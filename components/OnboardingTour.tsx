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
  const storageKey = `tour_shown_${tour}`;

  useEffect(() => {
    if (alreadyCompleted) return;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, "1");
    const timer = setTimeout(() => setActive(true), 600);
    return () => clearTimeout(timer);
  }, [alreadyCompleted, storageKey]);

  const updateRect = useCallback((step: TourStep) => {
    if (!step.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      setTargetRect(null);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      setTargetRect(el.getBoundingClientRect());
    }, 300);
  }, []);

  useEffect(() => {
    if (!active) return;
    updateRect(steps[currentStep]);
  }, [active, currentStep, steps, updateRect]);

  const finish = useCallback(async (showAgain: boolean) => {
    if (!showAgain) {
      try {
        await fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tour }),
        });
      } catch {}
    }
    setActive(false);
  }, [tour]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      finish(!dontShowAgain);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const handleSkip = () => finish(true);

  if (!active) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;
  const PADDING = 12;
  const TOOLTIP_W = 340;
  const TOOLTIP_H = 220;

  let tooltipStyle: React.CSSProperties = {};
  if (!step.target || !targetRect) {
    tooltipStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
    };
  } else {
    const placement = step.placement ?? "bottom";
    const winW = typeof window !== "undefined" ? window.innerWidth : 1440;
    const left = Math.max(16, Math.min(
      targetRect.left + targetRect.width / 2 - TOOLTIP_W / 2,
      winW - TOOLTIP_W - 16,
    ));
    if (placement === "bottom") {
      tooltipStyle = { position: "fixed", top: targetRect.bottom + PADDING, left };
    } else if (placement === "top") {
      tooltipStyle = { position: "fixed", top: targetRect.top - TOOLTIP_H - PADDING, left };
    } else if (placement === "left") {
      tooltipStyle = {
        position: "fixed",
        top: Math.max(16, targetRect.top + targetRect.height / 2 - TOOLTIP_H / 2),
        left: Math.max(16, targetRect.left - TOOLTIP_W - PADDING),
      };
    } else {
      tooltipStyle = {
        position: "fixed",
        top: Math.max(16, targetRect.top + targetRect.height / 2 - TOOLTIP_H / 2),
        left: targetRect.right + PADDING,
      };
    }
  }

  return (
    <>
      {/* Dimmed overlay with spotlight cutout */}
      <div style={{ position: "fixed", inset: 0, zIndex: 10000, pointerEvents: "none" }}>
        <svg
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0 }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <mask id={`tour-mask-${tour}`}>
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.x - PADDING}
                  y={targetRect.y - PADDING}
                  width={targetRect.width + PADDING * 2}
                  height={targetRect.height + PADDING * 2}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.72)"
            mask={`url(#tour-mask-${tour})`}
          />
          {targetRect && (
            <rect
              x={targetRect.x - PADDING}
              y={targetRect.y - PADDING}
              width={targetRect.width + PADDING * 2}
              height={targetRect.height + PADDING * 2}
              rx="12"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="2"
            />
          )}
        </svg>
      </div>

      {/* Tooltip */}
      <div
        style={{
          ...tooltipStyle,
          zIndex: 10001,
          width: `${TOOLTIP_W}px`,
          backgroundColor: "#111827",
          border: "1px solid #374151",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 24px 48px rgba(0,0,0,0.7)",
        }}
      >
        {/* Top row: step counter + skip */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <span style={{ color: "#A78BFA", fontSize: "12px", fontWeight: 600 }}>
            Step {currentStep + 1} of {steps.length}
          </span>
          <button
            onClick={handleSkip}
            style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "0 2px" }}
            aria-label="Skip tour"
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "16px" }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: "3px",
                borderRadius: "2px",
                backgroundColor: i <= currentStep ? "#8B5CF6" : "#1F2937",
                transition: "background-color 0.2s",
              }}
            />
          ))}
        </div>

        {/* Title */}
        <h3 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "16px", marginBottom: "8px" }}>
          {step.title}
        </h3>

        {/* Description */}
        <p style={{ color: "#9CA3AF", fontSize: "14px", lineHeight: 1.6, marginBottom: "16px" }}>
          {step.description}
        </p>

        {/* Don't show again – last step only */}
        {isLast && (
          <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={e => setDontShowAgain(e.target.checked)}
              style={{ accentColor: "#8B5CF6", width: "15px", height: "15px" }}
            />
            <span style={{ color: "#9CA3AF", fontSize: "13px" }}>Don&apos;t show again</span>
          </label>
        )}

        {/* Navigation buttons */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              style={{
                padding: "8px 16px", borderRadius: "8px",
                border: "1px solid #374151", backgroundColor: "transparent",
                color: "#9CA3AF", cursor: "pointer", fontSize: "14px",
              }}
            >
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            style={{
              padding: "8px 20px", borderRadius: "8px",
              border: "none", backgroundColor: "#8B5CF6",
              color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px",
            }}
          >
            {isLast ? "Finish" : "Next →"}
          </button>
        </div>
      </div>
    </>
  );
}
