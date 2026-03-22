"use client";
import { useCallback, useEffect, useState } from "react";

// TJTradeHub nav: py-5(20+20) + logo(36) + border(1) = 77px
const NAV_H = 77;

// Charts app uses position:sticky (all in normal flow):
// ticker-strip: top=0,  h=70
// .header:      top=70, h=56
// .symbol-bar:  top=126, padding=10+10, tabs(26)+gap(10)+chips(26) = 82+1border = 83
// .session-bar: top=209, padding=8+8, content~30 = 46
// .chart-grid:  top=255

interface Region { top: number; height: number }
interface Step { region: Region | null; title: string; description: string; }

const STEPS: Step[] = [
  {
    region: null,
    title: "Welcome to TJ Charts 📈",
    description: "Real-time charts for 65+ symbols across Forex, Indices, Crypto, Metals and Commodities — all powered by TradingView and built directly into your dashboard.",
  },
  {
    region: { top: NAV_H + 0, height: 70 },
    title: "Live Ticker Strip",
    description: "Real-time prices for S&P 500, NASDAQ, Gold, EUR/USD, BTC and more — always visible as you analyse the markets.",
  },
  {
    region: { top: NAV_H + 70, height: 56 },
    title: "Timeframes, Layout & Tools",
    description: "Switch between 1m and Weekly. Set 1, 2 or 3 chart columns. Change timezone, save watchlist presets, and open Calendar, Heatmap, News or Screener.",
  },
  {
    region: { top: NAV_H + 126, height: 83 },
    title: "65+ Symbols",
    description: "Choose from Indices, Forex, Metals, Crypto or Commodities. Add any custom TradingView ticker. Mark favourites for instant access.",
  },
  {
    region: { top: NAV_H + 209, height: 46 },
    title: "Trading Sessions",
    description: "Track Asia, London and New York live — open/closed status with countdown timers. Create your own custom sessions with individual colours.",
  },
  {
    region: { top: NAV_H + 255, height: 340 },
    title: "TradingView Charts",
    description: "Professional candlestick charts with the full TradingView toolset. Drag to reorder, double-click for fullscreen, add notes per chart.",
  },
];

export default function ChartsTourWrapper({ alreadyCompleted }: { alreadyCompleted: boolean }) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(false);

  const storageKey = "tour_shown_charts";

  useEffect(() => {
    const t = setTimeout(() => setActive(true), 700);
    return () => clearTimeout(t);
  }, []);

  const saveDismiss = useCallback(async () => {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tour: "charts" }),
      });
    } catch {}
  }, []);

  const close = useCallback(async (save: boolean) => {
    if (save) await saveDismiss();
    setActive(false);
    setStep(0);
    setDontShow(false);
  }, [saveDismiss]);

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else close(dontShow);
  };

  const handleBack = () => { if (step > 0) setStep(s => s - 1); };

  if (!active) return null;

  const current = STEPS[step];
  const region = current.region;
  const isLast = step === STEPS.length - 1;

  // Tooltip vertical position
  const tooltipTop = region
    ? (region.top + region.height + 14 > window.innerHeight - 260
        ? region.top - 260 - 14
        : region.top + region.height + 14)
    : undefined;

  return (
    <>
      {/* Overlay panels – leave the highlighted region visible */}
      {region ? (
        <>
          {/* Top dim */}
          <div onClick={() => close(dontShow)} style={{
            position: "fixed", top: 0, left: 0, right: 0,
            height: region.top,
            backgroundColor: "rgba(0,0,0,0.72)", zIndex: 10000,
          }} />
          {/* Bottom dim */}
          <div onClick={() => close(dontShow)} style={{
            position: "fixed", top: region.top + region.height, left: 0, right: 0, bottom: 0,
            backgroundColor: "rgba(0,0,0,0.72)", zIndex: 10000,
          }} />
          {/* Purple border on highlighted region */}
          <div style={{
            position: "fixed", top: region.top, left: 0, right: 0,
            height: region.height,
            border: "2px solid #8B5CF6",
            boxShadow: "0 0 20px rgba(139,92,246,0.4), 0 0 40px rgba(139,92,246,0.15), inset 0 0 20px rgba(139,92,246,0.05)",
            zIndex: 10001, pointerEvents: "none",
          }} />
        </>
      ) : (
        <div onClick={() => close(dontShow)} style={{
          position: "fixed", inset: 0,
          backgroundColor: "rgba(0,0,0,0.72)", zIndex: 10000,
        }} />
      )}

      {/* Tooltip card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "fixed",
          zIndex: 10002,
          width: "360px",
          ...(region
            ? { top: tooltipTop, left: "50%", transform: "translateX(-50%)" }
            : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" }),
          backgroundColor: "#0f1117",
          border: "1px solid #2d2f3e",
          borderRadius: "18px",
          boxShadow: "0 32px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(139,92,246,0.15)",
          overflow: "hidden",
        }}
      >
        {/* Purple top bar */}
        <div style={{ height: "3px", background: "linear-gradient(90deg,#7C3AED,#A78BFA,#7C3AED)" }} />

        <div style={{ padding: "20px 22px 22px" }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ display: "flex", gap: "5px" }}>
                {STEPS.map((_, i) => (
                  <div key={i} style={{
                    width: i === step ? "18px" : "6px",
                    height: "6px", borderRadius: "3px",
                    backgroundColor: i <= step ? "#8B5CF6" : "#1F2937",
                    transition: "width 0.25s, background-color 0.25s",
                  }} />
                ))}
              </div>
              <span style={{ color: "#6B7280", fontSize: "11px", fontWeight: 500 }}>
                {step + 1} / {STEPS.length}
              </span>
            </div>
            <button
              onClick={() => close(dontShow)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "26px", height: "26px", borderRadius: "8px",
                background: "rgba(255,255,255,0.05)", border: "1px solid #2d2f3e",
                color: "#6B7280", cursor: "pointer", fontSize: "14px",
              }}
            >✕</button>
          </div>

          <h3 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "16px", marginBottom: "7px", lineHeight: 1.3 }}>
            {current.title}
          </h3>
          <p style={{ color: "#9CA3AF", fontSize: "13.5px", lineHeight: 1.65, marginBottom: "18px" }}>
            {current.description}
          </p>

          <div style={{ height: "1px", backgroundColor: "#1F2937", marginBottom: "16px" }} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer" }}>
              <div
                onClick={() => setDontShow(v => !v)}
                style={{
                  width: "16px", height: "16px", borderRadius: "4px",
                  border: `1.5px solid ${dontShow ? "#8B5CF6" : "#374151"}`,
                  backgroundColor: dontShow ? "#8B5CF6" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
                }}
              >
                {dontShow && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ color: "#6B7280", fontSize: "12px", userSelect: "none" }}>Don&apos;t show again</span>
            </label>

            <div style={{ display: "flex", gap: "8px" }}>
              {step > 0 && (
                <button onClick={handleBack} style={{
                  padding: "7px 15px", borderRadius: "8px",
                  border: "1px solid #2d2f3e", backgroundColor: "transparent",
                  color: "#9CA3AF", cursor: "pointer", fontSize: "13px", fontWeight: 500,
                }}>← Back</button>
              )}
              <button onClick={handleNext} style={{
                padding: "7px 18px", borderRadius: "8px", border: "none",
                background: "linear-gradient(135deg,#7C3AED,#8B5CF6)",
                color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "13px",
                boxShadow: "0 4px 12px rgba(139,92,246,0.35)",
              }}>
                {isLast ? "Finish ✓" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
