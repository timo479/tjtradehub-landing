import { db } from "@/lib/db";

export type LotterySource =
  | "register"
  | "mt5_connect"
  | "five_trades"
  | "twitter_share"
  | "referrals";

export const LOTS_PER_SOURCE: Record<Exclude<LotterySource, "referrals">, number> = {
  register: 1,
  mt5_connect: 3,
  five_trades: 5,
  twitter_share: 2,
};

export const LOTS_PER_REFERRAL = 5;

/**
 * Make a referral code from the email local-part.
 * Lowercases, strips non-alphanumerics, falls back to "user".
 * Caller must handle collisions (try with suffix).
 */
export function baseReferralCode(email: string): string {
  const local = email.split("@")[0] ?? "";
  const cleaned = local.toLowerCase().replace(/[^a-z0-9]/g, "");
  return cleaned.length >= 3 ? cleaned : "user";
}

/**
 * Generate a unique referral code, retrying with numeric suffix on collision.
 * Returns the code.
 */
export async function generateUniqueReferralCode(email: string): Promise<string> {
  const base = baseReferralCode(email);
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? base : `${base}${attempt + 1}`;
    const { data } = await db
      .from("users")
      .select("id")
      .eq("referral_code", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  // Fallback: random suffix
  return `${base}${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Ensure a lottery row exists for the user. Idempotent.
 */
export async function ensureLotteryEntry(userId: string, email: string): Promise<void> {
  await db
    .from("founder_lottery_entries")
    .upsert(
      { user_id: userId, email, lots: 0, sources: {} },
      { onConflict: "user_id", ignoreDuplicates: true }
    );
}

/**
 * Award lots for a source. Idempotent for non-stacking sources
 * (register, mt5_connect, five_trades, twitter_share — each only once).
 * For "referrals", increments the counter and adds lots each time.
 *
 * Returns the new total lots, or null if the source was already credited.
 */
export async function awardLots(
  userId: string,
  email: string,
  source: LotterySource,
  amount: number
): Promise<number | null> {
  await ensureLotteryEntry(userId, email);

  const { data: row, error: readErr } = await db
    .from("founder_lottery_entries")
    .select("lots, sources")
    .eq("user_id", userId)
    .single();

  if (readErr || !row) {
    console.error("[lottery] read failed:", readErr);
    return null;
  }

  const sources = (row.sources ?? {}) as Record<string, number>;

  if (source === "referrals") {
    const prev = sources.referrals ?? 0;
    sources.referrals = prev + amount;
  } else {
    if (sources[source]) return null; // already credited
    sources[source] = amount;
  }

  const newLots = Object.values(sources).reduce((s, v) => s + (Number(v) || 0), 0);

  const { error: updErr } = await db
    .from("founder_lottery_entries")
    .update({ lots: newLots, sources })
    .eq("user_id", userId);

  if (updErr) {
    console.error("[lottery] update failed:", updErr);
    return null;
  }

  return newLots;
}
