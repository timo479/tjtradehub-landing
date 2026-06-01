"use client";

import { motion } from "framer-motion";

const FAQS = [
  {
    q: "Is the journal really free forever?",
    a: "Yes. Basic gives you unlimited trade logging, statistics, calendar, and custom fields — free, no credit card. You only pay if you want automatic MT4/MT5 sync via Pro ($29/mo) or Founder Lifetime ($149 one-time).",
  },
  {
    q: "Does it support both MT4 and MT5?",
    a: "Both, fully. Connect once, every trade syncs automatically — fills, comments, slippage, partial closes. No manual exports.",
  },
  {
    q: "What makes this different from other journals?",
    a: "Other journals log what happened. TJ TradeHub tracks whether it should have happened — against the rules you define. Discipline Score, rule violations, setup-specific stats. Your system, measured.",
  },
  {
    q: "Can I use it for prop firm challenges?",
    a: "Yes — FTMO, Apex, TopStep, FundedNext and others. Multi-account support lets you split journals per challenge / live / demo.",
  },
  {
    q: "Where is my data stored?",
    a: "Encrypted at rest in Supabase (EU region). Broker credentials are encrypted with per-user keys — we cannot trade on your behalf, only read your history.",
  },
];

export default function FaqR() {
  return (
    <section id="faq" style={{ padding: "120px 0", backgroundColor: "#000" }}>
      <div className="mx-auto px-6" style={{ maxWidth: 760 }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <p
            style={{
              color: "#71717a",
              fontSize: 11,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: 12,
              fontWeight: 600,
            }}
          >
            FAQ
          </p>
          <h2
            style={{
              fontSize: 44,
              fontWeight: 600,
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
              color: "#F4F4F5",
            }}
          >
            Questions, answered.
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FAQS.map((f, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
              style={{
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.06)",
                backgroundColor: "#0a0a0a",
                overflow: "hidden",
              }}
              className="group"
            >
              <summary
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "20px 24px",
                  cursor: "pointer",
                  listStyle: "none",
                  color: "#E4E4E7",
                  fontSize: 15.5,
                  fontWeight: 500,
                }}
              >
                <span>{f.q}</span>
                <span
                  style={{ color: "#52525b", fontSize: 12, marginLeft: 16 }}
                  className="group-open:rotate-180 transition-transform"
                >
                  ▾
                </span>
              </summary>
              <div
                style={{
                  padding: "0 24px 22px",
                  color: "#A1A1AA",
                  fontSize: 14.5,
                  lineHeight: 1.65,
                }}
              >
                {f.a}
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}
