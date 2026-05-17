"use client";

const ROW_A = [
  "MetaTrader 5", "MetaTrader 4", "IC Markets", "Pepperstone", "OANDA",
  "FTMO", "Topstep", "Tradovate", "NinjaTrader", "Forex.com",
];
const ROW_B = [
  "FundedNext", "The5ers", "True Forex Funds", "Earn2Trade", "Apex Trader Funding",
  "ATAS", "AMP Futures", "TradeStation", "Eightcap", "MyForexFunds",
];

function Row({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  return (
    <div className="relative overflow-hidden marquee-mask">
      <div className={`flex w-max gap-12 ${reverse ? "marquee-track-rev" : "marquee-track"}`}>
        {[...items, ...items].map((name, i) => (
          <div
            key={i}
            className="flex items-center gap-2 whitespace-nowrap transition-colors duration-200"
            style={{ color: "#6B7280" }}
          >
            <span
              className="w-2 h-2 rounded-sm"
              style={{
                background: "linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%)",
                opacity: 0.55,
              }}
            />
            <span className="text-lg font-medium tracking-tight">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LogoMarquee() {
  return (
    <section
      className="py-14 md:py-16"
      style={{
        backgroundColor: "#000000",
        borderTop: "1px solid rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: "1200px" }}>
        <p
          className="text-center mb-10 text-xs font-medium uppercase"
          style={{ color: "#6B7280", letterSpacing: "0.25em" }}
        >
          Built for traders on every prop firm &amp; broker
        </p>
        <div className="space-y-6">
          <Row items={ROW_A} />
          <Row items={ROW_B} reverse />
        </div>
      </div>
    </section>
  );
}
