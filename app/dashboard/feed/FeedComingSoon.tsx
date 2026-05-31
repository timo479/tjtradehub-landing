"use client";

import { useEffect, useState } from "react";

const MOCK_POSTS = [
  {
    impact: "high",
    color: "#EF4444",
    title: "Fed Powell signals higher-for-longer — DXY surges",
    symbols: ["DXY", "EURUSD", "XAUUSD"],
    source: "ForexLive",
    time: "2m ago",
    body: "Powell's comments at the Jackson Hole symposium pushed rate-cut expectations further into Q4. Markets repriced rapidly across USD pairs.",
    scenarios: [
      { if: "If DXY breaks above 106.50", then: "EURUSD could test 1.0650 support zone" },
      { if: "If 10Y yields stay above 4.5%", then: "XAUUSD may face continued downward pressure" },
    ],
  },
  {
    impact: "medium",
    color: "#F97316",
    title: "US Retail Sales beat — consumer resilience intact",
    symbols: ["USDJPY", "GBPUSD", "SPX"],
    source: "DailyFX",
    time: "18m ago",
    body: "Retail sales came in at +0.5% MoM vs +0.3% expected, signaling continued consumer strength.",
    scenarios: [
      { if: "If SPX breaks 5,400", then: "Risk-on mood could boost risk currencies vs USD" },
    ],
  },
  {
    impact: "low",
    color: "#EAB308",
    title: "ForexFactory: Key USD events today — NFP preview",
    symbols: ["EURUSD", "USDJPY", "DXY", "XAUUSD"],
    source: "ForexFactory",
    time: "1h ago",
    body: "Non-Farm Payrolls expected at 185k. Any deviation of ±30k could trigger sharp USD moves.",
    scenarios: [
      { if: "If NFP > 215k", then: "USD strength likely, risk assets under pressure" },
      { if: "If NFP < 155k", then: "Rate-cut bets increase, DXY could sell off sharply" },
    ],
  },
];

const SYMBOL_ICON: Record<string, string> = {
  EURUSD: "🇪🇺/🇺🇸", GBPUSD: "🇬🇧/🇺🇸", USDJPY: "🇺🇸/🇯🇵",
  XAUUSD: "🥇", DXY: "💵", SPX: "📈", BTCUSD: "₿",
};

const FEATURES = [
  {
    icon: "⚡",
    title: "Real-Time AI Curation",
    desc: "News from ForexLive, DailyFX, FXStreet and more — filtered, summarized and structured by AI every 15 minutes.",
  },
  {
    icon: "🎯",
    title: "Impact Rating",
    desc: "Every post is classified High / Medium / Low impact so you instantly know what matters right now.",
  },
  {
    icon: "🔀",
    title: "Scenario Analysis",
    desc: "Each insight includes 2–4 if/then scenarios — structured market context, no signals, no noise.",
  },
  {
    icon: "🪙",
    title: "Symbol Filter",
    desc: "Filter by EURUSD, XAUUSD, DXY, SPX and 12 more USD-related instruments in one click.",
  },
  {
    icon: "📅",
    title: "Economic Calendar",
    desc: "Daily preview of high-impact USD events from ForexFactory — built into your feed automatically.",
  },
  {
    icon: "🛡️",
    title: "100% Compliant",
    desc: "No buy/sell signals. No entries or targets. Pure educational context — every post includes a disclaimer.",
  },
];

export default function FeedComingSoon() {
  const [activeCard, setActiveCard] = useState(0);
  const [expandedScenario, setExpandedScenario] = useState<number | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard(c => (c + 1) % MOCK_POSTS.length);
      setTick(t => t + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const post = MOCK_POSTS[activeCard];

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>

      {/* Ambient glow blobs */}
      <div style={{ position: "fixed", top: "10%", left: "15%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", top: "50%", right: "10%", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      {/* HERO */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "60px 0 80px" }}>

        {/* Badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "20px", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.35)", marginBottom: "28px" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#8B5CF6", display: "inline-block", boxShadow: "0 0 8px #8B5CF6", animation: "pulse 2s infinite" }} />
          <span style={{ color: "#A78BFA", fontSize: "13px", fontWeight: 600, letterSpacing: "0.06em" }}>COMING SOON</span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: "clamp(36px, 6vw, 72px)",
          fontWeight: 800,
          margin: "0 0 20px",
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          background: "linear-gradient(135deg, #F9FAFB 0%, #A78BFA 50%, #F9FAFB 100%)",
          backgroundSize: "200% 200%",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: "shimmer 4s ease infinite",
        }}>
          Market Insights
        </h1>

        {/* Subtitle */}
        <p style={{ color: "#9CA3AF", fontSize: "clamp(16px, 2vw, 20px)", maxWidth: "580px", margin: "0 auto 40px", lineHeight: 1.6 }}>
          AI-curated USD market news with scenario analysis — delivered straight to your dashboard. No signals. No noise. Just context.
        </p>

        {/* Impact pill row */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          {[["🔴","High Impact","#EF4444"],["🟠","Medium Impact","#F97316"],["🟡","Low Impact","#EAB308"]].map(([dot, label, color]) => (
            <div key={label as string} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "7px 16px", borderRadius: "10px", border: `1px solid ${color}33`, background: `${color}11` }}>
              <span>{dot}</span>
              <span style={{ color: color as string, fontSize: "13px", fontWeight: 600 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* LIVE PREVIEW CARD */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: "680px", margin: "0 auto 80px", padding: "0 16px" }}>
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <span style={{ color: "#4B5563", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Preview — what your feed will look like</span>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: `1px solid ${post.color}44`,
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: `0 0 40px ${post.color}15, 0 0 80px rgba(139,92,246,0.08)`,
          transition: "all 0.5s ease",
        }}>
          {/* Top bar */}
          <div style={{ height: "3px", background: `linear-gradient(90deg, ${post.color}, ${post.color}88)` }} />

          <div style={{ padding: "24px" }}>
            {/* Meta */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "20px", background: `${post.color}22`, color: post.color, fontWeight: 700, border: `1px solid ${post.color}44`, letterSpacing: "0.05em" }}>
                {post.impact.toUpperCase()} IMPACT
              </span>
              <span style={{ fontSize: "12px", color: "#4B5563" }}>{post.time} · {post.source}</span>
            </div>

            {/* Title */}
            <h3 style={{ color: "#F9FAFB", fontSize: "18px", fontWeight: 700, margin: "0 0 12px", lineHeight: 1.4 }}>
              {post.title}
            </h3>

            {/* Body */}
            <p style={{ color: "#9CA3AF", fontSize: "14px", lineHeight: 1.6, margin: "0 0 16px" }}>
              {post.body}
            </p>

            {/* Symbols */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
              {post.symbols.map(s => (
                <span key={s} style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "20px", background: "rgba(255,255,255,0.06)", color: "#D1D5DB", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {SYMBOL_ICON[s] ?? ""} {s}
                </span>
              ))}
            </div>

            {/* Scenarios */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "16px" }}>
              <div style={{ color: "#6B7280", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Scenarios</div>
              {post.scenarios.map((sc, i) => (
                <div
                  key={i}
                  onClick={() => setExpandedScenario(expandedScenario === i ? null : i)}
                  style={{ marginBottom: "8px", padding: "10px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", borderLeft: "3px solid rgba(139,92,246,0.6)", cursor: "pointer" }}
                >
                  <div style={{ color: "#C4B5FD", fontSize: "13px", marginBottom: "4px" }}>▸ {sc.if}</div>
                  <div style={{ color: "#9CA3AF", fontSize: "13px", paddingLeft: "12px" }}>→ {sc.then}</div>
                </div>
              ))}
            </div>

            {/* Disclaimer */}
            <div style={{ marginTop: "16px", padding: "10px 14px", background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.25)", borderRadius: "8px", color: "#EAB308", fontSize: "12px", fontWeight: 600 }}>
              ⚠️ No financial advice. Educational only. Trade at your own risk.
            </div>
          </div>
        </div>

        {/* Card switcher dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
          {MOCK_POSTS.map((p, i) => (
            <button
              key={i}
              onClick={() => setActiveCard(i)}
              style={{ width: i === activeCard ? 24 : 8, height: 8, borderRadius: 4, border: "none", background: i === activeCard ? p.color : "rgba(255,255,255,0.15)", cursor: "pointer", transition: "all 0.3s ease", padding: 0 }}
            />
          ))}
        </div>
      </div>

      {/* FEATURES GRID */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", margin: "0 auto 80px", padding: "0 16px" }}>
        <h2 style={{ textAlign: "center", color: "#F9FAFB", fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>
          Everything you need to stay informed
        </h2>
        <p style={{ textAlign: "center", color: "#6B7280", fontSize: "15px", marginBottom: "48px" }}>
          Built for traders who want context, not clutter.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{
                padding: "24px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "14px",
                transition: "border-color 0.2s, background 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(139,92,246,0.4)";
                (e.currentTarget as HTMLDivElement).style.background = "rgba(139,92,246,0.05)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)";
              }}
            >
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>{f.icon}</div>
              <div style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "16px", marginBottom: "8px" }}>{f.title}</div>
              <div style={{ color: "#6B7280", fontSize: "14px", lineHeight: "1.6" }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SOURCES STRIP */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", marginBottom: "80px", padding: "0 16px" }}>
        <div style={{ color: "#4B5563", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "20px" }}>
          Powered by live data from
        </div>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          {["ForexLive","FXStreet","DailyFX","Investing.com","Finnhub","ForexFactory"].map(src => (
            <span key={src} style={{ padding: "6px 16px", borderRadius: "8px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#6B7280", fontSize: "13px", fontWeight: 500 }}>
              {src}
            </span>
          ))}
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #8B5CF6; }
          50% { opacity: 0.5; box-shadow: 0 0 16px #8B5CF6; }
        }
      `}</style>
    </div>
  );
}
