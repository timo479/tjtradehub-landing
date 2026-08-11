import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { effectiveStatus, MIN_PAYOUT_CENTS, type CommissionStatus } from "@/lib/affiliates";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

// PATCH /api/admin/affiliates/:id
//   { status }              → active | paused | ended
//   { rate_bps }            → Satz ändern (gilt erst für KÜNFTIGE Zahlungen,
//                             bereits gebuchte Provisionen sind eingefroren)
//   { action: "mark_paid" } → alle auszahlbaren Provisionen als überwiesen buchen
//   { action: "link_user" } → Partner mit dem Account seiner E-Mail verknüpfen
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { data: affiliate } = await db
    .from("affiliates")
    .select("id, email, status")
    .eq("id", id)
    .maybeSingle();
  if (!affiliate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ── Auszahlung buchen ──────────────────────────────────────────────────────
  // Nur was den 14-Tage-Refund-Hold hinter sich hat. "payable" wird nicht
  // persistiert, sondern aus payable_after abgeleitet — deshalb hier über das
  // Datum filtern statt über den Status.
  if (body.action === "mark_paid") {
    const now = new Date().toISOString();
    const { data: due, error: dueErr } = await db
      .from("commissions")
      .select("id, commission_cents, status, payable_after")
      .eq("affiliate_id", id)
      .eq("status", "pending")
      .lte("payable_after", now);

    if (dueErr) {
      console.error("mark_paid: select failed:", dueErr, "affiliate:", id);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    const payable = (due ?? []).filter(
      (c) => effectiveStatus(c as { status: CommissionStatus; payable_after: string }) === "payable"
    );
    const totalCents = payable.reduce((s, c) => s + (c.commission_cents as number), 0);

    if (!payable.length) {
      return NextResponse.json({ error: "Nothing payable yet" }, { status: 400 });
    }
    // Mindestauszahlung $50 — darunter rollt es in den Folgemonat. Mit
    // `force: true` lässt sich das bewusst übergehen (z.B. beim Beenden).
    if (totalCents < MIN_PAYOUT_CENTS && body.force !== true) {
      return NextResponse.json(
        {
          error: `Below minimum payout ($${(MIN_PAYOUT_CENTS / 100).toFixed(0)}). Rolls over.`,
          totalCents,
        },
        { status: 400 }
      );
    }

    const { error: updErr } = await db
      .from("commissions")
      .update({ status: "paid", paid_out_at: now })
      .in(
        "id",
        payable.map((c) => c.id)
      );
    if (updErr) {
      console.error("mark_paid: update failed:", updErr, "affiliate:", id);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, markedPaid: payable.length, totalCents });
  }

  // ── Account verknüpfen ─────────────────────────────────────────────────────
  if (body.action === "link_user") {
    const { data: user } = await db
      .from("users")
      .select("id")
      .eq("email", affiliate.email)
      .maybeSingle();
    if (!user) {
      return NextResponse.json({ error: "No account with that email yet" }, { status: 404 });
    }
    const { error } = await db.from("affiliates").update({ user_id: user.id }).eq("id", id);
    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "That account is already a partner" }, { status: 409 });
      }
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, linked: true });
  }

  // ── Stammdaten ─────────────────────────────────────────────────────────────
  const patch: Record<string, unknown> = {};

  if (typeof body.status === "string") {
    if (!["active", "paused", "ended"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    patch.status = body.status;
    patch.ended_at = body.status === "ended" ? new Date().toISOString() : null;
  }

  if (body.rate_bps !== undefined) {
    const rate = Math.round(Number(body.rate_bps));
    if (!Number.isFinite(rate) || rate < 0 || rate > 10000) {
      return NextResponse.json({ error: "rate_bps must be between 0 and 10000" }, { status: 400 });
    }
    patch.rate_bps = rate;
  }

  if (typeof body.payout_method === "string") patch.payout_method = body.payout_method.trim() || null;
  if (typeof body.admin_note === "string") patch.admin_note = body.admin_note.trim() || null;

  if (!Object.keys(patch).length) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await db.from("affiliates").update(patch).eq("id", id);
  if (error) {
    console.error("admin/affiliates PATCH failed:", error, "affiliate:", id);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
