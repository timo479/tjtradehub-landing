import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessDashboard } from "@/lib/trial";
import { NextRequest, NextResponse } from "next/server";

async function checkAccess(userId: string) {
  const { data } = await db.from("users").select("subscription_status, current_period_end, trial_ends_at").eq("id", userId).single();
  return data && canAccessDashboard(data);
}

// Known MT5 field labels that can be auto-mapped by name into any journal template
const MT5_FIELD_LABELS = [
  "Symbol", "Direction", "Volume", "Entry Price",
  "Exit Price", "P&L", "Commission", "Swap", "Comment",
];

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await checkAccess(session.user.id)) return NextResponse.json({ error: "Subscription required" }, { status: 403 });

  const { id } = await params;
  const { journal_id, field_values } = await req.json();

  if (!journal_id) return NextResponse.json({ error: "journal_id required" }, { status: 400 });

  // Verify trade belongs to user and is an MT5 trade
  const { data: entry } = await db
    .from("trade_entries")
    .select("id, template_id, source")
    .eq("id", id)
    .eq("user_id", session.user.id)
    .single();

  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (entry.source !== "mt5") return NextResponse.json({ error: "Not an MT5 trade" }, { status: 400 });

  // Verify journal belongs to user
  const { data: journal } = await db
    .from("journal_templates")
    .select("id, template_fields(id, label)")
    .eq("id", journal_id)
    .eq("user_id", session.user.id)
    .single();

  if (!journal) return NextResponse.json({ error: "Journal not found" }, { status: 404 });

  // Build field map for the target journal (label → field_id)
  const journalFieldMap: Record<string, string> = {};
  for (const f of (journal as any).template_fields ?? []) {
    journalFieldMap[f.label] = f.id;
  }

  // Get current MT5 field values (to carry over trade data into new journal)
  const { data: existingValues } = await db
    .from("trade_field_values")
    .select("value, template_fields(label)")
    .eq("trade_id", id);

  // Map existing MT5 values into the new journal's field IDs by label
  const carryOverValues: { field_id: string; value: string }[] = [];
  for (const fv of existingValues ?? []) {
    const label = (fv as any).template_fields?.label;
    if (label && MT5_FIELD_LABELS.includes(label) && journalFieldMap[label]) {
      carryOverValues.push({ field_id: journalFieldMap[label], value: fv.value });
    }
  }

  // Review field values provided by user (keyed by field_id of the chosen journal)
  const reviewValues: { field_id: string; value: string }[] = Object.entries(field_values ?? {})
    .filter(([, v]) => v !== "" && v !== null && v !== undefined)
    .map(([field_id, value]) => ({
      field_id,
      value: Array.isArray(value) ? JSON.stringify(value) : String(value),
    }));

  // Merge: review values override carry-over values for same field_id
  const reviewFieldIds = new Set(reviewValues.map(v => v.field_id));
  const mergedValues = [
    ...carryOverValues.filter(v => !reviewFieldIds.has(v.field_id)),
    ...reviewValues,
  ];

  // Replace all field values and reassign journal
  await db.from("trade_field_values").delete().eq("trade_id", id);

  if (mergedValues.length > 0) {
    await db.from("trade_field_values").insert(
      mergedValues.map(fv => ({ trade_id: id, ...fv }))
    );
  }

  await db.from("trade_entries").update({
    template_id: journal_id,
    template_version: 1,
    is_reviewed: true,
  }).eq("id", id);

  return NextResponse.json({ success: true });
}
