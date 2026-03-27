import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessDashboard } from "@/lib/trial";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const tradeSchema = z.object({
  trade_date: z.string().min(1, "trade_date is required"),
  symbol: z.string().min(1, "symbol is required").max(20),
  direction: z.enum(["BUY", "SELL", "buy", "sell"]),
  entry_price: z.coerce.number(),
  exit_price: z.coerce.number(),
  lot_size: z.coerce.number().positive(),
  pnl: z.coerce.number(),
  stop_loss: z.coerce.number().optional().nullable(),
  take_profit: z.coerce.number().optional().nullable(),
  risk_amount: z.coerce.number().optional().nullable(),
  setup_type: z.string().max(100).optional().nullable(),
  timeframe: z.string().max(20).optional().nullable(),
  emotional_state: z.string().max(100).optional().nullable(),
  rule_break: z.boolean().optional(),
  discipline_score: z.coerce.number().int().min(1).max(10).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
});

async function checkAccess(userId: string) {
  const { data } = await db.from("users").select("subscription_status, current_period_end, trial_ends_at").eq("id", userId).single();
  return data && canAccessDashboard(data);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await checkAccess(session.user.id)) return NextResponse.json({ error: "Subscription required" }, { status: 403 });

  const { data, error } = await db
    .from("trades")
    .select("*")
    .eq("user_id", session.user.id)
    .order("trade_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!await checkAccess(session.user.id)) return NextResponse.json({ error: "Subscription required" }, { status: 403 });

  const body = await req.json();
  const result = tradeSchema.safeParse(body);
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
    .insert({
      user_id: session.user.id,
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
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
