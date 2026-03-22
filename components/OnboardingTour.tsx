"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { TourStep } from "./tourSteps";

interface Props {
  tour: "dashboard" | "journal" | "charts";
  steps: TourStep[];
  alreadyCompleted: boolean;
}

export default function OnboardingTour({ tour, steps, alreadyCompleted }: Props) {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({
    position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
  });
  const highlightedEl = useRef<HTMLElement | null>(null);

  // Show once per login session
  const storageKey = `tour_shown_${tour}`;
  useEffect(() => {
    if (alreadyCompleted) return;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, "1");
    const t = setTimeout(() => setActive(true), 700);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remove highlight from previous element
  const clearHighlight = useCallback(() => {
    const el = highlightedEl.current;
    if (!el) return;
    el.style.outline = "";
    el.style.outlineOffset = "";
    el.style.position = "";
    el.style.zIndex = "";
    el.style.borderRadius = "";
    highlightedEl.current = null;
  }, []);

  // Apply highlight + compute tooltip position
  const applyStep = useCallback((step: TourStep) => {
    clearHighlight();

    if (!step.target) {
      setTooltipStyle({ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" });
      return;
    }

    const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
    if (!el) {
      setTooltipStyle({ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" });
      return;
    }

    // Highlight directly on the element — guaranteed correct position
    el.style.position = "relative";
    el.style.zIndex = "10001";
    el.style.outline = "2px solid #8B5CF6";
    el.style.outlineOffset = "3px";
    highlightedEl.current = el;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const W = 360;
      const H = 270;
      const GAP = 14;
      const elementIsHuge = rect.height > winH * 0.5;
      const placement = step.placement ?? "bottom";

      if (elementIsHuge) {
        setTooltipStyle({ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" });
        return;
      }

      const left = Math.max(16, Math.min(rect.left + rect.width / 2 - W / 2, winW - W - 16));

      let top: number;
      if (placement === "bottom") {
        top = Math.min(rect.bottom + GAP, winH - H - 16);
      } else if (placement === "top") {
        top = rect.top - H - GAP;
        if (top < 16) top = Math.min(rect.bottom + GAP, winH - H - 16);
        top = Math.max(16, top);
      } else if (placement === "left") {
        top = Math.max(16, Math.min(rect.top + rect.height / 2 - H / 2, winH - H - 16));
        setTooltipStyle({ position: "fixed", top, left: Math.max(16, rect.left - W - GAP) });
        return;
      } else {
        top = Math.max(16, Math.min(rect.top + rect.height / 2 - H / 2, winH - H - 16));
        setTooltipStyle({ position: "fixed", top, left: Math.min(rect.right + GAP, winW - W - 16) });
        return;
      }

      setTooltipStyle({ position: "fixed", top, left });
    }, 500);
  }, [clearHighlight]);

  useEffect(() => {
    if (!active) return;
    applyStep(steps[currentStep]);
  }, [active, currentStep, steps, applyStep]);

  const saveDismiss = useCallback(async () => {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tour }),
      });
    } catch {}
  }, [tour]);

  const close = useCallback(async (save: boolean) => {
    clearHighlight();
    if (save) await saveDismiss();
    setActive(false);
    setCurrentStep(0);
    setDontShowAgain(false);
  }, [clearHighlight, saveDismiss]);

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

  return (
    <>
      {/* Dim overlay – no SVG mask needed, element pops via z-index */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 10000,
          backgroundColor: "rgba(0,0,0,0.72)",
          pointerEvents: "auto",
        }}
        onClick={() => close(dontShowAgain)}
      />

      {/* Tooltip card */}
      <div
        style={{
          ...tooltipStyle,
          zIndex: 10002,
          width: "360px",
          backgroundColor: "#0f1117",
          border: "1px solid #2d2f3e",
          borderRadius: "18px",
          boxShadow: "0 32px 64px rgba(0,0,0,0.8), 0 0 0 1px rgba(139,92,246,0.15)",
          overflow: "hidden",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Purple top accent bar */}
        <div style={{ height: "3px", background: "linear-gradient(90deg,#7C3AED,#A78BFA,#7C3AED)" }} />

        <div style={{ padding: "20px 22px 22px" }}>
          {/* Header row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Animated step dots */}
              <div style={{ display: "flex", gap: "5px" }}>
                {steps.map((_, i) => (
                  <div key={i} style={{
                    width: i === currentStep ? "18px" : "6px",
                    height: "6px", borderRadius: "3px",
                    backgroundColor: i <= currentStep ? "#8B5CF6" : "#1F2937",
                    transition: "width 0.25s, background-color 0.25s",
                  }} />
                ))}
              </div>
              <span style={{ color: "#6B7280", fontSize: "11px", fontWeight: 500 }}>
                {currentStep + 1} / {steps.length}
              </span>
            </div>
            <button
              onClick={() => close(dontShowAgain)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "26px", height: "26px", borderRadius: "8px",
                background: "rgba(255,255,255,0.05)", border: "1px solid #2d2f3e",
                color: "#6B7280", cursor: "pointer", fontSize: "14px", lineHeight: 1,
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLButtonElement).style.color = "#F9FAFB"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLButtonElement).style.color = "#6B7280"; }}
              aria-label="Close"
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

          {/* Bottom row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
            {/* Don't show again */}
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

            {/* Nav */}
            <div style={{ display: "flex", gap: "8px" }}>
              {currentStep > 0 && (
                <button
                  onClick={handleBack}
                  style={{
                    padding: "7px 15px", borderRadius: "8px",
                    border: "1px solid #2d2f3e", backgroundColor: "transparent",
                    color: "#9CA3AF", cursor: "pointer", fontSize: "13px", fontWeight: 500,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "#F9FAFB"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "#9CA3AF"; }}
                >
                  ← Back
                </button>
              )}
              <button
                onClick={handleNext}
                style={{
                  padding: "7px 18px", borderRadius: "8px", border: "none",
                  background: "linear-gradient(135deg,#7C3AED,#8B5CF6)",
                  color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "13px",
                  boxShadow: "0 4px 12px rgba(139,92,246,0.35)",
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
