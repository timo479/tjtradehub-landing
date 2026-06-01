import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { hasActiveSubscription, canAccessDashboard } from "@/lib/trial";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FeedClient from "./FeedClient";
import FeedComingSoon from "./FeedComingSoon";

export const metadata = {
  title: "Market Insights – TJ TradeHub",
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
  const isPaying = hasActiveSubscription({
    subscription_status: session.user.subscriptionStatus ?? "basic",
    current_period_end: session.user.currentPeriodEnd ?? null,
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000" }}>
      <DashboardHeader
        activePage="feed"
        isAdmin={isAdmin}
        name={session.user.name}
        email={session.user.email}
        subscriptionStatus={session.user.subscriptionStatus}
      />
      <main className="mx-auto px-6 py-10" style={{ maxWidth: "960px" }}>
        {isAdmin ? (
          <>
            <div style={{ marginBottom: "32px" }}>
              <h1 style={{ color: "#F9FAFB", fontSize: "28px", fontWeight: 700, margin: "0 0 6px" }}>
                Market Insights
              </h1>
              <p style={{ color: "#6B7280", fontSize: "14px", margin: 0 }}>
                AI-curated USD market news with scenario analysis.
              </p>
            </div>
            <FeedClient />
          </>
        ) : (
          <FeedComingSoon />
        )}
      </main>
    </div>
  );
}
