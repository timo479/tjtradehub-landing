import { auth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/trial";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ChecklistComingSoon from "@/components/checklist/ChecklistComingSoon";
import ChecklistClient from "@/components/checklist/ChecklistClient";

export const metadata = { title: "Trade Checklist – TJ TradeHub" };

export default async function ChecklistPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canAccessDashboard({ trial_ends_at: session.user.trialEndsAt, subscription_status: session.user.subscriptionStatus, current_period_end: session.user.currentPeriodEnd })) redirect("/billing");

  const enabled = process.env.NEXT_PUBLIC_CHECKLIST_ENABLED === "true";

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 55%), #000" }}>
      <DashboardHeader
        activePage="checklist"
        name={session.user.name}
        email={session.user.email}
        subscriptionStatus={session.user.subscriptionStatus}
        headerStyle={{ borderBottom: "1px solid #1F2937" }}
      />
      <main className="mx-auto px-6 py-10" style={{ maxWidth: "900px" }}>
        {enabled ? (
          <ChecklistClient userId={session.user.id} />
        ) : (
          <ChecklistComingSoon />
        )}
      </main>
    </div>
  );
}
