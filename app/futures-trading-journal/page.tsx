import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Futures Trading Journal – Track & Analyze Futures Trades",
  description:
    "TJ TradeHub is the dedicated futures trading journal for ES, NQ, CL, and other futures traders. Track contracts, P&L per tick, discipline, and build a consistent edge.",
  alternates: {
    canonical: "https://www.tjtradehub.com/futures-trading-journal",
  },
  openGraph: {
    title: "Futures Trading Journal – Track & Analyze Futures Trades | TJ TradeHub",
    description:
      "Dedicated futures trading journal for systematic traders. Track contracts, tick P&L, discipline scores, and performance analytics for ES, NQ, CL and more.",
    url: "https://www.tjtradehub.com/futures-trading-journal",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TJ TradeHub – Futures Trading Journal",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web, Browser",
  url: "https://www.tjtradehub.com/futures-trading-journal",
  description:
    "Dedicated futures trading journal for systematic traders. Track ES, NQ, CL, and other futures contracts with full analytics and discipline scoring.",
  offers: {
    "@type": "Offer",
    price: "29",
    priceCurrency: "CHF",
  },
};

export default function FuturesTradingJournalPage() {
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
          Futures Trading Journal for Systematic Traders
        </h1>
        <p style={{ color: "#9CA3AF", fontSize: "18px", lineHeight: "1.7", marginBottom: "48px" }}>
          Futures trading demands precision and discipline. A dedicated futures trading journal gives you the performance data to refine your edge — from entry timing to position sizing to rule adherence across every contract you trade.
        </p>

        <div className="flex flex-col gap-12" style={{ color: "#9CA3AF", lineHeight: "1.8" }}>

          {/* H2: Why futures traders need a journal */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Why Futures Traders Need a Dedicated Journal
            </h2>
            <p>
              Futures markets are fast. ES, NQ, CL, GC — every contract has its own volatility profile, liquidity window, and risk dynamics. A futures trading journal is the tool that turns raw trade data into actionable performance insights.
            </p>
            <p className="mt-4">
              Without a journal, futures traders repeat the same mistakes — overtrading around economic releases, sizing up during drawdowns, or abandoning a working system after a losing streak. TJ TradeHub provides the structure to prevent this.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Track P&L Per Contract and Session
            </h3>
            <p>
              The futures trading journal in TJ TradeHub lets you track your P&L at the trade level — broken down by instrument, direction, and time of day. Know exactly which contracts you are profitable on and which trading sessions generate your best results.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Measure Execution Quality on Every Trade
            </h3>
            <p>
              In futures trading, execution quality is everything. A missed entry or a premature exit can be the difference between a winning and losing trade. The Discipline Score in TJ TradeHub captures how well you executed your plan — separate from whether the trade was profitable.
            </p>
          </section>

          {/* H2: Key features */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Futures Trading Journal Features
            </h2>
            <p>
              TJ TradeHub is built as a serious futures trading analytics platform — not a generic note-taking tool. Every feature is designed to help system-based futures traders measure and improve their performance.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              MT5 & MT4 Integration for Futures
            </h3>
            <p>
              Connect your MetaTrader 5 or MetaTrader 4 account to automatically sync your futures trades. Trades from CFDs on ES, NQ, DAX, crude oil, gold, and other instruments are imported automatically — keeping your futures trading journal up to date without manual work.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Performance Analytics Dashboard
            </h3>
            <p>
              The analytics dashboard in TJ TradeHub shows win rate, profit factor, consecutive wins and losses, R-multiple distribution, and monthly P&L charts — all relevant performance metrics for a futures trader tracking edge over time.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Trade Calendar for Futures Performance
            </h3>
            <p>
              Visualize your futures trading results day by day with the trade calendar. Identify your best and worst trading days, track consistency, and spot overtrading patterns before they become expensive habits.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Discipline Score — The Futures Trader&apos;s Edge Metric
            </h3>
            <p>
              Most futures traders know what to do — the challenge is doing it consistently. The Discipline Score in TJ TradeHub measures exactly that: how closely you follow your system on every trade. Over time, the correlation between discipline and profitability becomes clear.
            </p>
          </section>

          {/* H2: Who it's for */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Built for Serious Futures Traders
            </h2>
            <p>
              TJ TradeHub is the futures trading journal for traders who run a defined strategy and demand data-driven feedback. Whether you are day trading ES, swing trading NQ, or scalping crude oil — consistent journaling is the path to consistent performance.
            </p>
            <ul className="mt-4 flex flex-col gap-2" style={{ paddingLeft: "20px", listStyleType: "disc" }}>
              <li>Day traders on equity index futures (ES, NQ, YM, DAX)</li>
              <li>Commodity futures traders (CL, GC, NG, SI)</li>
              <li>MT5 futures CFD traders using MetaTrader platforms</li>
              <li>Prop firm traders with strict daily loss limits</li>
            </ul>
          </section>

          {/* H2: CTA */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Start Your Futures Trading Journal Free
            </h2>
            <p>
              Try TJ TradeHub free for 7 days. Connect your MetaTrader account, start tracking your futures trades, and build the performance record that separates systematic traders from guesswork traders.
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
              <Link href="/mt5-trading-journal" style={{ color: "#8B5CF6", fontSize: "14px" }}>MT5 Trading Journal →</Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
