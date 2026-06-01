import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FeedAdminClient from "./FeedAdminClient";

export const metadata = {
  title: "KI Feed Admin – TJ TradeHub",
};

export const dynamic = "force-dynamic";

export default async function FeedAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as { role?: string }).role !== "admin") redirect("/dashboard");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000" }}>
      <DashboardHeader
        activePage="admin-feed"
        isAdmin={true}
        name={session.user.name}
        email={session.user.email}
        subscriptionStatus={session.user.subscriptionStatus}
      />
      <main className="mx-auto px-6 py-10" style={{ maxWidth: "960px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ color: "#F9FAFB", fontSize: "28px", fontWeight: 700, margin: "0 0 6px" }}>
            KI Feed
          </h1>
          <p style={{ color: "#6B7280", fontSize: "14px", margin: 0 }}>
            Review and publish AI-generated market insights from the n8n pipeline.
          </p>
        </div>
        <FeedAdminClient />
      </main>
    </div>
  );
}
