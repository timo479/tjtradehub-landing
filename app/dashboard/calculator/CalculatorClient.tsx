"use client";
import { useState } from "react";

const TABS = [
  { id: "risk",     label: "Risk Calculator", src: "/calculator-embed/index.html" },
  { id: "drawdown", label: "Drawdown",         src: "/drawdown-embed/index.html" },
];

export default function CalculatorClient() {
  const [tab, setTab] = useState("risk");
  const current = TABS.find(t => t.id === tab)!;

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
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* iframe */}
      <iframe
        key={current.src}
        src={current.src}
        style={{ flex: 1, border: "none", width: "100%", display: "block" }}
        title={current.label}
      />
    </div>
  );
}
