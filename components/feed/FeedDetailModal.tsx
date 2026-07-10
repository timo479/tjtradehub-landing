"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

// Shared feed presentation primitives — used by BOTH the live feed (FeedClient)
// and the admin "Preview as user" modal (FeedAdminClient), so what an admin
// previews is byte-for-byte what a subscriber sees.

export const IMPACT_COLOR: Record<string, string> = {
  high: "#EF4444",
  medium: "#F97316",
  low: "#EAB308",
};

export const IMPACT_LABEL: Record<string, string> = {
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};

// Clean display labels (no emoji). FX pairs auto-format to EUR/USD.
export const SYMBOL_LABEL: Record<string, string> = {
  XAUUSD: "Gold",
  XAGUSD: "Silver",
  USOIL: "Oil",
  BTCUSD: "BTC",
  ETHUSD: "ETH",
  DXY: "DXY",
  SPX: "S&P 500",
  NAS100: "Nasdaq",
  US30: "Dow",
};

export function symLabel(s: string): string {
  if (SYMBOL_LABEL[s]) return SYMBOL_LABEL[s];
  if (/^[A-Z]{6}$/.test(s)) return `${s.slice(0, 3)}/${s.slice(3)}`;
  return s;
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface Scenario { if: string; then: string; }

export interface FeedModalPost {
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

export function FeedDetailModal({ post, onClose }: { post: FeedModalPost; onClose: () => void }) {
  const color = IMPACT_COLOR[post.impact];
  const [expanded, setExpanded] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const content = (
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
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} /> {IMPACT_LABEL[post.impact]} IMPACT
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
                {symLabel(s)}
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
            display: "flex", alignItems: "flex-start", gap: "9px",
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
            <span>{post.disclaimer}</span>
          </div>
        </div>
      </div>

      {/* Self-contained keyframes so this modal animates even outside the feed page (e.g. admin preview). */}
      <style>{`
        @keyframes backdrop-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.97) translateY(12px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}
