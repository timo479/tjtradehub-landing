import { auth } from "@/lib/auth";
import { getDaysRemaining, isTrialActive } from "@/lib/trial";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import UserMenu from "@/components/UserMenu";
import HelpButton from "@/components/HelpButton";
import DashboardStats from "@/components/dashboard/DashboardStats";
import DashboardKpiCards from "@/components/dashboard/DashboardKpiCards";
import MetaConnect from "@/components/meta/MetaConnect";
import DashboardTourWrapper from "@/components/DashboardTourWrapper";
import TikTokConversion from "@/components/TikTokConversion";

export const metadata = {
  title: "Dashboard – TJ TradeHub",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { name, trialEndsAt, subscriptionStatus } = session.user;
  const onTrial = isTrialActive({ trial_ends_at: trialEndsAt });
  const daysLeft = getDaysRemaining({ trial_ends_at: trialEndsAt });
  const isSubscribed = subscriptionStatus === "active" || subscriptionStatus === "lifetime";

  // Fetch entries from JournalV2
  const { data: rawEntries } = await db
    .from("trade_entries")
    .select("id, trade_date, trade_field_values(value, template_fields(label, field_type))")
    .eq("user_id", session.user.id);

  const { data: userRow } = await db
    .from("users")
    .select("onboarding_completed")
    .eq("id", session.user.id)
    .single();
  const onboardingCompleted = userRow?.onboarding_completed ?? false;

  const allEntries = rawEntries ?? [];

  const getPnl = (e: typeof allEntries[0]): number | null => {
    for (const fv of e.trade_field_values ?? []) {
      const label = (fv.template_fields?.label ?? "").toLowerCase();
      if (fv.template_fields?.field_type === "number" &&
        (label.includes("p&l") || label.includes("pnl") || label === "profit" || label.includes("gewinn") || label.includes("gain"))) {
        const n = parseFloat(fv.value);
        return isNaN(n) ? null : n;
      }
    }
    return null;
  };

  const getRating = (e: typeof allEntries[0]): number | null => {
    for (const fv of e.trade_field_values ?? []) {
      if ((fv.template_fields?.label ?? "").toLowerCase().includes("rating")) {
        const n = parseFloat(fv.value);
        return isNaN(n) ? null : n;
      }
    }
    return null;
  };

  const now = new Date();
  const nowMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const monthEntries = allEntries.filter((e) => e.trade_date?.slice(0, 7) === nowMonth);

  const pnls = allEntries.map(getPnl).filter((v): v is number => v !== null);
  const totalPnl = pnls.reduce((s, v) => s + v, 0);
  const wins = pnls.filter((v) => v > 0).length;
  const winRate = pnls.length ? Math.round((wins / pnls.length) * 100) : null;
  const ratings = allEntries.map(getRating).filter((v): v is number => v !== null);
  const avgRating = ratings.length
    ? (ratings.reduce((s, v) => s + v, 0) / ratings.length).toFixed(1)
    : null;

  const cards = [
    {
      label: "Trades This Month",
      value: monthEntries.length.toString(),
      sub: allEntries.length > 0 ? `${allEntries.length} total` : "no trades yet",
      color: "#F9FAFB",
    },
    {
      label: "Avg Rating",
      value: avgRating ? `${avgRating}/10` : "—",
      sub: avgRating ? "across all trades" : "add trades to calculate",
      color: avgRating ? (parseFloat(avgRating) >= 7 ? "#8B5CF6" : "#ef4444") : "#6B7280",
      progress: avgRating ? (parseFloat(avgRating) / 10) * 100 : undefined,
    },
    {
      label: "Win Rate",
      value: winRate !== null ? `${winRate}%` : "—",
      sub: winRate !== null ? `${wins} of ${pnls.length} trades` : "add trades to calculate",
      color: winRate !== null ? (winRate >= 50 ? "#22c55e" : "#ef4444") : "#6B7280",
      progress: winRate !== null ? winRate : undefined,
    },
    {
      label: "Total P&L",
      value: pnls.length ? `${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}` : "—",
      sub: pnls.length ? "realized profit / loss" : "no trades yet",
      color: pnls.length ? (totalPnl >= 0 ? "#22c55e" : "#ef4444") : "#6B7280",
    },
  ];

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.22) 0%, transparent 60%), #000" }}>
      <TikTokConversion />
      {/* Trial Banner */}
      {onTrial && !isSubscribed && (
        <div className="w-full px-6 py-3 flex items-center justify-between text-sm"
          style={{ backgroundColor: "rgba(139, 92, 246, 0.1)", borderBottom: "1px solid rgba(139, 92, 246, 0.2)" }}>
          <span style={{ color: "#C4B5FD" }}>
            <strong style={{ color: "#A78BFA" }}>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>{" "}
            left in your free trial
          </span>
          <Link href="/billing" className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ backgroundColor: "#8B5CF6", color: "#F9FAFB" }}>
            Upgrade – $29/mo
          </Link>
        </div>
      )}

      {/* Header */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100 }} className="px-6 py-5">
        <div className="mx-auto flex items-center justify-between" style={{ maxWidth: "1200px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              <div style={{ perspective: "150px" }}>
                <div className="logo-rotate" style={{ width: 36, height: 36, position: "relative" }}>
                  {Array.from({ length: 16 }).map((_, i) => (
                    <Image
                      key={i}
                      src="/logo-tj-transparent.png"
                      alt={i === 0 ? "TJ TradeHub" : ""}
                      width={36}
                      height={36}
                      className="logo-layer object-contain"
                      style={{ transform: `translateZ(${i * 0.5}px)`, opacity: i === 15 ? 1 : 0.6 }}
                    />
                  ))}
                </div>
              </div>
              <span style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "16px", fontFamily: "'Space Grotesk', sans-serif" }}>
                TJ TradeHub
              </span>
            </Link>
            <nav style={{ display: "flex", gap: "24px" }}>
              <Link href="/dashboard" style={{ color: "#8B5CF6", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
                Dashboard
              </Link>
              <Link href="/dashboard/journal" style={{ color: "#9CA3AF", fontSize: "14px", textDecoration: "none" }}>
                Journal
              </Link>
              <Link href="/dashboard/calendar" style={{ color: "#9CA3AF", fontSize: "14px", textDecoration: "none" }}>
                Calendar
              </Link>
              <Link href="/dashboard/charts" style={{ color: "#9CA3AF", fontSize: "14px", textDecoration: "none" }}>
                Charts
              </Link>
              <Link href="/dashboard/calculator" style={{ color: "#9CA3AF", fontSize: "14px", textDecoration: "none" }}>
                Calculator
              </Link>
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <HelpButton />
            <UserMenu name={name} email={session.user.email} subscriptionStatus={subscriptionStatus} />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto px-6 py-8" style={{ maxWidth: "1200px" }}>
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: "#F9FAFB" }}>
            Welcome back, {name?.split(" ")[0]} 👋
          </h2>
          <p style={{ color: "#9CA3AF" }}>
            {isSubscribed
              ? "Your subscription is active. Track your trades below."
              : `You're on your free trial. ${daysLeft} days remaining.`}
          </p>
        </div>

        {/* Stats Cards */}
        <DashboardKpiCards cards={cards} />

        {/* MetaAPI */}
        <div className="mb-6" data-tour="metaconnect">
          <MetaConnect isSubscribed={isSubscribed} />
        </div>

        {/* Statistiken Widget Grid */}
        <div className="mb-8" data-tour="dashboard-stats">
          <DashboardStats />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dashboard/journal" style={{ textDecoration: "none" }}>
            <div className="dash-card rounded-2xl p-6" data-tour="quick-action-journal" style={{ cursor: "pointer" }}>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(139,92,246,0.1)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="font-semibold" style={{ color: "#F9FAFB" }}>Trading Journal</h3>
              </div>
              <p className="text-sm" style={{ color: "#9CA3AF" }}>
                {allEntries.length > 0
                  ? `${allEntries.length} trade${allEntries.length > 1 ? "s" : ""} logged – keep tracking`
                  : "Log your first trade and build your statistics"}
              </p>
            </div>
          </Link>

          <Link href="/dashboard/journal" style={{ textDecoration: "none" }}>
            <div className="dash-card rounded-2xl p-6" data-tour="quick-action-mt5" style={{ cursor: "pointer" }}>
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "rgba(34,197,94,0.1)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke="#22c55e" strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="font-semibold" style={{ color: "#F9FAFB" }}>MT4 / MT5 Sync</h3>
              </div>
              <p className="text-sm" style={{ color: "#9CA3AF" }}>Automatic trade synchronization via MetaTrader 4 & 5</p>
              <span className="inline-block mt-3 px-3 py-1 rounded-lg text-xs font-medium"
                style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.2)" }}>
                Live
              </span>
            </div>
          </Link>
        </div>
      </main>

      <DashboardTourWrapper alreadyCompleted={onboardingCompleted} />
    </div>
  );
}
