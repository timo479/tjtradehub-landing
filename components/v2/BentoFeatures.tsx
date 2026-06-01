"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { ReactNode } from "react";

function TiltCard({
  children, className = "", area,
}: { children: ReactNode; className?: string; area?: string }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const bg = useMotionTemplate`radial-gradient(220px circle at ${mx}px ${my}px, rgba(139,92,246,0.18), transparent 60%)`;

  function handle(e: React.MouseEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  }

  return (
    <motion.div
      onMouseMove={handle}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7 }}
      style={{ gridArea: area }}
      className={`group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-950/60 backdrop-blur p-6 md:p-8 hover:border-white/20 transition-colors ${className}`}
    >
      <motion.div style={{ background: bg }} className="pointer-events-none absolute inset-0" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}

export default function BentoFeatures() {
  return (
    <section id="features" className="py-24 md:py-32 relative">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl mb-16">
          <p className="text-xs uppercase tracking-[0.25em] text-violet-400 mb-3">Features</p>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            Everything you need to <span className="v2-aurora">find your edge</span>.
          </h2>
          <p className="mt-5 text-zinc-400 text-lg">
            Tools, automation, and analytics — wired together so journaling stops feeling like homework.
          </p>
        </div>

        <div
          className="grid gap-4 md:grid-cols-6 md:grid-rows-[repeat(4,minmax(0,180px))]"
        >
          {/* MT5 Sync — big left */}
          <TiltCard area="1 / 1 / 3 / 4" className="md:col-span-3 md:row-span-2">
            <div className="flex items-center gap-2 text-xs text-emerald-400 mb-4">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              <span>Live sync</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">MT4 & MT5 auto-import</h3>
            <p className="mt-3 text-zinc-400 max-w-md">
              Connect your account once — every fill, every slippage, every comment lands in your journal automatically.
              No CSV exports. No copy-paste.
            </p>
            <div className="mt-6 rounded-xl border border-white/[0.08] bg-black/50 p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">[12:04:32] Trade synced</span>
                <span className="text-emerald-400">+$842</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">[12:11:08] Trade synced</span>
                <span className="text-emerald-400">+$312</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">[13:22:51] Trade synced</span>
                <span className="text-red-400">-$190</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">[14:01:09] Trade synced</span>
                <span className="text-emerald-400">+$1,240</span>
              </div>
            </div>
          </TiltCard>

          {/* Discipline Score */}
          <TiltCard area="1 / 4 / 3 / 7" className="md:col-span-3 md:row-span-2">
            <h3 className="text-2xl md:text-3xl font-semibold tracking-tight">Discipline score</h3>
            <p className="mt-3 text-zinc-400 max-w-md">
              We grade every trade against your own rules — and surface the patterns that quietly cost you money.
            </p>
            <div className="mt-6 flex items-center gap-6">
              <div className="relative w-32 h-32">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <motion.circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="url(#g)" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray="263.9"
                    initial={{ strokeDashoffset: 263.9 }}
                    whileInView={{ strokeDashoffset: 263.9 * (1 - 0.92) }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.6, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="g" x1="0" x2="1">
                      <stop offset="0%" stopColor="#A78BFA" />
                      <stop offset="100%" stopColor="#F0ABFC" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="text-center">
                    <div className="text-3xl font-semibold tabular-nums">92</div>
                    <div className="text-[10px] uppercase tracking-widest text-zinc-500">/ 100</div>
                  </div>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Followed plan: 27/29</li>
                <li className="flex items-center gap-2"><span className="text-emerald-400">✓</span> Stop respected: 28/29</li>
                <li className="flex items-center gap-2"><span className="text-red-400">✕</span> Revenge trades: 2</li>
              </ul>
            </div>
          </TiltCard>

          {/* Calendar */}
          <TiltCard area="3 / 1 / 5 / 3" className="md:col-span-2 md:row-span-2">
            <h3 className="text-xl font-semibold tracking-tight">Performance calendar</h3>
            <p className="mt-2 text-zinc-400 text-sm">Every day a number. Patterns emerge fast.</p>
            <div className="mt-5 grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => {
                const v = Math.sin(i * 0.7) + Math.cos(i * 0.3);
                const intensity = Math.abs(v);
                const positive = v > 0;
                return (
                  <div
                    key={i}
                    className="aspect-square rounded"
                    style={{
                      background: positive
                        ? `rgba(16,185,129,${0.1 + intensity * 0.35})`
                        : `rgba(244,63,94,${0.1 + intensity * 0.3})`,
                    }}
                  />
                );
              })}
            </div>
          </TiltCard>

          {/* Strategies */}
          <TiltCard area="3 / 3 / 5 / 5" className="md:col-span-2 md:row-span-2">
            <h3 className="text-xl font-semibold tracking-tight">Strategy splits</h3>
            <p className="mt-2 text-zinc-400 text-sm">Tag each trade. See which setup actually pays.</p>
            <div className="mt-5 space-y-3">
              {[
                { name: "London Open", win: 74, color: "from-violet-500 to-fuchsia-500" },
                { name: "FVG Retrace", win: 61, color: "from-cyan-500 to-violet-500" },
                { name: "Liquidity Sweep", win: 52, color: "from-fuchsia-500 to-rose-500" },
              ].map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300">{s.name}</span>
                    <span className="text-zinc-500 tabular-nums">{s.win}% WR</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${s.win}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.4, delay: i * 0.15, ease: "easeOut" }}
                      className={`h-full bg-gradient-to-r ${s.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </TiltCard>

          {/* Screenshots */}
          <TiltCard area="3 / 5 / 5 / 7" className="md:col-span-2 md:row-span-2">
            <h3 className="text-xl font-semibold tracking-tight">Drop your chart</h3>
            <p className="mt-2 text-zinc-400 text-sm">Paste TradingView screenshots straight into each trade.</p>
            <div className="mt-5 relative aspect-[4/3] rounded-lg border border-dashed border-white/15 bg-black/40 grid place-items-center overflow-hidden">
              <div className="absolute inset-0 v2-grid opacity-50" />
              <div className="relative text-center">
                <div className="mx-auto w-10 h-10 rounded-full border border-white/15 grid place-items-center text-zinc-400 mb-2">⌘V</div>
                <div className="text-xs text-zinc-500">Paste image to attach</div>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>
    </section>
  );
}
