import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canAccessDashboard, getPlanTier } from "@/lib/trial";
import ImpersonationBanner from "@/components/ImpersonationBanner";
import FounderUpgradeModal from "@/components/FounderUpgradeModal";
import FeedbackBubble from "@/components/feedback/FeedbackBubble";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userPlan = {
    subscription_status: session.user.subscriptionStatus,
    current_period_end: session.user.currentPeriodEnd,
  };

  if (!canAccessDashboard(userPlan)) {
    redirect("/billing");
  }

  const tier = getPlanTier(userPlan);

  return (
    <>
      {session.user.isImpersonating && (
        <ImpersonationBanner email={session.user.email ?? ""} />
      )}
      {children}
      {tier === "basic" && <FounderUpgradeModal />}
      {/* In-app feedback bubble — only for logged-in users (dashboard layout). */}
      <FeedbackBubble />
    </>
  );
}
