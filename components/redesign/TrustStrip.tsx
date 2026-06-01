"use client";

const BROKERS = [
  "IC Markets", "Pepperstone", "FTMO", "Apex", "TopStep", "FundedNext",
  "OANDA", "Vantage", "Tickmill", "Exness", "Forex.com", "MyForexFunds",
];

export default function TrustStrip() {
  return (
    <section
      style={{
        borderTop: "1px solid rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        padding: "32px 0",
        background: "linear-gradient(180deg, #000 0%, #0a0a0a 100%)",
      }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: 1200 }}>
        <p
          style={{
            color: "#52525b",
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: 22,
            fontWeight: 500,
          }}
        >
          Works with the brokers you already trade with
        </p>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            maskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
            WebkitMaskImage: "linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 56,
              animation: "marquee 38s linear infinite",
              width: "max-content",
            }}
          >
            {[...BROKERS, ...BROKERS].map((b, i) => (
              <span
                key={i}
                style={{
                  color: "#71717a",
                  fontSize: 18,
                  fontWeight: 500,
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
