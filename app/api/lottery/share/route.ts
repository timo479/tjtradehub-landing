import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { awardLots, LOTS_PER_SOURCE } from "@/lib/lottery";
import { NextResponse } from "next/server";

// POST /api/lottery/share – Award +2 lots once when the user shares on X/Twitter.
// Self-reported (no API verification) — idempotent: only credits the first call.
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await db
    .from("users")
    .select("email")
    .eq("id", session.user.id)
    .single();

  if (!user?.email) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const total = await awardLots(session.user.id, user.email, "twitter_share", LOTS_PER_SOURCE.twitter_share);

  if (total === null) {
    return NextResponse.json({ success: true, alreadyCredited: true });
  }

  return NextResponse.json({ success: true, lots: total });
}
