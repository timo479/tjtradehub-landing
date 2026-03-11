import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Use a Trading Journal — Step-by-Step Guide for Traders",
  description:
    "Learn how to use a trading journal effectively. A practical step-by-step guide covering what to log, how to review, and how to turn journal data into better trading performance.",
  alternates: {
    canonical: "https://www.tjtradehub.com/how-to-use-a-trading-journal",
  },
  openGraph: {
    title: "How to Use a Trading Journal — Step-by-Step Guide | TJ TradeHub",
    description:
      "Practical step-by-step guide on how to use a trading journal effectively — what to log, how to review, and how to turn data into better performance.",
    url: "https://www.tjtradehub.com/how-to-use-a-trading-journal",
  },
};

export default function HowToUseTradingJournalPage() {
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
          How to Use a Trading Journal Effectively
        </h1>
        <p style={{ color: "#9CA3AF", fontSize: "18px", lineHeight: "1.7", marginBottom: "48px" }}>
          Keeping a trading journal only works if you use it correctly. Most traders start a journal and abandon it within weeks because they log the wrong things or never review their data. This guide covers exactly how to use a trading journal to get real results.
        </p>

        <div className="flex flex-col gap-12" style={{ color: "#9CA3AF", lineHeight: "1.8" }}>

          {/* H2: Step by step */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Step-by-Step: How to Use a Trading Journal
            </h2>
            <p>
              A trading journal is only as useful as the process you build around it. Here is the system that works — from before you enter a trade to your weekly review session.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "28px", marginBottom: "10px" }}>
              Step 1 — Log the Trade Before You Enter
            </h3>
            <p>
              The most valuable journal entry starts before you click buy or sell. Write down your setup: what you see, why this qualifies as a valid entry, where your stop loss is, and what your target is. This pre-trade note forces clarity and prevents impulse entries.
            </p>
            <p className="mt-3">
              If you cannot describe why you are taking the trade before you enter it, do not take it.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "28px", marginBottom: "10px" }}>
              Step 2 — Record the Full Trade Details
            </h3>
            <p>
              After the trade closes, log the objective data:
            </p>
            <ul className="mt-3 flex flex-col gap-2" style={{ paddingLeft: "20px", listStyleType: "disc" }}>
              <li>Instrument and direction (long / short)</li>
              <li>Entry price, exit price, stop loss, take profit</li>
              <li>Position size and risk in currency</li>
              <li>Profit or loss (in both currency and R-multiples)</li>
              <li>Trade duration</li>
            </ul>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "28px", marginBottom: "10px" }}>
              Step 3 — Score Your Discipline
            </h3>
            <p>
              Separately from the P&L, rate your execution quality on a scale of 1–10. Did you follow your entry rules exactly? Did you move your stop? Did you exit early out of fear or hold too long out of greed? This Discipline Score is often more informative than the P&L itself.
            </p>
            <p className="mt-3">
              A trade can be highly profitable and poorly executed at the same time. Your journal needs to capture both dimensions.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "28px", marginBottom: "10px" }}>
              Step 4 — Write a Post-Trade Note
            </h3>
            <p>
              Add a brief note about what happened during the trade. Was the setup as clean as you expected? Did the market behave differently than anticipated? What would you do the same or differently? This reflection is where the real learning happens.
            </p>
            <p className="mt-3">
              Keep it honest. The journal is for you — not for showing off winning trades.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "28px", marginBottom: "10px" }}>
              Step 5 — Do a Weekly Review
            </h3>
            <p>
              Set aside 30–60 minutes at the end of each week to review your journal. Look at all trades, not just the losers. Ask yourself: Are my winners coming from high-discipline entries? Are there patterns in my losing trades? What should I do more or less of next week?
            </p>
            <p className="mt-3">
              The weekly review is where your trading journal pays off. Without it, you are just collecting data with no action.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "28px", marginBottom: "10px" }}>
              Step 6 — Do a Monthly Performance Analysis
            </h3>
            <p>
              Once a month, look at the bigger picture. Review your win rate, profit factor, maximum drawdown, and average R-multiple. Compare this month to previous months. Are you improving? Are there new patterns emerging? Is your discipline score trending upward?
            </p>
          </section>

          {/* H2: What to avoid */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Common Mistakes When Using a Trading Journal
            </h2>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Only Logging Winning Trades
            </h3>
            <p>
              This is the most common journaling mistake. Selective logging skews your data and prevents you from seeing the real picture. Every trade goes in — especially the painful ones.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Logging Without Reviewing
            </h3>
            <p>
              A journal that is never reviewed is just a record. The value comes from the analysis. If you are logging trades but skipping your weekly and monthly reviews, you are doing half the job.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Using a Spreadsheet That Is Too Complicated
            </h3>
            <p>
              Many traders build elaborate Excel spreadsheets that take 20 minutes to update after each trade. Complexity kills consistency. The best trading journal is the one you actually use — simple enough to complete in under two minutes.
            </p>

            <h3 style={{ color: "#E5E7EB", fontSize: "18px", fontWeight: 600, marginTop: "24px", marginBottom: "10px" }}>
              Focusing Only on P&L
            </h3>
            <p>
              P&L tells you what happened. A good trading journal tells you why. If you only track profit and loss, you are missing the execution quality data that actually drives improvement.
            </p>
          </section>

          {/* H2: Benefits */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              What You Gain from Using a Trading Journal Consistently
            </h2>
            <p>
              Traders who commit to consistent journaling for 3–6 months typically report:
            </p>
            <ul className="mt-4 flex flex-col gap-3" style={{ paddingLeft: "20px", listStyleType: "disc" }}>
              <li>A clearer understanding of which setups have positive expectancy</li>
              <li>Fewer emotional trades and impulsive entries</li>
              <li>Better position sizing based on actual risk data</li>
              <li>Stronger confidence during drawdowns because the data shows recovery patterns</li>
              <li>A genuine competitive edge built on personal performance data — not generic advice</li>
            </ul>
          </section>

          {/* H2: Examples */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Real-World Journal Review Example
            </h2>
            <p>
              Here is what a monthly trading journal review might reveal for a Forex trader:
            </p>
            <div
              className="mt-4 p-6 rounded-xl flex flex-col gap-4"
              style={{ backgroundColor: "#0D0D0D", border: "1px solid #1F2937" }}
            >
              <div className="flex justify-between items-center">
                <span style={{ color: "#9CA3AF", fontSize: "14px" }}>Total Trades</span>
                <span style={{ color: "#F9FAFB", fontSize: "15px", fontWeight: 600 }}>47</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: "#9CA3AF", fontSize: "14px" }}>Win Rate</span>
                <span style={{ color: "#F9FAFB", fontSize: "15px", fontWeight: 600 }}>54%</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: "#9CA3AF", fontSize: "14px" }}>Avg Discipline Score</span>
                <span style={{ color: "#F9FAFB", fontSize: "15px", fontWeight: 600 }}>7.2 / 10</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: "#9CA3AF", fontSize: "14px" }}>Win Rate on Discipline ≥ 8</span>
                <span style={{ color: "#22C55E", fontSize: "15px", fontWeight: 600 }}>71%</span>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ color: "#9CA3AF", fontSize: "14px" }}>Win Rate on Discipline ≤ 5</span>
                <span style={{ color: "#EF4444", fontSize: "15px", fontWeight: 600 }}>28%</span>
              </div>
              <p style={{ color: "#6B7280", fontSize: "13px", marginTop: "8px" }}>
                Insight: Low-discipline trades are destroying this trader&apos;s performance. Eliminating trades with a pre-set discipline score below 6 would dramatically improve results.
              </p>
            </div>
            <p className="mt-4">
              This is the kind of insight that only a properly used trading journal can surface. A P&L spreadsheet would never show you this.
            </p>
          </section>

          {/* H2: CTA */}
          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "26px", fontWeight: 700, marginBottom: "16px" }}>
              Use TJ TradeHub as Your Trading Journal
            </h2>
            <p>
              TJ TradeHub is built around this exact workflow — pre-trade logging, post-trade review, discipline scoring, and structured performance analytics. Connect your MetaTrader 5 account for automatic trade sync, or log trades manually in seconds.
            </p>
            <p className="mt-4">
              Everything described in this guide is built into TJ TradeHub — ready to use from day one.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold"
                style={{ backgroundColor: "#8B5CF6", color: "#F9FAFB", borderRadius: "14px" }}
              >
                Start Free — No Credit Card Required
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium"
                style={{ color: "#9CA3AF", border: "1px solid #374151", borderRadius: "14px" }}
              >
                See How TJ TradeHub Works
              </Link>
            </div>
          </section>

          {/* Internal Links */}
          <section style={{ borderTop: "1px solid #1F2937", paddingTop: "32px" }}>
            <h2 style={{ color: "#F9FAFB", fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
              Continue Learning
            </h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/what-is-a-trading-journal" style={{ color: "#8B5CF6", fontSize: "14px" }}>What Is a Trading Journal? →</Link>
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
