"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const IMPACT_COLOR: Record<string, string> = {
  high: "#EF4444",
  medium: "#F97316",
  low: "#EAB308",
};

const IMPACT_LABEL: Record<string, string> = {
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

const SYMBOL_ICON: Record<string, string> = {
  EURUSD: "🇪🇺/🇺🇸",
  GBPUSD: "🇬🇧/🇺🇸",
  USDJPY: "🇺🇸/🇯🇵",
  USDCHF: "🇺🇸/🇨🇭",
  USDCAD: "🇺🇸/🇨🇦",
  AUDUSD: "🇦🇺/🇺🇸",
  NZDUSD: "🇳🇿/🇺🇸",
  XAUUSD: "🥇",
  XAGUSD: "🥈",
  USOIL: "🛢️",
  BTCUSD: "₿",
  ETHUSD: "Ξ",
  DXY: "💵",
  SPX: "📈",
  NAS100: "💻",
  US30: "🏛️",
};

const ALLOWED_SYMBOLS = [
  "EURUSD","GBPUSD","USDJPY","USDCHF","USDCAD","AUDUSD","NZDUSD",
  "XAUUSD","XAGUSD","USOIL","BTCUSD","ETHUSD","DXY","SPX","NAS100","US30",
];

interface Scenario { if: string; then: string; }

interface FeedPost {
  id: string;
  title: string;
  body: string;
  scenarios: Scenario[];
  impact: "high" | "medium" | "low";
  symbols: string[];
  source_name: string;
  source_url: string;
  disclaimer: string;
  published_at: string;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Skeleton ───────────────────────────────────────────────────────────────

function SkeletonCard({ hero = false }: { hero?: boolean }) {
  const sk = {
    background: "linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)",
    backgroundSize: "400% 100%",
    animation: "sk-sweep 1.8s ease infinite",
    borderRadius: "6px",
  };
  return (
    <div style={{
      borderRadius: hero ? "20px" : "14px",
      border: "1px solid rgba(255,255,255,0.06)",
      background: "rgba(255,255,255,0.02)",
      padding: hero ? "28px 32px" : "18px 22px",
    }}>
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
        <div style={{ ...sk, width: 80, height: 22 }} />
        <div style={{ ...sk, width: 60, height: 22, animationDelay: "0.2s" }} />
      </div>
      <div style={{ ...sk, width: hero ? "78%" : "70%", height: hero ? 30 : 20, marginBottom: 10 }} />
      {hero && <div style={{ ...sk, width: "55%", height: 30, marginBottom: 18, animationDelay: "0.1s" }} />}
      {hero && <div style={{ ...sk, width: "88%", height: 15, marginBottom: 8, animationDelay: "0.05s" }} />}
      {hero && <div style={{ ...sk, width: "72%", height: 15, marginBottom: 22, animationDelay: "0.1s" }} />}
      <div style={{ display: "flex", gap: "6px" }}>
        {[56, 66, 48].map((w, i) => (
          <div key={i} style={{ ...sk, width: w, height: 24, borderRadius: 20, animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    </div>
  );
}

// ── Hero Card ──────────────────────────────────────────────────────────────

function HeroCard({ post, onClick }: { post: FeedPost; onClick: () => void }) {
  const color = IMPACT_COLOR[post.impact];
  const [hovered, setHovered] = useState(false);
  const bodyPreview = post.body.length > 200 ? post.body.slice(0, 200) + "…" : post.body;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: "20px",
        border: `1px solid ${hovered ? `${color}55` : `${color}2e`}`,
        background: `linear-gradient(140deg, ${color}12 0%, rgba(0,0,0,0) 55%), rgba(255,255,255,0.02)`,
        padding: "28px 32px",
        cursor: "pointer",
        overflow: "hidden",
        position: "relative",
        transition: "all 0.25s ease",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hovered
          ? `0 20px 70px ${color}28, 0 0 0 1px ${color}20`
          : `0 0 50px ${color}0e`,
        animation: "card-in 0.35s ease both",
      }}
    >
      {/* Impact bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: `linear-gradient(90deg, ${color}, ${color}66, transparent)` }} />

      {/* Meta */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
        <span style={{
          fontSize: "10px", padding: "4px 12px", borderRadius: "20px",
          background: `${color}22`, color, fontWeight: 800,
          border: `1px solid ${color}44`, letterSpacing: "0.1em",
          boxShadow: `0 0 12px ${color}18`,
        }}>
          {post.impact.toUpperCase()} IMPACT
        </span>
        <span style={{ fontSize: "12px", color: "#4B5563", fontWeight: 500 }}>
          {timeAgo(post.published_at)} · {post.source_name}
        </span>
        {post.scenarios.length > 0 && (
          <span style={{
            marginLeft: "auto", fontSize: "12px",
            color: hovered ? "#A78BFA" : "#4B5563",
            fontWeight: 600, transition: "color 0.2s",
          }}>
            {post.scenarios.length} scenario{post.scenarios.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Title */}
      <h2 style={{
        color: "#F9FAFB", fontSize: "clamp(20px, 2.4vw, 25px)", fontWeight: 700,
        margin: "0 0 14px", lineHeight: 1.35, letterSpacing: "-0.015em", maxWidth: "86%",
      }}>
        {post.title}
      </h2>

      {/* Body */}
      <p style={{ color: "#9CA3AF", fontSize: "14px", lineHeight: 1.72, margin: "0 0 22px", maxWidth: "740px" }}>
        {bodyPreview}
      </p>

      {/* Symbols + CTA */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        {post.symbols.map(s => (
          <span key={s} style={{
            fontSize: "12px", padding: "4px 12px", borderRadius: "20px",
            background: "rgba(255,255,255,0.05)", color: "#D1D5DB",
            border: "1px solid rgba(255,255,255,0.1)", fontWeight: 500,
          }}>
            {SYMBOL_ICON[s] ?? ""} {s}
          </span>
        ))}
        <span style={{
          marginLeft: "auto", fontSize: "13px",
          color: hovered ? color : "#374151",
          fontWeight: 600, transition: "color 0.2s", letterSpacing: "-0.01em",
        }}>
          Read full insight →
        </span>
      </div>
    </div>
  );
}

// ── Regular Card ───────────────────────────────────────────────────────────

function RegularCard({ post, onClick }: { post: FeedPost; onClick: () => void }) {
  const color = IMPACT_COLOR[post.impact];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        borderRadius: "14px",
        border: `1px solid ${hovered ? "rgba(139,92,246,0.35)" : "rgba(255,255,255,0.07)"}`,
        background: hovered ? "rgba(139,92,246,0.05)" : "rgba(255,255,255,0.02)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 8px 36px rgba(139,92,246,0.13)" : "none",
        animation: "card-in 0.35s ease both",
      }}
    >
      {/* Left gradient edge */}
      <div style={{
        width: "3px", flexShrink: 0,
        background: `linear-gradient(180deg, ${color}, ${color}77)`,
        boxShadow: hovered ? `0 0 14px ${color}88` : "none",
        transition: "box-shadow 0.2s",
      }} />

      <div style={{ flex: 1, padding: "16px 20px" }}>
        {/* Title row */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "10px" }}>
          <span style={{
            flexShrink: 0, marginTop: "2px",
            fontSize: "10px", padding: "3px 9px", borderRadius: "20px",
            background: `${color}18`, color, fontWeight: 800,
            border: `1px solid ${color}30`, letterSpacing: "0.08em",
          }}>
            {IMPACT_LABEL[post.impact]}
          </span>
          <span style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "15px", lineHeight: 1.4, letterSpacing: "-0.01em" }}>
            {post.title}
          </span>
        </div>

        {/* Symbols + meta */}
        <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", alignItems: "center" }}>
          {post.symbols.slice(0, 4).map(s => (
            <span key={s} style={{
              fontSize: "11px", padding: "2px 9px", borderRadius: "20px",
              background: "rgba(255,255,255,0.05)", color: "#9CA3AF",
              border: "1px solid rgba(255,255,255,0.08)",
            }}>
              {SYMBOL_ICON[s] ? `${SYMBOL_ICON[s]} ` : ""}{s}
            </span>
          ))}
          {post.symbols.length > 4 && (
            <span style={{ fontSize: "11px", color: "#374151" }}>+{post.symbols.length - 4}</span>
          )}
          <span style={{ fontSize: "12px", color: "#374151", marginLeft: "auto", fontWeight: 500 }}>
            {timeAgo(post.published_at)} · {post.source_name}
          </span>
        </div>
      </div>

      {/* Arrow */}
      <div style={{
        display: "flex", alignItems: "center", paddingRight: "18px",
        color: hovered ? "#A78BFA" : "rgba(255,255,255,0.14)",
        fontSize: "16px", transition: "color 0.2s, transform 0.2s",
        transform: hovered ? "translateX(3px)" : "translateX(0)",
      }}>
        →
      </div>
    </div>
  );
}

// ── Detail Modal ───────────────────────────────────────────────────────────

function DetailModal({ post, onClose }: { post: FeedPost; onClose: () => void }) {
  const color = IMPACT_COLOR[post.impact];
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        animation: "backdrop-in 0.2s ease forwards",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "linear-gradient(160deg, rgba(10,10,16,0.99), rgba(6,6,10,0.99))",
        border: `1px solid ${color}30`,
        borderRadius: "22px",
        width: "100%", maxWidth: "660px", maxHeight: "88vh", overflowY: "auto",
        boxShadow: `0 0 120px ${color}1e, 0 50px 140px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.04)`,
        animation: "modal-in 0.25s ease forwards",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(255,255,255,0.08) transparent",
      }}>

        {/* Impact bar */}
        <div style={{ height: "4px", background: `linear-gradient(90deg, ${color}, ${color}77, transparent)`, borderRadius: "22px 22px 0 0" }} />

        <div style={{ padding: "28px 32px 36px" }}>

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              float: "right", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)", color: "#6B7280",
              cursor: "pointer", fontSize: "16px", borderRadius: "8px",
              width: 32, height: 32, display: "inline-flex", alignItems: "center",
              justifyContent: "center", marginLeft: "16px", transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#F9FAFB"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "#6B7280"; }}
          >
            ×
          </button>

          {/* Impact badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "7px",
            padding: "5px 14px", borderRadius: "20px",
            background: `${color}1e`, border: `1px solid ${color}50`,
            color, fontSize: "11px", fontWeight: 800, letterSpacing: "0.1em",
            marginBottom: "16px", boxShadow: `0 0 18px ${color}18`,
          }}>
            {post.impact === "high" ? "🔴" : post.impact === "medium" ? "🟠" : "🟡"} {IMPACT_LABEL[post.impact]} IMPACT
          </div>

          {/* Title */}
          <h2 style={{
            color: "#F9FAFB", fontSize: "clamp(18px, 2.4vw, 22px)",
            fontWeight: 700, margin: "0 0 14px", lineHeight: 1.4,
            letterSpacing: "-0.015em",
          }}>
            {post.title}
          </h2>

          {/* Symbols + meta */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "22px" }}>
            {post.symbols.map(s => (
              <span key={s} style={{
                fontSize: "12px", padding: "4px 12px", borderRadius: "20px",
                background: "rgba(255,255,255,0.06)", color: "#D1D5DB",
                border: "1px solid rgba(255,255,255,0.1)",
              }}>
                {SYMBOL_ICON[s] ? `${SYMBOL_ICON[s]} ` : ""}{s}
              </span>
            ))}
            <span style={{ fontSize: "12px", color: "#4B5563", marginLeft: "auto" }}>
              {timeAgo(post.published_at)} ·{" "}
              <a
                href={post.source_url} target="_blank" rel="noopener noreferrer"
                style={{ color: "#8B5CF6", textDecoration: "none", fontWeight: 600 }}
              >
                {post.source_name} ↗
              </a>
            </span>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: "22px" }} />

          {/* Body */}
          <div style={{ color: "#D1D5DB", fontSize: "15px", lineHeight: 1.78, marginBottom: "28px", whiteSpace: "pre-wrap" }}>
            {post.body}
          </div>

          {/* Scenarios */}
          {post.scenarios.length > 0 && (
            <div style={{ marginBottom: "28px" }}>
              <div style={{ color: "#4B5563", fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "14px" }}>
                ▸ Possible Scenarios
              </div>
              {post.scenarios.map((s, i) => (
                <div
                  key={i}
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  style={{
                    marginBottom: "10px", borderRadius: "12px",
                    border: "1px solid rgba(139,92,246,0.18)",
                    background: expanded === i ? "rgba(139,92,246,0.09)" : "rgba(139,92,246,0.04)",
                    borderLeft: "3px solid rgba(139,92,246,0.7)",
                    cursor: "pointer", transition: "background 0.15s",
                  }}
                >
                  <div style={{ padding: "13px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#C4B5FD", fontSize: "13px", fontWeight: 500, flex: 1 }}>▸ {s.if}</span>
                    <span style={{
                      color: "#4B5563", fontSize: "13px",
                      transition: "transform 0.2s", display: "inline-block",
                      transform: expanded === i ? "rotate(90deg)" : "rotate(0deg)",
                    }}>›</span>
                  </div>
                  {expanded === i && (
                    <div style={{ padding: "0 16px 14px 30px", color: "#9CA3AF", fontSize: "13px", lineHeight: 1.65 }}>
                      → {s.then}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", marginBottom: "18px" }} />

          {/* Disclaimer */}
          <div style={{
            padding: "12px 16px",
            background: "rgba(234,179,8,0.07)", border: "1px solid rgba(234,179,8,0.22)",
            borderRadius: "10px", color: "#CA8A04", fontSize: "12px", fontWeight: 600, letterSpacing: "0.01em",
          }}>
            ⚠️ {post.disclaimer}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function FeedClient() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [impacts, setImpacts] = useState<string[]>([]);
  const [symbol, setSymbol] = useState("");
  const [modal, setModal] = useState<FeedPost | null>(null);
  const [symbolOpen, setSymbolOpen] = useState(false);
  const symbolRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (pg: number, append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    const params = new URLSearchParams({ page: String(pg), limit: "20" });
    impacts.forEach(i => params.append("impact", i));
    if (symbol) params.set("symbol", symbol);

    try {
      const res = await fetch(`/api/feed?${params}`);
      const data = await res.json();
      if (append) {
        setPosts(prev => [...prev, ...(data.items ?? [])]);
      } else {
        setPosts(data.items ?? []);
      }
      setTotal(data.total ?? 0);
    } catch {
      if (!append) setPosts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [impacts, symbol]);

  useEffect(() => {
    setPage(1);
    fetchPosts(1, false);
  }, [fetchPosts]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (symbolRef.current && !symbolRef.current.contains(e.target as Node)) {
        setSymbolOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  function toggleImpact(imp: string) {
    setImpacts(prev => prev.includes(imp) ? prev.filter(i => i !== imp) : [...prev, imp]);
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, true);
  }

  const [hero, ...rest] = posts;

  return (
    <div style={{ position: "relative" }}>

      {/* ── Sticky filter toolbar ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        marginBottom: "24px",
        padding: "14px 0",
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>

          {/* Impact pills */}
          <div style={{ display: "flex", gap: "7px" }}>
            {(["high", "medium", "low"] as const).map(imp => {
              const active = impacts.includes(imp);
              const color = IMPACT_COLOR[imp];
              return (
                <button
                  key={imp}
                  onClick={() => toggleImpact(imp)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "6px 14px", borderRadius: "8px", cursor: "pointer",
                    fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em",
                    border: `1px solid ${active ? color : "rgba(255,255,255,0.1)"}`,
                    background: active ? `${color}20` : "rgba(255,255,255,0.03)",
                    color: active ? color : "#6B7280",
                    transition: "all 0.15s",
                    boxShadow: active ? `0 0 16px ${color}2e` : "none",
                  }}
                >
                  <span style={{ color: active ? color : "rgba(255,255,255,0.2)", fontSize: "8px" }}>●</span>
                  {IMPACT_LABEL[imp]}
                </button>
              );
            })}
            {impacts.length > 0 && (
              <button
                onClick={() => setImpacts([])}
                style={{
                  padding: "6px 12px", borderRadius: "8px", cursor: "pointer",
                  fontSize: "12px", fontWeight: 600,
                  border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#4B5563",
                  transition: "color 0.15s",
                }}
              >
                All
              </button>
            )}
          </div>

          {/* Divider */}
          <div style={{ width: 1, height: 22, background: "rgba(255,255,255,0.08)", flexShrink: 0 }} />

          {/* Custom symbol dropdown */}
          <div ref={symbolRef} style={{ position: "relative" }}>
            <button
              onClick={() => setSymbolOpen(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "6px 14px", borderRadius: "8px", cursor: "pointer",
                border: `1px solid ${symbol ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.1)"}`,
                background: symbol ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.03)",
                color: symbol ? "#C4B5FD" : "#6B7280",
                fontSize: "13px", fontWeight: 600, transition: "all 0.15s",
                boxShadow: symbol ? "0 0 16px rgba(139,92,246,0.2)" : "none",
              }}
            >
              <span>{symbol ? `${SYMBOL_ICON[symbol] ?? ""} ${symbol}` : "All Symbols"}</span>
              <span style={{ fontSize: "9px", opacity: 0.5 }}>▾</span>
            </button>

            {symbolOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", left: 0,
                background: "rgba(8,8,12,0.98)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "14px", padding: "8px",
                display: "grid", gridTemplateColumns: "1fr 1fr",
                gap: "3px", zIndex: 100,
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)",
                minWidth: "260px",
                animation: "dropdown-in 0.15s ease forwards",
              }}>
                <button
                  onClick={() => { setSymbol(""); setSymbolOpen(false); }}
                  style={{
                    gridColumn: "1 / -1", padding: "8px 12px", borderRadius: "8px",
                    cursor: "pointer", border: "none",
                    background: symbol === "" ? "rgba(139,92,246,0.15)" : "transparent",
                    color: symbol === "" ? "#A78BFA" : "#6B7280",
                    fontSize: "13px", fontWeight: 600, textAlign: "left", transition: "background 0.1s",
                  }}
                  onMouseEnter={e => { if (symbol !== "") (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={e => { if (symbol !== "") (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                >
                  All Symbols
                </button>
                {ALLOWED_SYMBOLS.map(s => (
                  <button
                    key={s}
                    onClick={() => { setSymbol(s); setSymbolOpen(false); }}
                    style={{
                      padding: "8px 12px", borderRadius: "8px", cursor: "pointer", border: "none",
                      background: symbol === s ? "rgba(139,92,246,0.15)" : "transparent",
                      color: symbol === s ? "#A78BFA" : "#9CA3AF",
                      fontSize: "12px", fontWeight: 600, textAlign: "left",
                      transition: "background 0.1s",
                      display: "flex", alignItems: "center", gap: "7px",
                    }}
                    onMouseEnter={e => { if (symbol !== s) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
                    onMouseLeave={e => { if (symbol !== s) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                  >
                    <span style={{ fontSize: "14px" }}>{SYMBOL_ICON[s] ?? "·"}</span>
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div style={{ flex: 1 }} />

          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E", display: "inline-block", animation: "pulsedot 2s infinite", boxShadow: "0 0 8px #22C55E" }} />
            <span style={{ fontSize: "12px", color: "#374151", fontWeight: 500 }}>AI-curated · Live</span>
          </div>
        </div>
      </div>

      {/* ── Posts ── */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <SkeletonCard hero />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : posts.length === 0 ? (
        <div style={{
          textAlign: "center", padding: "80px 0", color: "#4B5563", fontSize: "15px",
          border: "1px dashed rgba(255,255,255,0.07)", borderRadius: "18px",
        }}>
          <div style={{ fontSize: "36px", marginBottom: "14px" }}>📭</div>
          No insights for this filter. Check back later.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {hero && <HeroCard post={hero} onClick={() => setModal(hero)} />}
          {rest.map(post => (
            <RegularCard key={post.id} post={post} onClick={() => setModal(post)} />
          ))}
        </div>
      )}

      {/* ── Load more ── */}
      {posts.length < total && !loading && (
        <div style={{ textAlign: "center", marginTop: "32px" }}>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              padding: "12px 40px", borderRadius: "10px",
              border: "1px solid rgba(139,92,246,0.35)",
              background: "rgba(139,92,246,0.08)",
              color: "#A78BFA", cursor: loadingMore ? "default" : "pointer",
              fontSize: "14px", fontWeight: 600,
              transition: "all 0.2s",
              boxShadow: "0 0 24px rgba(139,92,246,0.12)",
              opacity: loadingMore ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!loadingMore) { const b = e.currentTarget as HTMLButtonElement; b.style.background = "rgba(139,92,246,0.16)"; b.style.boxShadow = "0 0 40px rgba(139,92,246,0.22)"; }}}
            onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = "rgba(139,92,246,0.08)"; b.style.boxShadow = "0 0 24px rgba(139,92,246,0.12)"; }}
          >
            {loadingMore ? "Loading…" : "Load more ↓"}
          </button>
        </div>
      )}

      {/* ── Modal ── */}
      {modal && <DetailModal post={modal} onClose={() => setModal(null)} />}

      <style>{`
        @keyframes sk-sweep {
          0%   { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes pulsedot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.8); }
        }
        @keyframes card-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dropdown-in {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes backdrop-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.97) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
