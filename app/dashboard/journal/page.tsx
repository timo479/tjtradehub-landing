import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import JournalV2 from "@/components/journal/v2/JournalV2";
import SignOutButton from "@/components/SignOutButton";
import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Journal – TJ TradeHub" };

export default async function JournalPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

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
              <Link href="/dashboard/journal"
                style={{ color: "#8B5CF6", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
                Journal
              </Link>
              <Link href="/dashboard/calendar" style={{ color: "#9CA3AF", fontSize: "14px", textDecoration: "none" }}>
                Calendar
              </Link>
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "#9CA3AF", fontSize: "14px" }}>{session.user.name}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto px-6 py-10" style={{ maxWidth: "1200px" }}>
        <JournalV2 />
      </main>
    </div>
  );
}
