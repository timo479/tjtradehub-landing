import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessDashboard } from "@/lib/trial";
import { NextRequest, NextResponse } from "next/server";

const MT5_FIELD_LABELS = ["Symbol", "Direction", "Volume", "Entry Price", "Exit Price", "P&L", "Commission", "Swap", "Comment"];

async function checkAccess(userId: string) {
  const { data } = await db.from("users").select("subscription_status, current_period_end, trial_ends_at").eq("id", userId).single();
  return data && canAccessDashboard(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await checkAccess(session.user.id)) return NextResponse.json({ error: "Subscription required" }, { status: 403 });

  const { journal_id, entry_ids } = await req.json();
  if (!journal_id) return NextResponse.json({ error: "journal_id required" }, { status: 400 });
  if (!Array.isArray(entry_ids) || entry_ids.length === 0) return NextResponse.json({ error: "entry_ids required" }, { status: 400 });

  // Verify journal belongs to user
  const { data: journal } = await db
    .from("journal_templates")
    .select("id, template_fields(id, label)")
    .eq("id", journal_id)
    .eq("user_id", session.user.id)
    .single();
  if (!journal) return NextResponse.json({ error: "Journal not found" }, { status: 404 });

  // Build field map for journal (label → field_id)
  const journalFieldMap: Record<string, string> = {};
  for (const f of (journal as any).template_fields ?? []) journalFieldMap[f.label] = f.id;

  let moved = 0;
  for (const entryId of entry_ids) {
    // Verify entry belongs to user
    const { data: entry } = await db
      .from("trade_entries")
      .select("id, source")
      .eq("id", entryId)
      .eq("user_id", session.user.id)
      .single();
    if (!entry) continue;

    // Get existing MT5 field values
    const { data: existingValues } = await db
      .from("trade_field_values")
      .select("value, template_fields(label)")
      .eq("trade_id", entryId);

    // Map MT5 values to new journal field IDs by label
    const newValues: { field_id: string; value: string }[] = [];
    for (const fv of existingValues ?? []) {
      const label = (fv as any).template_fields?.label;
      if (label && MT5_FIELD_LABELS.includes(label) && journalFieldMap[label]) {
        newValues.push({ field_id: journalFieldMap[label], value: fv.value });
      }
    }

    // Replace field values + reassign journal
    await db.from("trade_field_values").delete().eq("trade_id", entryId);
    if (newValues.length > 0) {
      await db.from("trade_field_values").insert(newValues.map(fv => ({ trade_id: entryId, ...fv })));
    }
    await db.from("trade_entries").update({
      template_id: journal_id,
      template_version: 1,
      is_reviewed: true,
    }).eq("id", entryId);

    moved++;
  }

  return NextResponse.json({ moved });
}
