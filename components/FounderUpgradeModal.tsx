"use client";

import { useEffect, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

type Stats = {
  soldCount: number;
  saleTotal: number;
  remainingForSale: number;
};

const DISMISS_KEY = "tj-founder-modal-dismissed-until";
const DISMISS_HOURS = 24;
const SHOW_AFTER_MS = 800;
const SESSION_FOUNDER_DONE = "tj-founder-done";
const SESSION_WELCOME_DONE = "tj-welcome-done";

function fireFounderDone() {
  try { sessionStorage.setItem(SESSION_FOUNDER_DONE, "1"); } catch { /* private mode */ }
  window.dispatchEvent(new Event("founderDone"));
}

export default function FounderUpgradeModal() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);

  const close = useCallback(() => {
    setClosing(true);
    try {
      const until = Date.now() + DISMISS_HOURS * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_KEY, String(until));
    } catch {
      /* private mode */
    }
    fireFounderDone();
    setTimeout(() => {
      setVisible(false);
      setClosing(false);
    }, 280);
  }, []);

  // Only fire on the main dashboard page
  useEffect(() => {
    if (pathname !== "/dashboard") return;

    // Already dismissed → skip modal, unblock tour
    try {
      const until = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (until && until > Date.now()) {
        fireFounderDone();
        return;
      }
    } catch {}

    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const startModal = () => {
      if (cancelled) return;
      timer = setTimeout(async () => {
        try {
          const res = await fetch("/api/founders/status", { cache: "no-store" });
          if (!res.ok) { if (!cancelled) fireFounderDone(); return; }
          const data: Stats = await res.json();
          if (cancelled) return;
          if (data.remainingForSale <= 0) { fireFounderDone(); return; }
          setStats(data);
          setVisible(true);
        } catch {
          if (!cancelled) fireFounderDone();
        }
      }, SHOW_AFTER_MS);
    };

    // Wait for welcome screen to finish first (or fire immediately if already done)
    try {
      if (sessionStorage.getItem(SESSION_WELCOME_DONE)) {
        startModal();
      } else {
        window.addEventListener("welcomeDone", startModal, { once: true });
      }
    } catch {
      startModal(); // sessionStorage unavailable — start directly
    }

    return () => {
      cancelled = true;
      window.removeEventListener("welcomeDone", startModal);
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

  // Lock body scroll + Escape key while open
  useEffect(() => {
    if (!visible) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [visible, close]);

  if (!visible || !stats) return null;

  const progress = (stats.soldCount / stats.saleTotal) * 100;

  return (
    <>
      <style>{`
        @keyframes fum-backdrop-in {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(14px); }
        }
        @keyframes fum-backdrop-out {
          from { opacity: 1; backdrop-filter: blur(14px); }
          to { opacity: 0; backdrop-filter: blur(0px); }
        }
        @keyframes fum-modal-in {
          0% { opacity: 0; transform: translateY(40px) scale(0.92); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fum-modal-out {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(20px) scale(0.96); }
        }
        @keyframes fum-gradient-flow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fum-cta-glow {
          0%, 100% {
            box-shadow:
              0 0 0 0 rgba(251,191,36,0.55),
              0 10px 40px rgba(251,191,36,0.35),
              inset 0 1px 0 rgba(255,255,255,0.4);
          }
          50% {
            box-shadow:
              0 0 0 14px rgba(251,191,36,0),
              0 14px 56px rgba(251,191,36,0.55),
              inset 0 1px 0 rgba(255,255,255,0.4);
          }
        }
        @keyframes fum-shimmer {
          0% { transform: translateX(-150%) skewX(-15deg); }
          100% { transform: translateX(700%) skewX(-15deg); }
        }
        @keyframes fum-progress-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes fum-float-pulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.6); }
        }
        @keyframes fum-number-pop {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); filter: brightness(1.2); }
        }
        @keyframes fum-border-glow {
          0%, 100% { box-shadow: 0 0 60px rgba(139,92,246,0.45), 0 0 120px rgba(251,191,36,0.18); }
          50% { box-shadow: 0 0 80px rgba(139,92,246,0.65), 0 0 160px rgba(251,191,36,0.28); }
        }
        .fum-cta:hover { transform: translateY(-2px) scale(1.02); }
        .fum-cta:hover .fum-cta-arrow { transform: translateX(8px); }
        .fum-cta:active { transform: translateY(0) scale(1); }
        .fum-later:hover { color: #C4B5FD !important; }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={close}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          backgroundColor: "rgba(8, 4, 20, 0.78)",
          backdropFilter: "blur(14px)",
          animation: `${closing ? "fum-backdrop-out" : "fum-backdrop-in"} 0.3s ease-out forwards`,
        }}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fum-title"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
          pointerEvents: "none",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 520,
            borderRadius: 28,
            overflow: "hidden",
            background:
              "linear-gradient(140deg, #0F0420 0%, #1E0B3F 25%, #2D1B4E 50%, #1E0B3F 75%, #0F0420 100%)",
            backgroundSize: "220% 220%",
            animation:
              `fum-gradient-flow 14s ease infinite, ${closing ? "fum-modal-out" : "fum-modal-in"} 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards, fum-border-glow 4s ease-in-out infinite`,
            border: "1px solid rgba(167,139,250,0.4)",
            pointerEvents: "auto",
          }}
        >
          {/* Shimmer streak across top */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "14%",
              height: 90,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)",
              animation: "fum-shimmer 7s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />

          {/* Floating sparkles */}
          {[
            { top: "12%", left: "8%", size: 4, color: "#FBBF24", glow: "#FBBF24", delay: 0 },
            { top: "20%", left: "88%", size: 3, color: "#C4B5FD", glow: "#C4B5FD", delay: 1.2 },
            { top: "55%", left: "92%", size: 2, color: "#F9FAFB", glow: "rgba(255,255,255,0.8)", delay: 2.4 },
            { top: "78%", left: "10%", size: 3, color: "#A78BFA", glow: "#A78BFA", delay: 0.8 },
            { top: "42%", left: "5%", size: 2, color: "#FCD34D", glow: "#FCD34D", delay: 1.8 },
            { top: "88%", left: "78%", size: 2, color: "#A78BFA", glow: "#A78BFA", delay: 3 },
          ].map((s, i) => (
            <div
              key={i}
              aria-hidden
              style={{
                position: "absolute",
                top: s.top,
                left: s.left,
                width: s.size,
                height: s.size,
                borderRadius: "50%",
                backgroundColor: s.color,
                boxShadow: `0 0 ${s.size * 3}px ${s.glow}`,
                animation: `fum-float-pulse ${3.4 + (i % 3) * 0.6}s ease-in-out infinite ${s.delay}s`,
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Close button */}
          <button
            onClick={close}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 16,
              right: 16,
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.6)",
              fontSize: 16,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s, color 0.2s, transform 0.2s",
              zIndex: 3,
              backdropFilter: "blur(8px)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)";
              e.currentTarget.style.color = "rgba(255,255,255,0.9)";
              e.currentTarget.style.transform = "rotate(90deg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "rgba(255,255,255,0.6)";
              e.currentTarget.style.transform = "rotate(0deg)";
            }}
          >
            ✕
          </button>

          {/* Content */}
          <div style={{ position: "relative", padding: "48px 36px 36px", zIndex: 2 }}>
            {/* Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "7px 14px",
                borderRadius: 999,
                background:
                  "linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(251,191,36,0.06) 100%)",
                border: "1px solid rgba(251,191,36,0.5)",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#FCD34D",
                backdropFilter: "blur(6px)",
                marginBottom: 22,
              }}
            >
              <span style={{ fontSize: 12 }}>✦</span>
              Exclusive Founder Offer
            </div>

            {/* Headline */}
            <h2
              id="fum-title"
              style={{
                fontSize: 36,
                lineHeight: 1.08,
                fontWeight: 800,
                margin: "0 0 14px",
                letterSpacing: "-0.02em",
                color: "#F9FAFB",
              }}
            >
              Become a{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #FCD34D 0%, #FBBF24 45%, #F59E0B 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Founder
              </span>
            </h2>

            {/* Subhead */}
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.55,
                color: "#C4B5FD",
                margin: "0 0 24px",
                fontWeight: 500,
              }}
            >
              Pay <span style={{ color: "#F9FAFB", fontWeight: 700 }}>$149 once</span>. Never pay again. Only 100 spots exist —{" "}
              <span style={{ color: "#FCD34D", fontWeight: 700 }}>ever</span>.
            </p>

            {/* Live counter */}
            <div
              style={{
                padding: "16px 18px",
                borderRadius: 16,
                background:
                  "linear-gradient(135deg, rgba(139,92,246,0.16) 0%, rgba(109,40,217,0.06) 100%)",
                border: "1px solid rgba(139,92,246,0.32)",
                marginBottom: 24,
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    color: "#A78BFA",
                    textTransform: "uppercase",
                  }}
                >
                  Spots claimed
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                  <span
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      lineHeight: 1,
                      background:
                        "linear-gradient(135deg, #FCD34D 0%, #FBBF24 50%, #F59E0B 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      fontVariantNumeric: "tabular-nums",
                      animation: "fum-number-pop 2.6s ease-in-out infinite",
                    }}
                  >
                    {stats.soldCount}
                  </span>
                  <span style={{ fontSize: 16, color: "#6B7280", fontWeight: 600 }}>
                    / {stats.saleTotal}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div
                style={{
                  position: "relative",
                  height: 8,
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
                    width: `${Math.max(3, progress)}%`,
                    background:
                      "linear-gradient(90deg, #6D28D9 0%, #8B5CF6 35%, #FBBF24 100%)",
                    borderRadius: 999,
                    transition: "width 0.6s ease",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
                    backgroundSize: "200% 100%",
                    animation: "fum-progress-shimmer 2.6s linear infinite",
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: "#9CA3AF",
                  marginTop: 10,
                  fontWeight: 500,
                }}
              >
                Only{" "}
                <span style={{ color: "#FCD34D", fontWeight: 800, fontSize: 13 }}>
                  {stats.remainingForSale}
                </span>{" "}
                Lifetime spots left
              </div>
            </div>

            {/* Benefits */}
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 28 }}>
              {[
                "Everything in Pro, forever",
                "Lock in $149 — never $29/mo again",
                "Exclusive Founder badge & number",
                "Lottery entry for one of 10 free spots",
              ].map((text) => (
                <div
                  key={text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    fontSize: 14,
                    color: "#E5E7EB",
                    fontWeight: 500,
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)",
                      color: "#1a0a2e",
                      fontSize: 11,
                      fontWeight: 900,
                      flexShrink: 0,
                      boxShadow: "0 2px 8px rgba(251,191,36,0.4)",
                    }}
                  >
                    ✓
                  </span>
                  {text}
                </div>
              ))}
            </div>

            {/* CTA */}
            <Link
              href="/founders"
              onClick={close}
              className="fum-cta"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                width: "100%",
                padding: "17px 24px",
                borderRadius: 999,
                background:
                  "linear-gradient(135deg, #FCD34D 0%, #FBBF24 50%, #F59E0B 100%)",
                color: "#1a0a2e",
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: "0.01em",
                textTransform: "uppercase",
                textDecoration: "none",
                animation: "fum-cta-glow 2.4s ease-in-out infinite",
                transition: "transform 0.18s",
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 18 }}>✦</span>
              Claim your Founder spot
              <span
                className="fum-cta-arrow"
                style={{ transition: "transform 0.25s", fontSize: 20 }}
              >
                →
              </span>
            </Link>

            {/* Later link */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={close}
                className="fum-later"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#9CA3AF",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                  transition: "color 0.2s",
                }}
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
