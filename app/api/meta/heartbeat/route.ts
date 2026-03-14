import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasActiveSubscription } from "@/lib/trial";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await db
    .from("users")
    .select("subscription_status, current_period_end, metaapi_account_id")
    .eq("id", session.user.id)
    .single();

  if (!user || !hasActiveSubscription(user) || !user.metaapi_account_id) {
    return NextResponse.json({ ok: false });
  }

  await db
    .from("users")
    .update({ meta_last_active: new Date().toISOString() })
    .eq("id", session.user.id);

  return NextResponse.json({ ok: true });
}
