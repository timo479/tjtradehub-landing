import { auth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/trial";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import JournalLayoutClient from "@/components/journal/new/JournalLayoutClient";

export const metadata = { title: "Journal – TJ TradeHub" };

export default async function JournalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canAccessDashboard({ trial_ends_at: session.user.trialEndsAt, subscription_status: session.user.subscriptionStatus, current_period_end: session.user.currentPeriodEnd })) redirect("/billing");

  const { data: userRow } = await db
    .from("users")
    .select("journal_tour_completed")
    .eq("id", session.user.id)
    .single();
  const journalTourCompleted = userRow?.journal_tour_completed ?? false;

  return (
    <JournalLayoutClient
      name={session.user.name}
      email={session.user.email}
      subscriptionStatus={session.user.subscriptionStatus}
      journalTourCompleted={journalTourCompleted}
    />
  );
}
