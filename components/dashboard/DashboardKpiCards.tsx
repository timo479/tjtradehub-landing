"use client";
import { useState } from "react";

// ─── Design Tokens ────────────────────────────────────────────────────────────
// 4 cards in a row = each is effectively colSpan 3 (small)
// Padding: 16px 20px  |  Value: 32px bold  |  Label: 10px uppercase

export interface KpiCard {
  label: string;
  value: string;
  sub: string;
  color: string;
  progress?: number; // 0–100
}

export default function DashboardKpiCards({ cards }: { cards: KpiCard[] }) {
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      data-tour="stats-cards"
    >
      {cards.map((card) => {
        const isHovered = hovered === card.label;

        // Accent color for border and glow
        const isNeutral = card.color === "#F9FAFB" || card.color === "#6B7280";
        const accent = isNeutral
          ? "139,92,246"
          : card.color === "#22c55e"
          ? "34,197,94"
          : card.color === "#ef4444"
          ? "239,68,68"
          : "245,158,11";

        return (
          <div
            key={card.label}
            onMouseEnter={() => setHovered(card.label)}
            onMouseLeave={() => setHovered(null)}
            style={{
              borderRadius: "14px",
              padding: "16px 20px",
              background: `linear-gradient(#0f1623, #111827) padding-box, linear-gradient(135deg, rgba(${accent},0.32) 0%, transparent 65%) border-box`,
              border: "1px solid transparent",
              boxShadow: isHovered
                ? `0 0 28px rgba(${accent},0.18), 0 8px 32px rgba(0,0,0,0.5)`
                : "0 0 0 1px rgba(255,255,255,0.02), 0 4px 20px rgba(0,0,0,0.35)",
              transition: "box-shadow 0.25s ease, transform 0.2s ease",
              transform: isHovered ? "translateY(-2px)" : "none",
              cursor: "default",
            }}
          >
            {/* Label */}
            <p style={{
              color: "#6B7280",
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.09em",
              fontWeight: 700,
              marginBottom: "12px",
            }}>
              {card.label}
            </p>

            {/* Value */}
            <p style={{
              color: card.color,
              fontSize: "32px",
              fontWeight: 800,
              lineHeight: 1,
              marginBottom: "6px",
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.02em",
            }}>
              {card.value}
            </p>

            {/* Sub */}
            <p style={{ color: "#4B5563", fontSize: "12px" }}>{card.sub}</p>

            {/* Progress bar */}
            {card.progress !== undefined && (
              <div style={{ marginTop: "14px" }}>
                <div style={{
                  height: "3px",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: `${Math.min(100, Math.max(0, card.progress))}%`,
                    background: `linear-gradient(90deg, rgba(${accent},1), rgba(${accent},0.5))`,
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
