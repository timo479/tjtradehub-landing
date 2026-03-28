import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessDashboard } from "@/lib/trial";
import { NextRequest, NextResponse } from "next/server";

async function checkAccess(userId: string) {
  const { data } = await db.from("users").select("subscription_status, current_period_end, trial_ends_at").eq("id", userId).single();
  return data && canAccessDashboard(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await checkAccess(session.user.id)) return NextResponse.json({ error: "Subscription required" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();

  const { data: journal } = await db
    .from("journal_templates")
    .select("id")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();
  if (!journal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = ["name", "instrument_type", "time_from", "time_to", "risk_per_trade", "max_trades_per_day", "starting_balance", "rules"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  await db.from("journal_templates").update(updates).eq("id", id);
  return NextResponse.json({ success: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await checkAccess(session.user.id)) return NextResponse.json({ error: "Subscription required" }, { status: 403 });

  const { id } = await params;

  const { data: journal } = await db
    .from("journal_templates")
    .select("id")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();
  if (!journal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Get entry IDs for this journal
  const { data: entryIds } = await db
    .from("trade_entries")
    .select("id")
    .eq("template_id", id)
    .eq("user_id", session.user.id);

  if (entryIds && entryIds.length > 0) {
    await db.from("trade_field_values").delete().in("trade_id", entryIds.map(e => e.id));
    await db.from("trade_entries").delete().eq("template_id", id).eq("user_id", session.user.id);
  }

  const { data: sections } = await db.from("template_sections").select("id").eq("template_id", id);
  if (sections && sections.length > 0) {
    await db.from("template_fields").delete().in("section_id", sections.map(s => s.id));
  }
  await db.from("template_sections").delete().eq("template_id", id);
  await db.from("journal_templates").delete().eq("id", id);

  return NextResponse.json({ success: true });
}
