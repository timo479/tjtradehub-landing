"use client";

import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const PLANS = [
  {
    id: "basic",
    name: "Basic",
    tagline: "For traders just getting started",
    price: 0,
    priceLabel: "$0",
    period: "forever",
    cta: "Start free",
    href: "/register",
    features: [
      "Unlimited trade logging — no cap, ever",
      "Equity curve & win-rate KPIs",
      "P&L calendar heatmap",
      "Weekday, monthly & instrument stats",
      "Custom fields & setup tagging",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "Stop logging manually. Let your broker do it.",
    price: 29,
    priceLabel: "$29",
    period: "/ month",
    cta: "Upgrade to Pro",
    href: "/register",
    popular: true,
    timeSaved: "Saves ~3h / week of manual entry",
    features: [
      "Everything in Basic",
      "MT4 & MT5 auto-sync — zero manual entry",
      "Multi-account dashboard & unlimited journals",
      "Discipline, rule-compliance & profit-factor analytics",
      "AI performance insights on your own trades",
      "Execution quality, slippage & timing breakdown",
      "Drawdown recovery & compound planner tools",
      "Weekly AI-generated market digest",
    ],
  },
  {
    id: "founder",
    name: "Founder",
    tagline: "Lifetime access — only 100 seats",
    price: 149,
    priceLabel: "$149",
    period: "one-time",
    cta: "Claim a seat",
    href: "/founders",
    founder: true,
    note: "... / 100 left",
    features: [
      "Everything in Pro · forever",
      "No recurring billing, ever",
      "Founder #001-100 number",
      "Lottery: 10 free seats Sept 2026",
      "Locked-in pricing forever",
    ],
  },
] as const;

export default function PricingSection() {
  const [founderNote, setFounderNote] = useState<string>("... / 100 left");

  useEffect(() => {
    fetch("/api/founders/status", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.remainingForSale != null) {
          setFounderNote(`${data.remainingForSale} / 100 left`);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <section
      id="pricing"
      style={{
        position: "relative",
        padding: "140px 0 120px",
        backgroundColor: "#000",
        overflow: "hidden",
      }}
    >
      {/* Aurora background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 75% 55% at 50% 40%, rgba(139,92,246,0.15) 0%, transparent 65%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "30%",
          transform: "translateX(-50%)",
          width: 800,
          height: 800,
          background:
            "radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 60%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      {/* Floating sparkles */}
      <FloatingSparkles />

      <div className="mx-auto px-6" style={{ maxWidth: 1200, position: "relative" }}>
        <div style={{ textAlign: "center", marginBottom: 64, maxWidth: 700, marginInline: "auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              padding: "5px 14px 5px 12px",
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              marginBottom: 22,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 8px #22c55e",
              }}
            />
            <span style={{ color: "#A1A1AA", fontSize: 12.5, letterSpacing: "0.04em" }}>
              <span style={{ color: "#86efac", fontWeight: 600 }}>Live pricing</span> · no upsells, no upgrades after
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 600,
              letterSpacing: "-0.035em",
              lineHeight: 1.02,
              color: "#F4F4F5",
              marginBottom: 18,
            }}
          >
            Free forever.
            <br />
            <span
              style={{
                background:
                  "linear-gradient(135deg, #71717a 0%, #52525b 50%, #3f3f46 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Pay only when you automate.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            style={{ color: "#A1A1AA", fontSize: 17, lineHeight: 1.5 }}
          >
            No paywall on the journal itself. Upgrade only to add MT5 sync — or lock in lifetime.
          </motion.p>
        </div>

        <div
          className="pricing-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1.08fr 1fr",
            gap: 18,
            maxWidth: 1100,
            marginInline: "auto",
            alignItems: "stretch",
          }}
        >
          {PLANS.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              index={i}
              liveNote={plan.id === "founder" ? founderNote : undefined}
            />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{
            textAlign: "center",
            marginTop: 48,
            display: "flex",
            justifyContent: "center",
            gap: 24,
            flexWrap: "wrap",
            color: "#52525b",
            fontSize: 12.5,
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <CheckIcon /> All prices in USD
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <CheckIcon /> 14-day refund on Founder
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <CheckIcon /> Cancel Pro anytime
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <CheckIcon /> Stripe checkout
          </span>
        </motion.div>
      </div>

      <style>{`
        @property --pro-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        @keyframes spinAngle {
          to { --pro-angle: 360deg; }
        }
        .pro-rotating-border {
          background: conic-gradient(
            from var(--pro-angle),
            transparent 0%,
            transparent 65%,
            rgba(139,92,246,0.55) 78%,
            rgba(168,85,247,0.85) 82%,
            rgba(139,92,246,0.55) 86%,
            transparent 100%
          );
          animation: spinAngle 5s linear infinite;
        }
        @keyframes goldShimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes floatUp {
          0% { transform: translateY(20vh) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-20vh) translateX(20px); opacity: 0; }
        }
        @media (max-width: 900px) {
          .pricing-grid {
            grid-template-columns: 1fr !important;
            max-width: 480px !important;
          }
        }
      `}</style>
    </section>
  );
}

function PlanCard({
  plan,
  index,
  liveNote,
}: {
  plan: (typeof PLANS)[number];
  index: number;
  liveNote?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), {
    stiffness: 200,
    damping: 20,
  });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mouseX.set((e.clientX - r.left) / r.width - 0.5);
    mouseY.set((e.clientY - r.top) / r.height - 0.5);
  }
  function onMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  const isPro = "popular" in plan && plan.popular;
  const isFounder = "founder" in plan && plan.founder;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 0.7,
        delay: index * 0.1,
        ease: [0.2, 0.8, 0.2, 1],
      }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{
        position: "relative",
        transformStyle: "preserve-3d",
        rotateX,
        rotateY,
        marginTop: isPro ? -12 : 0,
        marginBottom: isPro ? -12 : 0,
        isolation: "isolate",
      }}
    >
      {/* Outer soft glow — stays inside the card footprint, no bleed onto neighbors */}
      {isPro && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 20,
            boxShadow: "0 0 0 1px rgba(139,92,246,0.18), 0 24px 80px -24px rgba(139,92,246,0.45)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}
      {isFounder && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 20,
            boxShadow: "0 0 0 1px rgba(251,191,36,0.18), 0 24px 80px -24px rgba(251,191,36,0.35)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      )}

      {/* Rotating conic border for Pro — pattern rotates, element stays static (no overflow into neighbors) */}
      {isPro && (
        <div
          className="pro-rotating-border"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 20,
            padding: 1,
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
      )}

      <div
        style={{
          position: "relative",
          padding: "36px 30px 32px",
          borderRadius: 20,
          backgroundColor: isPro ? "#0c0a14" : isFounder ? "#0e0b06" : "#0a0a0a",
          border: isPro
            ? "1px solid rgba(139,92,246,0.25)"
            : isFounder
            ? "1px solid rgba(251,191,36,0.25)"
            : "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          zIndex: 1,
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Inner card background pattern */}
        {isPro && (
          <div
            style={{
              position: "absolute",
              top: -120,
              right: -120,
              width: 280,
              height: 280,
              background:
                "radial-gradient(circle, rgba(139,92,246,0.18) 0%, transparent 70%)",
              filter: "blur(20px)",
              pointerEvents: "none",
            }}
          />
        )}
        {isFounder && (
          <>
            <div
              style={{
                position: "absolute",
                top: -100,
                left: -100,
                width: 260,
                height: 260,
                background:
                  "radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)",
                filter: "blur(20px)",
                pointerEvents: "none",
              }}
            />
            <FounderStars />
          </>
        )}

        {/* Badges */}
        {isPro && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
            style={{
              position: "absolute",
              top: -1,
              left: "50%",
              transform: "translate(-50%, -50%)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 14px",
              borderRadius: 999,
              background:
                "linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #8B5CF6 100%)",
              color: "#fff",
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              boxShadow: "0 6px 20px -4px rgba(139,92,246,0.5)",
              zIndex: 2,
            }}
          >
            <SparkleIcon /> Most popular
          </motion.div>
        )}

        {isFounder && (liveNote ?? ("note" in plan && plan.note)) && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "3px 10px",
              borderRadius: 999,
              backgroundColor: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.3)",
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: "#FBBF24",
              fontFamily: "monospace",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                backgroundColor: "#FBBF24",
                animation: "pulse 1.6s infinite",
              }}
            />
            {liveNote ?? ("note" in plan ? plan.note : "")}
          </motion.div>
        )}

        {/* Plan name */}
        <div style={{ position: "relative", marginBottom: 24 }}>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: isPro ? "#A78BFA" : isFounder ? "#FBBF24" : "#71717a",
              marginBottom: 8,
            }}
          >
            {plan.name}
          </h3>
          <p
            style={{
              color: "#71717a",
              fontSize: 13.5,
              lineHeight: 1.5,
              minHeight: 40,
            }}
          >
            {plan.tagline}
          </p>
        </div>

        {/* Big price */}
        <div style={{ position: "relative", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <AnimatedPrice value={plan.price} isFounder={isFounder} />
            <span
              style={{
                color: "#71717a",
                fontSize: 15,
                marginLeft: 4,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {plan.period}
            </span>
          </div>
          {isFounder && (
            <p
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "rgba(251,191,36,0.7)",
                fontWeight: 500,
              }}
            >
              <s style={{ color: "#52525b", opacity: 0.6 }}>$348/yr value</s> · saves $199/yr forever
            </p>
          )}
          {isPro && (
            <p
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "rgba(167,139,250,0.7)",
                fontWeight: 500,
              }}
            >
              Billed monthly · cancel anytime
            </p>
          )}
          {"timeSaved" in plan && plan.timeSaved && (
            <div
              style={{
                marginTop: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "5px 12px",
                borderRadius: 999,
                backgroundColor: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.2)",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="#A78BFA" strokeWidth="1.4" />
                <path d="M7 4v3.5l2 1.5" stroke="#A78BFA" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 11.5, color: "#A78BFA", fontWeight: 600 }}>
                {plan.timeSaved}
              </span>
            </div>
          )}
          {!isPro && !isFounder && (
            <p
              style={{
                marginTop: 6,
                fontSize: 12,
                color: "#52525b",
                fontWeight: 500,
              }}
            >
              No credit card. Ever.
            </p>
          )}
        </div>

        {/* CTA */}
        <Link
          href={plan.href}
          style={{
            position: "relative",
            display: "block",
            textAlign: "center",
            padding: "14px 20px",
            borderRadius: 12,
            marginBottom: 32,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
            transition: "all 0.2s",
            ...(isPro
              ? {
                  background:
                    "linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #8B5CF6 100%)",
                  backgroundSize: "200% 200%",
                  color: "#fff",
                  boxShadow:
                    "0 10px 32px -8px rgba(139,92,246,0.6), inset 0 1px 0 rgba(255,255,255,0.2)",
                  animation: "goldShimmer 4s ease-in-out infinite",
                }
              : isFounder
              ? {
                  background:
                    "linear-gradient(135deg, #FBBF24 0%, #F59E0B 50%, #FBBF24 100%)",
                  backgroundSize: "200% 200%",
                  color: "#1a0a02",
                  boxShadow:
                    "0 10px 32px -8px rgba(251,191,36,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
                  animation: "goldShimmer 3s ease-in-out infinite",
                }
              : {
                  backgroundColor: "rgba(255,255,255,0.06)",
                  color: "#F4F4F5",
                  border: "1px solid rgba(255,255,255,0.1)",
                }),
          }}
          className="hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          {plan.cta}
          {(isPro || isFounder) && (
            <span style={{ marginLeft: 6, opacity: 0.85 }}>→</span>
          )}
        </Link>

        {/* Divider with label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 18,
          }}
        >
          <div style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
          <span
            style={{
              fontSize: 10,
              color: "#52525b",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            What&apos;s included
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Features */}
        <ul
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            listStyle: "none",
            padding: 0,
            margin: 0,
            flex: 1,
          }}
        >
          {plan.features.map((f, j) => (
            <motion.li
              key={j}
              initial={{ opacity: 0, x: -8 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 + 0.3 + j * 0.05 }}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                color: "#D4D4D8",
                fontSize: 13.5,
                lineHeight: 1.5,
              }}
            >
              <CheckBubble color={isPro ? "#A78BFA" : isFounder ? "#FBBF24" : "#71717a"} />
              {f}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function AnimatedPrice({ value, isFounder }: { value: number; isFounder?: boolean }) {
  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (v) => `$${Math.round(v)}`);

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 1.2,
      ease: [0.2, 0.8, 0.2, 1],
    });
    return () => controls.stop();
  }, [motionVal, value]);

  return (
    <motion.span
      style={{
        fontSize: 64,
        fontWeight: 600,
        letterSpacing: "-0.05em",
        lineHeight: 1,
        color: isFounder ? undefined : "#F4F4F5",
        fontVariantNumeric: "tabular-nums",
        background: isFounder
          ? "linear-gradient(135deg, #FCD34D 0%, #FBBF24 50%, #F59E0B 100%)"
          : undefined,
        WebkitBackgroundClip: isFounder ? "text" : undefined,
        WebkitTextFillColor: isFounder ? "transparent" : undefined,
        backgroundClip: isFounder ? "text" : undefined,
      }}
    >
      {display}
    </motion.span>
  );
}

function CheckBubble({ color }: { color: string }) {
  return (
    <span
      style={{
        flexShrink: 0,
        width: 18,
        height: 18,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: `${color}1f`,
        border: `1px solid ${color}33`,
        marginTop: 2,
      }}
    >
      <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
        <path
          d="M2 5l2 2 4-4"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <path d="M2 7l3 3 7-7" stroke="#52525b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 0L7.2 4.8L12 6L7.2 7.2L6 12L4.8 7.2L0 6L4.8 4.8L6 0Z"
        fill="#fff"
      />
    </svg>
  );
}

function FounderStars() {
  return (
    <>
      {[
        { top: "12%", left: "15%", size: 4, delay: 0 },
        { top: "20%", left: "75%", size: 3, delay: 1.5 },
        { top: "45%", left: "85%", size: 5, delay: 0.8 },
        { top: "65%", left: "10%", size: 3, delay: 2.2 },
        { top: "80%", left: "70%", size: 4, delay: 1.2 },
      ].map((s, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: "50%",
            backgroundColor: "#FBBF24",
            boxShadow: `0 0 ${s.size * 2}px #FBBF24`,
            opacity: 0.5,
            animation: `pulse 2.4s ease-in-out infinite ${s.delay}s`,
            pointerEvents: "none",
          }}
        />
      ))}
    </>
  );
}

function FloatingSparkles() {
  const [particles, setParticles] = useState<
    { left: string; delay: number; duration: number; size: number }[]
  >([]);

  useEffect(() => {
    const items = Array.from({ length: 14 }).map(() => ({
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 12,
      duration: 10 + Math.random() * 8,
      size: 1 + Math.random() * 2,
    }));
    setParticles(items);
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {particles.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            bottom: 0,
            left: p.left,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: i % 3 === 0 ? "#FBBF24" : "#A78BFA",
            boxShadow: `0 0 ${p.size * 4}px ${i % 3 === 0 ? "#FBBF24" : "#A78BFA"}`,
            opacity: 0.4,
            animation: `floatUp ${p.duration}s linear infinite ${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
