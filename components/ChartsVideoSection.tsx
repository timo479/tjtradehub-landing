"use client";
import { useRef, useState } from "react";

const FEATURES = [
  "65+ Symbols",
  "Real-Time Prices",
  "Economic Calendar",
  "Market Heatmap",
  "News Feed",
  "Screener",
  "Trading Sessions",
  "TradingView Charts",
];

export default function ChartsVideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  return (
    <section
      className="py-16 md:py-[120px] relative overflow-hidden"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Subtle bg glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto px-6 relative z-10" style={{ maxWidth: "1200px" }}>

        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#8B5CF6" }}
          >
            TJ Charts
          </p>
          <h2
            className="text-3xl md:text-5xl font-bold leading-tight mb-5"
            style={{ color: "#F9FAFB" }}
          >
            Professional Charts.{" "}
            <span style={{ color: "#8B5CF6" }}>Built Into Your Dashboard.</span>
          </h2>
          <p
            className="text-lg leading-relaxed mx-auto"
            style={{ color: "#9CA3AF", maxWidth: "600px" }}
          >
            65+ symbols. Real-time TradingView charts. Economic calendar, market heatmap,
            live news and screener — everything a serious trader needs, in one place.
          </p>
        </div>

        {/* Video container */}
        <div className="relative mx-auto" style={{ maxWidth: "980px" }}>

          {/* Glow behind video */}
          <div
            className="absolute pointer-events-none"
            style={{
              inset: "-40px",
              background:
                "radial-gradient(ellipse at 50% 60%, rgba(139,92,246,0.22) 0%, transparent 65%)",
              filter: "blur(24px)",
            }}
          />

          {/* Card */}
          <div
            className="relative rounded-2xl overflow-hidden"
            style={{
              border: "1px solid rgba(139,92,246,0.35)",
              boxShadow:
                "0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(139,92,246,0.08)",
            }}
          >
            {/* Browser chrome bar */}
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{
                backgroundColor: "#0d0d14",
                borderBottom: "1px solid #1a1a2e",
              }}
            >
              <div className="flex gap-1.5 flex-shrink-0">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FF5F57" }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FFBD2E" }} />
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#28C840" }} />
              </div>
              <div
                className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md text-xs"
                style={{ backgroundColor: "#1a1a2e", color: "#6B7280" }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <circle cx="5" cy="5" r="4" stroke="#6B7280" strokeWidth="1" />
                  <path d="M5 2v3l2 1" stroke="#6B7280" strokeWidth="1" strokeLinecap="round" />
                </svg>
                tjtradehub.com/dashboard/charts
              </div>
            </div>

            {/* Video */}
            <div className="relative cursor-pointer group" onClick={toggle}>
              <video
                ref={videoRef}
                autoPlay
                muted
                loop
                playsInline
                style={{ width: "100%", display: "block" }}
              >
                <source src="/videos/charts-tour.mp4" type="video/mp4" />
              </video>

              {/* Play/pause overlay – shows on hover or when paused */}
              <div
                className="absolute inset-0 flex items-center justify-center transition-opacity duration-200"
                style={{
                  opacity: playing ? 0 : 1,
                  background: "rgba(0,0,0,0.45)",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "64px",
                    height: "64px",
                    backgroundColor: "rgba(139,92,246,0.9)",
                    boxShadow: "0 8px 32px rgba(139,92,246,0.5)",
                  }}
                >
                  {playing ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
                      <rect x="5" y="3" width="3" height="14" rx="1.5" />
                      <rect x="12" y="3" width="3" height="14" rx="1.5" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="white" style={{ marginLeft: "3px" }}>
                      <path d="M5 3l13 7-13 7V3z" />
                    </svg>
                  )}
                </div>
              </div>

              {/* Hover overlay */}
              <div
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ background: "rgba(0,0,0,0.2)" }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: "56px",
                    height: "56px",
                    backgroundColor: "rgba(139,92,246,0.85)",
                    boxShadow: "0 8px 32px rgba(139,92,246,0.4)",
                  }}
                >
                  {playing ? (
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="white">
                      <rect x="5" y="3" width="3" height="14" rx="1.5" />
                      <rect x="12" y="3" width="3" height="14" rx="1.5" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="white" style={{ marginLeft: "3px" }}>
                      <path d="M5 3l13 7-13 7V3z" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mt-10">
          {FEATURES.map((f) => (
            <span
              key={f}
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{
                backgroundColor: "rgba(139,92,246,0.08)",
                border: "1px solid rgba(139,92,246,0.18)",
                color: "#C4B5FD",
              }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: "#8B5CF6",
              color: "#F9FAFB",
              borderRadius: "14px",
              boxShadow: "0 8px 24px rgba(139,92,246,0.35)",
            }}
          >
            Start Free Trial – 7 Days
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <p className="text-sm mt-3" style={{ color: "#6B7280" }}>
            No credit card required
          </p>
        </div>

      </div>
    </section>
  );
}
