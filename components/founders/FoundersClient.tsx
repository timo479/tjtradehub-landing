"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Stats = {
  soldCount: number;
  saleTotal: number;
  remainingForSale: number;
  lastClaimedAt: string | null;
};

function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.floor(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export default function FoundersClient({ initialStats }: { initialStats: Stats }) {
  const [stats, setStats] = useState<Stats>(initialStats);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch("/api/founders/status", { cache: "no-store" });
        if (res.ok) setStats(await res.json());
      } catch {
        /* ignore */
      }
    };
    const t = setInterval(poll, 10_000);
    return () => clearInterval(t);
  }, []);

  const handleClaim = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/founder-checkout", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Could not start checkout");
        setLoading(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }, []);

  const progress = (stats.soldCount / stats.saleTotal) * 100;
  const soldOut = stats.remainingForSale <= 0;

  return (
    <>
      <style>{`
        @keyframes fnd-cta-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.55), 0 8px 32px rgba(251,191,36,0.35); }
          50% { box-shadow: 0 0 0 12px rgba(251,191,36,0), 0 12px 48px rgba(251,191,36,0.55); }
        }
        @keyframes fnd-shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fnd-pulse-dot {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.6); }
        }
        @keyframes fnd-progress {
          from { width: 0%; }
        }
        .fnd-cta:hover .fnd-cta-arrow { transform: translateX(8px); }
        .fnd-cta:hover { transform: translateY(-2px); }
        .fnd-cta:active { transform: translateY(0); }
      `}</style>

      {/* Live status row */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 16px",
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(8px)",
          marginBottom: 24,
        }}
      >
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: "#22c55e",
            boxShadow: "0 0 8px #22c55e",
            animation: "fnd-pulse-dot 2s ease-in-out infinite",
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.04em" }}>
          LIVE NOW
        </span>
      </div>

      {/* Counter card */}
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto 32px",
          padding: 28,
          borderRadius: 24,
          background:
            "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(109,40,217,0.06) 50%, rgba(0,0,0,0) 100%)",
          border: "1px solid rgba(139,92,246,0.35)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#A78BFA", textTransform: "uppercase", marginBottom: 6 }}>
              Founder Spots Claimed
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  fontSize: 52,
                  fontWeight: 800,
                  lineHeight: 1,
                  background: "linear-gradient(135deg, #FCD34D 0%, #FBBF24 50%, #F59E0B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {stats.soldCount}
              </span>
              <span style={{ fontSize: 24, color: "#6B7280", fontWeight: 600 }}>/ {stats.saleTotal}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#F9FAFB", lineHeight: 1 }}>
              {stats.remainingForSale}
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", color: "#9CA3AF", textTransform: "uppercase", marginTop: 4 }}>
              spots left
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            position: "relative",
            height: 10,
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.06)",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: `${Math.max(2, progress)}%`,
              background:
                "linear-gradient(90deg, #6D28D9 0%, #8B5CF6 35%, #FBBF24 100%)",
              borderRadius: 999,
              transition: "width 0.6s ease",
              animation: "fnd-progress 1s ease-out",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
              backgroundSize: "200% 100%",
              animation: "fnd-shimmer 3s linear infinite",
            }}
          />
        </div>

        {stats.lastClaimedAt && (
          <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 12, fontWeight: 500 }}>
            Last claimed {relativeTime(stats.lastClaimedAt)}
          </div>
        )}
      </div>

      {/* CTA */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 12 }}>
        <button
          onClick={handleClaim}
          disabled={loading || soldOut}
          className="fnd-cta"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            padding: "16px 32px",
            borderRadius: 999,
            border: "none",
            background:
              soldOut
                ? "rgba(255,255,255,0.1)"
                : "linear-gradient(135deg, #FCD34D 0%, #FBBF24 50%, #F59E0B 100%)",
            color: soldOut ? "#6B7280" : "#1a0a2e",
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: "0.01em",
            cursor: loading || soldOut ? "not-allowed" : "pointer",
            animation: soldOut ? "none" : "fnd-cta-glow 2.4s ease-in-out infinite",
            transition: "transform 0.18s",
            textTransform: "uppercase",
            opacity: loading ? 0.6 : 1,
          }}
        >
          <span style={{ fontSize: 18 }}>✦</span>
          {soldOut ? "Sold out" : loading ? "Opening checkout…" : "Claim your Founder spot"}
          {!soldOut && (
            <span className="fnd-cta-arrow" style={{ transition: "transform 0.25s", fontSize: 20 }}>
              →
            </span>
          )}
        </button>
        {!soldOut && (
          <div style={{ fontSize: 14, color: "#9CA3AF" }}>
            <span style={{ color: "#F9FAFB", fontWeight: 700 }}>$149</span> once · Lifetime access · No recurring
          </div>
        )}
        {error && (
          <div style={{ fontSize: 13, color: "#F87171", marginTop: 4 }}>{error}</div>
        )}

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            marginTop: 18,
            padding: "10px 18px",
            borderRadius: 999,
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 13,
          }}
        >
          <span style={{ color: "#9CA3AF" }}>Don&apos;t want to buy?</span>
          <Link
            href="/register?ref=giveaway"
            style={{
              color: "#A78BFA",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            Enter free via giveaway →
          </Link>
        </div>
      </div>
    </>
  );
}
