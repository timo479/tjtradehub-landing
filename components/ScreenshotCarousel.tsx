"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Slide = {
  id: string;
  label: string;
  path: string;
  description: string;
  image: string;
  scrollable?: boolean;
  icon: React.ReactNode;
};

const slides: Slide[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    description: "Performance overview — stats, equity curve, MT5 sync and more at a glance",
    image: "/screenshots/ss-dashboard-v2.png",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3" width="7" height="9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <rect x="14" y="3" width="7" height="5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <rect x="14" y="12" width="7" height="9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <rect x="3" y="16" width="7" height="5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: "journal",
    label: "Trade Journal",
    path: "/dashboard/journal",
    description: "Log every trade with setup, emotions, rules checklist and screenshots",
    image: "/screenshots/ss-journal.png",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M6 3h11a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M8 8h7M8 12h7M8 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "analytics",
    label: "Analytics",
    path: "/dashboard/statistics",
    description: "Deep-dive statistics: equity curve, win rate, rule compliance, setup performance and more",
    image: "/screenshots/ss-stats.png",
    scrollable: true,
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M4 19h16M7 16V9M12 16V5M17 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "calculator",
    label: "Risk Calculator",
    path: "/dashboard/calculator",
    description: "Calculate exact position size, risk amount and R:R ratio for any MT5 instrument",
    image: "/screenshots/ss-calculator.png",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="3" width="14" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M9 7h6M8 12h2M14 12h2M8 16h2M14 16h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: "drawdown",
    label: "Drawdown Tool",
    path: "/dashboard/drawdown",
    description: "Know exactly how much you need to recover from any drawdown — and how long it takes",
    image: "/screenshots/ss-drawdown.png",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M3 6l5 5 4-4 9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M21 16v4h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

export default function ScreenshotCarousel() {
  const [active, setActive] = useState(0);
  const [fading, setFading] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const zoomRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentSlide = slides[active];
  const isAnalytics = currentSlide.id === "analytics";

  const handleZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomRef.current) return;
    const rect = zoomRef.current.getBoundingClientRect();
    setZoomPos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

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
      <section id="journal" style={{ position: "relative", backgroundColor: "#050507", padding: "96px 0 112px", overflow: "hidden" }}>

        {/* Ambient glow */}
        <div
          aria-hidden
          className="brokers-glow"
          style={{
            position: "absolute",
            inset: "-200px 0",
            background: "radial-gradient(ellipse 900px 500px at 50% 30%, rgba(139,92,246,0.16) 0%, transparent 70%)",
            filter: "blur(40px)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Subtle grid pattern */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(139,92,246,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.05) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
            maskImage: "radial-gradient(ellipse 800px 400px at 50% 0%, #000 0%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(ellipse 800px 400px at 50% 0%, #000 0%, transparent 70%)",
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        <div style={{ position: "relative", maxWidth: "1080px", margin: "0 auto", padding: "0 24px", zIndex: 1 }}>

          {/* Section label */}
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "6px 14px", borderRadius: "20px",
              fontSize: "11px", fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase",
              backgroundColor: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.25)",
              color: "#A78BFA",
              backdropFilter: "blur(8px)",
            }}>
              <span className="mt5-pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#A78BFA", display: "inline-block" }} />
              Product Tour
            </span>
          </div>

          {/* Heading */}
          <div style={{ textAlign: "center", marginBottom: "52px" }}>
            <h2 style={{
              fontSize: "clamp(28px, 4vw, 46px)", fontWeight: 800,
              color: "#F9FAFB", lineHeight: 1.15, marginBottom: "16px",
              letterSpacing: "-0.02em",
            }}>
              See it{" "}
              <span style={{
                background: "linear-gradient(135deg, #C4B5FD 0%, #8B5CF6 50%, #A855F7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                in action
              </span>
            </h2>
            <p style={{ color: "#9CA3AF", fontSize: "17px", maxWidth: "520px", margin: "0 auto", lineHeight: 1.6 }}>
              Everything you need to track, analyze, and improve your trading — in one place.
            </p>
          </div>

          {/* Segmented tab pill */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "36px" }}>
            <div
              role="tablist"
              style={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: `repeat(${slides.length}, 1fr)`,
                gap: "2px",
                padding: "5px",
                borderRadius: "14px",
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(10px)",
              }}
              className="screenshot-tab-group"
            >
              {/* Sliding indicator */}
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  top: "5px",
                  bottom: "5px",
                  left: `calc(5px + ${active} * ((100% - 10px) / ${slides.length}))`,
                  width: `calc((100% - 10px) / ${slides.length})`,
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)",
                  boxShadow: "0 6px 20px rgba(139,92,246,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
                  transition: "left 0.32s cubic-bezier(0.22, 1, 0.36, 1)",
                  zIndex: 0,
                }}
              />
              {slides.map((slide, i) => (
                <button
                  key={slide.id}
                  role="tab"
                  aria-selected={active === i}
                  onClick={() => goTo(i)}
                  style={{
                    position: "relative",
                    zIndex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    padding: "10px 16px",
                    borderRadius: "10px",
                    border: "none",
                    background: "transparent",
                    color: active === i ? "#FFFFFF" : "#9CA3AF",
                    fontWeight: active === i ? 600 : 500,
                    fontSize: "13.5px",
                    cursor: "pointer",
                    transition: "color 0.2s",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ display: "inline-flex", color: active === i ? "#FFFFFF" : "#6B7280", transition: "color 0.2s" }}>
                    {slide.icon}
                  </span>
                  <span className="screenshot-tab-label">{slide.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Browser mockup + screenshot */}
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              position: "relative",
              borderRadius: "18px",
              overflow: "hidden",
              border: "1px solid rgba(139,92,246,0.18)",
              boxShadow: "0 0 0 1px rgba(139,92,246,0.1), 0 50px 100px rgba(0,0,0,0.65), 0 0 160px rgba(139,92,246,0.15)",
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
                flex: 1, maxWidth: "420px", margin: "0 auto",
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: "7px", padding: "6px 12px",
                display: "flex", alignItems: "center", gap: "8px",
                border: "1px solid rgba(255,255,255,0.04)",
              }}>
                {/* Lock icon */}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <rect x="5" y="11" width="14" height="9" rx="2" stroke="#6B7280" strokeWidth="2"/>
                  <path d="M8 11V7a4 4 0 018 0v4" stroke="#6B7280" strokeWidth="2"/>
                </svg>
                <span style={{ color: "#9CA3AF", fontSize: "12px", fontWeight: 500 }}>
                  tjtradehub.com
                </span>
                <span
                  key={currentSlide.id}
                  style={{
                    color: "#A78BFA",
                    fontSize: "12px",
                    fontWeight: 500,
                    opacity: fading ? 0 : 1,
                    transition: "opacity 0.18s",
                  }}
                >
                  {currentSlide.path}
                </span>
                {/* Live status */}
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "5px", flexShrink: 0 }}>
                  <span className="mt5-pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#22c55e", display: "inline-block" }} />
                  <span style={{ color: "#22c55e", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em" }}>LIVE</span>
                </div>
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
              <div
                ref={isAnalytics ? zoomRef : undefined}
                onMouseMove={isAnalytics ? handleZoomMove : undefined}
                onMouseEnter={isAnalytics ? () => setIsZooming(true) : undefined}
                onMouseLeave={isAnalytics ? () => { setIsZooming(false); setZoomPos({ x: 50, y: 50 }); } : undefined}
                data-lenis-prevent
                style={{
                  aspectRatio: "2885 / 1318",
                  maxHeight: "480px",
                  overflowY: isAnalytics ? "hidden" : "auto",
                  overflow: isAnalytics ? "hidden" : undefined,
                  backgroundColor: "#050507",
                  opacity: fading ? 0 : 1,
                  transition: "opacity 0.18s ease",
                  scrollbarWidth: "thin",
                  scrollbarColor: "rgba(139,92,246,0.4) transparent",
                  cursor: isAnalytics ? (isZooming ? "crosshair" : "zoom-in") : "default",
                }}
              >
                <Image
                  key={currentSlide.id}
                  src={currentSlide.image}
                  alt={currentSlide.label}
                  width={1080}
                  height={1800}
                  sizes="(max-width: 768px) 100vw, 1080px"
                  quality={100}
                  unoptimized
                  style={{
                    width: "100%",
                    height: "auto",
                    display: "block",
                    transform: isAnalytics && isZooming ? "scale(2.2)" : "scale(1)",
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transition: isZooming ? "transform 0.15s ease, transform-origin 0s" : "transform 0.3s ease",
                    willChange: "transform",
                  }}
                  priority={active === 0}
                />
              </div>
              {/* Zoom hint badge – only for analytics */}
              {isAnalytics && !isZooming && (
                <div style={{
                  position: "absolute", top: "14px", right: "14px",
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "5px 10px", borderRadius: "8px",
                  backgroundColor: "rgba(10,10,15,0.75)",
                  border: "1px solid rgba(139,92,246,0.3)",
                  backdropFilter: "blur(8px)",
                  pointerEvents: "none",
                  opacity: fading ? 0 : 1,
                  transition: "opacity 0.2s ease",
                }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <circle cx="11" cy="11" r="7" stroke="#A78BFA" strokeWidth="2"/>
                    <path d="M16.5 16.5L21 21" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M11 8v6M8 11h6" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  <span style={{ color: "#C4B5FD", fontSize: "11px", fontWeight: 600, letterSpacing: "0.03em" }}>
                    Hover to explore
                  </span>
                </div>
              )}
              {/* Fade out bottom – only for scrollable slides */}
              {currentSlide.scrollable && (
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  height: "100px", pointerEvents: "none",
                  background: "linear-gradient(to bottom, transparent, #050507)",
                }} />
              )}
            </div>
          </div>

          {/* Description */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: "10px", marginTop: "28px",
            opacity: fading ? 0 : 1, transition: "opacity 0.18s ease",
          }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: "22px", height: "22px",
              borderRadius: "50%",
              backgroundColor: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.25)",
              flexShrink: 0,
              color: "#A78BFA",
            }}>
              {currentSlide.icon}
            </span>
            <p style={{
              color: "#9CA3AF", fontSize: "14.5px", lineHeight: 1.6,
              textAlign: "center",
            }}>
              {currentSlide.description}
            </p>
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
                flex: 1, maxWidth: "420px", margin: "0 auto",
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: "6px", padding: "5px 12px",
                display: "flex", alignItems: "center", gap: "7px",
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <rect x="5" y="11" width="14" height="9" rx="2" stroke="#6B7280" strokeWidth="2"/>
                  <path d="M8 11V7a4 4 0 018 0v4" stroke="#6B7280" strokeWidth="2"/>
                </svg>
                <span style={{ color: "#9CA3AF", fontSize: "12px" }}>tjtradehub.com</span>
                <span style={{ color: "#A78BFA", fontSize: "12px" }}>{currentSlide.path}</span>
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
                src={currentSlide.image}
                alt={currentSlide.label}
                width={1080}
                height={1800}
                sizes="100vw"
                quality={100}
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
