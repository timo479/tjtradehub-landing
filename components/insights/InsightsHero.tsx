"use client";

import React, { useEffect, useState } from "react";
import { SESSIONS, isOpenAt } from "./MarketPulse";

/* Hero for the AI Market Insights page: wow-effect animated title on the left,
   a premium live status card (rotating gradient border) on the right filling
   the header gap — live UTC clock + global session status (real data). */

const MANTRAS = [
  "Discipline over emotion.",
  "Plan the trade. Trade the plan.",
  "Risk first. Profit follows.",
  "Process over outcome.",
  "Cut losses. Let winners run.",
  "Consistency beats intensity.",
  "Patience is a position.",
  "Trade what you see, not what you feel.",
];

export default function InsightsHero({ name }: { name?: string | null }) {
  const [now, setNow] = useState<Date | null>(null);
  const [mi, setMi] = useState(0);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setMi(p => (p + 1) % MANTRAS.length), 8000);
    return () => clearInterval(id);
  }, []);

  const first = (name?.trim().split(/\s+/)[0]) || "Trader";
  const greeting = now ? (now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening") : "Welcome";

  const states = now ? SESSIONS.map(s => ({ s, open: isOpenAt(s, now) })) : SESSIONS.map(s => ({ s, open: false }));
  const openCount = states.filter(x => x.open).length;
  const openCity = states.find(x => x.open)?.s.city;

  const time = now ? now.toISOString().slice(11, 19) : "--:--:--";
  const date = now
    ? new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(now)
    : "";

  return (
    <div className="ih-hero" style={{ position: "relative", marginBottom: "28px", textAlign: "center", paddingTop: "6px" }}>
      {/* ── Left: greeting + name + rotating mantra ── */}
      <div className="ih-greeting" style={{ textAlign: "left" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#64748b", marginBottom: "4px" }}>{greeting}</div>
        <div style={{ fontSize: "42px", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1, backgroundImage: "linear-gradient(110deg, #7c3aed 20%, #ffffff 48%, #a78bfa 58%, #7c3aed 85%)", backgroundSize: "220% auto", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent", animation: "ih-flow 4.5s linear infinite" }}>{first}</div>
        <div style={{ height: "22px", overflow: "hidden", marginTop: "6px" }}>
          <span key={mi} style={{ display: "block", color: "#94a3b8", fontSize: "14px", fontWeight: 500, fontStyle: "italic", whiteSpace: "nowrap", animation: "ih-mantra 8s ease both" }}>“{MANTRAS[mi]}”</span>
        </div>
      </div>

      {/* ── Center: title ── */}
      <div>
        <div style={{ marginBottom: "16px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "5px 12px", borderRadius: "20px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.28)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#A78BFA", boxShadow: "0 0 8px #A78BFA", animation: "ih-pulse 2s infinite" }} />
            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.12em", color: "#C4B5FD", textTransform: "uppercase" }}>AI-Powered · Real-Time</span>
          </span>
        </div>

        {/* animated gradient title + shine sweep */}
        <div style={{ position: "relative", display: "inline-block" }}>
          <h1 style={{ ...titleStyle, backgroundImage: "linear-gradient(100deg, #ffffff 0%, #C4B5FD 30%, #8B5CF6 50%, #22d3ee 70%, #ffffff 100%)", backgroundSize: "200% auto", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent", animation: "ih-flow 7s linear infinite", filter: "drop-shadow(0 4px 30px rgba(139,92,246,0.35))" }}>
            Market Insights
          </h1>
          <h1 aria-hidden style={{ ...titleStyle, position: "absolute", inset: 0, backgroundImage: "linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.9) 50%, transparent 58%)", backgroundSize: "250% 100%", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent", animation: "ih-shine 5s ease-in-out infinite", pointerEvents: "none" }}>
            Market Insights
          </h1>
        </div>

        <p style={{ color: "#9CA3AF", fontSize: "15px", margin: "10px auto 0", maxWidth: "560px", lineHeight: 1.5 }}>
          Live global sessions, high-impact events and AI-curated market analysis — your entire trading day, one command center.
        </p>
      </div>

      {/* ── Right: live status card (rotating gradient border) ── */}
      <div className="ih-cardpos">
      <div style={{ position: "relative", borderRadius: "18px", overflow: "hidden", textAlign: "left" }}>
        <div style={{ position: "absolute", inset: "-60%", background: "conic-gradient(from 0deg, transparent 0deg, rgba(139,92,246,0.9) 40deg, rgba(34,211,238,0.7) 90deg, transparent 140deg, transparent 220deg, rgba(217,70,239,0.8) 300deg, transparent 340deg)", animation: "ih-spin 6s linear infinite" }} />
        <div style={{ position: "relative", margin: "1.5px", borderRadius: "16px", background: "rgba(8,8,14,0.92)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", padding: "16px 22px", display: "flex", alignItems: "center", gap: "24px" }}>
          {/* clock */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22d3ee", boxShadow: "0 0 8px #22d3ee", animation: "ih-pulse 2s infinite" }} />
              <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.14em", color: "#64748b" }}>UTC TIME</span>
            </div>
            <div style={{ fontSize: "30px", fontWeight: 800, color: "#F9FAFB", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em", lineHeight: 1 }}>{time}</div>
            <div style={{ fontSize: "11px", color: "#6B7280", fontWeight: 600, marginTop: "5px" }}>{date}</div>
          </div>

          <div style={{ width: 1, alignSelf: "stretch", background: "rgba(255,255,255,0.08)" }} />

          {/* session status */}
          <div>
            <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.14em", color: "#64748b", marginBottom: "8px" }}>SESSIONS</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "26px", fontWeight: 800, color: openCount > 0 ? "#22c55e" : "#9CA3AF", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{openCount}</span>
              <span style={{ fontSize: "13px", color: "#4B5563", fontWeight: 700 }}>/ {SESSIONS.length} open</span>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {states.map(({ s, open }) => (
                <span key={s.key} title={s.city} style={{
                  width: 9, height: 9, borderRadius: "50%",
                  background: open ? s.color : "rgba(148,163,184,0.28)",
                  boxShadow: open ? `0 0 9px ${s.color}` : "none",
                  animation: open ? "ih-pulse 2s infinite" : "none",
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>

      <style>{`
        @keyframes ih-flow { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
        @keyframes ih-shine { 0% { background-position: 150% 0; } 55%, 100% { background-position: -80% 0; } }
        @keyframes ih-spin { to { transform: rotate(360deg); } }
        @keyframes ih-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes ih-mantra { 0% { opacity: 0; transform: translateY(10px); } 12%,88% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-10px); } }
        .ih-greeting { position: absolute; left: 0; top: 50%; transform: translateY(-50%); }
        .ih-cardpos { position: absolute; right: 0; top: 50%; transform: translateY(-50%); }
        @media (max-width: 1280px) {
          .ih-greeting { display: none; }
          .ih-cardpos { position: static; transform: none; margin: 22px auto 0; display: inline-block; }
        }
      `}</style>
    </div>
  );
}

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: "clamp(34px, 4.8vw, 56px)",
  fontWeight: 800,
  letterSpacing: "-0.035em",
  lineHeight: 1.02,
  whiteSpace: "nowrap",
};
