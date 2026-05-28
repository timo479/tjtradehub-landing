import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Settings – TJ TradeHub",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { data: userRow } = await db
    .from("users")
    .select("newsletter_opt_in")
    .eq("id", session.user.id)
    .single();

  const newsletterOptIn = userRow?.newsletter_opt_in ?? false;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000" }}>
      <DashboardHeader
        activePage="dashboard"
        name={session.user.name}
        email={session.user.email}
        subscriptionStatus={session.user.subscriptionStatus}
      />

      <main className="mx-auto px-6 py-10" style={{ maxWidth: "720px" }}>
        <h1 style={{ color: "#F9FAFB", fontSize: "28px", fontWeight: 700, margin: "0 0 6px" }}>
          Settings
        </h1>
        <p style={{ color: "#6B7280", fontSize: "14px", margin: "0 0 32px" }}>
          Manage your account preferences.
        </p>

        <SettingsClient initialNewsletterOptIn={newsletterOptIn} />
      </main>
    </div>
  );
}
