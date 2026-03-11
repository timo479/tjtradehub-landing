import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "What Is a Trading Journal? The Complete Guide for Traders",
  description:
    "Learn what a trading journal is, why every serious trader needs one, and how it can transform your trading performance. Includes examples and how to get started.",
  alternates: {
    canonical: "https://www.tjtradehub.com/what-is-a-trading-journal",
  },
  openGraph: {
    title: "What Is a Trading Journal? The Complete Guide for Traders | TJ TradeHub",
    description:
      "Learn what a trading journal is, why every serious trader needs one, and how it transforms trading performance.",
    url: "https://www.tjtradehub.com/what-is-a-trading-journal",
  },
};

export default function WhatIsATradingJournalPage() {
  return (
    <div style={{ backgroundColor: "#000000", minHeight: "100vh" }}>
      <div className="mx-auto px-6 py-16" style={{ maxWidth: "860px" }}>
        <Link href="/" style={{ color: "#8B5CF6", fontSize: "14px", textDecoration: "none" }}>
          ← Back to Home
        </Link>

        {/* H1 */}
        <h1
          className="text-4xl font-bold mt-8 mb-4"
          style={{ color: "#F9FAFB", lineHeight: "1.2" }}
        >
          What Is a Trading Journal?
        </h1>
        <p style={{ color: "#9CA3AF", fontSize: "18px", lineHeight: "1.7", marginBottom: "48px" }}>
          A trading journal is a structured record of every trade you take — including why you entered, how you managed the position, and what you learned. It is the single most important tool for any trader who wants to improve consistently over time.
        </p>

        <div className="flex flex-col gap-12" style={{ color: "#9CA3AF", lineHeight: "1.8" }}>

          {/* H2: Definition */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Trading Journal — Definition and Purpose
            </h2>
            <p>
              At its core, a trading journal is a log of your trades. But a good trading journal goes far beyond simple entry and exit prices. It captures the full context of every trade: your reasoning, your emotional state, whether you followed your system, and the quantitative outcome.
            </p>
            <p className="mt-4">
              Professional traders treat their journal the same way a pilot treats a flight log — it is not optional, it is the foundation of safe and consistent operation. Without a trading journal, you are flying blind.
            </p>
            <p className="mt-4">
              A trading journal typically records:
            </p>
            <ul className="mt-3 flex flex-col gap-2" style={{ paddingLeft: "20px", listStyleType: "disc" }}>
              <li>Trade date, instrument, and direction (long or short)</li>
              <li>Entry price, exit price, and lot size</li>
              <li>Profit or loss in currency and R-multiples</li>
              <li>Setup type and trading rules followed</li>
              <li>Discipline score — how well you executed your plan</li>
              <li>Notes on market context, emotions, and post-trade review</li>
            </ul>
          </section>

          {/* H2: Why every trader needs one */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Why Every Trader Needs a Trading Journal
            </h2>
            <p>
              Most losing traders have one thing in common: they do not journal. They repeat the same mistakes because there is no record to learn from. A trading journal breaks this cycle by turning every trade — winner or loser — into useful data.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              You Cannot Improve What You Do Not Measure
            </h3>
            <p>
              Without a trading journal, your performance review is based on memory and gut feeling — both of which are unreliable. A journal gives you objective data: win rate, profit factor, average winner vs. average loser, and trends over time.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Separate Skill from Luck
            </h3>
            <p>
              Good trades do not always make money, and bad trades do not always lose. A trading journal lets you evaluate the quality of your decision-making independently of the outcome — the only way to develop genuine trading skill rather than outcome-based thinking.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Identify Hidden Patterns in Your Trading
            </h3>
            <p>
              Over hundreds of trades, patterns emerge that are invisible in the moment: you lose more on Fridays, your best setups are in the London session, you underperform after two consecutive losers. A trading journal surfaces these patterns so you can act on them.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Build Psychological Discipline
            </h3>
            <p>
              Knowing you will journal every trade changes how you trade. Impulsive entries feel different when you know you have to write down why you took them. A trading journal creates accountability — one of the most powerful psychological tools available to a trader.
            </p>
          </section>

          {/* H2: Benefits */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              The Key Benefits of Keeping a Trading Journal
            </h2>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Faster Development as a Trader
            </h3>
            <p>
              Traders who journal consistently improve faster than those who do not. The feedback loop is shorter — you identify mistakes sooner, correct them quicker, and compound your learning over time.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Objective Performance Review
            </h3>
            <p>
              Instead of relying on how you feel about your trading, a journal gives you facts. Weekly and monthly reviews become structured and productive rather than emotional and vague.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Confidence Built on Data
            </h3>
            <p>
              When you have a journal showing 300 trades with a consistent edge, you trade with real confidence. Not blind optimism — evidence-based conviction in your system and execution.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Better Risk Management
            </h3>
            <p>
              A trading journal reveals your actual risk profile. You may think you are risking 1% per trade, but your journal might show your average loss is 1.6% due to slippage and emotional stop adjustments. This level of clarity is only possible with accurate records.
            </p>
          </section>

          {/* H2: Example */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              What a Good Trading Journal Entry Looks Like
            </h2>
            <p>
              Here is a realistic example of what a complete trading journal entry includes:
            </p>
            <div
              className="mt-4 p-6 rounded-xl flex flex-col gap-3"
              style={{ backgroundColor: "#0D0D0D", border: "1px solid #1F2937" }}
            >
              <div className="flex flex-col gap-1">
                <span style={{ color: "#6B7280", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Instrument</span>
                <span style={{ color: "#F9FAFB", fontSize: "15px" }}>EURUSD — Long</span>
              </div>
              <div className="flex flex-col gap-1">
                <span style={{ color: "#6B7280", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Entry / Exit</span>
                <span style={{ color: "#F9FAFB", fontSize: "15px" }}>1.08420 → 1.08890 &nbsp;|&nbsp; 0.5 lots</span>
              </div>
              <div className="flex flex-col gap-1">
                <span style={{ color: "#6B7280", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>P&amp;L</span>
                <span style={{ color: "#22C55E", fontSize: "15px", fontWeight: 600 }}>+$235 &nbsp;|&nbsp; +2.3R</span>
              </div>
              <div className="flex flex-col gap-1">
                <span style={{ color: "#6B7280", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Discipline Score</span>
                <span style={{ color: "#F9FAFB", fontSize: "15px" }}>9 / 10</span>
              </div>
              <div className="flex flex-col gap-1">
                <span style={{ color: "#6B7280", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Notes</span>
                <span style={{ color: "#9CA3AF", fontSize: "14px" }}>
                  Clean break of London session high. Waited for retest before entry. Followed plan perfectly — held through a minor pullback to full target. Slight hesitation on entry but executed. Would take this setup again.
                </span>
              </div>
            </div>
            <p className="mt-4">
              This level of detail turns a single trade into a reusable data point. Over 200 trades, patterns emerge that would otherwise be invisible.
            </p>
          </section>

          {/* H2: CTA */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Start Your Trading Journal with TJ TradeHub
            </h2>
            <p>
              TJ TradeHub is the trading journal built for serious Forex and Futures traders. Log trades manually or connect your MetaTrader 5 account for automatic sync. Track discipline scores, analyze performance across instruments and sessions, and build the data foundation your trading career needs.
            </p>
            <p className="mt-4">
              7-day free trial. No credit card required.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold"
                style={{ backgroundColor: "#8B5CF6", color: "#F9FAFB", borderRadius: "14px" }}
              >
                Start Your Trading Journal Free
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium"
                style={{ color: "#9CA3AF", border: "1px solid #374151", borderRadius: "14px" }}
              >
                Explore All Features
              </Link>
            </div>
          </section>

          {/* Internal Links */}
          <section style={{ borderTop: "1px solid #1F2937", paddingTop: "32px" }}>
            <h2 style={{ color: "#F9FAFB", fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
              Continue Learning
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/how-to-use-a-trading-journal" style={{ color: "#8B5CF6", fontSize: "14px" }}>How to Use a Trading Journal →</Link>
              <Link href="/forex-trading-journal-guide" style={{ color: "#8B5CF6", fontSize: "14px" }}>Forex Trading Journal Guide →</Link>
              <Link href="/trading-performance-tracking" style={{ color: "#8B5CF6", fontSize: "14px" }}>Trading Performance Tracking →</Link>
              <Link href="/trading-journal" style={{ color: "#8B5CF6", fontSize: "14px" }}>Best Trading Journal Software →</Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
