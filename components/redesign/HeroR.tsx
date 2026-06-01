"use client";

import Link from "next/link";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";

const RULES = [
  { label: "SL placed before entry", delay: 0.2 },
  { label: "Risk ≤ 1% of account", delay: 0.6 },
  { label: "Setup matches plan", delay: 1.0 },
  { label: "No trading after 2 losses", delay: 1.4 },
  { label: "Journal entry written", delay: 1.8 },
];

function AnimatedScore() {
  const score = useMotionValue(6.2);
  const display = useTransform(score, (v) => v.toFixed(1));
  const [phase, setPhase] = useState<"idle" | "checking" | "scored">("idle");

  useEffect(() => {
    let cancel = false;
    async function loop() {
      while (!cancel) {
        setPhase("idle");
        score.set(6.2);
        await new Promise((r) => setTimeout(r, 600));
        setPhase("checking");
        await new Promise((r) => setTimeout(r, 2400));
        setPhase("scored");
        animate(score, 8.4, { duration: 1.2, ease: [0.2, 0.8, 0.2, 1] });
        await new Promise((r) => setTimeout(r, 2800));
      }
    }
    loop();
    return () => {
      cancel = true;
    };
  }, [score]);

  return (
    <div
      style={{
        position: "relative",
        borderRadius: 20,
        background:
          "linear-gradient(180deg, rgba(20,20,23,0.95) 0%, rgba(10,10,12,0.95) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: 28,
        boxShadow:
          "0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,92,246,0.06) inset",
        overflow: "hidden",
      }}
    >
      {/* Subtle gradient halo behind */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 320,
          height: 320,
          background:
            "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 22 }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ color: "#71717a", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>
              Discipline Score
            </p>
            <p style={{ color: "#A1A1AA", fontSize: 12.5 }}>
              Rolling 30 trades · EUR/USD
            </p>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 999,
              backgroundColor: "rgba(34,197,94,0.1)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                boxShadow: "0 0 8px #22c55e",
              }}
            />
            <span style={{ color: "#86efac", fontSize: 11.5, fontWeight: 600 }}>LIVE</span>
          </div>
        </div>

        {/* Big score */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <motion.span
            style={{
              fontSize: 84,
              fontWeight: 600,
              letterSpacing: "-0.05em",
              lineHeight: 1,
              color: "#F4F4F5",
              fontVariantNumeric: "tabular-nums",
              fontFeatureSettings: '"tnum"',
            }}
          >
            {display}
          </motion.span>
          <span style={{ color: "#52525b", fontSize: 22, fontWeight: 500, marginBottom: 8 }}>
            / 10
          </span>
          <motion.div
            initial={false}
            animate={{
              opacity: phase === "scored" ? 1 : 0,
              y: phase === "scored" ? 0 : 6,
            }}
            transition={{ duration: 0.4 }}
            style={{
              marginLeft: "auto",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 10px",
              borderRadius: 8,
              backgroundColor: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.25)",
              color: "#86efac",
              fontSize: 12.5,
              fontWeight: 600,
              marginBottom: 14,
            }}
          >
            ▲ +2.2
          </motion.div>
        </div>

        {/* Rules being checked */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ color: "#52525b", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600 }}>
            Last trade · rule check
          </p>
          {RULES.map((rule, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.35 }}
              animate={{
                opacity: phase === "idle" ? 0.35 : 1,
              }}
              transition={{ duration: 0.3, delay: phase === "checking" ? rule.delay * 0.3 : 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 12px",
                borderRadius: 10,
                backgroundColor: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: phase === "checking" ? [0.6, 1.2, 1] : 1,
                  backgroundColor:
                    phase === "idle"
                      ? "rgba(82,82,91,0.4)"
                      : "rgba(34,197,94,0.25)",
                }}
                transition={{
                  duration: 0.45,
                  delay: phase === "checking" ? rule.delay * 0.3 : 0,
                  ease: "easeOut",
                }}
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
                <motion.svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  initial={false}
                  animate={{
                    opacity: phase === "idle" ? 0 : 1,
                    scale: phase === "checking" ? [0, 1.2, 1] : 1,
                  }}
                  transition={{
                    duration: 0.4,
                    delay: phase === "checking" ? rule.delay * 0.3 + 0.1 : 0,
                  }}
                >
                  <path d="M2 5l2 2 4-4" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </motion.svg>
              </motion.div>
              <span style={{ color: "#D4D4D8", fontSize: 13, fontWeight: 500 }}>
                {rule.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HeroR() {
  return (
    <section
      style={{
        position: "relative",
        paddingTop: 120,
        paddingBottom: 90,
        backgroundColor: "#000",
        overflow: "hidden",
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage: "radial-gradient(ellipse 60% 50% at 50% 30%, #000 30%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 30%, #000 30%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="mx-auto px-6"
        style={{ maxWidth: 1200, position: "relative" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 0.95fr)",
            gap: 64,
            alignItems: "center",
          }}
          className="hero-grid"
        >
          {/* Left: Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 12px 5px 6px",
                borderRadius: 999,
                backgroundColor: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                marginBottom: 28,
              }}
            >
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  padding: "2px 8px",
                  borderRadius: 999,
                  backgroundColor: "#8B5CF6",
                  color: "#fff",
                }}
              >
                NEW
              </span>
              <span style={{ color: "#A1A1AA", fontSize: 13 }}>
                Basic plan is now free, forever ·{" "}
                <Link href="/founders" style={{ color: "#FBBF24", textDecoration: "none" }}>
                  Founder Lifetime $149 →
                </Link>
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
              style={{
                fontSize: "clamp(44px, 5.6vw, 76px)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 0.98,
                color: "#F4F4F5",
                marginBottom: 22,
              }}
            >
              The trading journal
              <br />
              that knows{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #C4B5FD 0%, #8B5CF6 50%, #6D28D9 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                your rules.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              style={{
                fontSize: 18,
                color: "#A1A1AA",
                lineHeight: 1.55,
                maxWidth: 480,
                marginBottom: 36,
              }}
            >
              Define what makes a valid setup. We track every trade against it. See your discipline score climb — or crash — in real time.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 28 }}
            >
              <Link
                href="/register"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: "#F4F4F5",
                  color: "#0a0a0a",
                  padding: "14px 24px",
                  borderRadius: 999,
                  fontSize: 14.5,
                  fontWeight: 500,
                  textDecoration: "none",
                  boxShadow: "0 10px 40px -10px rgba(255,255,255,0.3)",
                }}
                className="hover:scale-[1.02] transition-transform"
              >
                Start free forever <span style={{ opacity: 0.6 }}>→</span>
              </Link>
              <a
                href="#how"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: "transparent",
                  color: "#D4D4D8",
                  padding: "14px 24px",
                  borderRadius: 999,
                  fontSize: 14.5,
                  fontWeight: 500,
                  textDecoration: "none",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
                className="hover:bg-white/[0.04] transition-colors"
              >
                See how it works
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.45 }}
              style={{ display: "flex", gap: 24, color: "#71717a", fontSize: 13, alignItems: "center", flexWrap: "wrap" }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3 3 7-7" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                No credit card
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3 3 7-7" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Unlimited trades
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7l3 3 7-7" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Cancel anytime
              </span>
            </motion.div>
          </div>

          {/* Right: Live Discipline Score Card */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ position: "relative" }}
          >
            <AnimatedScore />
          </motion.div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </section>
  );
}
