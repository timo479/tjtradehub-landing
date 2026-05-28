import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  collectMarketNews,
  collectCommunityStats,
  collectFeatures,
  getWeekStart,
} from "@/lib/newsletter/collectors";
import { generateNewsletter } from "@/lib/newsletter/generateContent";

// Calls the Claude API — each request costs roughly $0.05–0.50 depending on
// how much adaptive thinking the model uses. Admin-only.
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
  const weekParam = sp.get("week");

  let weekStart: Date;
  if (weekParam && /^\d{4}-\d{2}-\d{2}$/.test(weekParam)) {
    weekStart = getWeekStart(new Date(weekParam + "T00:00:00Z"));
  } else if (weekParam === "current") {
    weekStart = getWeekStart(new Date());
  } else {
    const today = new Date();
    today.setUTCDate(today.getUTCDate() - 7);
    weekStart = getWeekStart(today);
  }

  const t0 = Date.now();

  const [community, features] = await Promise.all([
    collectCommunityStats(weekStart),
    collectFeatures(weekStart),
  ]);
  const market = collectMarketNews(weekStart);
  const collectedMs = Date.now() - t0;

  const t1 = Date.now();
  let generated;
  try {
    generated = await generateNewsletter({ market, community, features });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Claude API call failed",
        message: err instanceof Error ? err.message : String(err),
        collected: { market, community, features },
      },
      { status: 500 },
    );
  }
  const generatedMs = Date.now() - t1;

  return NextResponse.json({
    meta: {
      weekStart: weekStart.toISOString().slice(0, 10),
      collectedMs,
      generatedMs,
      model: process.env.NEWSLETTER_MODEL || "claude-opus-4-7",
      hint: "Override week with ?week=YYYY-MM-DD or ?week=current",
    },
    collected: { market, community, features },
    newsletter: generated,
  });
}
