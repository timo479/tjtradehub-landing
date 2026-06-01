"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function MetaSync() {
  return (
    <section style={{ padding: "120px 0", backgroundColor: "#000", position: "relative", overflow: "hidden" }}>
      {/* Subtle gradient backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(34,197,94,0.06) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />

      <div className="mx-auto px-6" style={{ maxWidth: 1100, position: "relative" }}>
        <div className="ms-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 64, alignItems: "center" }}>
          {/* Left: Live sync visualization */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
            style={{ position: "relative" }}
          >
            <SyncVisualization />
          </motion.div>

          {/* Right: Copy */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              style={{
                color: "#22c55e",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                fontWeight: 600,
                marginBottom: 14,
              }}
            >
              ● Live Integration
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.05 }}
              style={{
                fontSize: "clamp(32px, 3.8vw, 48px)",
                fontWeight: 600,
                letterSpacing: "-0.03em",
                lineHeight: 1.05,
                color: "#F4F4F5",
                marginBottom: 18,
              }}
            >
              Connect MT4/MT5 once.
              <br />
              <span style={{ color: "#71717a" }}>Forget about it.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1 }}
              style={{ color: "#A1A1AA", fontSize: 17, lineHeight: 1.55, marginBottom: 28, maxWidth: 440 }}
            >
              Trades sync automatically via MetaAPI — every fill, partial, slippage, and comment. No manual exports. No CSV juggling. No missed entries.
            </motion.p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
              {[
                "Works with 30+ brokers via MetaAPI Cloud",
                "Encrypted credentials, read-only access",
                "15-minute sync cadence, manual refresh anytime",
                "Multi-account: live, demo, prop firms separated",
              ].map((f, i) => (
                <motion.div
                  key={f}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.06 }}
                  style={{ display: "flex", alignItems: "center", gap: 10, color: "#D4D4D8", fontSize: 14.5 }}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3 3 7-7" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {f}
                </motion.div>
              ))}
            </div>

            <Link
              href="/register"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                color: "#F4F4F5",
                fontSize: 14.5,
                fontWeight: 500,
                textDecoration: "none",
                paddingBottom: 4,
                borderBottom: "1px solid rgba(255,255,255,0.3)",
              }}
              className="hover:border-white transition-colors"
            >
              Start free — upgrade when you need MT5 <span aria-hidden style={{ opacity: 0.6 }}>→</span>
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .ms-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </section>
  );
}

function SyncVisualization() {
  return (
    <div
      style={{
        position: "relative",
        borderRadius: 20,
        backgroundColor: "#0a0a0a",
        border: "1px solid rgba(255,255,255,0.06)",
        padding: 28,
        aspectRatio: "1 / 1",
        maxWidth: 460,
        marginInline: "auto",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <p style={{ color: "#71717a", fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase", fontWeight: 600 }}>
          Sync status
        </p>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#86efac", fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#22c55e", boxShadow: "0 0 8px #22c55e", animation: "pulse 1.6s infinite" }} />
          CONNECTED
        </span>
      </div>

      {/* Connection diagram */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, position: "relative" }}>
        {/* Broker side */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "linear-gradient(135deg, #1f2937, #0a0a0a)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
              boxShadow: "0 8px 24px -8px rgba(0,0,0,0.6)",
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 700, color: "#F4F4F5", fontFamily: "monospace" }}>MT5</span>
          </div>
          <p style={{ color: "#A1A1AA", fontSize: 11.5 }}>Your broker</p>
        </div>

        {/* Animated line */}
        <div style={{ flex: 1, position: "relative", height: 2, marginInline: 12 }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(255,255,255,0.06), rgba(255,255,255,0.06))", borderRadius: 1 }} />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute",
              left: 0,
              top: -3,
              width: "30%",
              height: 8,
              background: "linear-gradient(90deg, transparent, #8B5CF6, transparent)",
              borderRadius: 4,
              filter: "blur(1px)",
            }}
          />
        </div>

        {/* TJ side */}
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "linear-gradient(135deg, #6D28D9, #4C1D95)",
              border: "1px solid rgba(139,92,246,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
              boxShadow: "0 8px 24px -8px rgba(139,92,246,0.6)",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: "#F4F4F5", letterSpacing: "0.04em" }}>TJ</span>
          </div>
          <p style={{ color: "#A1A1AA", fontSize: 11.5 }}>TradeHub</p>
        </div>
      </div>

      {/* Recent syncs */}
      <p style={{ color: "#52525b", fontSize: 10.5, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10 }}>
        Recent activity
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {[
          { sym: "EUR/USD", t: "13:42", pnl: "+$84", color: "#22c55e" },
          { sym: "GBP/JPY", t: "12:18", pnl: "−$32", color: "#ef4444" },
          { sym: "XAU/USD", t: "11:05", pnl: "+$210", color: "#22c55e" },
        ].map((trade, i) => (
          <motion.div
            key={trade.sym}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 12px",
              borderRadius: 8,
              backgroundColor: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.04)",
              fontSize: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", backgroundColor: trade.color }} />
              <span style={{ color: "#D4D4D8", fontWeight: 600, fontFamily: "monospace" }}>{trade.sym}</span>
              <span style={{ color: "#52525b" }}>{trade.t}</span>
            </div>
            <span style={{ color: trade.color, fontFamily: "monospace", fontWeight: 600 }}>{trade.pnl}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
