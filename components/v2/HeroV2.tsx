"use client";

import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

export default function HeroV2() {
  const sectionRef = useRef<HTMLElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  // magnetic button
  const btnRef = useRef<HTMLAnchorElement>(null);
  const bx = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });
  const by = useSpring(useMotionValue(0), { stiffness: 200, damping: 15 });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const handle = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      el.style.setProperty("--mx", `${x}%`);
      el.style.setProperty("--my", `${y}%`);
      mx.set(e.clientX - r.left);
      my.set(e.clientY - r.top);
    };
    el.addEventListener("mousemove", handle);
    return () => el.removeEventListener("mousemove", handle);
  }, [mx, my]);

  function magnetEnter(e: React.MouseEvent<HTMLAnchorElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    bx.set((e.clientX - r.left - r.width / 2) * 0.35);
    by.set((e.clientY - r.top - r.height / 2) * 0.35);
  }
  function magnetMove(e: React.MouseEvent<HTMLAnchorElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    bx.set((e.clientX - r.left - r.width / 2) * 0.35);
    by.set((e.clientY - r.top - r.height / 2) * 0.35);
  }
  function magnetLeave() {
    bx.set(0);
    by.set(0);
  }

  return (
    <section ref={sectionRef} className="v2-spotlight relative isolate overflow-hidden pt-32 pb-24 md:pt-44 md:pb-32">
      {/* Mesh + Grid + Noise */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 v2-grid opacity-60" />
        <div className="v2-mesh opacity-70" />
        <div className="v2-noise" />
        {/* Floor reflection */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-6">
        {/* badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 backdrop-blur px-3 py-1 text-xs text-zinc-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Live — MetaTrader 5 sync is online
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.2, 0.8, 0.2, 1] }}
          className="mt-8 text-center text-[clamp(2.6rem,7vw,6.5rem)] font-semibold leading-[0.95] tracking-tight"
        >
          <span className="block text-white">Trade like a</span>
          <span className="block v2-aurora">business, not a bet.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.35 }}
          className="mx-auto mt-8 max-w-2xl text-center text-lg md:text-xl text-zinc-400 leading-relaxed"
        >
          The trading journal for system-based Forex & Futures traders.
          Auto-sync your MT4/MT5 trades, score your discipline, and turn
          chaos into edge.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mt-10 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <motion.a
            ref={btnRef}
            href="/register"
            onMouseEnter={magnetEnter}
            onMouseMove={magnetMove}
            onMouseLeave={magnetLeave}
            style={{ x: bx, y: by }}
            className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-white text-black px-6 py-3 font-medium shadow-[0_8px_40px_-8px_rgba(255,255,255,0.5)] hover:shadow-[0_8px_60px_-8px_rgba(255,255,255,0.8)] transition-shadow"
          >
            Start Free — No Credit Card
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </motion.a>
          <Link
            href="#how"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.02] backdrop-blur px-6 py-3 text-zinc-200 hover:bg-white/[0.06] hover:border-white/25 transition-colors"
          >
            <span className="grid place-items-center w-5 h-5 rounded-full bg-white/10">▶</span>
            See it in action
          </Link>
        </motion.div>

        {/* trust row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.85 }}
          className="mt-8 flex items-center justify-center gap-6 text-xs text-zinc-500"
        >
          <span className="inline-flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> No credit card required
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Cancel anytime
          </span>
          <span className="hidden md:inline-flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> $29/mo after trial
          </span>
        </motion.div>

        {/* App preview / chart */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1.2, delay: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative mt-16 md:mt-24 mx-auto max-w-6xl"
        >
          <div className="v2-border-glow rounded-2xl">
            <div className="relative rounded-2xl bg-zinc-950/80 backdrop-blur border border-white/10 overflow-hidden shadow-[0_30px_120px_-20px_rgba(139,92,246,0.4)]">
              {/* window chrome */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-black/40">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                <span className="ml-3 text-xs text-zinc-500 font-mono">app.tjtradehub.com/dashboard</span>
              </div>
              {/* stats bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5">
                {[
                  { label: "Total P&L", value: "+$24,891", sub: "+18.2%", color: "text-emerald-400" },
                  { label: "Win Rate", value: "68.4%", sub: "194 / 284 trades", color: "text-white" },
                  { label: "Profit Factor", value: "2.31", sub: "RR avg 1.8", color: "text-white" },
                  { label: "Discipline", value: "92", sub: "/ 100 score", color: "text-violet-400" },
                ].map((s, i) => (
                  <div key={i} className="bg-zinc-950 p-4">
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">{s.label}</div>
                    <div className={`mt-1 text-xl md:text-2xl font-semibold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{s.sub}</div>
                  </div>
                ))}
              </div>
              {/* chart */}
              <div className="relative h-[280px] md:h-[360px] p-4">
                <svg viewBox="0 0 800 300" className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="chartStroke" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stopColor="#A78BFA" />
                      <stop offset="100%" stopColor="#F0ABFC" />
                    </linearGradient>
                  </defs>
                  {/* grid lines */}
                  {[60, 120, 180, 240].map((y) => (
                    <line key={y} x1="0" x2="800" y1={y} y2={y} stroke="rgba(255,255,255,0.04)" />
                  ))}
                  {/* fill */}
                  <path
                    d="M0,240 L60,210 L120,225 L180,180 L240,195 L300,150 L360,165 L420,120 L480,135 L540,90 L600,105 L660,70 L720,85 L800,45 L800,300 L0,300 Z"
                    fill="url(#chartFill)"
                  />
                  {/* line */}
                  <path
                    className="v2-chart-line"
                    d="M0,240 L60,210 L120,225 L180,180 L240,195 L300,150 L360,165 L420,120 L480,135 L540,90 L600,105 L660,70 L720,85 L800,45"
                    fill="none"
                    stroke="url(#chartStroke)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* end dot */}
                  <circle cx="800" cy="45" r="5" fill="#F0ABFC">
                    <animate attributeName="r" values="5;8;5" dur="2s" repeatCount="indefinite" />
                  </circle>
                </svg>
                {/* floating tooltip */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.5, duration: 0.6 }}
                  className="absolute top-12 right-12 rounded-lg border border-white/10 bg-black/70 backdrop-blur px-3 py-2 text-xs font-mono shadow-2xl"
                >
                  <div className="text-zinc-400">May 14, 2026</div>
                  <div className="text-emerald-400 font-semibold">EURUSD · +$842 · 1.8R</div>
                </motion.div>
              </div>
            </div>
          </div>
          {/* underglow */}
          <div className="absolute -inset-x-20 -bottom-10 h-40 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/20 to-cyan-500/20 blur-3xl -z-10" />
        </motion.div>
      </div>
    </section>
  );
}
