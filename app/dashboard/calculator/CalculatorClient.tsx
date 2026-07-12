"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

const TABS = [
  { id: "risk",     label: "Risk Calculator", src: "/calculator-embed/index.html", pro: false },
  { id: "drawdown", label: "Drawdown",         src: "/drawdown-embed/index.html",   pro: true  },
];

export default function CalculatorClient({ isPro = false }: { isPro?: boolean }) {
  const [tab, setTab] = useState("risk");
  const current = TABS.find(t => t.id === tab)!;
  const locked = current.pro && !isPro;

  // Demo tour can switch tabs via the shared demo event bus.
  useEffect(() => {
    const h = (e: Event) => { const d = (e as CustomEvent).detail; if (d?.calcTab) setTab(d.calcTab as string); };
    window.addEventListener("journal-demo:action", h);
    return () => window.removeEventListener("journal-demo:action", h);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
      {/* Sub-nav tabs */}
      <div style={{ borderBottom: "1px solid #1F2937", paddingLeft: "24px", display: "flex", gap: "4px", flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 18px",
              fontSize: "13px",
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? "#A78BFA" : "#6B7280",
              background: "transparent",
              border: "none",
              borderBottom: tab === t.id ? "2px solid #8B5CF6" : "2px solid transparent",
              cursor: "pointer",
              transition: "color 0.15s",
              marginBottom: "-1px",
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
            }}
          >
            {t.label}
            {t.pro && !isPro && (
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  padding: "2px 6px",
                  borderRadius: "999px",
                  background: "rgba(139,92,246,0.16)",
                  border: "1px solid rgba(139,92,246,0.4)",
                  color: "#A78BFA",
                }}
              >
                PRO
              </span>
            )}
          </button>
        ))}
      </div>

      {/* iframe or Pro lock */}
      {locked ? (
        <DrawdownLock />
      ) : (
        <iframe
          key={current.src}
          src={current.src}
          style={{ flex: 1, border: "none", width: "100%", display: "block" }}
          title={current.label}
        />
      )}
    </div>
  );
}

const ACCENT = "#8B5CF6";

function DrawdownLock() {
  return (
    <div
      style={{
        position: "relative",
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        background: "radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.12) 0%, transparent 60%)",
      }}
    >
      <div
        style={{
          position: "relative",
          maxWidth: 440,
          margin: "0 24px",
          padding: "40px 36px",
          textAlign: "center",
          borderRadius: 20,
          background: "rgba(13,13,20,0.7)",
          border: "1px solid rgba(139,92,246,0.25)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 24px 80px -24px rgba(139,92,246,0.45)",
        }}
      >
        <span
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(139,92,246,0.16)",
            border: "1px solid rgba(139,92,246,0.4)",
            marginBottom: 18,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </span>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#F4F4F5", marginBottom: 10 }}>
          Drawdown Tool is a Pro feature
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "#9CA3AF", marginBottom: 24 }}>
          Unlock <strong style={{ color: "#D4D4D8" }}>Drawdown Recovery</strong> &amp;{" "}
          <strong style={{ color: "#D4D4D8" }}>Compound Planner</strong> — see exactly how much
          gain you need to recover from any loss and plan your compounding.
        </p>
        <Link href="/billing" style={{ textDecoration: "none" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "12px 22px",
              borderRadius: 12,
              background: `linear-gradient(135deg, ${ACCENT}, #7C3AED)`,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              boxShadow: "0 8px 26px -6px rgba(139,92,246,0.5)",
            }}
          >
            Unlock with Pro · $29/mo →
          </span>
        </Link>
      </div>
    </div>
  );
}
