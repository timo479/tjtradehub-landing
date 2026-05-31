"use client";

import { useState, useEffect, useCallback } from "react";

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

export default function FeedClient() {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [impacts, setImpacts] = useState<string[]>([]);
  const [symbol, setSymbol] = useState("");
  const [modal, setModal] = useState<FeedPost | null>(null);

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

  function toggleImpact(imp: string) {
    setImpacts(prev => prev.includes(imp) ? prev.filter(i => i !== imp) : [...prev, imp]);
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, true);
  }

  return (
    <div>
      {/* Impact filter buttons */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {(["high","medium","low"] as const).map(imp => {
          const active = impacts.includes(imp);
          return (
            <button
              key={imp}
              onClick={() => toggleImpact(imp)}
              style={{
                padding: "7px 16px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600,
                border: `1px solid ${active ? IMPACT_COLOR[imp] : "rgba(255,255,255,0.1)"}`,
                background: active ? `${IMPACT_COLOR[imp]}22` : "transparent",
                color: active ? IMPACT_COLOR[imp] : "#9CA3AF",
                transition: "all 0.15s",
              }}
            >
              {imp === "high" ? "🔴" : imp === "medium" ? "🟠" : "🟡"} {IMPACT_LABEL[imp]}
            </button>
          );
        })}
        {impacts.length > 0 && (
          <button
            onClick={() => setImpacts([])}
            style={{ padding: "7px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "#6B7280" }}
          >
            All
          </button>
        )}
      </div>

      {/* Symbol filter */}
      <div style={{ marginBottom: "28px" }}>
        <select
          value={symbol}
          onChange={e => setSymbol(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "#111", color: "#E5E7EB", fontSize: "14px", minWidth: "180px" }}
        >
          <option value="">All Symbols</option>
          {ALLOWED_SYMBOLS.map(s => (
            <option key={s} value={s}>{SYMBOL_ICON[s] ?? ""} {s}</option>
          ))}
        </select>
      </div>

      {/* Posts */}
      {loading ? (
        <div style={{ color: "#6B7280", textAlign: "center", padding: "60px 0" }}>Loading insights…</div>
      ) : posts.length === 0 ? (
        <div style={{ color: "#6B7280", textAlign: "center", padding: "60px 0", fontSize: "15px" }}>
          No insights for this filter. Check back later.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {posts.map(post => (
            <div
              key={post.id}
              onClick={() => setModal(post)}
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "12px",
                overflow: "hidden",
                cursor: "pointer",
                transition: "background 0.15s, border-color 0.15s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.06)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(139,92,246,0.3)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
                (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              {/* Impact bar */}
              <div style={{ width: "4px", flexShrink: 0, background: IMPACT_COLOR[post.impact] }} />
              <div style={{ flex: 1, padding: "14px 16px" }}>
                <div style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "15px", marginBottom: "8px", lineHeight: "1.4" }}>
                  {post.title}
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  {post.symbols.slice(0, 5).map(s => (
                    <span key={s} style={{ fontSize: "12px", padding: "2px 8px", borderRadius: "20px", background: "rgba(255,255,255,0.06)", color: "#9CA3AF", border: "1px solid rgba(255,255,255,0.08)" }}>
                      {SYMBOL_ICON[s] ? `${SYMBOL_ICON[s]} ` : ""}{s}
                    </span>
                  ))}
                  <span style={{ fontSize: "12px", color: "#4B5563", marginLeft: "auto" }}>
                    {timeAgo(post.published_at)} · {post.source_name}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {posts.length < total && (
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <button
            onClick={loadMore}
            disabled={loadingMore}
            style={{ padding: "10px 28px", borderRadius: "8px", border: "1px solid rgba(139,92,246,0.4)", background: "rgba(139,92,246,0.1)", color: "#A78BFA", cursor: loadingMore ? "default" : "pointer", fontSize: "14px", fontWeight: 600 }}
          >
            {loadingMore ? "Loading…" : "Load more ↓"}
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {modal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
        >
          <div style={{ background: "#0D0D0D", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", width: "100%", maxWidth: "640px", maxHeight: "90vh", overflowY: "auto", padding: "32px" }}>
            {/* Close */}
            <button
              onClick={() => setModal(null)}
              style={{ float: "right", background: "transparent", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "22px", lineHeight: 1, marginLeft: "12px" }}
            >
              ×
            </button>

            {/* Impact badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 12px", borderRadius: "20px", background: `${IMPACT_COLOR[modal.impact]}22`, border: `1px solid ${IMPACT_COLOR[modal.impact]}55`, color: IMPACT_COLOR[modal.impact], fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "12px" }}>
              {modal.impact === "high" ? "🔴" : modal.impact === "medium" ? "🟠" : "🟡"} {IMPACT_LABEL[modal.impact]} IMPACT
            </div>

            {/* Title */}
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 700, margin: "0 0 12px", lineHeight: "1.4" }}>
              {modal.title}
            </h2>

            {/* Symbols + meta */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center", marginBottom: "20px" }}>
              {modal.symbols.map(s => (
                <span key={s} style={{ fontSize: "12px", padding: "3px 10px", borderRadius: "20px", background: "rgba(255,255,255,0.06)", color: "#D1D5DB", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {SYMBOL_ICON[s] ? `${SYMBOL_ICON[s]} ` : ""}{s}
                </span>
              ))}
              <span style={{ fontSize: "12px", color: "#6B7280" }}>
                {timeAgo(modal.published_at)} ·{" "}
                <a href={modal.source_url} target="_blank" rel="noopener noreferrer" style={{ color: "#8B5CF6", textDecoration: "none" }}>
                  {modal.source_name} ↗
                </a>
              </span>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginBottom: "20px" }} />

            {/* Body */}
            <div style={{ color: "#D1D5DB", fontSize: "15px", lineHeight: "1.7", marginBottom: "24px", whiteSpace: "pre-wrap" }}>
              {modal.body}
            </div>

            {/* Scenarios */}
            {modal.scenarios.length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <div style={{ color: "#9CA3AF", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>
                  Possible Scenarios
                </div>
                {modal.scenarios.map((s, i) => (
                  <div key={i} style={{ marginBottom: "12px", padding: "12px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", borderLeft: `3px solid rgba(139,92,246,0.6)` }}>
                    <div style={{ color: "#C4B5FD", fontSize: "14px", marginBottom: "4px" }}>▸ {s.if}</div>
                    <div style={{ color: "#9CA3AF", fontSize: "14px", paddingLeft: "12px" }}>→ {s.then}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", marginBottom: "16px" }} />

            {/* Disclaimer */}
            <div style={{ padding: "12px 14px", background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: "8px", color: "#EAB308", fontSize: "13px", fontWeight: 600 }}>
              ⚠️ {modal.disclaimer}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
