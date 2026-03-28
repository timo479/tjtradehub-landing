import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: users, error } = await db
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  // Trade counts per user
  const { data: tradeCounts } = await db.from("trade_entries").select("user_id");
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

  // Revenue stats (non-admins only)
  const nonAdmins = result.filter((u) => u.role !== "admin");
  const activeUsers = nonAdmins.filter((u) => u.subscription_status === "active");
  const mrr = activeUsers.length * 29;
  const nowTs = Date.now();
  const expiredNonConverted = nonAdmins.filter(
    (u) =>
      u.subscription_status === "trialing" &&
      new Date(u.trial_ends_at).getTime() < nowTs
  ).length;
  const everSubscribed = nonAdmins.filter(
    (u) => u.subscription_status === "active" || u.subscription_status === "canceled"
  ).length;
  const conversionBase = everSubscribed + expiredNonConverted;
  const conversionRate = conversionBase > 0 ? Math.round((activeUsers.length / conversionBase) * 100) : 0;

  // Registrations per day (last 14 days)
  const regByDay: Record<string, number> = {};
  for (const u of nonAdmins) {
    const day = u.created_at.slice(0, 10);
    regByDay[day] = (regByDay[day] ?? 0) + 1;
  }

  return NextResponse.json({
    users: result,
    revenue: { mrr, conversionRate },
    regByDay,
  });
}
