import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";
import UserMenu from "@/components/UserMenu";
import HelpButton from "@/components/HelpButton";
import ChartsTourWrapper from "@/components/ChartsTourWrapper";

export const metadata = { title: "Charts – TJ TradeHub" };

export default async function ChartsPage() {
  const session = await auth();
  const { name, subscriptionStatus } = session!.user;

  const { data: userRow } = await db
    .from("users")
    .select("charts_tour_completed")
    .eq("id", session!.user.id)
    .single();
  const chartsTourCompleted = userRow?.charts_tour_completed ?? false;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 55%), #000" }}>
      {/* Header */}
      <header style={{ borderBottom: "1px solid #1F2937", flexShrink: 0 }} className="px-6 py-5">
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
              <Link href="/dashboard" style={{ color: "#9CA3AF", fontSize: "14px", textDecoration: "none" }}>Dashboard</Link>
              <Link href="/dashboard/journal" style={{ color: "#9CA3AF", fontSize: "14px", textDecoration: "none" }}>Journal</Link>
              <Link href="/dashboard/calendar" style={{ color: "#9CA3AF", fontSize: "14px", textDecoration: "none" }}>Calendar</Link>
              <Link href="/dashboard/charts" style={{ color: "#8B5CF6", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>Charts</Link>
              <Link href="/dashboard/calculator" style={{ color: "#9CA3AF", fontSize: "14px", textDecoration: "none" }}>Calculator</Link>
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <HelpButton />
            <UserMenu name={name} email={session!.user.email} subscriptionStatus={subscriptionStatus} />
          </div>
        </div>
      </header>

      {/* Charts iframe */}
      <iframe
        src="/charts-embed/index.html"
        style={{ flex: 1, border: "none", width: "100%", display: "block" }}
        title="TJ Charts"
        allow="notifications"
      />

      <ChartsTourWrapper alreadyCompleted={chartsTourCompleted} />
    </div>
  );
}
