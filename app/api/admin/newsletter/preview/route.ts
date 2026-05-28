import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  collectUserStats,
  getWeekStart,
} from "@/lib/newsletter/collectors";
import { renderNewsletterHtml } from "@/lib/newsletter/render-email";
import type { GeneratedNewsletter } from "@/lib/newsletter/generateContent";

// Renders a STORED newsletter (by id) as HTML. No Claude call — just reads
// the persisted content_json. Used by the admin page iframe + the
// "View rendered email" link in the admin notification email.
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const { data: nl } = await db
    .from("newsletters")
    .select("id, week_of, content_json")
    .eq("id", id)
    .single();

  if (!nl) {
    return NextResponse.json({ error: "Newsletter not found" }, { status: 404 });
  }

  const newsletter = nl.content_json as GeneratedNewsletter;
  const weekStart = getWeekStart(new Date(nl.week_of + "T00:00:00Z"));

  // Default to the admin's own user stats so the preview shows the "Your Week" box
  const userStats = await collectUserStats(session.user.id, weekStart);

  const { data: userRow } = await db
    .from("users")
    .select("name, unsubscribe_token")
    .eq("id", session.user.id)
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
