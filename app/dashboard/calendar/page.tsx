import { auth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/trial";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MarketCalendar from "@/components/calendar/MarketCalendar";

export const metadata = { title: "Market Calendar – TJ TradeHub" };

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canAccessDashboard({ trial_ends_at: session.user.trialEndsAt, subscription_status: session.user.subscriptionStatus, current_period_end: session.user.currentPeriodEnd })) redirect("/billing");

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 55%), #000" }}>
      {/* Header */}
      <DashboardHeader
        activePage="calendar"
        name={session.user.name}
        email={session.user.email}
        headerStyle={{ borderBottom: "1px solid #1F2937" }}
      />

      {/* Content */}
      <main className="mx-auto px-6 py-10" style={{ maxWidth: "1200px" }}>
        <MarketCalendar />
      </main>
    </div>
  );
}
