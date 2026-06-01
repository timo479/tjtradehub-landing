import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import NewsletterAdminClient from "./NewsletterAdminClient";

export const metadata = {
  title: "Newsletter Admin – TJ TradeHub",
};

export const dynamic = "force-dynamic";

export default async function NewsletterAdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if ((session.user as { role?: string }).role !== "admin") {
    redirect("/dashboard");
  }

  // Pending review (max 1 — UNIQUE on week_of)
  const { data: pending } = await db
    .from("newsletters")
    .select("id, week_of, subject, generated_at, content_json")
    .eq("status", "pending_approval")
    .order("week_of", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Recent history
  const { data: history } = await db
    .from("newsletters")
    .select("id, week_of, subject, status, sent_at, recipient_count, error_message, generated_at")
    .neq("status", "pending_approval")
    .order("generated_at", { ascending: false })
    .limit(10);

  // Opt-in count
  const { count: optInCount } = await db
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("newsletter_opt_in", true)
    .eq("email_verified", true)
    .neq("is_banned", true);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#000" }}>
      <DashboardHeader
        activePage="admin-newsletter"
        isAdmin={true}
        name={session.user.name}
        email={session.user.email}
        subscriptionStatus={session.user.subscriptionStatus}
      />

      <main className="mx-auto px-6 py-10" style={{ maxWidth: "960px" }}>
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{ color: "#F9FAFB", fontSize: "28px", fontWeight: 700, margin: "0 0 6px" }}>
            Newsletter Admin
          </h1>
          <p style={{ color: "#6B7280", fontSize: "14px", margin: 0 }}>
            Review and approve the weekly newsletter before it goes out to subscribers.
          </p>
        </div>

        <NewsletterAdminClient
          pending={pending}
          history={history ?? []}
          optInCount={optInCount ?? 0}
        />
      </main>
    </div>
  );
}
