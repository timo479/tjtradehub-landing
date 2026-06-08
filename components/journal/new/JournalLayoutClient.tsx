"use client";
import { useState, useEffect } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
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
  const pageBg = dk ? "radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 55%), #000" : "#f0f2f5";
  const btnBorder = dk ? "#374151" : "#D1D5DB";
  const btnClr = dk ? "#9CA3AF" : "#4B5563";

  const lightHeaderStyle: React.CSSProperties = {
    borderBottom: "1px solid rgba(0,0,0,0.1)",
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  };

  return (
    <div className="min-h-screen" style={{ background: pageBg, transition: "background 0.3s ease" }}>
      <DashboardHeader
        activePage="journal"
        name={name}
        email={email}
        subscriptionStatus={subscriptionStatus}
        headerStyle={dk ? undefined : lightHeaderStyle}
        extraButtons={
          mounted ? (
            <button
              onClick={toggleTheme}
              title={dk ? "Switch to light mode" : "Switch to dark mode"}
              style={{ padding: "7px 10px", borderRadius: "8px", border: `1px solid ${btnBorder}`, backgroundColor: "transparent", color: btnClr, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s ease" }}
            >
              {dk ? <SunIcon /> : <MoonIcon />}
            </button>
          ) : null
        }
      />

      <main className="mx-auto px-6 py-10" style={{ maxWidth: "1200px" }}>
        <JournalNew journalTourCompleted={journalTourCompleted} darkMode={darkMode} toggleTheme={toggleTheme} />
      </main>
    </div>
  );
}
