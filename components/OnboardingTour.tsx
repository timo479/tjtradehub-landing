"use client";
import { useCallback, useEffect, useState } from "react";
import { TourStep } from "./tourSteps";

interface Props {
  tour: "dashboard" | "journal";
  steps: TourStep[];
  alreadyCompleted: boolean;
}

export default function OnboardingTour({ tour, steps, alreadyCompleted }: Props) {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Show on every page load – only DB flag prevents it
  useEffect(() => {
    if (alreadyCompleted) return;
    const timer = setTimeout(() => setActive(true), 700);
    return () => clearTimeout(timer);
  }, [alreadyCompleted]);

  const updateRect = useCallback((step: TourStep) => {
    if (!step.target) { setTargetRect(null); return; }
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) { setTargetRect(null); return; }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setTargetRect(el.getBoundingClientRect()), 350);
  }, []);

  useEffect(() => {
    if (!active) return;
    updateRect(steps[currentStep]);
  }, [active, currentStep, steps, updateRect]);

  const saveDismiss = useCallback(async () => {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tour }),
      });
    } catch {}
  }, [tour]);

  const close = useCallback(async (saveFlag: boolean) => {
    if (saveFlag) await saveDismiss();
    setActive(false);
  }, [saveDismiss]);

  // X button: close + save if checkbox is ticked
  const handleDismiss = () => close(dontShowAgain);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      close(dontShowAgain);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  if (!active) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const PADDING = 14;
  const TOOLTIP_W = 360;
  const TOOLTIP_H = 270; // including "don't show again"

  const winW = typeof window !== "undefined" ? window.innerWidth : 1440;
  const winH = typeof window !== "undefined" ? window.innerHeight : 900;
  const elementIsHuge = targetRect !== null && targetRect.height > winH * 0.5;

  // ── Tooltip position ────────────────────────────────────────────────────────
  let tooltipStyle: React.CSSProperties = {};
  if (!step.target || !targetRect || elementIsHuge) {
    tooltipStyle = { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  } else {
    const placement = step.placement ?? "bottom";
    const cx = targetRect.left + targetRect.width / 2;
    const left = Math.max(16, Math.min(cx - TOOLTIP_W / 2, winW - TOOLTIP_W - 16));

    if (placement === "bottom") {
      const top = Math.min(targetRect.bottom + PADDING, winH - TOOLTIP_H - 16);
      tooltipStyle = { position: "fixed", top, left };
    } else if (placement === "top") {
      let top = targetRect.top - TOOLTIP_H - PADDING;
      if (top < 16) top = Math.min(targetRect.bottom + PADDING, winH - TOOLTIP_H - 16);
      tooltipStyle = { position: "fixed", top: Math.max(16, top), left };
    } else if (placement === "left") {
      tooltipStyle = {
        position: "fixed",
        top: Math.max(16, Math.min(targetRect.top + targetRect.height / 2 - TOOLTIP_H / 2, winH - TOOLTIP_H - 16)),
        left: Math.max(16, targetRect.left - TOOLTIP_W - PADDING),
      };
    } else {
      tooltipStyle = {
        position: "fixed",
        top: Math.max(16, Math.min(targetRect.top + targetRect.height / 2 - TOOLTIP_H / 2, winH - TOOLTIP_H - 16)),
        left: Math.min(targetRect.right + PADDING, winW - TOOLTIP_W - 16),
      };
    }
  }

  return (
    <>
      {/* ── Overlay ──────────────────────────────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 10000, pointerEvents: "none" }}>
        <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id={`tour-mask-${tour}`}>
              <rect width="100%" height="100%" fill="white" />
              {targetRect && !elementIsHuge && (
                <rect
                  x={targetRect.x - PADDING} y={targetRect.y - PADDING}
                  width={targetRect.width + PADDING * 2} height={targetRect.height + PADDING * 2}
                  rx="12" fill="black"
                />
              )}
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask={`url(#tour-mask-${tour})`} />
          {targetRect && !elementIsHuge && (
            <rect
              x={targetRect.x - PADDING} y={targetRect.y - PADDING}
              width={targetRect.width + PADDING * 2} height={targetRect.height + PADDING * 2}
              rx="12" fill="none" stroke="#8B5CF6" strokeWidth="2"
            />
          )}
        </svg>
      </div>

      {/* ── Tooltip card ─────────────────────────────────────────────────────── */}
      <div
        style={{
          ...tooltipStyle,
          zIndex: 10001,
          width: `${TOOLTIP_W}px`,
          backgroundColor: "#0f1117",
          border: "1px solid #2d2f3e",
          borderRadius: "18px",
          boxShadow: "0 32px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(139,92,246,0.15)",
          overflow: "hidden",
        }}
      >
        {/* Purple top accent bar */}
        <div style={{ height: "3px", background: "linear-gradient(90deg, #7C3AED, #A78BFA, #7C3AED)" }} />

        <div style={{ padding: "20px 22px 22px" }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Step dots */}
              <div style={{ display: "flex", gap: "5px" }}>
                {steps.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === currentStep ? "18px" : "6px",
                      height: "6px",
                      borderRadius: "3px",
                      backgroundColor: i <= currentStep ? "#8B5CF6" : "#1F2937",
                      transition: "width 0.25s, background-color 0.25s",
                    }}
                  />
                ))}
              </div>
              <span style={{ color: "#6B7280", fontSize: "11px", fontWeight: 500 }}>
                {currentStep + 1} / {steps.length}
              </span>
            </div>
            <button
              onClick={handleDismiss}
              title="Close"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "26px", height: "26px", borderRadius: "8px",
                background: "rgba(255,255,255,0.05)", border: "1px solid #2d2f3e",
                color: "#6B7280", cursor: "pointer", fontSize: "16px", lineHeight: 1,
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#F9FAFB"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "#6B7280"; }}
              aria-label="Close tour"
            >
              ✕
            </button>
          </div>

          {/* Title */}
          <h3 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "16px", marginBottom: "7px", lineHeight: 1.3 }}>
            {step.title}
          </h3>

          {/* Description */}
          <p style={{ color: "#9CA3AF", fontSize: "13.5px", lineHeight: 1.65, marginBottom: "18px" }}>
            {step.description}
          </p>

          {/* Divider */}
          <div style={{ height: "1px", backgroundColor: "#1F2937", marginBottom: "16px" }} />

          {/* Bottom row: Don't show again + navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            {/* Don't show again – always visible */}
            <label style={{ display: "flex", alignItems: "center", gap: "7px", cursor: "pointer", flexShrink: 0 }}>
              <div
                onClick={() => setDontShowAgain(v => !v)}
                style={{
                  width: "16px", height: "16px", borderRadius: "4px", flexShrink: 0,
                  border: `1.5px solid ${dontShowAgain ? "#8B5CF6" : "#374151"}`,
                  backgroundColor: dontShowAgain ? "#8B5CF6" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                {dontShowAgain && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ color: "#6B7280", fontSize: "12px", userSelect: "none" }}>Don&apos;t show again</span>
            </label>

            {/* Nav buttons */}
            <div style={{ display: "flex", gap: "8px" }}>
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  style={{
                    padding: "7px 15px", borderRadius: "8px",
                    border: "1px solid #2d2f3e", backgroundColor: "transparent",
                    color: "#9CA3AF", cursor: "pointer", fontSize: "13px", fontWeight: 500,
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "#F9FAFB"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}
                >
                  ← Back
                </button>
              )}
              <button
                onClick={handleNext}
                style={{
                  padding: "7px 18px", borderRadius: "8px",
                  border: "none",
                  background: "linear-gradient(135deg, #7C3AED, #8B5CF6)",
                  color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "13px",
                  boxShadow: "0 4px 12px rgba(139,92,246,0.35)",
                  transition: "opacity 0.15s, box-shadow 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.9"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
              >
                {isLast ? "Finish ✓" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
