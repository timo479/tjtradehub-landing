import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const patchSchema = z.object({
  trade_date: z.string().optional(),
  symbol: z.string().min(1),
  direction: z.string().min(1),
  entry_price: z.coerce.number().finite(),
  exit_price: z.coerce.number().finite(),
  stop_loss: z.coerce.number().finite().nullable().optional(),
  take_profit: z.coerce.number().finite().nullable().optional(),
  lot_size: z.coerce.number().finite(),
  risk_amount: z.coerce.number().finite().nullable().optional(),
  pnl: z.coerce.number().finite(),
  setup_type: z.string().nullable().optional(),
  timeframe: z.string().nullable().optional(),
  emotional_state: z.string().nullable().optional(),
  rule_break: z.boolean().optional(),
  discipline_score: z.coerce.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const result = patchSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }
  const {
    trade_date, symbol, direction, entry_price, exit_price,
    stop_loss, take_profit, lot_size, risk_amount, pnl,
    setup_type, timeframe, emotional_state, rule_break,
    discipline_score, notes,
  } = result.data;

  const { data, error } = await db
    .from("trades")
    .update({
      trade_date,
      symbol: symbol.toUpperCase(),
      direction: direction.toUpperCase(),
      entry_price,
      exit_price,
      stop_loss: stop_loss ?? null,
      take_profit: take_profit ?? null,
      lot_size,
      risk_amount: risk_amount ?? null,
      profit_loss: pnl,
      setup_type: setup_type || null,
      timeframe: timeframe || null,
      emotional_state: emotional_state || null,
      followed_plan: !(rule_break ?? false),
      rule_break: rule_break ?? false,
      discipline_score: discipline_score ?? null,
      notes: notes || null,
    })
    .eq("id", id)
    .eq("user_id", session.user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { error } = await db
    .from("trades")
    .delete()
    .eq("id", id)
    .eq("user_id", session.user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
