import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "MT5 Trading Journal – Auto-Sync MetaTrader 5 Trades",
  description:
    "TJ TradeHub is the MT5 trading journal that automatically syncs your MetaTrader 5 trades. Get full analytics, discipline tracking, and performance insights for MT5 traders.",
  alternates: {
    canonical: "https://www.tjtradehub.com/mt5-trading-journal",
  },
  openGraph: {
    title: "MT5 Trading Journal – Auto-Sync MetaTrader 5 Trades | TJ TradeHub",
    description:
      "The MT5 trading journal that automatically syncs your MetaTrader 5 trades. Full analytics, discipline tracking, and performance insights for MT5 traders.",
    url: "https://www.tjtradehub.com/mt5-trading-journal",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TJ TradeHub – MT5 Trading Journal",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web, Browser",
  url: "https://www.tjtradehub.com/mt5-trading-journal",
  description:
    "MT5 trading journal that auto-syncs MetaTrader 5 trades. Full analytics, discipline score, and performance tracking for MT5 traders.",
  offers: {
    "@type": "Offer",
    price: "29",
    priceCurrency: "USD",
  },
};

export default function MT5TradingJournalPage() {
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
          MT5 Trading Journal – Auto-Sync Your MetaTrader 5 Trades
        </h1>
        <p style={{ color: "#9CA3AF", fontSize: "18px", lineHeight: "1.7", marginBottom: "48px" }}>
          MetaTrader 5 is the platform of choice for millions of Forex and Futures traders. TJ TradeHub is the MT5 trading journal that connects directly to your account — automatically importing every trade so you can focus on analysis, not data entry.
        </p>

        <div className="flex flex-col gap-12" style={{ color: "#9CA3AF", lineHeight: "1.8" }}>

          {/* H2: Why MT5 needs a dedicated journal */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Why MT5 Traders Need a Dedicated Trading Journal
            </h2>
            <p>
              MetaTrader 5 provides execution and charting — but it does not give you the performance analytics a serious trader needs. The built-in trade history lacks depth: no discipline tracking, no session breakdowns, no R-multiple analysis, no visual performance calendar.
            </p>
            <p className="mt-4">
              TJ TradeHub fills this gap. As an MT5 trading journal, it connects to your MetaTrader 5 account and transforms raw trade data into structured performance insights — automatically, in real time.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Automatic Trade Import from MetaTrader 5
            </h3>
            <p>
              Forget manual trade entry. TJ TradeHub syncs your MT5 account via MetaAPI and pulls every trade — symbol, direction, lot size, entry, exit, and P&L — directly into your trading journal. Your MT5 trading history is always up to date.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Works with Any MT5 Broker
            </h3>
            <p>
              Whether you trade with a retail Forex broker, a prop firm, or a CFD provider — if they support MetaTrader 5, TJ TradeHub can connect to it. Your MT5 trading journal works regardless of which broker you use.
            </p>
          </section>

          {/* H2: Features for MT5 traders */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              MT5 Trading Journal Features
            </h2>
            <p>
              TJ TradeHub is more than a trade log. It is a complete MT5 trading analytics platform with features built specifically for system-based traders using MetaTrader 5.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Real-Time MT5 Trade Synchronization
            </h3>
            <p>
              Connect your MetaTrader 5 account once, and all trades sync automatically going forward. Closed positions, partial closes, and pending orders are all captured — giving you a complete MT5 trade history in your journal.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Performance Analytics for MT5 Traders
            </h3>
            <p>
              The analytics dashboard shows you win rate, profit factor, average R-multiple, drawdown metrics, and P&L charts across your MT5 trading history. Filter by instrument, direction, or time period to analyze exactly where your edge comes from.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Discipline Score on Every MT5 Trade
            </h3>
            <p>
              After each trade, rate your rule adherence with the Discipline Score. Over time, this reveals whether your losses come from bad setups or poor execution — a critical distinction for any serious MT5 trader.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Trade Notes and Context Logging
            </h3>
            <p>
              Attach notes to every MT5 trade — your reasoning, emotional state, market context, and post-trade review. This turns your trading journal into a structured learning library that compounds in value over time.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              MT5 Trade Calendar View
            </h3>
            <p>
              See your daily P&L across the month at a glance. The trade calendar makes it easy to spot your most profitable days, identify patterns like revenge trading, and build a consistent daily routine around your best performance windows.
            </p>
          </section>

          {/* H2: MT4 traders */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              MT4 Trading Journal — Also Supported
            </h2>
            <p>
              Still on MetaTrader 4? TJ TradeHub supports MT4 as well. Connect your MetaTrader 4 account and get the same automatic trade sync, analytics, and discipline tracking as MT5 users. Whether you upgrade to MT5 or stay on MT4, your trading journal stays with you.
            </p>
          </section>

          {/* H2: CTA */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Connect Your MT5 Account and Start Journaling Free
            </h2>
            <p>
              Start a 7-day free trial with full access to MT5 trade sync and all analytics features. No credit card required. Connect your MetaTrader 5 account in minutes and see your trading performance in a whole new light.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold"
                style={{ backgroundColor: "#8B5CF6", color: "#F9FAFB", borderRadius: "14px" }}
              >
                Start Free Trial – Connect MT5 for Free
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium"
                style={{ color: "#9CA3AF", border: "1px solid #374151", borderRadius: "14px" }}
              >
                View All Features
              </Link>
            </div>
          </section>

          {/* Internal Links */}
          <section style={{ borderTop: "1px solid #1F2937", paddingTop: "32px" }}>
            <h2 style={{ color: "#F9FAFB", fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
              Explore More Trading Journal Resources
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/trading-journal" style={{ color: "#8B5CF6", fontSize: "14px" }}>Trading Journal →</Link>
              <Link href="/forex-trading-journal" style={{ color: "#8B5CF6", fontSize: "14px" }}>Forex Trading Journal →</Link>
              <Link href="/futures-trading-journal" style={{ color: "#8B5CF6", fontSize: "14px" }}>Futures Trading Journal →</Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
