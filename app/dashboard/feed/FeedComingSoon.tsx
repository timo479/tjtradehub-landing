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
  { icon: "⚡", title: "Real-Time AI Curation", desc: "News from ForexLive, DailyFX, FXStreet and more — filtered, summarized and structured by AI every 15 minutes." },
  { icon: "🎯", title: "Impact Rating", desc: "Every post is classified High / Medium / Low impact so you instantly know what matters right now." },
  { icon: "🔀", title: "Scenario Analysis", desc: "Each insight includes 2–4 if/then scenarios — structured market context, no signals, no noise." },
  { icon: "🪙", title: "Symbol Filter", desc: "Filter by EURUSD, XAUUSD, DXY, SPX and 12 more USD-related instruments in one click." },
  { icon: "📅", title: "Economic Calendar", desc: "Daily preview of high-impact USD events from ForexFactory — built into your feed automatically." },
  { icon: "🛡️", title: "100% Compliant", desc: "No buy/sell signals. No entries or targets. Pure educational context — every post includes a disclaimer." },
];

const SOURCES = ["ForexLive", "FXStreet", "DailyFX", "Investing.com", "Finnhub", "ForexFactory", "Reuters", "Bloomberg"];

export default function FeedComingSoon() {
  const [activeCard, setActiveCard] = useState(0);
  const [cardKey, setCardKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCard(c => (c + 1) % MOCK_POSTS.length);
      setCardKey(k => k + 1);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const post = MOCK_POSTS[activeCard];

  return (
    <div style={{ position: "relative", overflow: "hidden" }}>

      {/* Grid background */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage:
          "linear-gradient(rgba(139,92,246,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.045) 1px, transparent 1px)",
        backgroundSize: "52px 52px",
        WebkitMaskImage: "radial-gradient(ellipse 85% 65% at 50% 0%, black 40%, transparent 100%)",
        maskImage: "radial-gradient(ellipse 85% 65% at 50% 0%, black 40%, transparent 100%)",
      }} />

      {/* Animated ambient blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "4%", left: "8%", width: 640, height: 640, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.13) 0%, transparent 65%)", animation: "blob1 18s ease-in-out infinite", filter: "blur(50px)" }} />
        <div style={{ position: "absolute", top: "38%", right: "4%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(239,68,68,0.09) 0%, transparent 65%)", animation: "blob2 23s ease-in-out infinite", filter: "blur(55px)" }} />
        <div style={{ position: "absolute", bottom: "8%", left: "28%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.1) 0%, transparent 65%)", animation: "blob3 16s ease-in-out infinite", filter: "blur(48px)" }} />
      </div>

      {/* ── HERO ── */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "80px 24px 96px" }}>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: "10px",
          padding: "7px 20px", borderRadius: "100px",
          background: "linear-gradient(135deg, rgba(139,92,246,0.18), rgba(124,58,237,0.08))",
          border: "1px solid rgba(139,92,246,0.45)",
          marginBottom: "40px",
          boxShadow: "0 0 24px rgba(139,92,246,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#8B5CF6", display: "inline-block", animation: "pulsedot 2s infinite", boxShadow: "0 0 12px #8B5CF6" }} />
          <span style={{ color: "#C4B5FD", fontSize: "12px", fontWeight: 700, letterSpacing: "0.12em" }}>COMING SOON</span>
          <span style={{ width: 1, height: 14, background: "rgba(139,92,246,0.45)" }} />
          <span style={{ color: "#7C3AED", fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em" }}>Pro Plan</span>
        </div>

        {/* Title */}
        <div>
          <h1 style={{
            fontSize: "clamp(52px, 8vw, 96px)", fontWeight: 900,
            margin: "0 0 4px", lineHeight: 1.0, letterSpacing: "-0.035em",
            background: "linear-gradient(135deg, #FFFFFF 0%, #A78BFA 45%, #F9FAFB 75%, #C4B5FD 100%)",
            backgroundSize: "300% 300%",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            animation: "shimmer 5s ease infinite",
          }}>
            Market
          </h1>
          <h1 style={{
            fontSize: "clamp(52px, 8vw, 96px)", fontWeight: 900,
            margin: "0 0 32px", lineHeight: 1.0, letterSpacing: "-0.035em",
            background: "linear-gradient(135deg, #A78BFA 0%, #FFFFFF 50%, #8B5CF6 100%)",
            backgroundSize: "300% 300%",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            animation: "shimmer 5s ease infinite 0.6s",
          }}>
            Insights
          </h1>
        </div>

        {/* Subtitle */}
        <p style={{ color: "#9CA3AF", fontSize: "clamp(16px, 2vw, 20px)", maxWidth: "560px", margin: "0 auto 52px", lineHeight: 1.7, fontWeight: 400 }}>
          AI-curated USD market news with scenario analysis — delivered straight to your dashboard.{" "}
          <span style={{ color: "#6B7280" }}>No signals. No noise. Just context.</span>
        </p>

        {/* Impact pills */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          {([["🔴", "HIGH IMPACT", "#EF4444"], ["🟠", "MEDIUM", "#F97316"], ["🟡", "LOW", "#EAB308"]] as [string, string, string][]).map(([dot, label, color]) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 20px", borderRadius: "12px",
              border: `1px solid ${color}44`,
              background: `linear-gradient(135deg, ${color}1a, ${color}0a)`,
              boxShadow: `0 0 14px ${color}18`,
            }}>
              <span style={{ fontSize: "14px" }}>{dot}</span>
              <span style={{ color: color, fontSize: "12px", fontWeight: 800, letterSpacing: "0.1em" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── LIVE PREVIEW ── */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: "720px", margin: "0 auto 104px", padding: "0 20px" }}>

        {/* Section label */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "5px 16px", borderRadius: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", animation: "pulsedot 1.5s infinite", display: "inline-block", boxShadow: "0 0 6px #22C55E" }} />
            <span style={{ color: "#4B5563", fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>Live Preview</span>
          </div>
        </div>

        {/* Window frame */}
        <div style={{
          borderRadius: "20px", overflow: "hidden",
          border: `1px solid ${post.color}33`,
          boxShadow: `0 0 70px ${post.color}22, 0 0 140px rgba(139,92,246,0.1), 0 40px 100px rgba(0,0,0,0.5)`,
          transition: "border-color 0.7s ease, box-shadow 0.7s ease",
          background: "rgba(6,6,10,0.97)",
        }}>
          {/* Titlebar */}
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "13px 18px",
            background: "rgba(255,255,255,0.025)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF5F57", display: "inline-block", boxShadow: "0 0 8px rgba(255,95,87,0.5)" }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#FEBC2E", display: "inline-block" }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#28C840", display: "inline-block" }} />
            <span style={{ flex: 1 }} />
            <span style={{ fontSize: "12px", color: "#374151", fontWeight: 500 }}>tjtradehub.com/dashboard/feed</span>
            <span style={{ flex: 1 }} />
            <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "3px 10px", borderRadius: "6px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22C55E", animation: "pulsedot 1.5s infinite", display: "inline-block" }} />
              <span style={{ color: "#22C55E", fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em" }}>LIVE</span>
            </div>
          </div>

          {/* Impact bar */}
          <div style={{ height: "3px", background: `linear-gradient(90deg, ${post.color}, ${post.color}77, transparent)`, transition: "background 0.7s ease" }} />

          {/* Card — key triggers fade-in animation on change */}
          <div key={cardKey} style={{ padding: "28px 32px", animation: "cardin 0.45s ease forwards" }}>

            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "18px" }}>
              <span style={{
                fontSize: "10px", padding: "4px 12px", borderRadius: "20px",
                background: `${post.color}22`, color: post.color,
                fontWeight: 800, border: `1px solid ${post.color}44`,
                letterSpacing: "0.1em",
              }}>
                {post.impact.toUpperCase()} IMPACT
              </span>
              <span style={{ fontSize: "12px", color: "#4B5563", fontWeight: 500 }}>
                {post.time} · <span style={{ color: "#6B7280" }}>{post.source}</span>
              </span>
            </div>

            <h3 style={{ color: "#F9FAFB", fontSize: "21px", fontWeight: 700, margin: "0 0 14px", lineHeight: 1.35, letterSpacing: "-0.015em" }}>
              {post.title}
            </h3>

            <p style={{ color: "#9CA3AF", fontSize: "14px", lineHeight: 1.72, margin: "0 0 20px" }}>
              {post.body}
            </p>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
              {post.symbols.map(s => (
                <span key={s} style={{
                  fontSize: "12px", padding: "4px 12px", borderRadius: "20px",
                  background: "rgba(255,255,255,0.05)", color: "#D1D5DB",
                  border: "1px solid rgba(255,255,255,0.1)", fontWeight: 500,
                }}>
                  {SYMBOL_ICON[s] ?? ""} {s}
                </span>
              ))}
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "20px" }}>
              <div style={{ color: "#4B5563", fontSize: "10px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "14px" }}>
                ▸ Scenarios
              </div>
              {post.scenarios.map((sc, i) => (
                <div key={i} style={{
                  marginBottom: "10px", padding: "14px 18px",
                  background: "rgba(139,92,246,0.05)",
                  border: "1px solid rgba(139,92,246,0.15)",
                  borderRadius: "10px",
                  borderLeft: "3px solid rgba(139,92,246,0.7)",
                }}>
                  <div style={{ color: "#C4B5FD", fontSize: "13px", marginBottom: "5px", fontWeight: 500 }}>▸ {sc.if}</div>
                  <div style={{ color: "#9CA3AF", fontSize: "13px", paddingLeft: "14px" }}>→ {sc.then}</div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: "20px", padding: "11px 16px",
              background: "rgba(234,179,8,0.06)",
              border: "1px solid rgba(234,179,8,0.2)",
              borderRadius: "8px", color: "#CA8A04",
              fontSize: "11px", fontWeight: 600, letterSpacing: "0.02em",
            }}>
              ⚠️ No financial advice. Educational only. Trade at your own risk.
            </div>
          </div>
        </div>

        {/* Card switcher dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "22px" }}>
          {MOCK_POSTS.map((p, i) => (
            <button
              key={i}
              onClick={() => { setActiveCard(i); setCardKey(k => k + 1); }}
              style={{
                width: i === activeCard ? 28 : 8, height: 8,
                borderRadius: 4, border: "none",
                background: i === activeCard ? p.color : "rgba(255,255,255,0.12)",
                cursor: "pointer", transition: "all 0.35s ease", padding: 0,
                boxShadow: i === activeCard ? `0 0 12px ${p.color}66` : "none",
              }}
            />
          ))}
        </div>
      </div>

      {/* ── FEATURES GRID ── */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: "980px", margin: "0 auto 104px", padding: "0 20px" }}>

        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h2 style={{
            color: "#F9FAFB", fontSize: "clamp(30px, 4vw, 46px)",
            fontWeight: 800, marginBottom: "14px",
            letterSpacing: "-0.025em", lineHeight: 1.1,
          }}>
            Everything you need to stay informed
          </h2>
          <p style={{ color: "#6B7280", fontSize: "16px", maxWidth: "440px", margin: "0 auto", lineHeight: 1.6 }}>
            Built for traders who want context, not clutter.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(288px, 1fr))", gap: "16px" }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              style={{
                padding: "28px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "18px",
                transition: "border-color 0.25s, background 0.25s, transform 0.25s, box-shadow 0.25s",
                animation: "fadeup 0.55s ease both",
                animationDelay: `${i * 0.07}s`,
                cursor: "default",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "rgba(139,92,246,0.45)";
                el.style.background = "rgba(139,92,246,0.07)";
                el.style.transform = "translateY(-4px)";
                el.style.boxShadow = "0 12px 48px rgba(139,92,246,0.18)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.borderColor = "rgba(255,255,255,0.07)";
                el.style.background = "rgba(255,255,255,0.02)";
                el.style.transform = "translateY(0)";
                el.style.boxShadow = "none";
              }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: "13px",
                background: "rgba(139,92,246,0.13)",
                border: "1px solid rgba(139,92,246,0.28)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px", marginBottom: "18px",
                boxShadow: "0 0 20px rgba(139,92,246,0.12)",
              }}>
                {f.icon}
              </div>
              <div style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "16px", marginBottom: "8px", letterSpacing: "-0.01em" }}>{f.title}</div>
              <div style={{ color: "#6B7280", fontSize: "14px", lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SOURCES MARQUEE ── */}
      <div style={{ position: "relative", zIndex: 1, marginBottom: "104px", overflow: "hidden" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <span style={{ color: "#374151", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em" }}>
            Powered by live data from
          </span>
        </div>
        <div style={{
          position: "relative", overflow: "hidden",
          WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%)",
          maskImage: "linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%)",
        }}>
          <div style={{ display: "flex", gap: "16px", animation: "ticker 22s linear infinite", width: "max-content" }}>
            {[...SOURCES, ...SOURCES, ...SOURCES].map((src, i) => (
              <span key={i} style={{
                padding: "9px 22px", borderRadius: "10px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#6B7280", fontSize: "13px", fontWeight: 600,
                whiteSpace: "nowrap", letterSpacing: "0.03em",
              }}>
                {src}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRO PLAN BANNER ── */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: "700px", margin: "0 auto 88px", padding: "0 20px", textAlign: "center" }}>
        <div style={{
          padding: "48px 40px",
          background: "linear-gradient(135deg, rgba(139,92,246,0.12), rgba(124,58,237,0.05), rgba(139,92,246,0.08))",
          border: "1px solid rgba(139,92,246,0.32)",
          borderRadius: "24px",
          boxShadow: "0 0 80px rgba(139,92,246,0.14), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}>
          <div style={{ fontSize: "36px", marginBottom: "20px" }}>🔮</div>
          <h3 style={{
            color: "#F9FAFB", fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 800,
            marginBottom: "12px", letterSpacing: "-0.02em",
          }}>
            Available with Pro Plan
          </h3>
          <p style={{ color: "#9CA3AF", fontSize: "15px", lineHeight: 1.65, margin: "0 auto", maxWidth: "420px" }}>
            Market Insights is part of the upcoming Pro upgrade — launching soon with live AI-curated analysis directly in your dashboard.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulsedot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.45; transform: scale(0.8); }
        }
        @keyframes blob1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(70px, -50px) scale(1.06); }
          66%       { transform: translate(-35px, 55px) scale(0.94); }
        }
        @keyframes blob2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(-90px, 65px) scale(1.09); }
          66%       { transform: translate(45px, -35px) scale(0.91); }
        }
        @keyframes blob3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(55px, 75px) scale(0.94); }
          66%       { transform: translate(-65px, -45px) scale(1.07); }
        }
        @keyframes cardin {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeup {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.333%); }
        }
      `}</style>
    </div>
  );
}
