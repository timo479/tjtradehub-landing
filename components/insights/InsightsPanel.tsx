"use client";

import Link from "next/link";
import type { Insight, InsightResult } from "@/lib/insights";

// Shared insight surface for BOTH Statistics (JournalStats) and Dashboard
// (WidgetGrid). Pro sees the payoff; Basic sees the hook + a blurred, real value.

const ACCENT = "#8B5CF6";
const LEAK = "#F97316";
const EDGE = "#22C55E";

function tokens(dark: boolean) {
  return {
    text: dark ? "#F9FAFB" : "#111827",
    muted: "#6B7280",
    cardBg: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.015)",
    border: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    innerBg: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
  };
}

function SeverityIcon({ severity }: { severity: Insight["severity"] }) {
  const color = severity === "leak" ? LEAK : EDGE;
  return (
    <span style={{ width: 30, height: 30, borderRadius: 9, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", background: `${color}18`, border: `1px solid ${color}40` }}>
      {severity === "leak" ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      )}
    </span>
  );
}

function LockedValue({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <span style={{ filter: "blur(6px)", pointerEvents: "none", userSelect: "none", opacity: 0.85 }} aria-hidden>
        {children}
      </span>
      <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        <span style={{ color: "#A78BFA", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em" }}>PRO</span>
      </span>
    </span>
  );
}

export default function InsightsPanel({ result, isPro, isDark = true }: { result: InsightResult; isPro: boolean; isDark?: boolean }) {
  const t = tokens(isDark);

  // Data gate — same for everyone, no plan lock.
  if (result.status === "insufficient") {
    const pctDone = Math.min(100, Math.round((result.total / result.needed) * 100));
    return (
      <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: "18px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <InsightsTitle color={t.text} />
        </div>
        <p style={{ color: t.muted, fontSize: 13, margin: "0 0 12px" }}>
          Keep logging trades — your personal performance insights unlock at {result.needed} trades.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 3, background: t.innerBg, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pctDone}%`, background: `linear-gradient(90deg, ${ACCENT}, #A78BFA)`, borderRadius: 3 }} />
          </div>
          <span style={{ color: t.muted, fontSize: 12, fontWeight: 700, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{result.total}/{result.needed}</span>
        </div>
      </div>
    );
  }

  if (result.insights.length === 0) return null;

  return (
    <div style={{ background: t.cardBg, border: `1px solid ${t.border}`, borderRadius: 16, padding: "18px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <InsightsTitle color={t.text} />
        {!isPro && (
          <span style={{ marginLeft: "auto", color: "#A78BFA", fontSize: 11, fontWeight: 800, letterSpacing: "0.06em", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.28)", borderRadius: 6, padding: "2px 8px" }}>PRO</span>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
        {result.insights.map(ins => (
          <div key={ins.id} style={{ background: t.innerBg, border: `1px solid ${t.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", gap: 12 }}>
            <SeverityIcon severity={ins.severity} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: t.text, fontSize: 13.5, fontWeight: 600, lineHeight: 1.4, marginBottom: 8 }}>{ins.headline}</div>
              {isPro ? (
                <>
                  <div style={{ display: "inline-block", color: "#C4B5FD", fontSize: 12, fontWeight: 700, background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.28)", borderRadius: 6, padding: "2px 9px", marginBottom: 6 }}>{ins.segmentLabel}</div>
                  <div style={{ color: t.muted, fontSize: 12, lineHeight: 1.5 }}>{ins.detailValue}</div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 6 }}>
                    <LockedValue>
                      <span style={{ color: "#C4B5FD", fontSize: 12, fontWeight: 700, background: "rgba(139,92,246,0.12)", borderRadius: 6, padding: "2px 9px" }}>{ins.segmentLabel}</span>
                    </LockedValue>
                  </div>
                  <LockedValue><span style={{ color: t.muted, fontSize: 12 }}>{ins.detailValue}</span></LockedValue>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {!isPro && (
        <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <span style={{ color: t.muted, fontSize: 12.5 }}>
            These patterns are from <strong style={{ color: t.text }}>your</strong> trades. Unlock the answers with Pro.
          </span>
          <Link href="/billing" style={{ textDecoration: "none", flexShrink: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, background: `linear-gradient(135deg, ${ACCENT}, #7C3AED)`, color: "#fff", fontSize: 13, fontWeight: 700, boxShadow: "0 6px 20px rgba(139,92,246,0.3)" }}>
              Unlock with Pro · $29/mo →
            </span>
          </Link>
        </div>
      )}
    </div>
  );
}

function InsightsTitle({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z" /><line x1="9" y1="21" x2="15" y2="21" /></svg>
      <h3 style={{ color, fontWeight: 700, fontSize: 15, margin: 0, letterSpacing: "-0.01em" }}>Performance Insights</h3>
    </div>
  );
}
