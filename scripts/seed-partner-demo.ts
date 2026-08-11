#!/usr/bin/env npx tsx
/**
 * TJTradeHub – Partner-Demo-Account Seed
 *
 * Legt einen vollständigen Partner an, damit man /dashboard/partner und
 * /admin/affiliates mit echten Daten anschauen kann.
 *
 *   Login:  partner@tjtradehub.com / partner1234
 *   Code:   DEMO20   →   tjtradehub.com/r/DEMO20
 *
 * Erzeugt eine Story, die ALLE Zustände des Dashboards zeigt:
 *   • 7 Signups: 4 zahlend, 2 gratis Basic, 1 gekündigt
 *   • Provisionen in allen Stadien: paid / payable / pending (Refund-Hold)
 *   • einen Founder-Lifetime-Kauf ($149 → $44.70 Provision)
 *   • auszahlbare Summe > $50, damit der "Mark paid"-Button im Admin greift
 *
 * Die geworbenen Demo-Kunden liegen auf @seed.local — nie zustellbar, klar als
 * Seed erkennbar, newsletter_opt_in = false. Sie tauchen in der User-Zählung auf;
 * --reset räumt sie restlos weg.
 *
 * Run:
 *   npx tsx scripts/seed-partner-demo.ts           # anlegen (Abbruch wenn vorhanden)
 *   npx tsx scripts/seed-partner-demo.ts --reset   # löschen + neu aufsetzen
 *
 * Voraussetzung: Migration scripts/migrations/2026-08-11_affiliates.sql ist
 * eingespielt. SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 */

import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── .env.local laden ─────────────────────────────────────────────────────────
function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv();

const URL_BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL_BASE || !KEY) {
  console.error("✗ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen in .env.local");
  process.exit(1);
}

// Bewusst plain fetch statt supabase-js: dessen Realtime-Client braucht auf
// Node 20 einen WebSocket-Polyfill ("ws"), den wir hier nicht schleppen wollen.
const headers = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  "Content-Type": "application/json",
};

async function rest<T = unknown>(
  path: string,
  init: RequestInit & { prefer?: string } = {}
): Promise<T> {
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers, ...(init.prefer ? { Prefer: init.prefer } : {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} → ${res.status}: ${text}`);
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

const insert = <T>(table: string, rows: unknown) =>
  rest<T[]>(table, {
    method: "POST",
    body: JSON.stringify(rows),
    prefer: "return=representation",
  });

// ─── Konstanten ───────────────────────────────────────────────────────────────
const PARTNER_EMAIL = "partner@tjtradehub.com";
const PARTNER_PASSWORD = "partner1234";
const PROMO_CODE = "DEMO20";
const RATE_BPS = 3000;

const DAY = 24 * 60 * 60 * 1000;
const HOLD_DAYS = 14;
const NOW = Date.now();
const ago = (days: number) => new Date(NOW - days * DAY).toISOString();

// Preise in Cent. Erste 3 Monate mit 20%-Code, danach voll.
const DISCOUNTED = 2320; // $23.20
const FULL = 2900; // $29.00
const LIFETIME = 14900; // $149.00
const commissionOf = (gross: number) => Math.floor((gross * RATE_BPS) / 10000);

type SeedCustomer = {
  slug: string;
  signedUpDays: number;
  firstPaidDays: number | null;
  churnedDays: number | null;
  invoices: { days: number; gross: number; paidOut: boolean; kind: "subscription" | "lifetime" }[];
};

// Die Story. Bewusst so gewählt, dass jeder Dashboard-Zustand mindestens einmal
// vorkommt — inkl. auszahlbarer Summe über der $50-Mindestgrenze.
const CUSTOMERS: SeedCustomer[] = [
  {
    // Treuester Kunde: 4 Monate dabei, Rabatt ausgelaufen, zahlt vollen Preis.
    slug: "1",
    signedUpDays: 120,
    firstPaidDays: 120,
    churnedDays: null,
    invoices: [
      { days: 118, gross: DISCOUNTED, paidOut: true, kind: "subscription" },
      { days: 88, gross: DISCOUNTED, paidOut: true, kind: "subscription" },
      { days: 58, gross: DISCOUNTED, paidOut: true, kind: "subscription" },
      { days: 28, gross: FULL, paidOut: false, kind: "subscription" }, // → payable
    ],
  },
  {
    // Zeigt den Refund-Hold: letzte Zahlung 3 Tage her → noch "pending".
    slug: "2",
    signedUpDays: 95,
    firstPaidDays: 95,
    churnedDays: null,
    invoices: [
      { days: 93, gross: DISCOUNTED, paidOut: true, kind: "subscription" },
      { days: 63, gross: DISCOUNTED, paidOut: true, kind: "subscription" },
      { days: 33, gross: DISCOUNTED, paidOut: false, kind: "subscription" }, // → payable
      { days: 3, gross: FULL, paidOut: false, kind: "subscription" }, // → pending
    ],
  },
  {
    slug: "3",
    signedUpDays: 20,
    firstPaidDays: 20,
    churnedDays: null,
    invoices: [{ days: 20, gross: DISCOUNTED, paidOut: false, kind: "subscription" }],
  },
  {
    // Gratis Basic — genau der Fall, den das 60-Tage-Cookie später noch einfängt.
    slug: "4",
    signedUpDays: 10,
    firstPaidDays: null,
    churnedDays: null,
    invoices: [],
  },
  { slug: "5", signedUpDays: 2, firstPaidDays: null, churnedDays: null, invoices: [] },
  {
    // Gekündigt: Provision ist mit dem Abo gestoppt.
    slug: "6",
    signedUpDays: 100,
    firstPaidDays: 100,
    churnedDays: 45,
    invoices: [
      { days: 98, gross: DISCOUNTED, paidOut: true, kind: "subscription" },
      { days: 68, gross: DISCOUNTED, paidOut: true, kind: "subscription" },
    ],
  },
  {
    // Founder Lifetime: $149 einmalig → $44.70. Liquiditätsseitig unkritisch.
    // Bewusst 25 Tage her: damit ist der 14-Tage-Hold vorbei und die auszahlbare
    // Summe übersteigt die $50-Mindestgrenze — sonst lässt sich der
    // "Mark paid"-Flow im Admin gar nicht auslösen.
    slug: "7",
    signedUpDays: 25,
    firstPaidDays: 25,
    churnedDays: null,
    invoices: [{ days: 25, gross: LIFETIME, paidOut: false, kind: "lifetime" }],
  },
];

const customerEmail = (slug: string) => `partner-demo-${slug}@seed.local`;

// ─── Reset ────────────────────────────────────────────────────────────────────
async function reset() {
  console.log("→ Räume alten Demo-Stand weg …");

  // affiliates löschen räumt referrals + commissions per ON DELETE CASCADE mit ab.
  await rest(`affiliates?promo_code=eq.${PROMO_CODE}`, { method: "DELETE" });

  const emails = CUSTOMERS.map((c) => customerEmail(c.slug));
  const list = emails.map((e) => `"${e}"`).join(",");
  await rest(`users?email=in.(${list})`, { method: "DELETE" });
  await rest(`users?email=eq.${PARTNER_EMAIL}`, { method: "DELETE" });

  console.log("  ✓ gelöscht");
}

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function seed() {
  // Vorab prüfen, ob die Migration eingespielt ist — sonst kommt sonst ein
  // kryptischer PostgREST-Fehler mitten im Lauf.
  try {
    await rest("affiliates?select=id&limit=1");
  } catch {
    console.error(
      "✗ Tabelle 'affiliates' nicht gefunden.\n" +
        "  Bitte zuerst scripts/migrations/2026-08-11_affiliates.sql im Supabase SQL Editor ausführen."
    );
    process.exit(1);
  }

  const existing = await rest<{ id: string }[]>(
    `affiliates?promo_code=eq.${PROMO_CODE}&select=id`
  );
  if (existing.length) {
    console.error(`✗ Partner ${PROMO_CODE} existiert schon. Mit --reset neu aufsetzen.`);
    process.exit(1);
  }

  // 1) Partner-Account (bekommt Pro für 1 Jahr — Teil des Partner-Angebots).
  console.log("→ Partner-Account …");
  const pwHash = await bcrypt.hash(PARTNER_PASSWORD, 12);
  const oneYear = new Date(NOW + 365 * DAY).toISOString();

  const [partnerUser] = await insert<{ id: string }>("users", {
    email: PARTNER_EMAIL,
    name: "Demo Partner",
    password_hash: pwHash,
    email_verified: true,
    subscription_status: "active",
    current_period_end: oneYear,
    trial_ends_at: null,
    newsletter_opt_in: false,
    welcome_shown: true,
    onboarding_completed: true,
    created_at: ago(130),
  });
  console.log(`  ✓ ${PARTNER_EMAIL} / ${PARTNER_PASSWORD}`);

  // 2) Affiliate-Datensatz
  const [affiliate] = await insert<{ id: string }>("affiliates", {
    user_id: partnerUser.id,
    name: "Demo Partner",
    email: PARTNER_EMAIL,
    instagram: "@demo.trader",
    promo_code: PROMO_CODE,
    rate_bps: RATE_BPS,
    status: "active",
    payout_method: "PayPal: partner@tjtradehub.com",
    created_at: ago(130),
  });
  console.log(`  ✓ Code ${PROMO_CODE} (${RATE_BPS / 100}%)`);

  // 3) Geworbene Kunden + Ledger
  console.log("→ Signups & Provisionen …");
  let paidOut = 0,
    payable = 0,
    pending = 0;

  for (const c of CUSTOMERS) {
    const isLifetime = c.invoices.some((i) => i.kind === "lifetime");
    const isPaying = c.firstPaidDays !== null && c.churnedDays === null;

    const [user] = await insert<{ id: string }>("users", {
      email: customerEmail(c.slug),
      name: `Demo Signup ${c.slug}`,
      password_hash: pwHash, // egal — diese Accounts loggen sich nie ein
      email_verified: true,
      subscription_status: isLifetime ? "lifetime" : isPaying ? "active" : "basic",
      current_period_end: isPaying && !isLifetime ? new Date(NOW + 20 * DAY).toISOString() : null,
      trial_ends_at: null,
      newsletter_opt_in: false,
      created_at: ago(c.signedUpDays),
    });

    const [referral] = await insert<{ id: string }>("referrals", {
      user_id: user.id,
      affiliate_id: affiliate.id,
      source: c.slug === "7" ? "promo" : "link",
      signed_up_at: ago(c.signedUpDays),
      first_paid_at: c.firstPaidDays === null ? null : ago(c.firstPaidDays),
      churned_at: c.churnedDays === null ? null : ago(c.churnedDays),
    });

    for (const [i, inv] of c.invoices.entries()) {
      const cents = commissionOf(inv.gross);
      const paidAt = new Date(NOW - inv.days * DAY);
      const payableAfter = new Date(paidAt.getTime() + HOLD_DAYS * DAY);
      const isPayableNow = payableAfter.getTime() <= NOW;

      if (inv.paidOut) paidOut += cents;
      else if (isPayableNow) payable += cents;
      else pending += cents;

      await insert("commissions", {
        affiliate_id: affiliate.id,
        referral_id: referral.id,
        user_id: user.id,
        // Erkennbar synthetisch, kollidiert nie mit echten Stripe-IDs.
        stripe_ref: `seed_${PROMO_CODE}_${c.slug}_${i}`,
        kind: inv.kind,
        gross_cents: inv.gross,
        rate_bps: RATE_BPS,
        commission_cents: cents,
        currency: "usd",
        status: inv.paidOut ? "paid" : "pending",
        paid_at: paidAt.toISOString(),
        payable_after: payableAfter.toISOString(),
        paid_out_at: inv.paidOut ? new Date(paidAt.getTime() + 20 * DAY).toISOString() : null,
        created_at: paidAt.toISOString(),
      });
    }

    const state = c.churnedDays !== null ? "gekündigt" : isPaying ? "zahlend" : "gratis Basic";
    console.log(`  ✓ Signup ${c.slug} — ${state}, ${c.invoices.length} Zahlung(en)`);
  }

  const usd = (c: number) => `$${(c / 100).toFixed(2)}`;
  console.log("\n─────────────────────────────────────────────");
  console.log("  Login    partner@tjtradehub.com / partner1234");
  console.log("  Partner  /dashboard/partner");
  console.log("  Admin    /admin/affiliates");
  console.log("  Link     tjtradehub.com/r/DEMO20");
  console.log("─────────────────────────────────────────────");
  const MIN_PAYOUT = 5000; // muss zu MIN_PAYOUT_CENTS in lib/affiliates.ts passen
  console.log(`  Bereits ausgezahlt  ${usd(paidOut)}`);
  console.log(
    `  Auszahlbar jetzt    ${usd(payable)}   ${
      payable >= MIN_PAYOUT
        ? '← "Mark paid" auslösbar'
        : `← UNTER Mindestgrenze ${usd(MIN_PAYOUT)}, rollt in den Folgemonat`
    }`
  );
  console.log(`  Noch im Hold        ${usd(pending)}`);
  console.log(`  Verdient gesamt     ${usd(paidOut + payable + pending)}`);
  console.log("─────────────────────────────────────────────\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  try {
    if (process.argv.includes("--reset")) await reset();
    await seed();
  } catch (e) {
    console.error("✗ Seed fehlgeschlagen:", e instanceof Error ? e.message : e);
    process.exit(1);
  }
})();
