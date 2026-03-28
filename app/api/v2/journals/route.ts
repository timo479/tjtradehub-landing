import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessDashboard } from "@/lib/trial";
import { NextRequest, NextResponse } from "next/server";

async function checkAccess(userId: string) {
  const { data } = await db.from("users").select("subscription_status, current_period_end, trial_ends_at").eq("id", userId).single();
  return data && canAccessDashboard(data);
}

const FIXED_SECTIONS = [
  {
    name: "Trade", order_index: 0,
    fields: [
      { label: "Symbol",      field_type: "text",   order_index: 0, options: null },
      { label: "Direction",   field_type: "select", order_index: 1, options: ["Long", "Short"] },
      { label: "Volume",      field_type: "number", order_index: 2, options: null },
      { label: "Entry Price", field_type: "number", order_index: 3, options: null },
      { label: "Exit Price",  field_type: "number", order_index: 4, options: null },
      { label: "Stop Loss",   field_type: "number", order_index: 5, options: null },
      { label: "Take Profit", field_type: "number", order_index: 6, options: null },
      { label: "BE",          field_type: "number", order_index: 7, options: null },
    ],
  },
  {
    name: "Numbers", order_index: 1,
    fields: [
      { label: "P&L",         field_type: "number", order_index: 0, options: null },
      { label: "Commission",  field_type: "number", order_index: 1, options: null },
      { label: "Swap",        field_type: "number", order_index: 2, options: null },
      { label: "Risk Amount", field_type: "number", order_index: 3, options: null },
    ],
  },
  {
    name: "Reflection", order_index: 2,
    fields: [
      { label: "Setup",          field_type: "text", order_index: 0, options: null },
      { label: "Emotions",       field_type: "text", order_index: 1, options: null },
      { label: "Emotion Note",   field_type: "text", order_index: 2, options: null },
      { label: "Rules Followed", field_type: "text", order_index: 3, options: null },
      { label: "Notes",          field_type: "text", order_index: 4, options: null },
    ],
  },
];

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await checkAccess(session.user.id)) return NextResponse.json({ error: "Subscription required" }, { status: 403 });

  const { data, error } = await db
    .from("journal_templates")
    .select("id, name, instrument_type, time_from, time_to, risk_per_trade, max_trades_per_day, starting_balance, rules, is_frozen, created_at, template_sections(*, template_fields(*))")
    .eq("user_id", session.user.id)
    .neq("name", "MetaAPI Import")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await checkAccess(session.user.id)) return NextResponse.json({ error: "Subscription required" }, { status: 403 });

  const body = await req.json();
  const { name, instrument_type, time_from, time_to, risk_per_trade, max_trades_per_day, starting_balance, rules } = body;
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const { data: template, error: tErr } = await db
    .from("journal_templates")
    .insert({
      user_id: session.user.id,
      name: name.trim(),
      version: 1,
      is_frozen: false,
      instrument_type: instrument_type ?? "Forex",
      time_from: time_from ?? "08:00",
      time_to: time_to ?? "17:00",
      risk_per_trade: risk_per_trade ?? null,
      max_trades_per_day: max_trades_per_day ?? null,
      starting_balance: starting_balance ?? null,
      rules: rules ?? [],
    })
    .select()
    .single();

  if (tErr || !template) return NextResponse.json({ error: tErr?.message ?? "Failed to create journal" }, { status: 500 });

  for (const sec of FIXED_SECTIONS) {
    const { data: section } = await db
      .from("template_sections")
      .insert({ template_id: template.id, name: sec.name, order_index: sec.order_index })
      .select().single();
    if (!section) continue;
    await db.from("template_fields").insert(
      sec.fields.map(f => ({
        template_id: template.id,
        section_id: section.id,
        label: f.label,
        field_type: f.field_type,
        is_required: false,
        options: f.options,
        order_index: f.order_index,
      }))
    );
  }

  const { data: full } = await db
    .from("journal_templates")
    .select("id, name, instrument_type, time_from, time_to, risk_per_trade, max_trades_per_day, starting_balance, rules, is_frozen, created_at, template_sections(*, template_fields(*))")
    .eq("id", template.id)
    .single();

  return NextResponse.json(full);
}
