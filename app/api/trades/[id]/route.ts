import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const {
    trade_date, symbol, direction, entry_price, exit_price,
    stop_loss, take_profit, lot_size, risk_amount, pnl,
    setup_type, timeframe, emotional_state, rule_break,
    discipline_score, notes,
  } = body;

  const { data, error } = await db
    .from("trades")
    .update({
      trade_date,
      symbol: symbol.toUpperCase(),
      direction: direction.toUpperCase(),
      entry_price: parseFloat(entry_price),
      exit_price: parseFloat(exit_price),
      stop_loss: stop_loss ? parseFloat(stop_loss) : null,
      take_profit: take_profit ? parseFloat(take_profit) : null,
      lot_size: parseFloat(lot_size),
      risk_amount: risk_amount ? parseFloat(risk_amount) : null,
      profit_loss: parseFloat(pnl),
      setup_type: setup_type || null,
      timeframe: timeframe || null,
      emotional_state: emotional_state || null,
      followed_plan: !(rule_break ?? false),
      rule_break: rule_break ?? false,
      discipline_score: discipline_score ? parseInt(discipline_score) : null,
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
