"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function FinalCtaR() {
  return (
    <section
      style={{
        position: "relative",
        padding: "140px 0 120px",
        backgroundColor: "#000",
        overflow: "hidden",
      }}
    >
      {/* Aurora background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(139,92,246,0.18) 0%, transparent 60%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%,-50%)",
          width: 600,
          height: 600,
          background:
            "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="mx-auto px-6"
        style={{ maxWidth: 900, position: "relative", textAlign: "center" }}
      >
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
          style={{
            fontSize: "clamp(40px, 7vw, 80px)",
            fontWeight: 600,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            color: "#F4F4F5",
            marginBottom: 24,
          }}
        >
          Start logging trades
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #C4B5FD 0%, #8B5CF6 50%, #6D28D9 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            the right way.
          </span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.15 }}
          style={{
            fontSize: 18,
            color: "#A1A1AA",
            maxWidth: 560,
            margin: "0 auto 44px",
            lineHeight: 1.55,
          }}
        >
          Free forever. No credit card. Set up your rules in under 5 minutes.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.25 }}
          style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
        >
          <Link
            href="/register"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "#F4F4F5",
              color: "#0a0a0a",
              padding: "16px 28px",
              borderRadius: 999,
              fontSize: 15.5,
              fontWeight: 500,
              textDecoration: "none",
              boxShadow: "0 12px 60px -10px rgba(255,255,255,0.4)",
            }}
            className="hover:scale-[1.02] transition-transform"
          >
            Start free forever <span style={{ opacity: 0.6 }}>→</span>
          </Link>
          <Link
            href="/founders"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "transparent",
              color: "#FBBF24",
              padding: "16px 28px",
              borderRadius: 999,
              fontSize: 15.5,
              fontWeight: 500,
              textDecoration: "none",
              border: "1px solid rgba(251,191,36,0.3)",
            }}
            className="hover:bg-yellow-500/10 transition-colors"
          >
            ✦ Founder Lifetime · $149
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
