"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import UserMenu from "@/components/UserMenu";
import HelpButton from "@/components/HelpButton";
import JournalNew from "./JournalNew";

interface Props {
  name: string | null;
  email: string | null;
  subscriptionStatus?: string;
  journalTourCompleted: boolean;
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

export default function JournalLayoutClient({ name, email, subscriptionStatus, journalTourCompleted }: Props) {
  const [darkMode, setDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try { const s = localStorage.getItem("tj-journal-theme"); if (s !== null) setDarkMode(s === "dark"); } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove("journal-light");
    } else {
      document.documentElement.classList.add("journal-light");
    }
    return () => { document.documentElement.classList.remove("journal-light"); };
  }, [darkMode]);

  const toggleTheme = () => setDarkMode(d => {
    const n = !d;
    try { localStorage.setItem("tj-journal-theme", n ? "dark" : "light"); } catch {}
    return n;
  });

  const dk = darkMode;
  const pageBg     = dk ? "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 55%), #000" : "#f0f2f5";
  const headerBg   = dk ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.92)";
  const headerBord = dk ? "1px solid #1F2937" : "1px solid rgba(0,0,0,0.1)";
  const logoClr    = dk ? "#F9FAFB" : "#111827";
  const navActive  = "#8B5CF6";
  const navInact   = dk ? "#9CA3AF" : "#4B5563";
  const btnBorder  = dk ? "#374151" : "#D1D5DB";
  const btnClr     = dk ? "#9CA3AF" : "#4B5563";

  return (
    <div className="min-h-screen" style={{ background: pageBg, transition: "background 0.3s ease" }}>
      {/* Header */}
      <header style={{ borderBottom: headerBord, backgroundColor: headerBg, backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 100, transition: "background-color 0.3s ease, border-color 0.3s ease" }} className="px-6 py-5">
        <div className="mx-auto flex items-center justify-between" style={{ maxWidth: "1200px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
              <div className="logo-rotate" style={{ width: 36, height: 36, position: "relative" }}>
                {Array.from({ length: 16 }).map((_, i) => (
                  <Image key={i} src="/logo-tj-transparent.png" alt={i === 0 ? "TJ TradeHub" : ""} width={36} height={36} className="logo-layer object-contain" style={{ transform: `translateZ(${i * 0.5}px)`, opacity: i === 15 ? 1 : 0.6 }} />
                ))}
              </div>
              <span style={{ color: logoClr, fontWeight: 600, fontSize: "16px", fontFamily: "'Space Grotesk', sans-serif", transition: "color 0.3s ease" }}>
                TJ TradeHub
              </span>
            </Link>
            <nav style={{ display: "flex", gap: "24px" }}>
              <Link href="/dashboard" style={{ color: navInact, fontSize: "14px", textDecoration: "none", transition: "color 0.3s ease" }}>Dashboard</Link>
              <Link href="/dashboard/journal" style={{ color: navActive, fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>Journal</Link>
              <Link href="/dashboard/calendar" style={{ color: navInact, fontSize: "14px", textDecoration: "none", transition: "color 0.3s ease" }}>Calendar</Link>
              <Link href="/dashboard/charts" style={{ color: navInact, fontSize: "14px", textDecoration: "none", transition: "color 0.3s ease" }}>Charts</Link>
              <Link href="/dashboard/calculator" style={{ color: navInact, fontSize: "14px", textDecoration: "none", transition: "color 0.3s ease" }}>Calculator</Link>
            </nav>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {mounted && (
              <button
                onClick={toggleTheme}
                title={dk ? "Switch to light mode" : "Switch to dark mode"}
                style={{ padding: "7px 10px", borderRadius: "8px", border: `1px solid ${btnBorder}`, backgroundColor: "transparent", color: btnClr, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease" }}
              >
                {dk ? <SunIcon /> : <MoonIcon />}
              </button>
            )}
            <HelpButton />
            <UserMenu name={name} email={email} subscriptionStatus={subscriptionStatus} />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto px-6 py-10" style={{ maxWidth: "1200px" }}>
        <JournalNew journalTourCompleted={journalTourCompleted} darkMode={darkMode} toggleTheme={toggleTheme} />
      </main>
    </div>
  );
}
