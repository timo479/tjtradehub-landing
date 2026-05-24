import { auth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/trial";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import LotteryView from "@/components/lottery/LotteryView";

export const metadata = { title: "Founder Lottery – TJ TradeHub" };

export default async function LotteryPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (
    !canAccessDashboard({
      subscription_status: session.user.subscriptionStatus,
      current_period_end: session.user.currentPeriodEnd,
    })
  ) {
    redirect("/billing");
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.22) 0%, transparent 60%), #000",
      }}
    >
      <DashboardHeader
        activePage="lottery"
        name={session.user.name}
        email={session.user.email}
        subscriptionStatus={session.user.subscriptionStatus}
      />

      <main className="mx-auto px-6 py-10" style={{ maxWidth: "900px" }}>
        <LotteryView />
      </main>
    </div>
  );
}
