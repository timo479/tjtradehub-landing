import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SettingsClient from "./SettingsClient";
import ChangePasswordCard from "./ChangePasswordCard";

export const metadata = {
  title: "Settings – TJ TradeHub",
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { data: userRow } = await db
    .from("users")
    .select("newsletter_opt_in, password_hash")
    .eq("id", session.user.id)
    .single();

  const newsletterOptIn = userRow?.newsletter_opt_in ?? false;
  // Google-Anmeldungen haben password_hash = "" (lib/auth.ts) → dort wird ein
  // Passwort erstmalig GESETZT, nicht geändert. Nur das Boolean geht an den
  // Client, niemals der Hash selbst.
  const hasPassword = !!userRow?.password_hash;
  const isAdmin = (session.user as { role?: string }).role === "admin";
  const isPartner = (session.user as { isPartner?: boolean }).isPartner === true;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000" }}>
      <DashboardHeader
        activePage="dashboard"
        isAdmin={isAdmin}
        isPartner={isPartner}
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
        <ChangePasswordCard hasPassword={hasPassword} />
      </main>
    </div>
  );
}
