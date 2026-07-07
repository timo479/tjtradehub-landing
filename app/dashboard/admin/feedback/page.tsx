import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import FeedbackAdminClient from "./FeedbackAdminClient";

export const metadata = {
  title: "Feedback Admin – TJ TradeHub",
};

export const dynamic = "force-dynamic";

export default async function FeedbackAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as { role?: string }).role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000" }}>
      <DashboardHeader
        activePage="admin-feedback"
        isAdmin={true}
        name={session.user.name}
        email={session.user.email}
        subscriptionStatus={session.user.subscriptionStatus}
      />

      <main className="mx-auto px-6 py-10" style={{ maxWidth: "1100px" }}>
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ color: "#F9FAFB", fontSize: "28px", fontWeight: 700, margin: "0 0 6px" }}>
            Feedback
          </h1>
          <p style={{ color: "#6B7280", fontSize: "14px", margin: 0 }}>
            Feedback submitted by logged-in users from inside the app.
          </p>
        </div>

        <FeedbackAdminClient />
      </main>
    </div>
  );
}
