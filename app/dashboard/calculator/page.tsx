import { auth } from "@/lib/auth";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import CalculatorClient from "./CalculatorClient";

export const metadata = { title: "Risk Calculator – TJ TradeHub" };

export default async function CalculatorPage() {
  const session = await auth();
  const { name, subscriptionStatus } = session!.user;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 55%), #000" }}>
      {/* Header */}
      <DashboardHeader
        activePage="calculator"
        name={name}
        email={session!.user.email}
        subscriptionStatus={subscriptionStatus}
        headerStyle={{ borderBottom: "1px solid #1F2937", flexShrink: 0 }}
      />

      <CalculatorClient />
    </div>
  );
}
