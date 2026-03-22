import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: users, error } = await db
    .from("users")
    .select(
      "id, email, name, created_at, subscription_status, current_period_end, trial_ends_at, stripe_customer_id, subscription_id, is_banned, role, meta_last_active"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // Get trade counts per user
  const { data: tradeCounts } = await db
    .from("trade_entries")
    .select("user_id");

  const countMap: Record<string, number> = {};
  if (tradeCounts) {
    for (const row of tradeCounts) {
      countMap[row.user_id] = (countMap[row.user_id] ?? 0) + 1;
    }
  }

  const result = (users ?? []).map((u) => ({
    ...u,
    trade_count: countMap[u.id] ?? 0,
  }));

  return NextResponse.json({ users: result });
}
