import { auth } from "@/lib/auth";
import { canAccessDashboard } from "@/lib/trial";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import UserMenu from "@/components/UserMenu";
import HelpButton from "@/components/HelpButton";
import MarketCalendar from "@/components/calendar/MarketCalendar";

export const metadata = { title: "Market Calendar – TJ TradeHub" };

export default async function CalendarPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canAccessDashboard({ trial_ends_at: session.user.trialEndsAt, subscription_status: session.user.subscriptionStatus, current_period_end: session.user.currentPeriodEnd })) redirect("/billing");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#000000" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #1F2937" }} className="px-6 py-5">
        <div className="mx-auto flex items-center justify-between" style={{ maxWidth: "1200px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              <div style={{ perspective: "150px" }}>
                <div className="logo-rotate" style={{ width: 36, height: 36, position: "relative", transformStyle: "preserve-3d" }}>
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
              <Link href="/dashboard" style={{ color: "#9CA3AF", fontSize: "14px", textDecoration: "none" }}>
                Dashboard
              </Link>
              <Link href="/dashboard/journal" style={{ color: "#9CA3AF", fontSize: "14px", textDecoration: "none" }}>
                Journal
              </Link>
              <Link href="/dashboard/calendar" style={{ color: "#8B5CF6", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
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
            <UserMenu name={session.user.name} email={session.user.email} />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto px-6 py-10" style={{ maxWidth: "1200px" }}>
        <MarketCalendar />
      </main>
    </div>
  );
}
