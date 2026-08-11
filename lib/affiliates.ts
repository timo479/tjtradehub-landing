import { db } from "@/lib/db";

// ─── Programm-Konstanten ──────────────────────────────────────────────────────
// Entschieden 2026-08-11. Der Satz gilt auf den TATSÄCHLICH EINGEGANGENEN Betrag
// (Stripe `amount_paid`), nicht auf den Listenpreis — dadurch stapeln sich der
// 20%-Follower-Rabatt und die Provision nicht gegen uns, und es kann per
// Konstruktion nie mehr rausgehen als reinkam (Liquiditäts-Sicherheit).
export const DEFAULT_RATE_BPS = 3000; // 30.00%
export const REFUND_HOLD_DAYS = 14;
export const MIN_PAYOUT_CENTS = 5000; // $50 — darunter rollt es in den Folgemonat

export type CommissionStatus = "pending" | "payable" | "paid" | "clawed_back";

export interface Affiliate {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  instagram: string | null;
  promo_code: string;
  rate_bps: number;
  status: "active" | "paused" | "ended";
  payout_method: string | null;
  created_at: string;
  ended_at: string | null;
}

/** Codes werden uppercase gespeichert und case-insensitive verglichen. */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Provision aus dem eingegangenen Betrag. Bewusst `floor`: wir runden immer zu
 * unseren Gunsten ab, damit nie ein Cent mehr ausgeschüttet wird als verdient.
 */
export function calcCommissionCents(grossCents: number, rateBps: number): number {
  return Math.floor((grossCents * rateBps) / 10000);
}

/**
 * Ein Partner darf einen fälligen Betrag erst nach dem Refund-Hold sehen.
 * `payable` wird NICHT persistiert, sondern aus `payable_after` abgeleitet —
 * so brauchen wir keinen Cron dafür (Vercel Hobby erlaubt nur 1 Cron/Tag).
 */
export function effectiveStatus(c: {
  status: CommissionStatus;
  payable_after: string;
}): CommissionStatus {
  if (c.status === "pending" && new Date(c.payable_after) <= new Date()) {
    return "payable";
  }
  return c.status;
}

// ─── Partner auflösen ─────────────────────────────────────────────────────────

/** Aktiver Partner zu einem Code. `paused`/`ended` liefern bewusst nichts. */
export async function findActiveAffiliateByCode(code: string): Promise<Affiliate | null> {
  const normalized = normalizeCode(code);
  if (!normalized || normalized.length > 64) return null;

  // ilike deutet `_` und `%` als Platzhalter — Codes dürfen aber Unterstriche
  // enthalten. Ohne Escaping würde `SARAH_20` auch auf `SARAH120` matchen und
  // die Provision dem falschen Partner gutschreiben.
  const escaped = normalized.replace(/[\\%_]/g, (m) => `\\${m}`);

  const { data, error } = await db
    .from("affiliates")
    .select("*")
    .ilike("promo_code", escaped)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    console.error("findActiveAffiliateByCode failed:", error, "code:", normalized);
    return null;
  }
  return (data as Affiliate | null) ?? null;
}

// ─── Referral stempeln (first-touch, unveränderlich) ──────────────────────────

/**
 * Ordnet einen User einem Partner zu — EINMALIG. Kommt der User später über einen
 * anderen Code, bleibt die erste Zuordnung bestehen (UNIQUE auf user_id + der
 * bewusste Verzicht auf UPDATE). Das nimmt jeden Attributions-Streit vorweg.
 *
 * Läuft best-effort: schlägt es fehl, darf weder Registrierung noch Webhook kippen.
 * Rückgabe: die referral-ID (neu oder bereits vorhanden), sonst null.
 */
export async function stampReferral(opts: {
  userId: string;
  affiliateId: string;
  source: "link" | "promo" | "manual";
}): Promise<string | null> {
  const { userId, affiliateId, source } = opts;

  const { data, error } = await db
    .from("referrals")
    .insert({ user_id: userId, affiliate_id: affiliateId, source })
    .select("id")
    .maybeSingle();

  if (!error && data) return data.id as string;

  // 23505 = unique_violation → der User war schon gestempelt. First-touch gewinnt.
  if (error && error.code !== "23505") {
    console.error("stampReferral failed:", error, "user:", userId);
    return null;
  }

  const { data: existing } = await db
    .from("referrals")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return (existing?.id as string | undefined) ?? null;
}

/** Bequemer Wrapper: Code auflösen + stempeln. Unbekannter Code = stiller No-Op. */
export async function stampReferralFromCode(opts: {
  userId: string;
  code: string;
  source: "link" | "promo" | "manual";
}): Promise<string | null> {
  const affiliate = await findActiveAffiliateByCode(opts.code);
  if (!affiliate) return null;
  return stampReferral({
    userId: opts.userId,
    affiliateId: affiliate.id,
    source: opts.source,
  });
}

// ─── Provision buchen ─────────────────────────────────────────────────────────

/**
 * Schreibt EINE Ledger-Zeile für eine tatsächlich eingegangene Zahlung.
 *
 * Idempotent über `stripe_ref` (Invoice- bzw. Checkout-Session-ID): Stripe liefert
 * at-least-once und retried — ein Duplikat würde sonst doppelt Provision gutschreiben.
 * Der UNIQUE-Constraint fängt das ab, wir behandeln 23505 als Erfolg.
 *
 * `grossCents` MUSS der wirklich gezahlte Betrag sein (invoice.amount_paid) —
 * niemals der Listenpreis, sonst zahlen wir Provision auf Geld, das nie kam.
 */
export async function recordCommission(opts: {
  userId: string;
  stripeRef: string;
  kind: "subscription" | "lifetime";
  grossCents: number;
  currency?: string;
  paidAt?: Date;
}): Promise<"recorded" | "duplicate" | "no_referral" | "skipped" | "error"> {
  const { userId, stripeRef, kind, grossCents } = opts;
  if (!stripeRef || grossCents <= 0) return "skipped";

  const { data: referral, error: rErr } = await db
    .from("referrals")
    .select("id, affiliate_id, first_paid_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (rErr) {
    console.error("recordCommission: referral lookup failed:", rErr, "user:", userId);
    return "error";
  }
  if (!referral) return "no_referral"; // völlig normal — die meisten User kommen organisch

  const { data: affiliate, error: aErr } = await db
    .from("affiliates")
    .select("id, rate_bps, status")
    .eq("id", referral.affiliate_id)
    .maybeSingle();

  if (aErr || !affiliate) {
    console.error("recordCommission: affiliate lookup failed:", aErr, "referral:", referral.id);
    return "error";
  }
  // Beendete Partnerschaft: laufende Kunden erzeugen keine neue Provision mehr.
  if (affiliate.status === "ended") return "skipped";

  const paidAt = opts.paidAt ?? new Date();
  const payableAfter = new Date(paidAt.getTime() + REFUND_HOLD_DAYS * 24 * 60 * 60 * 1000);
  const rateBps = affiliate.rate_bps ?? DEFAULT_RATE_BPS;

  const { error: cErr } = await db.from("commissions").insert({
    affiliate_id: affiliate.id,
    referral_id: referral.id,
    user_id: userId,
    stripe_ref: stripeRef,
    kind,
    gross_cents: grossCents,
    rate_bps: rateBps,
    commission_cents: calcCommissionCents(grossCents, rateBps),
    currency: (opts.currency ?? "usd").toLowerCase(),
    status: "pending",
    paid_at: paidAt.toISOString(),
    payable_after: payableAfter.toISOString(),
  });

  if (cErr) {
    if (cErr.code === "23505") return "duplicate"; // Webhook-Retry, alles gut
    console.error("recordCommission: insert failed:", cErr, "ref:", stripeRef);
    return "error";
  }

  // Erste Zahlung des Kunden festhalten (nur einmal setzen).
  if (!referral.first_paid_at) {
    await db
      .from("referrals")
      .update({ first_paid_at: paidAt.toISOString() })
      .eq("id", referral.id)
      .is("first_paid_at", null);
  }

  return "recorded";
}

/** Kunde hat endgültig gekündigt → Provision läuft ab jetzt nicht weiter. */
export async function markReferralChurned(userId: string): Promise<void> {
  const { error } = await db
    .from("referrals")
    .update({ churned_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("churned_at", null);
  if (error) console.error("markReferralChurned failed:", error, "user:", userId);
}

/**
 * Rückerstattung → Provision stornieren. Greift nur solange NICHT ausgezahlt;
 * bereits ausgezahltes Geld holen wir nicht zurück, das wäre den Partner-Ärger
 * nicht wert (und ist durch den 14-Tage-Hold der seltene Fall).
 */
export async function clawbackCommission(stripeRef: string): Promise<void> {
  const { error } = await db
    .from("commissions")
    .update({ status: "clawed_back", clawed_back_at: new Date().toISOString() })
    .eq("stripe_ref", stripeRef)
    .in("status", ["pending", "payable"]);
  if (error) console.error("clawbackCommission failed:", error, "ref:", stripeRef);
}

// ─── Auswertung ───────────────────────────────────────────────────────────────

export interface AffiliateTotals {
  signups: number;
  payingActive: number;
  churned: number;
  earnedCents: number;    // alles Verdiente ohne Clawbacks
  pendingCents: number;   // noch im Refund-Hold
  payableCents: number;   // Hold vorbei, wartet auf Auszahlung
  paidOutCents: number;   // bereits überwiesen
  clawedBackCents: number;
  mrrCents: number;       // laufende MRR, die dieser Partner generiert
}

/**
 * Kennzahlen eines Partners. Bewusst OHNE Kunden-Identitäten — diese Funktion
 * speist auch das Partner-Dashboard, und ein Partner darf nie erfahren, WER sich
 * über ihn angemeldet hat (DSG/DSGVO: das sind unsere Kundendaten, nicht seine).
 */
export async function getAffiliateTotals(affiliateId: string): Promise<AffiliateTotals> {
  const [{ data: refs }, { data: comms }] = await Promise.all([
    db
      .from("referrals")
      .select("id, first_paid_at, churned_at")
      .eq("affiliate_id", affiliateId),
    db
      .from("commissions")
      .select("commission_cents, gross_cents, status, payable_after, kind, paid_at")
      .eq("affiliate_id", affiliateId),
  ]);

  const referrals = refs ?? [];
  const commissions = comms ?? [];

  const totals: AffiliateTotals = {
    signups: referrals.length,
    payingActive: referrals.filter((r) => r.first_paid_at && !r.churned_at).length,
    churned: referrals.filter((r) => r.churned_at).length,
    earnedCents: 0,
    pendingCents: 0,
    payableCents: 0,
    paidOutCents: 0,
    clawedBackCents: 0,
    mrrCents: 0,
  };

  for (const c of commissions) {
    const status = effectiveStatus(c as { status: CommissionStatus; payable_after: string });
    const cents = c.commission_cents as number;
    if (status === "clawed_back") {
      totals.clawedBackCents += cents;
      continue;
    }
    totals.earnedCents += cents;
    if (status === "pending") totals.pendingCents += cents;
    else if (status === "payable") totals.payableCents += cents;
    else if (status === "paid") totals.paidOutCents += cents;
  }

  // MRR = Provision aus den Abo-Zahlungen der letzten 35 Tage von Kunden, die
  // noch nicht gekündigt haben. 35 statt 30, damit ein Abrechnungstag, der sich
  // um ein paar Tage verschiebt, die Zahl nicht auf 0 fallen lässt.
  const cutoff = Date.now() - 35 * 24 * 60 * 60 * 1000;
  totals.mrrCents = commissions
    .filter(
      (c) =>
        c.kind === "subscription" &&
        c.status !== "clawed_back" &&
        new Date(c.paid_at as string).getTime() >= cutoff
    )
    .reduce((sum, c) => sum + (c.commission_cents as number), 0);

  return totals;
}

export interface AnonymousSignup {
  label: string;      // "Signup #7" — bewusst keine Identität
  signedUpAt: string;
  state: "free" | "paying" | "cancelled";
  monthlyCents: number;
}

/**
 * Anonymisierte Signup-Liste fürs Partner-Dashboard. Der Partner sieht, DASS und
 * WANN jemand kam und ob es läuft — aber nie Name, E-Mail oder ID. Die Nummer ist
 * die Reihenfolge seiner eigenen Signups, kein globaler Identifikator.
 */
export async function getAnonymousSignups(affiliateId: string): Promise<AnonymousSignup[]> {
  const { data: refs } = await db
    .from("referrals")
    .select("id, signed_up_at, first_paid_at, churned_at")
    .eq("affiliate_id", affiliateId)
    .order("signed_up_at", { ascending: true });

  const referrals = refs ?? [];
  if (!referrals.length) return [];

  const { data: comms } = await db
    .from("commissions")
    .select("referral_id, commission_cents, paid_at, kind, status")
    .eq("affiliate_id", affiliateId)
    .eq("kind", "subscription")
    .neq("status", "clawed_back");

  // Letzte Monatsprovision je Referral → "was bringt mir dieser Kunde gerade".
  const latest = new Map<string, { at: number; cents: number }>();
  for (const c of comms ?? []) {
    const at = new Date(c.paid_at as string).getTime();
    const prev = latest.get(c.referral_id as string);
    if (!prev || at > prev.at) {
      latest.set(c.referral_id as string, { at, cents: c.commission_cents as number });
    }
  }

  return referrals.map((r, i) => ({
    label: `Signup #${i + 1}`,
    signedUpAt: r.signed_up_at as string,
    state: r.churned_at ? "cancelled" : r.first_paid_at ? "paying" : "free",
    monthlyCents: r.churned_at ? 0 : latest.get(r.id as string)?.cents ?? 0,
  }));
}

/** Partner-Datensatz zum eingeloggten User (null = kein Partner). */
export async function getAffiliateForUser(userId: string): Promise<Affiliate | null> {
  const { data } = await db
    .from("affiliates")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as Affiliate | null) ?? null;
}

/**
 * Nächster Auszahlungstermin = letzter Tag des laufenden Monats (Auszahlung
 * monatlich nachschüssig). Als UTC gerechnet, damit Server- und Anzeigezeit
 * nicht auseinanderlaufen.
 */
export function nextPayoutDate(from: Date = new Date()): Date {
  return new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0, 23, 59, 59));
}
