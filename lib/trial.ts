import type { User } from "./db";

export type PlanTier = "basic" | "pro" | "lifetime";

export function hasActiveSubscription(
  user: Pick<User, "subscription_status" | "current_period_end">
): boolean {
  if (user.subscription_status === "lifetime") return true;
  if (user.subscription_status === "active") {
    if (!user.current_period_end) return true;
    // 24h grace period for webhook delays
    return new Date(user.current_period_end).getTime() + 24 * 60 * 60 * 1000 > Date.now();
  }
  return false;
}

export function hasMt5Access(
  user: Pick<User, "subscription_status" | "current_period_end">
): boolean {
  return hasActiveSubscription(user);
}

export function canAccessDashboard(
  user: Pick<User, "subscription_status" | "current_period_end">
): boolean {
  if (user.subscription_status === "basic") return true;
  return hasActiveSubscription(user);
}

export function getPlanTier(
  user: Pick<User, "subscription_status" | "current_period_end">
): PlanTier {
  if (user.subscription_status === "lifetime") return "lifetime";
  if (hasActiveSubscription(user)) return "pro";
  return "basic";
}
