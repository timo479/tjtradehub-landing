"use client";

import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

function Counter({
  value, prefix = "", suffix = "", decimals = 0,
}: { value: number; prefix?: string; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { duration: 2200, bounce: 0 });
  const display = useTransform(spring, (n) =>
    `${prefix}${n.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
  );

  useEffect(() => { if (inView) mv.set(value); }, [inView, mv, value]);
  useEffect(() => {
    const unsub = display.on("change", (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return () => unsub();
  }, [display]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
}

const STATS = [
  { value: 1248391, prefix: "$", suffix: "", decimals: 0, label: "Tracked trade volume", sub: "logged this month" },
  { value: 94, suffix: "%", decimals: 0, label: "Edge-improvement", sub: "after 90 days of journaling" },
  { value: 28430, suffix: "+", decimals: 0, label: "Trades synced", sub: "from MT4 / MT5" },
  { value: 4.9, suffix: "/5", decimals: 1, label: "Avg. user rating", sub: "across reviews" },
];

export default function StatsCounter() {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="mx-auto max-w-7xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="text-center text-3xl md:text-5xl font-semibold tracking-tight mb-4"
        >
          Numbers that <span className="v2-aurora">compound</span>.
        </motion.h2>
        <p className="text-center text-zinc-400 max-w-xl mx-auto mb-16">
          Every trade you log is one more data point against bad habits — here&apos;s what the system runs on.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.06] rounded-2xl overflow-hidden border border-white/[0.06]">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="relative bg-black p-6 md:p-8 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/0 via-violet-500/0 to-fuchsia-500/0 group-hover:from-violet-500/[0.08] group-hover:to-fuchsia-500/[0.08] transition-colors duration-500" />
              <div className="relative">
                <div className="text-4xl md:text-5xl font-semibold tracking-tight tabular-nums">
                  <Counter value={s.value} prefix={s.prefix} suffix={s.suffix} decimals={s.decimals} />
                </div>
                <div className="mt-3 text-sm font-medium text-zinc-200">{s.label}</div>
                <div className="text-xs text-zinc-500">{s.sub}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
