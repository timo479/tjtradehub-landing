import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { canAccessDashboard } from "@/lib/trial";
import ImpersonationBanner from "@/components/ImpersonationBanner";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const canAccess = canAccessDashboard({
    trial_ends_at: session.user.trialEndsAt,
    subscription_status: session.user.subscriptionStatus,
    current_period_end: session.user.currentPeriodEnd,
  });

  if (!canAccess) {
    redirect("/billing");
  }

  return (
    <>
      {session.user.isImpersonating && (
        <ImpersonationBanner email={session.user.email ?? ""} />
      )}
      {children}
    </>
  );
}
