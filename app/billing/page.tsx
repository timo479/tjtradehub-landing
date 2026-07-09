"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const included = [
  { label: "Performance Insights", sub: "Your real edges & costly leaks — in numbers" },
  { label: "MT4 & MT5 auto-sync", sub: "Every trade imports itself, live" },
  { label: "Full statistics suite", sub: "Every widget & analytic unlocked" },
  { label: "Unlimited trading journals", sub: "One per strategy, no limits" },
  { label: "Full economic calendar", sub: "News, times & impact — unblurred" },
  { label: "Discipline & emotion analytics", sub: "See what your mindset costs you" },
];

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpgrade = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error || "Failed to start checkout");
        setLoading(false);
        return;
      }

      // TikTok: InitiateCheckout – only fire after confirmed checkout session creation
      if (typeof window !== "undefined" && (window as any).ttq) {
        (window as any).ttq.track("InitiateCheckout", { value: 29, currency: "USD" });
      }

      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-5 py-16 overflow-hidden"
      style={{ backgroundColor: "#000" }}
    >
      {/* ─── Ambient background ─────────────────────────────────────────── */}
      <div className="bp-bg" aria-hidden>
        <div className="bp-aurora bp-aurora-1" />
        <div className="bp-aurora bp-aurora-2" />
        <div className="bp-aurora bp-aurora-gold" />
        <div className="bp-grid" />
        {/* floating glow dots */}
        <span className="bp-dot" style={{ left: "12%", top: "22%", animationDelay: "0s" }} />
        <span className="bp-dot" style={{ left: "84%", top: "30%", animationDelay: "1.2s" }} />
        <span className="bp-dot" style={{ left: "22%", top: "72%", animationDelay: "2.1s" }} />
        <span className="bp-dot" style={{ left: "72%", top: "78%", animationDelay: "0.6s" }} />
        <span className="bp-dot bp-dot-gold" style={{ left: "50%", top: "14%", animationDelay: "1.7s" }} />
      </div>

      {/* ─── Logo ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 mb-9"
      >
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo-3d.png" alt="TJ TradeHub" width={34} height={34} className="bp-logo-float" />
          <span className="font-semibold text-lg" style={{ color: "#F9FAFB" }}>
            TJ TradeHub
          </span>
        </Link>
      </motion.div>

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08 }}
        className="relative z-10 text-center mb-9"
        style={{ maxWidth: "560px" }}
      >
        <div className="bp-badge">
          <span className="bp-badge-dot" />
          Upgrade to Pro
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.08] mb-4" style={{ color: "#F9FAFB", letterSpacing: "-0.02em" }}>
          Turn your journal into a{" "}
          <span className="bp-gradient-text">trading coach</span>
        </h1>
        <p className="text-lg" style={{ color: "#9CA3AF", lineHeight: 1.6 }}>
          Logging stays free forever. Pro reads <strong style={{ color: "#F9FAFB" }}>your</strong> trades
          and hands you the edges, leaks and analytics that actually move your P&amp;L.
        </p>
      </motion.div>

      {/* ─── Pricing Card ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 26, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
        className="bp-card-wrap relative z-10 w-full"
        style={{ maxWidth: "440px" }}
      >
        <div className="bp-card">
          <div className="flex items-center justify-between mb-6">
            <span className="font-semibold text-[15px]" style={{ color: "#F9FAFB" }}>
              Founder Access
            </span>
            <span className="bp-earlybird">
              ✦ Early Bird
            </span>
          </div>

          <div className="flex items-end gap-2 mb-1.5">
            <span className="text-6xl font-extrabold leading-none" style={{ color: "#F9FAFB", letterSpacing: "-0.03em" }}>
              $29
            </span>
            <span className="text-base mb-1.5" style={{ color: "#9CA3AF" }}>
              / month
            </span>
          </div>
          <p className="text-sm mb-7" style={{ color: "#9CA3AF" }}>
            Founder rate — locked in for as long as you stay subscribed.
          </p>

          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm mb-4"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#F87171",
              }}
            >
              {error}
            </div>
          )}

          <motion.button
            onClick={handleUpgrade}
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            className="bp-cta"
            style={{ cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.85 : 1 }}
          >
            {!loading && <span className="bp-cta-shimmer" aria-hidden />}
            <span className="relative">
              {loading ? "Redirecting to checkout…" : "Upgrade Now — $29/mo"}
            </span>
          </motion.button>

          <p className="text-xs text-center mt-4 mb-7 flex items-center justify-center gap-1.5" style={{ color: "#9CA3AF" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            Secure checkout via Stripe · Cancel anytime
          </p>

          <div className="w-full h-px mb-6" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />

          <ul className="flex flex-col gap-4">
            {included.map((item, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.32 + i * 0.07 }}
                className="flex items-start gap-3"
              >
                <span className="bp-check">
                  <svg width="11" height="11" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5L4 7.5L8 2.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="flex flex-col">
                  <span className="text-[14px] font-semibold" style={{ color: "#F9FAFB" }}>{item.label}</span>
                  <span className="text-[12.5px]" style={{ color: "#9CA3AF" }}>{item.sub}</span>
                </span>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>

      {/* ─── Lifetime + footer links ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.55 }}
        className="relative z-10 flex flex-col items-center"
      >
        <Link href="/founders" className="bp-lifetime mt-7">
          ✦ Looking for Lifetime? $149 one-time →
        </Link>

        <div className="flex items-center gap-4 mt-5">
          <Link href="/dashboard" className="text-sm transition-colors hover:text-gray-300" style={{ color: "#6B7280" }}>
            ← Back to Journal
          </Link>
          <span style={{ color: "#1F2937" }}>·</span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-sm transition-colors hover:text-gray-400"
            style={{ color: "#4B5563", background: "none", border: "none", cursor: "pointer" }}
          >
            Sign out
          </button>
        </div>
      </motion.div>

      {/* ─── Scoped styles / keyframes ──────────────────────────────────── */}
      <style>{`
        .bp-bg { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
        .bp-aurora { position: absolute; border-radius: 9999px; filter: blur(90px); opacity: 0.55; will-change: transform; }
        .bp-aurora-1 { width: 620px; height: 620px; top: -180px; left: -140px; background: radial-gradient(circle, rgba(139,92,246,0.55), transparent 70%); animation: bpAurora1 16s ease-in-out infinite; }
        .bp-aurora-2 { width: 560px; height: 560px; bottom: -200px; right: -120px; background: radial-gradient(circle, rgba(124,58,237,0.5), transparent 70%); animation: bpAurora2 19s ease-in-out infinite; }
        .bp-aurora-gold { width: 420px; height: 420px; top: 40%; left: 55%; background: radial-gradient(circle, rgba(251,191,36,0.16), transparent 70%); animation: bpAurora1 22s ease-in-out infinite reverse; }
        .bp-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px); background-size: 46px 46px; mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 100%); -webkit-mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, #000 40%, transparent 100%); }
        .bp-dot { position: absolute; width: 5px; height: 5px; border-radius: 9999px; background: #A78BFA; box-shadow: 0 0 12px 2px rgba(167,139,250,0.7); animation: bpFloat 6s ease-in-out infinite; }
        .bp-dot-gold { background: #FBBF24; box-shadow: 0 0 12px 2px rgba(251,191,36,0.7); }

        @keyframes bpAurora1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,30px) scale(1.12); } }
        @keyframes bpAurora2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-40px,-24px) scale(1.1); } }
        @keyframes bpFloat { 0%,100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(-16px); opacity: 1; } }

        .bp-logo-float { animation: bpFloat 5s ease-in-out infinite; }

        .bp-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; font-size: 12.5px; font-weight: 600; margin-bottom: 22px; border-radius: 9999px; color: #C4B5FD; background: rgba(139,92,246,0.12); border: 1px solid rgba(139,92,246,0.32); box-shadow: 0 0 24px rgba(139,92,246,0.18); }
        .bp-badge-dot { width: 7px; height: 7px; border-radius: 9999px; background: #A78BFA; box-shadow: 0 0 8px 1px rgba(167,139,250,0.9); animation: bpPulseDot 1.8s ease-in-out infinite; }
        @keyframes bpPulseDot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }

        .bp-gradient-text { background: linear-gradient(100deg, #A78BFA 0%, #C4B5FD 30%, #FBBF24 65%, #A78BFA 100%); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: bpGradientText 5s linear infinite; }
        @keyframes bpGradientText { to { background-position: 200% center; } }

        .bp-card-wrap { position: relative; border-radius: 25px; padding: 1.5px; background: linear-gradient(155deg, rgba(167,139,250,0.7) 0%, rgba(139,92,246,0.14) 42%, rgba(139,92,246,0.14) 70%, rgba(251,191,36,0.4) 100%); box-shadow: 0 30px 90px -26px rgba(139,92,246,0.5); animation: bpGlow 4.5s ease-in-out infinite; }
        @keyframes bpGlow { 0%,100% { box-shadow: 0 30px 90px -26px rgba(139,92,246,0.4); } 50% { box-shadow: 0 34px 110px -24px rgba(139,92,246,0.62); } }
        .bp-card { position: relative; border-radius: 23.5px; padding: 30px 28px; background: rgba(13,14,20,0.94); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); box-shadow: inset 0 1px 0 rgba(255,255,255,0.06); }

        .bp-earlybird { display: inline-flex; align-items: center; padding: 4px 11px; font-size: 11.5px; font-weight: 700; border-radius: 9999px; color: #FBBF24; background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.3); }

        .bp-cta { position: relative; overflow: hidden; display: block; width: 100%; text-align: center; padding: 16px 24px; font-weight: 700; font-size: 15.5px; color: #fff; border: none; border-radius: 16px; background: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%); box-shadow: 0 10px 30px rgba(139,92,246,0.45); animation: bpCtaPulse 2.6s ease-in-out infinite; }
        @keyframes bpCtaPulse { 0%,100% { box-shadow: 0 10px 30px rgba(139,92,246,0.4); } 50% { box-shadow: 0 12px 42px rgba(139,92,246,0.65); } }
        .bp-cta-shimmer { position: absolute; top: 0; left: -60%; width: 40%; height: 100%; background: linear-gradient(100deg, transparent, rgba(255,255,255,0.35), transparent); transform: skewX(-20deg); animation: bpShimmer 3.4s ease-in-out infinite; }
        @keyframes bpShimmer { 0% { left: -60%; } 55%,100% { left: 130%; } }

        .bp-check { flex-shrink: 0; width: 22px; height: 22px; margin-top: 1px; border-radius: 7px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #8B5CF6, #7C3AED); box-shadow: 0 2px 8px rgba(139,92,246,0.4); }

        .bp-lifetime { font-size: 14px; font-weight: 600; color: #FBBF24; transition: all 0.2s; text-shadow: 0 0 18px rgba(251,191,36,0.35); }
        .bp-lifetime:hover { color: #FCD34D; text-shadow: 0 0 26px rgba(251,191,36,0.55); }

        @media (prefers-reduced-motion: reduce) {
          .bp-aurora, .bp-dot, .bp-logo-float, .bp-badge-dot, .bp-gradient-text, .bp-card-wrap, .bp-cta, .bp-cta-shimmer { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
