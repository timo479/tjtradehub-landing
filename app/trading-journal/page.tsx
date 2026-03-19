import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Trading Journal Software for Serious Traders",
  description:
    "TJ TradeHub is a trading journal built for system-based traders. Log trades, track performance, measure discipline, and improve your edge — all in one place.",
  alternates: {
    canonical: "https://www.tjtradehub.com/trading-journal",
  },
  openGraph: {
    title: "Trading Journal Software for Serious Traders | TJ TradeHub",
    description:
      "Log trades, track performance, and measure discipline. TJ TradeHub is a trading journal built for Forex and Futures traders.",
    url: "https://www.tjtradehub.com/trading-journal",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TJ TradeHub – Trading Journal",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web, Browser",
  url: "https://www.tjtradehub.com/trading-journal",
  description:
    "The best trading journal software for system-based Forex and Futures traders. Track every trade, measure discipline, and improve your performance.",
  offers: {
    "@type": "Offer",
    price: "29",
    priceCurrency: "USD",
  },
};

export default function TradingJournalPage() {
  return (
    <div style={{ backgroundColor: "#000000", minHeight: "100vh" }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto px-6 py-16" style={{ maxWidth: "860px" }}>
        <Link href="/" style={{ color: "#8B5CF6", fontSize: "14px", textDecoration: "none" }}>
          ← Back to Home
        </Link>

        {/* H1 */}
        <h1
          className="text-4xl font-bold mt-8 mb-4"
          style={{ color: "#F9FAFB", lineHeight: "1.2" }}
        >
          The Trading Journal Software for Serious Traders
        </h1>
        <p style={{ color: "#9CA3AF", fontSize: "18px", lineHeight: "1.7", marginBottom: "48px" }}>
          Stop guessing why you lose trades. A structured trading journal gives you the data to understand your edge, identify patterns, and systematically improve your performance.
        </p>

        <div className="flex flex-col gap-12" style={{ color: "#9CA3AF", lineHeight: "1.8" }}>

          {/* H2: Why You Need a Trading Journal */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Why Every Trader Needs a Trading Journal
            </h2>
            <p>
              Professional traders across Forex, Futures, and equity markets share one habit: they keep a detailed trading journal. Without one, you are trading on gut feeling rather than data. A trading journal forces accountability, reveals hidden patterns, and transforms losses into lessons.
            </p>
            <p className="mt-4">
              TJ TradeHub is built as a trading journal software specifically for system-based traders — those who follow rules, manage risk precisely, and want measurable progress over time.
            </p>

            {/* H3 */}
            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Track More Than Just P&L
            </h3>
            <p>
              Most trading journals only track profit and loss. TJ TradeHub goes deeper — logging execution quality, rule adherence, and a proprietary Discipline Score for every trade. This turns your journal from a record into a genuine performance tracker.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Identify What Is Actually Working
            </h3>
            <p>
              With consistent journaling, patterns emerge: which setups perform, which sessions drain your account, and which emotional states lead to mistakes. The best trading journal is one you actually use — and TJ TradeHub makes the process fast and frictionless.
            </p>
          </section>

          {/* H2: Key Features */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Key Features of TJ TradeHub Trading Journal
            </h2>
            <p>
              TJ TradeHub is not a generic spreadsheet. It is a dedicated trading journal software with professional-grade analytics built for active traders.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Performance Analytics Dashboard
            </h3>
            <p>
              Visualize your trading performance with win rate, profit factor, average R-multiple, and monthly P&L charts. The analytics dashboard gives you a complete picture of your trading edge at a glance.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Discipline Score Tracking
            </h3>
            <p>
              Every trade entry includes a Discipline Score — your self-assessment of how well you followed your system. Over time, this metric reveals whether execution quality correlates with profitability. Great trading journal software measures the process, not just the outcome.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              MT5 & MT4 Trade Import
            </h3>
            <p>
              Connect your MetaTrader 5 or MetaTrader 4 account to automatically sync your trades. No manual entry required — your trading journal updates in real time as you trade.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Trade Calendar View
            </h3>
            <p>
              The trade calendar visualizes your daily P&L across the month, making it easy to spot overtrading, identify best/worst trading days, and track consistency across weeks.
            </p>
          </section>

          {/* H2: Who It's For */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Who This Trading Journal Is Built For
            </h2>
            <p>
              TJ TradeHub is designed for traders who take their craft seriously — not casual market observers. If you follow a defined trading system and want to measure your adherence to it, this is the trading journal for you.
            </p>
            <ul className="mt-4 flex flex-col gap-2" style={{ paddingLeft: "20px", listStyleType: "disc" }}>
              <li>Forex traders tracking FX pairs and currency performance</li>
              <li>Futures traders managing position sizing and tick data</li>
              <li>MetaTrader users who want automated trade syncing</li>
              <li>System-based traders focused on process over outcomes</li>
            </ul>
          </section>

          {/* H2: CTA */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Start Your Trading Journal Today
            </h2>
            <p>
              TJ TradeHub offers a 7-day free trial with full access to all trading journal features. No credit card required. Start logging trades, measuring discipline, and building the data foundation for consistent performance.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold"
                style={{ backgroundColor: "#8B5CF6", color: "#F9FAFB", borderRadius: "14px" }}
              >
                Start Free Trial – No Credit Card Required
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium"
                style={{ color: "#9CA3AF", border: "1px solid #374151", borderRadius: "14px" }}
              >
                Learn More About TJ TradeHub
              </Link>
            </div>
          </section>

          {/* Internal Links */}
          <section style={{ borderTop: "1px solid #1F2937", paddingTop: "32px" }}>
            <h2 style={{ color: "#F9FAFB", fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
              Explore More Trading Journal Resources
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/forex-trading-journal" style={{ color: "#8B5CF6", fontSize: "14px" }}>Forex Trading Journal →</Link>
              <Link href="/futures-trading-journal" style={{ color: "#8B5CF6", fontSize: "14px" }}>Futures Trading Journal →</Link>
              <Link href="/mt5-trading-journal" style={{ color: "#8B5CF6", fontSize: "14px" }}>MT5 Trading Journal →</Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
