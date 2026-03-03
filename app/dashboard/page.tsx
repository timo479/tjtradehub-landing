import { auth } from "@/lib/auth";
import { getDaysRemaining, isTrialActive } from "@/lib/trial";
import Link from "next/link";
import { redirect } from "next/navigation";
import SignOutButton from "@/components/SignOutButton";

export const metadata = {
  title: "Dashboard – TJ TradeHub",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) redirect("/login");

  const { name, trialEndsAt, subscriptionStatus } = session.user;
  const onTrial = isTrialActive({ trial_ends_at: trialEndsAt });
  const daysLeft = getDaysRemaining({ trial_ends_at: trialEndsAt });
  const isSubscribed = subscriptionStatus === "active";

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#0B0F1A" }}
    >
      {/* Trial Banner */}
      {onTrial && !isSubscribed && (
        <div
          className="w-full px-6 py-3 flex items-center justify-between text-sm"
          style={{
            backgroundColor: "rgba(139, 92, 246, 0.1)",
            borderBottom: "1px solid rgba(139, 92, 246, 0.2)",
          }}
        >
          <span style={{ color: "#C4B5FD" }}>
            <strong style={{ color: "#A78BFA" }}>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>{" "}
            left in your free trial
          </span>
          <Link
            href="/billing"
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{ backgroundColor: "#8B5CF6", color: "#F9FAFB" }}
          >
            Upgrade – $29/mo
          </Link>
        </div>
      )}

      {/* Header */}
      <header
        style={{ borderBottom: "1px solid #1F2937" }}
        className="px-6 py-5"
      >
        <div
          className="mx-auto flex items-center justify-between"
          style={{ maxWidth: "1200px" }}
        >
          <h1 className="text-lg font-semibold" style={{ color: "#F9FAFB" }}>
            TJ TradeHub
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm" style={{ color: "#9CA3AF" }}>
              {name}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className="mx-auto px-6 py-12"
        style={{ maxWidth: "1200px" }}
      >
        {/* Welcome */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-2" style={{ color: "#F9FAFB" }}>
            Welcome back, {name?.split(" ")[0]} 👋
          </h2>
          <p style={{ color: "#9CA3AF" }}>
            {isSubscribed
              ? "Your subscription is active. Track your trades below."
              : `You're on your free trial. ${daysLeft} days remaining.`}
          </p>
        </div>

        {/* Dashboard Placeholder Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: "Total Trades", value: "0", sub: "this month" },
            { label: "Discipline Score", value: "—", sub: "log trades to calculate" },
            { label: "Win Rate", value: "—", sub: "log trades to calculate" },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl p-6"
              style={{
                backgroundColor: "#111827",
                border: "1px solid #1F2937",
              }}
            >
              <p className="text-sm mb-3" style={{ color: "#9CA3AF" }}>
                {card.label}
              </p>
              <p className="text-4xl font-bold mb-1" style={{ color: "#F9FAFB" }}>
                {card.value}
              </p>
              <p className="text-xs" style={{ color: "#6B7280" }}>
                {card.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Empty State */}
        <div
          className="rounded-2xl p-12 flex flex-col items-center text-center"
          style={{
            backgroundColor: "#111827",
            border: "1px solid #1F2937",
          }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
            style={{ backgroundColor: "rgba(139, 92, 246, 0.1)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                stroke="#8B5CF6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: "#F9FAFB" }}>
            Your journal is ready
          </h3>
          <p className="text-sm mb-6" style={{ color: "#9CA3AF", maxWidth: "360px" }}>
            MT5 sync and manual trade logging coming soon. Your account is set up
            and ready to go.
          </p>
          <div
            className="px-4 py-2 rounded-xl text-xs font-medium"
            style={{
              backgroundColor: "rgba(139, 92, 246, 0.1)",
              color: "#8B5CF6",
              border: "1px solid rgba(139, 92, 246, 0.2)",
            }}
          >
            MT5 Integration – Coming Soon
          </div>
        </div>
      </main>
    </div>
  );
}
