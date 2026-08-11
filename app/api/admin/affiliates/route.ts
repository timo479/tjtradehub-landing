import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  DEFAULT_RATE_BPS,
  getAffiliateTotals,
  normalizeCode,
  type Affiliate,
} from "@/lib/affiliates";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if ((session.user as { role?: string }).role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { error: null };
}

// GET /api/admin/affiliates — Partnerliste mit Kennzahlen.
// Enthält im Gegensatz zum Partner-Dashboard bewusst die Klarnamen/E-Mails der
// Partner selbst (nicht die der geworbenen Kunden — die tauchen nirgends auf).
export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const { data, error } = await db
    .from("affiliates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("admin/affiliates GET failed:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const affiliates = (data ?? []) as Affiliate[];
  const withTotals = await Promise.all(
    affiliates.map(async (a) => ({
      ...a,
      totals: await getAffiliateTotals(a.id),
    }))
  );

  return NextResponse.json({ affiliates: withTotals });
}

// POST /api/admin/affiliates — neuen Partner anlegen.
// Legt NICHT den Stripe-Promo-Code an: der wird bewusst manuell im Stripe-
// Dashboard erstellt (20% off, repeating, 3 Monate, auf den Pro-Preis begrenzt).
// Ein Schreibzugriff aufs Live-Zahlungssystem aus einer Admin-Maske heraus wäre
// das Risiko nicht wert — hier wird nur der Code registriert, den es in Stripe gibt.
export async function POST(req: Request) {
  const guard = await requireAdmin();
  if (guard.error) return guard.error;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const promoCode = normalizeCode(String(body.promo_code ?? ""));
  const instagram = String(body.instagram ?? "").trim() || null;
  const payoutMethod = String(body.payout_method ?? "").trim() || null;
  const rateBps = Number.isFinite(Number(body.rate_bps))
    ? Math.round(Number(body.rate_bps))
    : DEFAULT_RATE_BPS;
  const grantPro = body.grant_pro === true;

  if (!name || !email || !promoCode) {
    return NextResponse.json({ error: "name, email and promo_code are required" }, { status: 400 });
  }
  if (!/^[A-Z0-9_-]{3,32}$/.test(promoCode)) {
    return NextResponse.json(
      { error: "promo_code must be 3-32 chars, A-Z 0-9 _ - only" },
      { status: 400 }
    );
  }
  if (rateBps < 0 || rateBps > 10000) {
    return NextResponse.json({ error: "rate_bps must be between 0 and 10000" }, { status: 400 });
  }

  // Partner an einen bestehenden Account hängen, falls die E-Mail schon existiert
  // — darüber loggt er sich später ins Partner-Dashboard ein.
  const { data: existingUser } = await db
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  const { data: created, error } = await db
    .from("affiliates")
    .insert({
      user_id: existingUser?.id ?? null,
      name,
      email,
      instagram,
      promo_code: promoCode,
      rate_bps: rateBps,
      payout_method: payoutMethod,
      status: "active",
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Promo code already exists" }, { status: 409 });
    }
    console.error("admin/affiliates POST failed:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // Gratis-Pro fürs eigene Testen (Teil des Partner-Angebots). Bewusst "active"
  // mit Ablaufdatum statt "lifetime": lifetime ist den Foundern vorbehalten und
  // wird an mehreren Stellen gesondert behandelt (z.B. nie herabstufen).
  let proGranted = false;
  if (grantPro && existingUser?.id) {
    const oneYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const { error: proErr } = await db
      .from("users")
      .update({ subscription_status: "active", current_period_end: oneYear })
      .eq("id", existingUser.id);
    if (proErr) console.error("grant_pro failed:", proErr, "user:", existingUser.id);
    else proGranted = true;
  }

  return NextResponse.json({
    affiliate: created,
    linkedUser: !!existingUser,
    proGranted,
    // Hinweis für die UI: ohne bestehenden Account kann weder verknüpft noch Pro
    // vergeben werden — der Partner muss sich erst registrieren.
    note: existingUser
      ? null
      : "No account with this email yet — link it after the partner registers.",
  });
}
