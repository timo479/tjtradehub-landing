import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const strategySchema = z.object({
  name: z.string().min(1, "name is required").max(200),
  description: z.string().max(2000).optional().nullable(),
  rules: z.array(z.string().max(500)).optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await db
    .from("strategies")
    .select("*, strategy_rules(id, label, order_index)")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = strategySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { name, description, rules } = result.data;

  const { data: strategy, error } = await db
    .from("strategies")
    .insert({ user_id: session.user.id, name, description })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (rules?.length) {
    await db.from("strategy_rules").insert(
      rules.map((label: string, i: number) => ({
        strategy_id: strategy.id,
        label,
        order_index: i,
      }))
    );
  }

  return NextResponse.json(strategy);
}
