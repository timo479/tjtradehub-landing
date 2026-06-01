"use client";

import { motion } from "framer-motion";

const FAQS = [
  {
    q: "Does it support both MT4 and MT5?",
    a: "Yes — both fully supported. Connect once and every trade syncs automatically: fills, comments, slippage, partial closes. No manual exports.",
  },
  {
    q: "Is the journal really free forever?",
    a: "Yes — the Basic plan gives you unlimited trade logging, statistics, calendar and custom fields, free forever. No credit card required. You only pay ($29/month or $149 one-time for Founder Lifetime) if you want automatic MT4/MT5 sync and advanced analytics.",
  },
  {
    q: "Can I journal trades without connecting a broker?",
    a: "Absolutely. Manual entry is fully supported on the free Basic plan. Broker sync is the upgrade — not a requirement.",
  },
  {
    q: "Is this for prop firm challenges?",
    a: "Yes — many users run FTMO, Apex, Topstep, FundedNext etc. Multi-account support lets you split journals per challenge / live / demo.",
  },
  {
    q: "Where is my data stored?",
    a: "Encrypted at rest in Supabase (EU region). Credentials for broker accounts are encrypted with per-user keys — we cannot trade on your behalf.",
  },
  {
    q: "Can I cancel anytime?",
    a: "One click in /billing. Stripe handles the subscription. Your journal data stays read-only after cancellation in case you come back.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center mb-14">
          <p className="text-xs uppercase tracking-[0.25em] text-violet-400 mb-3">FAQ</p>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">Questions, answered.</h2>
        </div>
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="group rounded-2xl border border-white/[0.08] bg-zinc-950/40 backdrop-blur overflow-hidden hover:border-white/15 transition-colors"
            >
              <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none">
                <span className="font-medium text-zinc-100">{f.q}</span>
                <span className="v2-chev text-zinc-500">▾</span>
              </summary>
              <div className="px-6 pb-5 text-zinc-400 text-[15px] leading-relaxed">
                {f.a}
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}
