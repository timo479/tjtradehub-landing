"use client";

import Link from "next/link";

const ACCENT = "#8B5CF6";

/**
 * Blurs its children and lays a "Unlock with Pro" overlay on top when `locked`.
 * When not locked, renders children untouched (no extra DOM).
 *
 * The parent must be position:relative (GlowCard / WidgetCard already are).
 * The blurred content is the REAL widget — upgrading reveals the true numbers.
 */
export default function LockedWidget({ locked, children }: { locked: boolean; children: React.ReactNode }) {
  if (!locked) return <>{children}</>;

  return (
    <div style={{ position: "relative" }}>
      <div style={{ filter: "blur(7px)", pointerEvents: "none", userSelect: "none", opacity: 0.9 }} aria-hidden>
        {children}
      </div>
      <div style={{
        position: "absolute", inset: 0, zIndex: 2,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 12, textAlign: "center", padding: 16,
      }}>
        <span style={{ width: 40, height: 40, borderRadius: 12, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(139,92,246,0.16)", border: "1px solid rgba(139,92,246,0.4)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        </span>
        <Link href="/billing" style={{ textDecoration: "none" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", borderRadius: 10, background: `linear-gradient(135deg, ${ACCENT}, #7C3AED)`, color: "#fff", fontSize: 13, fontWeight: 700, boxShadow: "0 6px 20px rgba(139,92,246,0.3)" }}>
            Unlock with Pro · $29/mo →
          </span>
        </Link>
      </div>
    </div>
  );
}
