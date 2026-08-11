import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getAffiliateForUser,
  getAffiliateTotals,
  getAnonymousSignups,
  MIN_PAYOUT_CENTS,
  nextPayoutDate,
  REFUND_HOLD_DAYS,
} from "@/lib/affiliates";

// GET /api/partner — Kennzahlen für den eingeloggten Partner.
//
// DATENSCHUTZ: Diese Route gibt bewusst KEINE Identitäten der geworbenen Kunden
// heraus — weder Name noch E-Mail noch User-ID. Ein Partner ist ein Dritter; die
// Kunden haben nie eingewilligt, dass ihre Daten an ihn fließen (DSG/DSGVO).
// Er sieht nur anonymisierte Signups ("Signup #7") plus seine eigenen Summen.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const affiliate = await getAffiliateForUser(session.user.id);
  if (!affiliate) {
    return NextResponse.json({ isPartner: false }, { status: 200 });
  }

  const [totals, signups] = await Promise.all([
    getAffiliateTotals(affiliate.id),
    getAnonymousSignups(affiliate.id),
  ]);

  return NextResponse.json({
    isPartner: true,
    partner: {
      name: affiliate.name,
      promoCode: affiliate.promo_code,
      ratePct: affiliate.rate_bps / 100,
      status: affiliate.status,
      payoutMethod: affiliate.payout_method,
    },
    totals,
    signups,
    payout: {
      nextDate: nextPayoutDate().toISOString(),
      minimumCents: MIN_PAYOUT_CENTS,
      holdDays: REFUND_HOLD_DAYS,
    },
  });
}
