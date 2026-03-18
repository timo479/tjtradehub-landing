import type { User } from "./db";

export function isTrialActive(user: Pick<User, "trial_ends_at">): boolean {
  return new Date(user.trial_ends_at) >= new Date();
}

export function getDaysRemaining(user: Pick<User, "trial_ends_at">): number {
  const diff = new Date(user.trial_ends_at).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function hasActiveSubscription(
  user: Pick<User, "subscription_status" | "current_period_end">
): boolean {
  if (user.subscription_status === "active") {
    if (!user.current_period_end) return true;
    return new Date(user.current_period_end) > new Date();
  }
  return false;
}

export function canAccessDashboard(
  user: Pick<User, "trial_ends_at" | "subscription_status" | "current_period_end">
): boolean {
  return isTrialActive(user) || hasActiveSubscription(user);
}
