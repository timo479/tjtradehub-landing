"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function FinalCTAV2() {
  return (
    <section className="relative overflow-hidden py-32 md:py-48">
      {/* big background word */}
      <div className="absolute inset-0 grid place-items-center -z-10 pointer-events-none select-none overflow-hidden">
        <div className="text-[18vw] md:text-[15vw] font-semibold tracking-tighter text-white/[0.025] leading-none">
          TRADEHUB
        </div>
      </div>
      {/* mesh */}
      <div className="absolute inset-0 -z-10">
        <div className="v2-mesh opacity-50" />
      </div>

      <div className="mx-auto max-w-4xl px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-7xl font-semibold tracking-tight leading-[1.0]"
        >
          Stop guessing.<br />
          <span className="v2-aurora">Start compounding.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
          className="mt-8 text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto"
        >
          The traders who win don&apos;t have better setups — they have better feedback loops.
          Start building yours today. Free forever.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link
            href="/register"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-white text-black px-7 py-3.5 font-medium shadow-[0_10px_60px_-10px_rgba(255,255,255,0.6)] hover:shadow-[0_10px_80px_-10px_rgba(255,255,255,0.9)] transition-shadow"
          >
            Start Free Forever
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.02] backdrop-blur px-7 py-3.5 text-zinc-200 hover:bg-white/[0.06] hover:border-white/25 transition-colors"
          >
            I already have an account
          </Link>
        </motion.div>
        <p className="mt-6 text-xs text-zinc-500">No credit card · MT4/MT5 sync from $29/mo</p>
      </div>
    </section>
  );
}
