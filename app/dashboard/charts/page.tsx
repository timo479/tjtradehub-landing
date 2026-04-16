import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ChartsTourWrapper from "@/components/ChartsTourWrapper";

export const metadata = { title: "Charts – TJ TradeHub" };

export default async function ChartsPage() {
  const session = await auth();
  const { name, subscriptionStatus } = session!.user;

  const { data: userRow } = await db
    .from("users")
    .select("charts_tour_completed")
    .eq("id", session!.user.id)
    .single();
  const chartsTourCompleted = userRow?.charts_tour_completed ?? false;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 55%), #000" }}>
      {/* Header */}
      <DashboardHeader
        activePage="charts"
        name={name}
        email={session!.user.email}
        subscriptionStatus={subscriptionStatus}
        headerStyle={{ borderBottom: "1px solid #1F2937", flexShrink: 0 }}
      />

      {/* Charts iframe */}
      <iframe
        src="/charts-embed/index.html"
        style={{ flex: 1, border: "none", width: "100%", display: "block" }}
        title="TJ Charts"
        allow="notifications"
      />

      <ChartsTourWrapper alreadyCompleted={chartsTourCompleted} />
    </div>
  );
}
