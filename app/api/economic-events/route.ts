import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/trial";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessDashboard({
    subscription_status: session.user.subscriptionStatus,
    current_period_end: session.user.currentPeriodEnd ?? null,
  })) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);

  // Default window: start of the current month through end of next month.
  const now = new Date();
  const defFrom = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const defTo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 1)).toISOString();

  const from = searchParams.get("from") ?? defFrom;
  const to = searchParams.get("to") ?? defTo;
  const impact = searchParams.get("impact");
  const country = searchParams.get("country");

  let query = db
    .from("economic_events")
    .select("id, title, country, event_time, impact, forecast, previous, feed_post_id")
    .gte("event_time", from)
    .lte("event_time", to);

  if (impact) query = query.eq("impact", impact);
  if (country) query = query.eq("country", country);

  const { data, error } = await query.order("event_time", { ascending: true });

  if (error) {
    console.error("economic_events select error:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}
