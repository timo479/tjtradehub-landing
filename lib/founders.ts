import { db } from "@/lib/db";

export const SALE_TOTAL = 90;
export const RESERVED_GIVEAWAY = 10;
export const FOUNDER_PRICE_USD = 149;

export type AcquiredVia = "sale" | "giveaway" | "soft_launch";

export interface FounderStats {
  soldCount: number;       // slots with acquired_via='sale'
  saleTotal: number;       // 90
  remainingForSale: number;
  totalClaimed: number;    // all claimed (sale + giveaway + soft_launch)
  lastClaimedAt: string | null;
}

/**
 * Public counter snapshot for /founders landing.
 */
export async function getFounderStats(): Promise<FounderStats> {
  const { count: soldCount } = await db
    .from("founder_slots")
    .select("number", { count: "exact", head: true })
    .eq("acquired_via", "sale");

  const { count: totalClaimed } = await db
    .from("founder_slots")
    .select("number", { count: "exact", head: true })
    .not("claimed_by_user_id", "is", null);

  const { data: latest } = await db
    .from("founder_slots")
    .select("claimed_at")
    .not("claimed_at", "is", null)
    .order("claimed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const sold = soldCount ?? 0;
  return {
    soldCount: sold,
    saleTotal: SALE_TOTAL,
    remainingForSale: Math.max(0, SALE_TOTAL - sold),
    totalClaimed: totalClaimed ?? 0,
    lastClaimedAt: latest?.claimed_at ?? null,
  };
}

/**
 * Atomically claim the next available founder slot via Postgres function.
 * Returns the slot number, or null on failure.
 *
 * The Postgres function is idempotent for sales: passing the same
 * stripe_session_id twice returns the same slot number both times.
 */
export async function claimFounderSlot(args: {
  userId: string;
  email: string;
  acquiredVia: AcquiredVia;
  stripeSessionId?: string;
}): Promise<{ slot: number } | { error: "no_sale_slots_remaining" | "no_slots_available" | "rpc_failed" }> {
  const { data, error } = await db.rpc("claim_founder_slot", {
    p_user_id: args.userId,
    p_email: args.email,
    p_acquired_via: args.acquiredVia,
    p_stripe_session_id: args.stripeSessionId ?? null,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("no_sale_slots_remaining")) return { error: "no_sale_slots_remaining" };
    if (msg.includes("no_slots_available")) return { error: "no_slots_available" };
    console.error("[founders] claim_founder_slot RPC failed:", error);
    return { error: "rpc_failed" };
  }

  return { slot: data as number };
}
