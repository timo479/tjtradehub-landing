import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureLotteryEntry, generateUniqueReferralCode, LOTS_PER_REFERRAL, LOTS_PER_SOURCE } from "@/lib/lottery";
import { NextResponse } from "next/server";

// GET /api/lottery/status – returns the user's lottery state, referral code, referral URL,
// and how many people have signed up via their code.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await db
    .from("users")
    .select("email, referral_code")
    .eq("id", session.user.id)
    .single();

  if (!user?.email) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Backfill referral_code for users created before the lottery launched
  let referralCode = user.referral_code as string | null;
  if (!referralCode) {
    referralCode = await generateUniqueReferralCode(user.email);
    await db.from("users").update({ referral_code: referralCode }).eq("id", session.user.id);
  }

  await ensureLotteryEntry(session.user.id, user.email);

  const { data: entry } = await db
    .from("founder_lottery_entries")
    .select("lots, sources")
    .eq("user_id", session.user.id)
    .single();

  const { count: referredCount } = await db
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("referred_by_user_id", session.user.id);

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.tjtradehub.com";
  const referralUrl = `${base.replace(/\/$/, "")}/register?ref=${referralCode}`;

  return NextResponse.json({
    lots: entry?.lots ?? 0,
    sources: entry?.sources ?? {},
    referralCode,
    referralUrl,
    referredCount: referredCount ?? 0,
    rewards: {
      register: LOTS_PER_SOURCE.register,
      mt5_connect: LOTS_PER_SOURCE.mt5_connect,
      five_trades: LOTS_PER_SOURCE.five_trades,
      twitter_share: LOTS_PER_SOURCE.twitter_share,
      referral: LOTS_PER_REFERRAL,
    },
  });
}
