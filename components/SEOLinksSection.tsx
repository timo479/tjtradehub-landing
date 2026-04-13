import Link from "next/link";

const pages = [
  {
    title: "What Is a Trading Journal?",
    description:
      "A trading journal is the most effective tool to improve your trading. Learn what it is, why every serious trader needs one, and how to structure yours for maximum insight.",
    href: "/what-is-a-trading-journal",
    anchor: "Learn what a trading journal is",
  },
  {
    title: "Forex Trading Journal",
    description:
      "Track every forex trade with precision. Capture entry, exit, strategy, and execution quality — so you can identify exactly what's working and what's costing you pips.",
    href: "/forex-trading-journal",
    anchor: "Explore the Forex Trading Journal",
  },
  {
    title: "MT5 Trading Journal",
    description:
      "Connect your MetaTrader 5 account and import trades automatically. Sync your execution data in real time so you never miss a trade or lose track of your performance.",
    href: "/mt5-trading-journal",
    anchor: "See the MT5 Trading Journal",
  },
  {
    title: "Trading Performance Tracking",
    description:
      "Go beyond win rate. Track your P&L, drawdown, risk-reward ratio, and discipline score — and get a complete picture of your trading edge over time.",
    href: "/trading-performance-tracking",
    anchor: "View trading performance tracking",
  },
];

export default function SEOLinksSection() {
  return (
    <section
      style={{
        backgroundColor: "#000000",
        borderTop: "1px solid #1F2937",
      }}
    >
      <div className="mx-auto px-6 py-16" style={{ maxWidth: "1200px" }}>
        <h2
          className="text-2xl font-bold mb-3"
          style={{ color: "#FFFFFF" }}
        >
          Everything You Need to Journal and Improve Your Trading
        </h2>
        <p
          className="mb-10 text-base"
          style={{ color: "#9CA3AF", maxWidth: "600px" }}
        >
          TJ TradeHub is built for traders who take their process seriously.
          Explore our tools and guides below.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {pages.map((page) => (
            <div
              key={page.href}
              style={{
                backgroundColor: "#0A0A0A",
                border: "1px solid #1F2937",
                borderRadius: "12px",
                padding: "24px",
              }}
            >
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "#FFFFFF" }}
              >
                {page.title}
              </h3>
              <p
                className="text-sm mb-4"
                style={{ color: "#9CA3AF", lineHeight: "1.6" }}
              >
                {page.description}
              </p>
              <Link
                href={page.href}
                className="text-sm font-medium"
                style={{ color: "#8B5CF6" }}
              >
                {page.anchor} →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
