import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasActiveSubscription, canAccessDashboard } from "@/lib/trial";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MarketPulse from "@/components/insights/MarketPulse";
import InsightsHero from "@/components/insights/InsightsHero";
import FeedClient from "./FeedClient";
import FeedComingSoon from "./FeedComingSoon";

export const metadata = {
  title: "AI Market Insights – TJ TradeHub",
};

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const canAccess = canAccessDashboard({
    subscription_status: session.user.subscriptionStatus ?? "basic",
    current_period_end: session.user.currentPeriodEnd ?? null,
  });

  if (!canAccess) redirect("/billing");

  const isAdmin = (session.user as { role?: string }).role === "admin";
  // Demo account sees the live feed (for the product tour video) without being admin.
  const isDemo = session.user.email === "demo@tjtradehub.com";
  const showFeed = isAdmin || isDemo;
  const isPaying = hasActiveSubscription({
    subscription_status: session.user.subscriptionStatus ?? "basic",
    current_period_end: session.user.currentPeriodEnd ?? null,
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000", position: "relative", overflow: "hidden" }}>
      {/* Ambient background */}
      <div style={{ position: "fixed", top: "-15%", left: "50%", transform: "translateX(-50%)", width: "1100px", height: "560px", background: "radial-gradient(ellipse, rgba(139,92,246,0.12), transparent 65%)", pointerEvents: "none", zIndex: 0 }} />

      <DashboardHeader
        activePage="feed"
        isAdmin={isAdmin}
        name={session.user.name}
        email={session.user.email}
        subscriptionStatus={session.user.subscriptionStatus}
      />

      <main className="px-6 md:px-10 py-10" style={{ width: "100%", position: "relative", zIndex: 1 }}>
        {/* ── Hero (animated title + live status card) ── */}
        <InsightsHero name={session.user.name} />

        {/* ── Market Pulse: neon world map (left) + AI insights feed (right) + widgets below ── */}
        <MarketPulse feed={showFeed ? <FeedClient /> : <FeedComingSoon />} />
      </main>
    </div>
  );
}
