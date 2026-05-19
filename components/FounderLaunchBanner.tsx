"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

const LAUNCH_DATE = new Date("2026-06-02T00:00:00+02:00").getTime();
const STORAGE_KEY = "tj-founder-banner-dismissed";

function format(ms: number) {
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  const seconds = Math.floor((ms % 60_000) / 1_000);
  return { days, hours, minutes, seconds };
}

const pad = (n: number) => n.toString().padStart(2, "0");

export default function FounderLaunchBanner() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY) === "1") return;
    setNow(Date.now());
    setVisible(true);
    const t = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(t);
  }, []);

  if (pathname?.startsWith("/dashboard")) return null;
  if (!visible) return null;

  const diff = LAUNCH_DATE - now;
  if (diff <= 0) return null;

  const { days, hours, minutes, seconds } = format(diff);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* private mode */
    }
    setVisible(false);
  };

  const digits = [
    { label: "DAYS", val: days },
    { label: "HRS", val: hours },
    { label: "MIN", val: minutes },
    { label: "SEC", val: seconds },
  ];

  return (
    <>
      <style>{`
        @keyframes tj-shimmer {
          0% { transform: translateX(-120%) skewX(-12deg); }
          100% { transform: translateX(800%) skewX(-12deg); }
        }
        @keyframes tj-float-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.4); }
        }
        @keyframes tj-cta-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.55), 0 4px 16px rgba(251,191,36,0.3); }
          50% { box-shadow: 0 0 0 8px rgba(251,191,36,0), 0 4px 24px rgba(251,191,36,0.45); }
        }
        @keyframes tj-gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes tj-flip {
          0% { transform: translateY(-100%); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .tj-banner-link:hover .tj-banner-arrow { transform: translateX(6px); }
        .tj-banner-link:hover .tj-digit-box {
          border-color: rgba(255,255,255,0.4);
          background-color: rgba(0,0,0,0.5);
        }
        .tj-digit-flip {
          display: inline-block;
          animation: tj-flip 0.4s ease-out;
        }
      `}</style>

      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 200,
          color: "#F9FAFB",
          overflow: "hidden",
          background:
            "linear-gradient(115deg, #0F0420 0%, #2D1B4E 22%, #6D28D9 50%, #2D1B4E 78%, #0F0420 100%)",
          backgroundSize: "250% 250%",
          animation: "tj-gradient-flow 16s ease infinite",
          borderBottom: "1px solid rgba(167,139,250,0.35)",
        }}
      >
        {/* Shimmer streak */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "12%",
            height: "100%",
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
            animation: "tj-shimmer 6s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        {/* Floating sparkle dots */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "20%",
            left: "6%",
            width: 4,
            height: 4,
            borderRadius: "50%",
            backgroundColor: "#FBBF24",
            boxShadow: "0 0 8px #FBBF24",
            animation: "tj-float-pulse 3.4s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: "25%",
            left: "82%",
            width: 3,
            height: 3,
            borderRadius: "50%",
            backgroundColor: "#C4B5FD",
            boxShadow: "0 0 6px #C4B5FD",
            animation: "tj-float-pulse 4.2s ease-in-out infinite 1s",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "55%",
            left: "45%",
            width: 2,
            height: 2,
            borderRadius: "50%",
            backgroundColor: "#F9FAFB",
            boxShadow: "0 0 5px rgba(255,255,255,0.8)",
            animation: "tj-float-pulse 5s ease-in-out infinite 2.2s",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: "30%",
            left: "30%",
            width: 2,
            height: 2,
            borderRadius: "50%",
            backgroundColor: "#A78BFA",
            boxShadow: "0 0 6px #A78BFA",
            animation: "tj-float-pulse 4.6s ease-in-out infinite 0.5s",
            pointerEvents: "none",
          }}
        />

        <Link
          href="/founders"
          className="tj-banner-link"
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            padding: "12px 56px 12px 24px",
            color: "inherit",
            textDecoration: "none",
            maxWidth: 1400,
            margin: "0 auto",
            flexWrap: "wrap",
            zIndex: 1,
          }}
        >
          {/* Badge + tagline */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 11px",
                borderRadius: 999,
                background:
                  "linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(251,191,36,0.06) 100%)",
                border: "1px solid rgba(251,191,36,0.5)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "#FCD34D",
                backdropFilter: "blur(6px)",
              }}
            >
              <span style={{ fontSize: 11 }}>✦</span> Founder Launch
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "0.005em" }}>
              <span
                style={{
                  background: "linear-gradient(90deg, #FCD34D 0%, #FBBF24 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 800,
                }}
              >
                100
              </span>{" "}
              Lifetime spots ·{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #FCD34D 0%, #FBBF24 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 800,
                }}
              >
                10 FREE
              </span>{" "}
              to win
            </span>
          </div>

          {/* Countdown */}
          <div style={{ display: "flex", gap: 6 }}>
            {digits.map(({ label, val }) => (
              <div
                key={label}
                className="tj-digit-box"
                style={{
                  minWidth: 46,
                  padding: "5px 8px 4px",
                  borderRadius: 10,
                  backgroundColor: "rgba(0,0,0,0.4)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  textAlign: "center",
                  backdropFilter: "blur(6px)",
                  transition: "border-color 0.25s, background-color 0.25s",
                }}
              >
                <div
                  key={val} /* re-mount each tick → flip animation */
                  className="tj-digit-flip"
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    color: "#F9FAFB",
                    lineHeight: 1.05,
                    fontFeatureSettings: '"tnum"',
                  }}
                >
                  {pad(val)}
                </div>
                <div
                  style={{
                    fontSize: 8,
                    color: "#A78BFA",
                    letterSpacing: "0.12em",
                    marginTop: 3,
                    fontWeight: 700,
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 18px",
              borderRadius: 999,
              background: "linear-gradient(135deg, #FCD34D 0%, #FBBF24 50%, #F59E0B 100%)",
              color: "#1a0a2e",
              fontSize: 13,
              fontWeight: 800,
              letterSpacing: "0.01em",
              animation: "tj-cta-glow 2.4s ease-in-out infinite",
              cursor: "pointer",
              textTransform: "uppercase",
            }}
          >
            Claim or win
            <span className="tj-banner-arrow" style={{ transition: "transform 0.25s", fontSize: 15 }}>
              →
            </span>
          </span>

          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            style={{
              position: "absolute",
              right: 14,
              top: "50%",
              transform: "translateY(-50%)",
              background: "transparent",
              border: "none",
              color: "rgba(255,255,255,0.55)",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
              padding: 6,
              zIndex: 2,
            }}
          >
            ✕
          </button>
        </Link>
      </div>
    </>
  );
}
