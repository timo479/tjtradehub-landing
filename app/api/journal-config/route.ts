import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_MODULES = {
  prices: true,
  position: true,
  timeframe: true,
  session: false,
  psychology: false,
  notes: true,
  strategy: true,
  custom: false,
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await db
    .from("journal_config")
    .select("modules, risk_settings")
    .eq("user_id", session.user.id)
    .single();

  return NextResponse.json({
    modules: data?.modules ?? DEFAULT_MODULES,
    risk_settings: data?.risk_settings ?? {},
  });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { modules, risk_settings } = body;

  const update: Record<string, unknown> = { user_id: session.user.id };
  if (modules !== undefined) update.modules = modules;
  if (risk_settings !== undefined) update.risk_settings = risk_settings;

  const { error } = await db
    .from("journal_config")
    .upsert(update, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
