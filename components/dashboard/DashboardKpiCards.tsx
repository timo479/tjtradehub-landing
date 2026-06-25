"use client";
import { useState } from "react";

export interface KpiCard {
  label: string;
  value: string;
  sub: string;
  color: string;
  progress?: number; // 0–100
}

// ─── Line icons per card ──────────────────────────────────────────────────────
const ICONS: Record<string, React.ReactNode> = {
  "Trades This Month": <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  "Avg Rating": <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />,
  "Win Rate": <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></>,
  "Total P&L": <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>,
};

function CardIcon({ label, color }: { label: string; color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
      {ICONS[label] ?? ICONS["Total P&L"]}
    </svg>
  );
}

export default function DashboardKpiCards({ cards }: { cards: KpiCard[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6" data-tour="stats-cards">
      <style>{`
        @keyframes tjKpiIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tjKpiBar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @media (prefers-reduced-motion: reduce) { .tj-kpi, .tj-kpi-bar { animation: none !important; } }
      `}</style>
      {cards.map((card, i) => {
        const isHovered = hovered === card.label;
        const isNeutral = card.color === "#F9FAFB" || card.color === "#6B7280";
        const accent = isNeutral ? "139,92,246"
          : card.color === "#22c55e" ? "34,197,94"
          : card.color === "#ef4444" ? "239,68,68"
          : "245,158,11";
        const accentSolid = `rgb(${accent})`;
        const isPnl = card.label === "Total P&L";
        const showArrow = isPnl && card.value !== "—";
        const up = card.color === "#22c55e";

        return (
          <div
            key={card.label}
            className="tj-kpi"
            onMouseEnter={() => setHovered(card.label)}
            onMouseLeave={() => setHovered(null)}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "16px",
              padding: "16px 18px",
              background: "linear-gradient(145deg, #110c1e, #080808)",
              border: isHovered ? `1px solid rgba(${accent},0.4)` : "1px solid rgba(255,255,255,0.06)",
              boxShadow: isHovered
                ? `0 0 30px rgba(${accent},0.2), 0 10px 36px rgba(0,0,0,0.55)`
                : "0 4px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)",
              transition: "box-shadow 0.25s ease, transform 0.2s ease, border-color 0.2s ease",
              transform: isHovered ? "translateY(-3px)" : "none",
              animation: `tjKpiIn 0.5s cubic-bezier(.22,1,.36,1) ${i * 70}ms both`,
              cursor: "default",
            }}
          >
            {/* accent edge */}
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: `linear-gradient(180deg, ${accentSolid}, rgba(${accent},0.2))` }} />
            {/* ambient glow */}
            <div style={{ position: "absolute", top: "-50%", right: "-20%", width: "150px", height: "120px", background: `radial-gradient(ellipse, rgba(${accent},${isHovered ? 0.16 : 0.08}), transparent 70%)`, pointerEvents: "none", transition: "background 0.25s" }} />

            {/* Header: label + icon badge */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "12px", position: "relative", zIndex: 1 }}>
              <p style={{ color: "#9CA3AF", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.09em", fontWeight: 700, margin: 0 }}>{card.label}</p>
              <div style={{ width: "30px", height: "30px", borderRadius: "9px", background: `rgba(${accent},0.12)`, border: `1px solid rgba(${accent},0.25)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CardIcon label={card.label} color={accentSolid} />
              </div>
            </div>

            {/* Value */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px", position: "relative", zIndex: 1 }}>
              {showArrow && <span style={{ color: card.color, fontSize: "15px", fontWeight: 800 }}>{up ? "▲" : "▼"}</span>}
              <p style={{ color: card.color, fontSize: "32px", fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.025em", margin: 0 }}>{card.value}</p>
            </div>

            {/* Sub */}
            <p style={{ color: "#6B7280", fontSize: "12px", margin: 0, position: "relative", zIndex: 1 }}>{card.sub}</p>

            {/* Progress bar */}
            {card.progress !== undefined && (
              <div style={{ marginTop: "14px", position: "relative", zIndex: 1 }}>
                <div style={{ height: "5px", backgroundColor: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                  <div className="tj-kpi-bar" style={{
                    height: "100%",
                    width: `${Math.min(100, Math.max(0, card.progress))}%`,
                    background: `linear-gradient(90deg, rgba(${accent},0.7), ${accentSolid})`,
                    borderRadius: "3px",
                    boxShadow: `0 0 10px rgba(${accent},0.5)`,
                    transformOrigin: "left",
                    animation: `tjKpiBar 0.9s cubic-bezier(.22,1,.36,1) ${i * 70 + 200}ms both`,
                  }} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
