"use client";

const message =
  "TJ TradeHub is currently in Early Access — built by active traders, for active traders. Your feedback directly shapes the product.";

const items = Array(8).fill(message);

export default function EarlyAccessBanner() {
  return (
    <div
      style={{
        backgroundColor: "#000000",
        borderTop: "1px solid #1a1a2e",
        borderBottom: "1px solid #1a1a2e",
        overflow: "hidden",
        position: "relative",
        padding: "14px 0",
      }}
    >
      {/* Left fade */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: "120px",
          background: "linear-gradient(to right, #000000, transparent)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />
      {/* Right fade */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "120px",
          background: "linear-gradient(to left, #000000, transparent)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          width: "max-content",
          animation: "marquee 40s linear infinite",
        }}
      >
        {items.map((text, i) => (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "20px",
              paddingRight: "48px",
              whiteSpace: "nowrap",
              fontSize: "13px",
              color: "#6B7280",
              letterSpacing: "0.02em",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "5px",
                height: "5px",
                borderRadius: "50%",
                backgroundColor: "#7C3AED",
                flexShrink: 0,
                boxShadow: "0 0 6px #7C3AED",
              }}
            />
            <span>
              <span style={{ color: "#8B5CF6", fontWeight: 600 }}>Early Access</span>
              {"  —  "}
              {text.replace("TJ TradeHub is currently in Early Access — ", "")}
            </span>
          </span>
        ))}
      </div>

      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
