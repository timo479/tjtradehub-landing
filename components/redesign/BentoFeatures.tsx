"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function BentoFeatures() {
  return (
    <section
      id="features"
      style={{
        padding: "120px 0",
        backgroundColor: "#000",
      }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        <div style={{ textAlign: "center", marginBottom: 56, maxWidth: 720, marginInline: "auto" }}>
          <p
            style={{
              color: "#71717a",
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            Features
          </p>
          <h2
            style={{
              fontSize: "clamp(32px, 4vw, 52px)",
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "#F4F4F5",
            }}
          >
            Built around{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #C4B5FD, #8B5CF6, #6D28D9)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              your system.
            </span>
          </h2>
        </div>

        {/* Bento grid: 12-column, asymmetric */}
        <div
          className="bento-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gridAutoRows: "minmax(220px, auto)",
            gap: 16,
          }}
        >
          {/* Big — Custom Rules (live demo) */}
          <BentoCard col="span 7" row="span 2" delay={0}>
            <CardEyebrow>Rule tracking</CardEyebrow>
            <CardTitle>You define the rules. We watch every trade.</CardTitle>
            <CardDesc>Entry criteria, risk caps, execution checklist. Whatever your system says is a valid trade — codify it. Violations get flagged, scored, and counted.</CardDesc>
            <RulesDemo />
          </BentoCard>

          {/* Medium — MT5 Sync (with pulse) */}
          <BentoCard col="span 5" row="span 1" delay={0.05} accent="green">
            <CardEyebrow>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span
                  style={{
                    width: 6, height: 6, borderRadius: "50%", backgroundColor: "#22c55e",
                    boxShadow: "0 0 8px #22c55e",
                    animation: "pulse 1.6s infinite",
                  }}
                />
                MT4 / MT5 auto-sync
              </span>
            </CardEyebrow>
            <CardTitle small>Every fill, every partial, automatically.</CardTitle>
            <CardDesc small>Connect once. Trades sync every 15 minutes via MetaAPI. Comments, slippage, partial closes — all of it.</CardDesc>
            <p style={{ marginTop: 14, fontSize: 11, color: "#52525b" }}>
              <span style={{ color: "#FBBF24" }}>★</span> Pro &amp; Founder
            </p>
          </BentoCard>

          {/* Medium — Multi-Account */}
          <BentoCard col="span 5" row="span 1" delay={0.1}>
            <CardEyebrow>Multi-account</CardEyebrow>
            <CardTitle small>Live, demo, and three prop firms — separated.</CardTitle>
            <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { name: "FTMO $100k", bal: "$104,820", color: "#22c55e" },
                { name: "Apex $50k", bal: "$53,210", color: "#22c55e" },
                { name: "Live · IC Markets", bal: "$8,440", color: "#A78BFA" },
                { name: "Demo · MT5", bal: "—", color: "#52525b" },
              ].map((a) => (
                <div
                  key={a.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    backgroundColor: "rgba(255,255,255,0.025)",
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span style={{ color: "#D4D4D8", fontSize: 12 }}>{a.name}</span>
                  <span style={{ color: a.color, fontSize: 12, fontFamily: "monospace", fontWeight: 600 }}>{a.bal}</span>
                </div>
              ))}
            </div>
          </BentoCard>

          {/* Wide — Setup Tagging */}
          <BentoCard col="span 6" row="span 1" delay={0.15}>
            <CardEyebrow>Setup tagging</CardEyebrow>
            <CardTitle small>Tag every entry. See which patterns actually pay.</CardTitle>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 14 }}>
              {[
                ["Breakout A+", "+$840", true],
                ["Pullback B", "+$210", true],
                ["Reversal C", "−$320", false],
                ["News scalp", "+$60", true],
                ["Range fade", "−$140", false],
              ].map(([name, pnl, win]) => (
                <span
                  key={name as string}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 10px",
                    borderRadius: 999,
                    fontSize: 11.5,
                    fontWeight: 500,
                    backgroundColor: win ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
                    border: `1px solid ${win ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                    color: win ? "#86efac" : "#fca5a5",
                  }}
                >
                  {name}
                  <span style={{ opacity: 0.7, fontFamily: "monospace" }}>{pnl}</span>
                </span>
              ))}
            </div>
          </BentoCard>

          {/* Compact — Privacy/Trust */}
          <BentoCard col="span 6" row="span 1" delay={0.2}>
            <CardEyebrow>Your data</CardEyebrow>
            <CardTitle small>Encrypted at rest. Read-only access. EU-hosted.</CardTitle>
            <CardDesc small>Broker credentials are encrypted with per-user keys. We can read your trade history — never trade on your behalf.</CardDesc>
            <div style={{ display: "flex", gap: 14, marginTop: 14, fontSize: 11, color: "#71717a", flexWrap: "wrap" }}>
              <span>🇪🇺 Supabase EU</span>
              <span>•</span>
              <span>AES-256 at rest</span>
              <span>•</span>
              <span>Read-only API</span>
            </div>
          </BentoCard>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        @media (max-width: 900px) {
          .bento-grid {
            grid-template-columns: 1fr !important;
          }
          .bento-grid > div {
            grid-column: span 1 !important;
            grid-row: auto !important;
          }
        }
      `}</style>
    </section>
  );
}

function BentoCard({
  children,
  col,
  row,
  delay = 0,
  accent,
}: {
  children: React.ReactNode;
  col: string;
  row: string;
  delay?: number;
  accent?: "green" | "violet";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.2, 0.8, 0.2, 1] }}
      style={{
        gridColumn: col,
        gridRow: row,
        padding: 28,
        borderRadius: 18,
        backgroundColor: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.06)",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
      whileHover={{ borderColor: accent === "green" ? "rgba(34,197,94,0.25)" : "rgba(139,92,246,0.25)" }}
    >
      {children}
    </motion.div>
  );
}

function CardEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        color: "#71717a",
        fontSize: 11,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        fontWeight: 600,
        marginBottom: 12,
      }}
    >
      {children}
    </p>
  );
}

function CardTitle({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <h3
      style={{
        fontSize: small ? 20 : 26,
        fontWeight: 600,
        letterSpacing: "-0.025em",
        lineHeight: 1.15,
        color: "#F4F4F5",
        marginBottom: 10,
        maxWidth: small ? 320 : 460,
      }}
    >
      {children}
    </h3>
  );
}

function CardDesc({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return (
    <p
      style={{
        color: "#A1A1AA",
        fontSize: small ? 13.5 : 15,
        lineHeight: 1.55,
        maxWidth: small ? 320 : 460,
      }}
    >
      {children}
    </p>
  );
}

function RulesDemo() {
  const [checks, setChecks] = useState<boolean[]>([true, true, true, false, true]);

  useEffect(() => {
    const interval = setInterval(() => {
      setChecks((prev) => prev.map(() => Math.random() > 0.18));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  const rules = [
    "Setup matches A+ criteria",
    "Risk ≤ 1% of account",
    "SL set before entry",
    "Not chasing after 2 losses",
    "Journal entry written",
  ];

  return (
    <div
      style={{
        marginTop: 24,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      {rules.map((r, i) => (
        <div
          key={r}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            borderRadius: 10,
            backgroundColor: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          <motion.div
            animate={{
              backgroundColor: checks[i] ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.2)",
              scale: 1,
            }}
            transition={{ duration: 0.3 }}
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              {checks[i] ? (
                <path d="M2 5l2 2 4-4" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <path d="M2 2l6 6M8 2l-6 6" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </motion.div>
          <span style={{ color: checks[i] ? "#D4D4D8" : "#71717a", fontSize: 13, fontWeight: 500, flex: 1, textDecoration: checks[i] ? "none" : "line-through" }}>
            {r}
          </span>
          {!checks[i] && (
            <span style={{ fontSize: 10, color: "#fca5a5", fontWeight: 600, letterSpacing: "0.05em" }}>
              VIOLATION
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
