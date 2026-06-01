"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const FEATURES = [
  "Unlimited trade journaling",
  "MT4 & MT5 auto-import",
  "Discipline score & analytics",
  "Performance calendar heatmap",
  "Strategy splits & tagging",
  "Screenshot attachments",
  "Weekly performance reports",
  "Multi-account support",
  "All future updates included",
];

export default function PricingV2() {
  return (
    <section id="pricing" className="py-24 md:py-32 relative overflow-hidden">
      {/* glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-to-br from-violet-500/15 via-fuchsia-500/10 to-transparent blur-3xl -z-10" />

      <div className="mx-auto max-w-7xl px-6 text-center mb-16">
        <p className="text-xs uppercase tracking-[0.25em] text-violet-400 mb-3">Pricing</p>
        <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05] max-w-3xl mx-auto">
          One plan. <span className="v2-aurora">Everything unlocked.</span>
        </h2>
        <p className="mt-5 text-zinc-400 max-w-xl mx-auto">
          Founder access pricing — locked in for life. No tiers, no upsells, no &ldquo;contact sales&rdquo;.
        </p>
      </div>

      <div className="mx-auto max-w-md px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="v2-border-glow rounded-3xl"
        >
          <div className="relative rounded-3xl bg-zinc-950/90 backdrop-blur p-8 md:p-10">
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">
                FOUNDER ACCESS
              </span>
              <span className="text-xs text-zinc-500">Free Basic plan included</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-semibold tracking-tight">$29</span>
              <span className="text-zinc-500">/ month</span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">Billed monthly · cancel anytime</div>

            <Link
              href="/register"
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white text-black px-6 py-3 font-medium hover:bg-zinc-200 transition-colors shadow-[0_8px_40px_-8px_rgba(255,255,255,0.5)] hover:shadow-[0_8px_60px_-8px_rgba(255,255,255,0.8)]"
            >
              Start Free
              <span>→</span>
            </Link>

            <div className="mt-8 v2-divider" />

            <ul className="mt-6 space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-zinc-300">
                  <span className="grid place-items-center w-5 h-5 rounded-full bg-violet-500/15 text-violet-300 text-[10px]">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
