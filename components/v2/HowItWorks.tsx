"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const STEPS = [
  {
    n: "01",
    title: "Connect your broker",
    body: "Drop in your MT4/MT5 credentials. We deploy a managed account that syncs every fill, every comment, every slippage tick — automatically.",
    visual: "connect",
  },
  {
    n: "02",
    title: "Trade your plan",
    body: "Mark each trade against your own rules: setup type, emotion, conviction. The journal stays out of your way while you execute.",
    visual: "execute",
  },
  {
    n: "03",
    title: "Compound your edge",
    body: "Weekly reports surface what's quietly working — and what's costing you. Adjust, iterate, ship a tighter system every Monday.",
    visual: "compound",
  },
];

function Visual({ kind }: { kind: string }) {
  if (kind === "connect") {
    return (
      <div className="relative h-full w-full grid place-items-center">
        <div className="absolute inset-0 v2-grid opacity-40" />
        <div className="relative flex items-center gap-8">
          <div className="rounded-2xl border border-white/10 bg-zinc-950/80 px-5 py-4">
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">Broker</div>
            <div className="font-semibold mt-1">MetaTrader 5</div>
          </div>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-violet-400"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
              />
            ))}
          </div>
          <div className="rounded-2xl border border-violet-500/40 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 px-5 py-4 shadow-[0_0_40px_-10px_rgba(139,92,246,0.6)]">
            <div className="text-[10px] uppercase tracking-widest text-violet-300">TJ TradeHub</div>
            <div className="font-semibold mt-1">Live journal</div>
          </div>
        </div>
      </div>
    );
  }
  if (kind === "execute") {
    return (
      <div className="relative h-full w-full p-6">
        <div className="space-y-3">
          {[
            { sym: "EURUSD", side: "Long", r: "+1.8R", rule: "Plan followed", ok: true },
            { sym: "NQ", side: "Short", r: "+2.1R", rule: "Stop respected", ok: true },
            { sym: "GBPJPY", side: "Long", r: "-1.0R", rule: "Revenge trade", ok: false },
          ].map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-zinc-950/80 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className={`w-1 h-8 rounded-full ${t.ok ? "bg-emerald-400" : "bg-rose-400"}`} />
                <div>
                  <div className="font-semibold text-sm">{t.sym} · {t.side}</div>
                  <div className="text-xs text-zinc-500">{t.rule}</div>
                </div>
              </div>
              <div className={`font-mono text-sm ${t.ok ? "text-emerald-400" : "text-rose-400"}`}>{t.r}</div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }
  // compound
  return (
    <div className="relative h-full w-full p-6">
      <svg viewBox="0 0 400 200" className="w-full h-full">
        <defs>
          <linearGradient id="cf" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,160 C60,150 100,140 140,120 S220,80 280,55 360,30 400,15 L400,200 L0,200 Z" fill="url(#cf)" />
        <motion.path
          d="M0,160 C60,150 100,140 140,120 S220,80 280,55 360,30 400,15"
          stroke="#F0ABFC" strokeWidth="2.5" fill="none" strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 2 }}
        />
        {[0, 40, 80, 120, 160].map((y, i) => (
          <line key={i} x1="0" x2="400" y1={y} y2={y} stroke="rgba(255,255,255,0.04)" />
        ))}
      </svg>
      <div className="absolute top-6 left-6 text-xs text-zinc-500">90-day equity curve</div>
      <div className="absolute top-6 right-6 text-xs text-emerald-400 font-mono">+184%</div>
    </div>
  );
}

export default function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const progressHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="how" ref={sectionRef} className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-20">
          <p className="text-xs uppercase tracking-[0.25em] text-violet-400 mb-3">How it works</p>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            Three steps to <span className="v2-aurora">replace the spreadsheet</span>.
          </h2>
        </div>

        <div className="relative grid md:grid-cols-[80px_1fr_1fr] gap-x-8 md:gap-x-12">
          {/* progress rail */}
          <div className="hidden md:block relative">
            <div className="sticky top-32 h-[60vh] w-px ml-10 bg-white/[0.06] overflow-hidden rounded-full">
              <motion.div
                style={{ height: progressHeight }}
                className="absolute top-0 left-0 right-0 bg-gradient-to-b from-violet-400 via-fuchsia-400 to-cyan-400"
              />
            </div>
          </div>
          {/* steps */}
          <div className="space-y-32 md:col-span-2 md:grid md:grid-cols-2 md:gap-x-12 md:gap-y-32 md:space-y-0">
            {STEPS.map((s, i) => (
              <div key={i} className="contents">
                <motion.div
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-120px" }}
                  transition={{ duration: 0.7 }}
                  className="md:sticky md:top-32 self-start"
                >
                  <div className="text-7xl md:text-8xl font-semibold v2-aurora">{s.n}</div>
                  <h3 className="mt-4 text-2xl md:text-3xl font-semibold tracking-tight">{s.title}</h3>
                  <p className="mt-4 text-zinc-400 text-lg leading-relaxed">{s.body}</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-120px" }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  className="relative rounded-2xl border border-white/10 bg-zinc-950/60 backdrop-blur h-[320px] md:h-[400px] overflow-hidden"
                >
                  <Visual kind={s.visual} />
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
