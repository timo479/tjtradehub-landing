"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

const slides = [
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Performance overview — stats, equity curve, MT5 sync and more at a glance",
    image: "/screenshots/ss-dashboard-v2.png",
  },
  {
    id: "journal",
    label: "Trade Journal",
    description: "Log every trade with setup, emotions, rules checklist and screenshots",
    image: "/screenshots/ss-journal.png",
  },
  {
    id: "analytics",
    label: "Analytics",
    description: "Deep-dive statistics: equity curve, win rate, rule compliance, setup performance and more",
    image: "/screenshots/ss-stats.png",
    scrollable: true,
  },
  {
    id: "calculator",
    label: "Risk Calculator",
    description: "Calculate exact position size, risk amount and R:R ratio for any MT5 instrument",
    image: "/screenshots/ss-calculator.png",
  },
  {
    id: "drawdown",
    label: "Drawdown Tool",
    description: "Know exactly how much you need to recover from any drawdown — and how long it takes",
    image: "/screenshots/ss-drawdown.png",
  },
];

export default function ScreenshotCarousel() {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (index: number) => {
    if (index === active) return;
    setFading(true);
    setTimeout(() => {
      setActive(index);
      setFading(false);
    }, 180);
  };

  useEffect(() => {
    if (hovered) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setActive(prev => (prev + 1) % slides.length);
        setFading(false);
      }, 180);
    }, 4500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [hovered]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setLightbox(false); };
    if (lightbox) {
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [lightbox]);

  return (
    <>
      <section style={{ backgroundColor: "#050507", padding: "96px 0 112px" }}>
        <div style={{ maxWidth: "1080px", margin: "0 auto", padding: "0 24px" }}>

          {/* Section label */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <span style={{
              display: "inline-block",
              padding: "4px 14px", borderRadius: "20px",
              fontSize: "11px", fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase",
              backgroundColor: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.25)",
              color: "#A78BFA",
            }}>
              Product Tour
            </span>
          </div>

          {/* Heading */}
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <h2 style={{
              fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800,
              color: "#F9FAFB", lineHeight: 1.2, marginBottom: "14px",
            }}>
              See it in action
            </h2>
            <p style={{ color: "#6B7280", fontSize: "17px", maxWidth: "480px", margin: "0 auto", lineHeight: 1.6 }}>
              Everything you need to track, analyze, and improve your trading — in one place.
            </p>
          </div>

          {/* Tab switcher */}
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "32px" }}>
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                onClick={() => goTo(i)}
                style={{
                  padding: "8px 20px", borderRadius: "10px",
                  border: `1px solid ${active === i ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.06)"}`,
                  backgroundColor: active === i ? "rgba(139,92,246,0.12)" : "transparent",
                  color: active === i ? "#C4B5FD" : "#6B7280",
                  fontWeight: active === i ? 600 : 400,
                  fontSize: "14px", cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {slide.label}
              </button>
            ))}
          </div>

          {/* Browser mockup + screenshot */}
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 0 0 1px rgba(139,92,246,0.1), 0 40px 80px rgba(0,0,0,0.6), 0 0 120px rgba(139,92,246,0.08)",
            }}
          >
            {/* Browser chrome bar */}
            <div style={{
              backgroundColor: "#0f1117",
              padding: "12px 16px",
              display: "flex", alignItems: "center", gap: "12px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              {/* Traffic lights */}
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                {["#FF5F57", "#FFBD2E", "#28C840"].map(c => (
                  <div key={c} style={{ width: "11px", height: "11px", borderRadius: "50%", backgroundColor: c }} />
                ))}
              </div>
              {/* URL bar */}
              <div style={{
                flex: 1, maxWidth: "340px", margin: "0 auto",
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: "6px", padding: "5px 12px",
                display: "flex", alignItems: "center", gap: "7px",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" stroke="#4B5563" strokeWidth="1.5"/>
                  <path d="M12 2c-2.5 2.5-4 5.5-4 10s1.5 7.5 4 10M12 2c2.5 2.5 4 5.5 4 10s-1.5 7.5-4 10M2 12h20" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span style={{ color: "#6B7280", fontSize: "12px" }}>tjtradehub.com</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ marginLeft: "auto", flexShrink: 0 }}>
                  <path d="M12 2l3 6.3L22 9.3l-5 4.9 1.2 6.8L12 18l-6.2 3 1.2-6.8-5-4.9 7-1z" fill="#4B5563"/>
                </svg>
              </div>
              {/* Fullscreen button */}
              <button
                onClick={() => setLightbox(true)}
                title="View fullscreen"
                style={{
                  flexShrink: 0,
                  width: "28px", height: "28px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  color: "#6B7280",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(139,92,246,0.15)"; (e.currentTarget as HTMLButtonElement).style.color = "#A78BFA"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.3)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "#6B7280"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M8 3H5a2 2 0 00-2 2v3M16 3h3a2 2 0 012 2v3M8 21H5a2 2 0 01-2-2v-3M16 21h3a2 2 0 002-2v-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Screenshot */}
            <div style={{ position: "relative" }}>
              <div style={{
                maxHeight: "580px",
                overflowY: "auto",
                backgroundColor: "#050507",
                opacity: fading ? 0 : 1,
                transition: "opacity 0.18s ease",
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(139,92,246,0.4) transparent",
              }}>
                <Image
                  key={slides[active].id}
                  src={slides[active].image}
                  alt={slides[active].label}
                  width={1080}
                  height={1800}
                  sizes="(max-width: 768px) 100vw, 1080px"
                  unoptimized
                  style={{ width: "100%", height: "auto", display: "block" }}
                  priority={active === 0}
                />
              </div>
              {/* Fade out bottom – for tall/scrollable images */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                height: "100px", pointerEvents: "none",
                background: "linear-gradient(to bottom, transparent, #050507)",
              }} />
            </div>
          </div>

          {/* Slide description + progress dots */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", marginTop: "28px" }}>
            <p style={{
              color: "#6B7280", fontSize: "14px",
              opacity: fading ? 0 : 1, transition: "opacity 0.18s ease",
            }}>
              {slides[active].description}
            </p>
            <div style={{ display: "flex", gap: "6px" }}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  style={{
                    width: active === i ? "24px" : "6px",
                    height: "6px", borderRadius: "3px",
                    backgroundColor: active === i ? "#8B5CF6" : "#1F2937",
                    border: "none", cursor: "pointer", padding: 0,
                    transition: "all 0.25s ease",
                  }}
                />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 9999,
            backgroundColor: "rgba(0,0,0,0.92)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: "relative",
              width: "min(1100px, calc(100vw - 80px))",
              maxHeight: "calc(100vh - 80px)",
              borderRadius: "16px",
              overflow: "hidden",
              border: "1px solid rgba(139,92,246,0.25)",
              boxShadow: "0 0 0 1px rgba(139,92,246,0.1), 0 40px 80px rgba(0,0,0,0.8)",
              display: "flex", flexDirection: "column",
            }}
          >
            {/* Lightbox chrome bar */}
            <div style={{
              backgroundColor: "#0f1117",
              padding: "12px 16px",
              display: "flex", alignItems: "center", gap: "12px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              flexShrink: 0,
            }}>
              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                {["#FF5F57", "#FFBD2E", "#28C840"].map(c => (
                  <div key={c} style={{ width: "11px", height: "11px", borderRadius: "50%", backgroundColor: c }} />
                ))}
              </div>
              <div style={{
                flex: 1, maxWidth: "340px", margin: "0 auto",
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: "6px", padding: "5px 12px",
                display: "flex", alignItems: "center", gap: "7px",
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M12 2a10 10 0 100 20A10 10 0 0012 2z" stroke="#4B5563" strokeWidth="1.5"/>
                  <path d="M12 2c-2.5 2.5-4 5.5-4 10s1.5 7.5 4 10M12 2c2.5 2.5 4 5.5 4 10s-1.5 7.5-4 10M2 12h20" stroke="#4B5563" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span style={{ color: "#6B7280", fontSize: "12px" }}>tjtradehub.com / {slides[active].label.toLowerCase()}</span>
              </div>
              {/* Close button */}
              <button
                onClick={() => setLightbox(false)}
                style={{
                  flexShrink: 0,
                  width: "28px", height: "28px",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  color: "#6B7280",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(239,68,68,0.15)"; (e.currentTarget as HTMLButtonElement).style.color = "#F87171"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(239,68,68,0.3)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "#6B7280"; (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Full image scrollable */}
            <div style={{
              overflowY: "auto",
              backgroundColor: "#050507",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(139,92,246,0.4) transparent",
            }}>
              <Image
                src={slides[active].image}
                alt={slides[active].label}
                width={1080}
                height={1800}
                sizes="100vw"
                unoptimized
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
