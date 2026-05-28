import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  collectMarketNews,
  collectCommunityStats,
  collectUserStats,
  collectFeatures,
  getWeekStart,
} from "@/lib/newsletter/collectors";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const userIdParam = sp.get("userId");
  const weekParam = sp.get("week"); // e.g. "previous" for last week, "current" for this week, or YYYY-MM-DD

  // Default: previous Monday (the week the newsletter would cover)
  let weekStart: Date;
  if (weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
    weekStart = getWeekStart(new Date(weekParam + "T00:00:00Z"));
  } else if (weekParam === "current") {
    weekStart = getWeekStart(new Date());
  } else {
    // previous week (default)
    const today = new Date();
    today.setUTCDate(today.getUTCDate() - 7);
    weekStart = getWeekStart(today);
  }

  const userId = userIdParam ?? session.user.id;

  const t0 = Date.now();
  const [market, community, user, features] = await Promise.all([
    Promise.resolve(collectMarketNews(weekStart)),
    collectCommunityStats(weekStart),
    collectUserStats(userId, weekStart),
    collectFeatures(weekStart),
  ]);
  const elapsedMs = Date.now() - t0;

  return NextResponse.json({
    meta: {
      weekStart: weekStart.toISOString().slice(0, 10),
      userId,
      elapsedMs,
      hint: "Override with ?userId=<uuid>&week=YYYY-MM-DD (or week=current/previous)",
    },
    market,
    community,
    user,
    features,
  });
}
