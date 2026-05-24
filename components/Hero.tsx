"use client";

import Image from "next/image";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef } from "react";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, delay, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] },
});

export default function Hero() {
  // Magnetic primary CTA
  const bx = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  const by = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  const btnRef = useRef<HTMLAnchorElement>(null);

  function onMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    bx.set((e.clientX - r.left - r.width / 2) * 0.3);
    by.set((e.clientY - r.top - r.height / 2) * 0.3);
  }
  function onLeave() {
    bx.set(0);
    by.set(0);
  }

  return (
    <section
      className="flex items-center py-16 md:py-0"
      style={{
        minHeight: "85vh",
        paddingTop: "80px",
        backgroundColor: "#000000",
      }}
    >
      <div
        className="mx-auto w-full px-6"
        style={{ maxWidth: "1200px" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div className="flex flex-col gap-6">
            <motion.div
              {...fadeUp(0)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium w-fit"
              style={{
                backgroundColor: "#111827",
                color: "#8B5CF6",
                border: "1px solid #1F2937",
                borderRadius: "8px",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#8B5CF6" }}
              />
              Trading Journal
            </motion.div>

            <motion.h1
              {...fadeUp(0.08)}
              className="text-4xl md:text-5xl lg:text-[56px] font-bold leading-tight tracking-tight"
              style={{ color: "#F9FAFB" }}
            >
              Most Journals Are Built for Someone Else.{" "}
              <span className="aurora-text">This One Is Built by You.</span>
            </motion.h1>

            <motion.p
              {...fadeUp(0.18)}
              className="text-lg leading-relaxed"
              style={{ color: "#9CA3AF", maxWidth: "480px" }}
            >
              Define your own entry rules, setups, and risk criteria. TJ TradeHub tracks every trade against your system — not a generic template.
            </motion.p>

            {/* Feature badges */}
            <motion.div {...fadeUp(0.28)} className="flex flex-wrap gap-2" style={{ maxWidth: "480px" }}>
              {[
                "MT4/MT5 Auto-Sync",
                "Custom Rule Tracking",
                "Discipline Score",
                "Setup Analytics",
              ].map((feature) => (
                <span
                  key={feature}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: "rgba(139,92,246,0.08)",
                    border: "1px solid rgba(139,92,246,0.2)",
                    color: "#C4B5FD",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {feature}
                </span>
              ))}
            </motion.div>

            <motion.div {...fadeUp(0.38)} className="flex flex-col sm:flex-row gap-4 pt-2">
              <motion.a
                ref={btnRef}
                href="/register"
                onMouseMove={onMove}
                onMouseLeave={onLeave}
                style={{
                  x: bx,
                  y: by,
                  backgroundColor: "#8B5CF6",
                  color: "#F9FAFB",
                  borderRadius: "14px",
                  boxShadow: "0 10px 40px -10px rgba(139,92,246,0.6)",
                }}
                className="magnet btn-accent inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold transition-shadow duration-200 hover:shadow-[0_10px_60px_-10px_rgba(139,92,246,0.9)]"
              >
                Start Free Forever
              </motion.a>
              <a
                href="#features"
                className="btn-outline inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold transition-all duration-200"
                style={{
                  color: "#9CA3AF",
                  border: "1px solid #1F2937",
                  borderRadius: "14px",
                }}
              >
                See How It Works
              </a>
            </motion.div>

            <motion.p {...fadeUp(0.48)} className="text-sm" style={{ color: "#9CA3AF" }}>
              No credit card required &nbsp;·&nbsp; Cancel anytime
            </motion.p>
          </div>

          {/* Right: 3-Card Fan */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 1.1, delay: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            className="hero-fan-container"
          >
            {/* Ambient glow */}
            <div
              className="absolute pointer-events-none"
              style={{
                inset: "-60px",
                background:
                  "radial-gradient(ellipse at center, rgba(139,92,246,0.28) 0%, transparent 65%)",
                filter: "blur(60px)",
                zIndex: 0,
              }}
            />

            {[
              { id: "journal", url: "tjtradehub.com/journal", image: "/screenshots/ss-journal.png", pos: "left" },
              { id: "dashboard", url: "tjtradehub.com/dashboard", image: "/screenshots/ss-dashboard-v2.png", pos: "center" },
              { id: "stats", url: "tjtradehub.com/statistics", image: "/screenshots/ss-stats.png", pos: "right" },
            ].map((card) => (
              <div key={card.id} className={`hero-card hero-card-${card.pos}`}>
                <div className="hero-card-chrome">
                  <div className="hero-card-dots">
                    <span style={{ backgroundColor: "#FF5F57" }} />
                    <span style={{ backgroundColor: "#FFBD2E" }} />
                    <span style={{ backgroundColor: "#28C840" }} />
                  </div>
                  <div className="hero-card-url">{card.url}</div>
                </div>
                <div className="hero-card-screenshot">
                  <Image
                    src={card.image}
                    alt={card.id}
                    width={1080}
                    height={1800}
                    unoptimized
                    priority={card.pos === "center"}
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                  <div className="hero-card-fade" />
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
