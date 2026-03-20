import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessDashboard } from "@/lib/trial";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const entrySchema = z.object({
  template_id: z.string().uuid("template_id must be a valid UUID"),
  template_version: z.number().int().positive(),
  trade_date: z.string().min(1, "trade_date is required"),
  field_values: z.record(z.string(), z.unknown()).optional(),
});

async function checkAccess(userId: string) {
  const { data } = await db.from("users").select("subscription_status, current_period_end, trial_ends_at").eq("id", userId).single();
  return data && canAccessDashboard(data);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await checkAccess(session.user.id)) return NextResponse.json({ error: "Subscription required" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const journalId = searchParams.get("journal_id");

  let query = db
    .from("trade_entries")
    .select(`*, trade_field_values ( *, template_fields ( id, label, field_type ) ), journal_templates ( id, name, version )`)
    .eq("user_id", session.user.id)
    .order("trade_date", { ascending: false });

  if (journalId) query = query.eq("template_id", journalId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await checkAccess(session.user.id)) return NextResponse.json({ error: "Subscription required" }, { status: 403 });

  const body = await req.json();
  const result = entrySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { template_id, template_version, trade_date, field_values } = result.data;

  // Create entry
  const { data: entry, error: eErr } = await db
    .from("trade_entries")
    .insert({ user_id: session.user.id, template_id, template_version, trade_date })
    .select()
    .single();

  if (eErr) return NextResponse.json({ error: eErr.message }, { status: 500 });

  // Save field values
  if (field_values && Object.keys(field_values).length) {
    await db.from("trade_field_values").insert(
      Object.entries(field_values)
        .filter(([, v]) => v !== "" && v !== null && v !== undefined)
        .map(([field_id, value]) => ({
          trade_id: entry.id,
          field_id,
          value: Array.isArray(value) ? JSON.stringify(value) : String(value),
        }))
    );
  }

  // Freeze template after first trade
  await db
    .from("journal_templates")
    .update({ is_frozen: true })
    .eq("id", template_id)
    .eq("user_id", session.user.id);

  return NextResponse.json(entry);
}
