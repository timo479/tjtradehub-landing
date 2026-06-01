"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState, useEffect } from "react";

const STEPS = [
  {
    n: "01",
    title: "Define your rules",
    desc: "Setup criteria, risk limits, execution checklist. Whatever your system says makes a valid trade — put it in. No templates. No compromises.",
  },
  {
    n: "02",
    title: "Log every trade",
    desc: "Manual entry or auto-sync from MT4/MT5 (Pro). Each trade gets checked against your rules. Violations get flagged. Nothing hides.",
  },
  {
    n: "03",
    title: "Watch your discipline score",
    desc: "A single number that tells you how consistently you executed your system this week. It moves up when you follow rules. Down when you don't.",
  },
  {
    n: "04",
    title: "Find what's actually costing you",
    desc: "Setup-by-setup stats. Time-of-day patterns. Which rule, when broken, drains the most equity. Fix the leak instead of guessing.",
  },
];

function ScreenPreview({ step }: { step: number }) {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 16,
        backgroundColor: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
        boxShadow: "0 30px 80px -20px rgba(0,0,0,0.5)",
        aspectRatio: "16 / 11",
      }}
    >
      {/* Window chrome */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#FF5F57" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#FFBD2E" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#28C840" }} />
        <span style={{ marginLeft: 12, color: "#52525b", fontSize: 11, fontFamily: "monospace" }}>
          tjtradehub.com/{["rules", "journal", "dashboard", "settings"][step]}
        </span>
      </div>

      <div style={{ padding: "24px 28px", position: "relative", height: "calc(100% - 40px)" }}>
        {step === 0 && <RulesView />}
        {step === 1 && <JournalView />}
        {step === 2 && <DashboardView />}
        {step === 3 && <AnalyticsView />}
      </div>
    </div>
  );
}

function RulesView() {
  const rules = [
    "SL placed before entry",
    "Risk ≤ 1% of account",
    "Setup matches plan (A+ only)",
    "No trading after 2 losses",
    "Journal entry within 5 min",
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      key="rules"
    >
      <p style={{ color: "#71717a", fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>
        Your rule set · EUR/USD strategy
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rules.map((r, i) => (
          <motion.div
            key={r}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 14px",
              borderRadius: 10,
              backgroundColor: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 5,
                border: "1.5px solid #8B5CF6",
                backgroundColor: "rgba(139,92,246,0.18)",
              }}
            />
            <span style={{ color: "#D4D4D8", fontSize: 12.5 }}>{r}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function JournalView() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} key="journal">
      <p style={{ color: "#71717a", fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>
        New trade · EUR/USD · 13:42
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
        {[
          ["Side", "LONG", "#22c55e"],
          ["Entry", "1.0842", "#D4D4D8"],
          ["SL", "1.0828", "#D4D4D8"],
          ["TP", "1.0876", "#D4D4D8"],
          ["Risk", "0.8%", "#D4D4D8"],
          ["Setup", "Breakout A+", "#A78BFA"],
        ].map(([label, val, color]) => (
          <div key={label} style={{ padding: "10px 12px", borderRadius: 8, backgroundColor: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p style={{ color: "#52525b", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 2 }}>{label}</p>
            <p style={{ color, fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>{val}</p>
          </div>
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        style={{
          padding: "10px 14px",
          borderRadius: 10,
          backgroundColor: "rgba(34,197,94,0.1)",
          border: "1px solid rgba(34,197,94,0.25)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 7l3 3 7-7" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span style={{ color: "#86efac", fontSize: 12, fontWeight: 600 }}>All 5 rules passed — clean execution</span>
      </motion.div>
    </motion.div>
  );
}

function DashboardView() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} key="dashboard">
      <p style={{ color: "#71717a", fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>
        This week · Discipline trend
      </p>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }}>
        <span style={{ fontSize: 48, fontWeight: 600, letterSpacing: "-0.04em", color: "#F4F4F5", lineHeight: 1, fontFamily: "monospace" }}>8.4</span>
        <span style={{ color: "#52525b", fontSize: 16 }}>/ 10</span>
        <span style={{ marginLeft: "auto", color: "#86efac", fontSize: 12, fontWeight: 600, backgroundColor: "rgba(34,197,94,0.12)", padding: "3px 8px", borderRadius: 6 }}>
          ▲ +1.4 vs last week
        </span>
      </div>
      <svg viewBox="0 0 300 80" style={{ width: "100%", height: 80 }}>
        <defs>
          <linearGradient id="hwk-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d="M0 60 L40 55 L80 58 L120 45 L160 50 L200 32 L240 25 L300 12"
          fill="none"
          stroke="#8B5CF6"
          strokeWidth="2"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
        <motion.path
          d="M0 60 L40 55 L80 58 L120 45 L160 50 L200 32 L240 25 L300 12 L300 80 L0 80 Z"
          fill="url(#hwk-grad)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        />
      </svg>
    </motion.div>
  );
}

function AnalyticsView() {
  const setups = [
    { name: "Breakout A+", pnl: "+$840", win: 78, color: "#22c55e", bar: 78 },
    { name: "Pullback B", pnl: "+$210", win: 54, color: "#A78BFA", bar: 54 },
    { name: "Reversal C", pnl: "−$320", win: 31, color: "#ef4444", bar: 31 },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} key="analytics">
      <p style={{ color: "#71717a", fontSize: 10.5, letterSpacing: "0.18em", textTransform: "uppercase", fontWeight: 600, marginBottom: 14 }}>
        Setup performance · 30 days
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {setups.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ color: "#D4D4D8", fontSize: 12, fontWeight: 500 }}>{s.name}</span>
              <span style={{ color: s.color, fontSize: 12, fontWeight: 600, fontFamily: "monospace" }}>{s.pnl} · {s.win}%</span>
            </div>
            <div style={{ height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${s.bar}%` }}
                transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                style={{ height: "100%", backgroundColor: s.color, borderRadius: 3 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
      <p style={{ marginTop: 14, padding: "10px 12px", borderRadius: 8, backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#fca5a5", fontSize: 11.5 }}>
        ⓘ Reversal C: 12 trades broke your &ldquo;A+ only&rdquo; rule. Cost: −$320.
      </p>
    </motion.div>
  );
}

export default function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  // 4 steps → divide 0..1 into 4 buckets
  const stepProgress = useTransform(scrollYProgress, (p) => {
    return Math.min(3, Math.max(0, Math.floor(p * 4)));
  });

  return (
    <section id="how" ref={ref} style={{ position: "relative", backgroundColor: "#000" }}>
      <div
        style={{
          height: "400vh",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            height: "100vh",
            display: "flex",
            alignItems: "center",
            paddingTop: 60,
          }}
        >
          <div className="mx-auto px-6" style={{ maxWidth: 1200, width: "100%" }}>
            {/* Section heading */}
            <div style={{ marginBottom: 56, textAlign: "center" }}>
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
                How it works
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
                Your system. Measured.
              </h2>
            </div>

            <div
              className="hiw-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 0.85fr) minmax(0, 1.15fr)",
                gap: 64,
                alignItems: "center",
              }}
            >
              {/* Left: Steps */}
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {STEPS.map((step, i) => (
                  <StepCard key={i} index={i} step={step} stepProgress={stepProgress} />
                ))}
              </div>

              {/* Right: Mock UI */}
              <StickyPreview stepProgress={stepProgress} />
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @media (max-width: 900px) {
          .hiw-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </section>
  );
}

function StepCard({
  index,
  step,
  stepProgress,
}: {
  index: number;
  step: (typeof STEPS)[number];
  stepProgress: import("framer-motion").MotionValue<number>;
}) {
  const opacity = useTransform(stepProgress, (v) => (v === index ? 1 : 0.32));
  const borderColor = useTransform(stepProgress, (v) =>
    v === index ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.06)"
  );

  return (
    <motion.div
      style={{
        opacity,
        borderLeft: useTransform(borderColor, (c) => `2px solid ${c}`),
        paddingLeft: 22,
        cursor: "pointer",
      }}
    >
      <p style={{ color: "#8B5CF6", fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 6, fontVariantNumeric: "tabular-nums" }}>
        {step.n}
      </p>
      <h3 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", color: "#F4F4F5", marginBottom: 8 }}>
        {step.title}
      </h3>
      <p style={{ color: "#A1A1AA", fontSize: 15, lineHeight: 1.55, maxWidth: 440 }}>
        {step.desc}
      </p>
    </motion.div>
  );
}

function StickyPreview({ stepProgress }: { stepProgress: import("framer-motion").MotionValue<number> }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const unsub = stepProgress.on("change", (v) => setStep(v));
    return unsub;
  }, [stepProgress]);

  return (
    <div style={{ position: "relative" }}>
      <ScreenPreview step={step} />
    </div>
  );
}
