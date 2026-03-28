"use client";
import { useState } from "react";

export interface KpiCard {
  label: string;
  value: string;
  sub: string;
  color: string;
  progress?: number; // 0–100, optional progress bar
}

export default function DashboardKpiCards({ cards }: { cards: KpiCard[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10"
      data-tour="stats-cards"
    >
      {cards.map((card) => {
        const isHovered = hovered === card.label;
        const isNeutral = card.color === "#F9FAFB" || card.color === "#6B7280";
        const glowColor = isNeutral ? "rgba(139,92,246" : card.color === "#22c55e" ? "rgba(34,197,94" : card.color === "#ef4444" ? "rgba(239,68,68" : "rgba(245,158,11";

        return (
          <div
            key={card.label}
            onMouseEnter={() => setHovered(card.label)}
            onMouseLeave={() => setHovered(null)}
            style={{
              borderRadius: "16px",
              padding: "24px",
              background: `linear-gradient(#0f1623, #111827) padding-box, linear-gradient(135deg, ${glowColor},0.35) 0%, transparent 65%) border-box`,
              border: "1px solid transparent",
              boxShadow: isHovered
                ? `0 0 28px ${glowColor},0.18), 0 8px 32px rgba(0,0,0,0.5)`
                : `0 0 0 1px rgba(255,255,255,0.03), 0 4px 20px rgba(0,0,0,0.35)`,
              transition: "box-shadow 0.25s ease, transform 0.2s ease",
              transform: isHovered ? "translateY(-3px)" : "none",
              cursor: "default",
            }}
          >
            <p style={{
              color: "#6B7280",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              fontWeight: 700,
              marginBottom: "14px",
            }}>
              {card.label}
            </p>

            <p style={{
              color: card.color,
              fontSize: "34px",
              fontWeight: 800,
              lineHeight: 1,
              marginBottom: "8px",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
            }}>
              {card.value}
            </p>

            <p style={{ color: "#4B5563", fontSize: "12px" }}>{card.sub}</p>

            {card.progress !== undefined && (
              <div style={{ marginTop: "16px" }}>
                <div style={{
                  height: "3px",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(100, Math.max(0, card.progress))}%`,
                    background: `linear-gradient(90deg, ${card.color}, ${card.color}99)`,
                    borderRadius: "2px",
                    transition: "width 0.6s cubic-bezier(0.4,0,0.2,1)",
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
