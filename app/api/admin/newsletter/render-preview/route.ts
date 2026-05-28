import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  collectMarketNews,
  collectCommunityStats,
  collectUserStats,
  collectFeatures,
  getWeekStart,
} from "@/lib/newsletter/collectors";
import { generateNewsletter } from "@/lib/newsletter/generateContent";
import { renderNewsletterHtml } from "@/lib/newsletter/render-email";

// Generates + renders the newsletter as HTML so you can open it in the browser
// and see what subscribers would receive. Each call hits Claude — costs ~$0.05–0.50.
// Pass ?userId=<uuid> to inject that user's personal stats.
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
  const userIdParam = sp.get("userId") ?? session.user.id;

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

  const [community, features, userStats] = await Promise.all([
    collectCommunityStats(weekStart),
    collectFeatures(weekStart),
    collectUserStats(userIdParam, weekStart),
  ]);
  const market = collectMarketNews(weekStart);

  let newsletter;
  try {
    newsletter = await generateNewsletter({ market, community, features });
  } catch (err) {
    return NextResponse.json(
      { error: "Claude API call failed", message: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }

  // Lookup recipient name + unsubscribe token
  const { data: userRow } = await db
    .from("users")
    .select("name, unsubscribe_token")
    .eq("id", userIdParam)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.tjtradehub.com";
  const unsubscribeUrl = `${appUrl}/unsubscribe?t=${userRow?.unsubscribe_token ?? "PREVIEW"}`;

  const html = renderNewsletterHtml({
    newsletter,
    userStats,
    recipientName: userRow?.name ?? null,
    unsubscribeUrl,
  });

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
