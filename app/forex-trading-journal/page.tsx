import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Forex Trading Journal – Track & Analyze Your FX Trades",
  description:
    "TJ TradeHub is the dedicated Forex trading journal for FX traders. Log currency pairs, track performance by session and pair, measure discipline, and improve your Forex edge.",
  alternates: {
    canonical: "https://www.tjtradehub.com/forex-trading-journal",
  },
  openGraph: {
    title: "Forex Trading Journal – Track & Analyze Your FX Trades | TJ TradeHub",
    description:
      "Dedicated Forex trading journal for FX traders. Log currency pairs, track session performance, measure discipline, and grow your Forex edge.",
    url: "https://www.tjtradehub.com/forex-trading-journal",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TJ TradeHub – Forex Trading Journal",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web, Browser",
  url: "https://www.tjtradehub.com/forex-trading-journal",
  description:
    "Dedicated Forex trading journal for FX traders. Track currency pair performance, session analytics, and discipline score for every trade.",
  offers: {
    "@type": "Offer",
    price: "29",
    priceCurrency: "USD",
  },
};

export default function ForexTradingJournalPage() {
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
          Forex Trading Journal Built for FX Traders
        </h1>
        <p style={{ color: "#9CA3AF", fontSize: "18px", lineHeight: "1.7", marginBottom: "48px" }}>
          The Forex market demands precision. A dedicated Forex trading journal helps you understand which currency pairs, sessions, and setups generate your edge — and which ones are draining your account.
        </p>

        <div className="flex flex-col gap-12" style={{ color: "#9CA3AF", lineHeight: "1.8" }}>

          {/* H2: Why FX traders need a journal */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Why Forex Traders Need a Dedicated Trading Journal
            </h2>
            <p>
              Forex trading is the world's most liquid market, operating 24 hours across multiple sessions. With so many variables — currency pairs, session overlaps, economic events — a Forex trading journal is not optional. It is the only way to cut through noise and find your real edge.
            </p>
            <p className="mt-4">
              Generic journals and spreadsheets fall short for FX traders. TJ TradeHub is built specifically as a Forex trading journal, giving you the analytics that matter most for currency market trading.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Track Performance by Currency Pair
            </h3>
            <p>
              Not all pairs are equal. Your Forex trading journal should show you exactly which currency pairs you are profitable on — and which ones to avoid. TJ TradeHub breaks down your performance by instrument so you can trade your strengths.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Identify Your Best Trading Sessions
            </h3>
            <p>
              London open, New York session, Asian overlap — every FX trader has sessions where they perform differently. A Forex trading journal surfaces this data automatically, showing you when you trade best and when to stay off the screen.
            </p>
          </section>

          {/* H2: Features for Forex traders */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Forex Performance Tracker Features
            </h2>
            <p>
              TJ TradeHub functions as a complete Forex performance tracker — not just a log of your trades. Every entry feeds into analytics that reveal the structure behind your results.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              MT4 & MT5 Auto-Sync for Forex Trades
            </h3>
            <p>
              Most Forex traders use MetaTrader 4 or MetaTrader 5. TJ TradeHub connects directly to your MT4 or MT5 account and syncs your Forex trades automatically. Your trading journal updates in real time — no manual entry, no missed trades.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Forex Analytics Dashboard
            </h3>
            <p>
              The analytics dashboard shows win rate, profit factor, average R-multiple, and monthly P&L across your Forex trading history. Filter by pair, direction (long/short), or time period to isolate exactly what is working.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Discipline Score for Every Forex Trade
            </h3>
            <p>
              Forex trading is as much psychological as technical. The Discipline Score in TJ TradeHub lets you rate your rule adherence on every trade — revealing whether your losses come from bad setups or bad execution.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Trade Calendar & Streak Tracking
            </h3>
            <p>
              The trade calendar gives you a monthly view of your Forex performance, day by day. Spot overtrading, revenge trading patterns, and the days of the week where your edge is strongest.
            </p>
          </section>

          {/* H2: Who it's for */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Designed for Systematic Forex Traders
            </h2>
            <p>
              TJ TradeHub is the Forex trading journal for traders who operate with a defined system. Whether you trade price action, order flow, breakouts, or carry strategies — if you follow rules, you need data to measure how well you follow them.
            </p>
            <ul className="mt-4 flex flex-col gap-2" style={{ paddingLeft: "20px", listStyleType: "disc" }}>
              <li>Full-time and part-time Forex traders</li>
              <li>Prop firm traders managing daily drawdown limits</li>
              <li>MT4 and MT5 users wanting automated trade syncing</li>
              <li>Traders building consistency through process journaling</li>
            </ul>
          </section>

          {/* H2: CTA */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Start Your Forex Trading Journal Free
            </h2>
            <p>
              Try TJ TradeHub free for 7 days — no credit card required. Connect your MT4 or MT5 account, start tracking your Forex trades, and discover patterns you never knew existed.
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
              <Link href="/futures-trading-journal" style={{ color: "#8B5CF6", fontSize: "14px" }}>Futures Trading Journal →</Link>
              <Link href="/mt5-trading-journal" style={{ color: "#8B5CF6", fontSize: "14px" }}>MT5 Trading Journal →</Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
