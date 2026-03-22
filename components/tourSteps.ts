export interface TourStep {
  target: string | null; // data-tour attribute value (null = centered modal)
  title: string;
  description: string;
  placement?: "top" | "bottom" | "left" | "right";
}

export const DASHBOARD_STEPS: TourStep[] = [
  {
    target: null,
    title: "Welcome to TJ TradeHub 👋",
    description: "Your all-in-one platform to track, analyze, and improve your trading. This quick tour shows you everything in under a minute.",
  },
  {
    target: "stats-cards",
    title: "Your Trading Stats",
    description: "See your key metrics at a glance — trades this month, win rate, total P&L, and average rating. All calculated automatically from your journal entries.",
    placement: "bottom",
  },
  {
    target: "metaconnect",
    title: "MT4 / MT5 Auto-Sync",
    description: "Connect your MetaTrader account once and your trades sync automatically — no manual entry needed. Supports both MT4 and MT5.",
    placement: "bottom",
  },
  {
    target: "quick-action-journal",
    title: "Trading Journal",
    description: "Log trades manually, track your emotions, follow your rules checklist, and review setups. Your journal is the core of your improvement process.",
    placement: "top",
  },
  {
    target: "quick-action-mt5",
    title: "Live Sync Status",
    description: "See your MetaTrader sync status in real-time. New trades from MT4/MT5 appear automatically in your journal inbox.",
    placement: "top",
  },
];

export const CHARTS_STEPS: TourStep[] = [
  {
    target: null,
    title: "Welcome to TJ Charts 📈",
    description: "Real-time charts for 65+ symbols across Forex, Indices, Crypto, Metals and Commodities — all powered by TradingView and built directly into your dashboard.",
  },
  {
    target: null,
    title: "Live Ticker Strip",
    description: "The ticker at the top shows real-time prices for all major instruments — S&P 500, NASDAQ, Gold, EUR/USD, BTC and more. Always visible as you work.",
  },
  {
    target: null,
    title: "Multi-Symbol Layouts",
    description: "Display 1, 2 or 3 charts side by side. Switch timeframes from 1 minute to Weekly with one click, and adjust the chart height to fit your screen.",
  },
  {
    target: null,
    title: "Trading Sessions",
    description: "Track the Asia, London and New York sessions live with open/closed status and countdown timers. Create custom sessions with your own colors and hours.",
  },
  {
    target: null,
    title: "Calendar, Heatmap & Screener",
    description: "Open the Economic Calendar, Market Heatmap, News Feed or Screener with one click. Save your favourite watchlists as presets for instant access.",
  },
];

export const JOURNAL_STEPS: TourStep[] = [
  {
    target: null,
    title: "Your Trading Journal 📓",
    description: "This is where improvement happens. Track every trade, review your decisions, and build the data you need to become consistently profitable.",
  },
  {
    target: "journal-header",
    title: "Create Separate Journals",
    description: "Use different journals for different strategies or instruments — e.g. 'Scalping EUR/USD' or 'Swing Trades'. Click '+ New Journal' to get started.",
    placement: "bottom",
  },
  {
    target: "journal-grid",
    title: "Your Journal Overview",
    description: "Each card shows win rate, P&L and trade count at a glance. Click any journal to open it and view your trades.",
    placement: "bottom",
  },
  {
    target: null,
    title: "Log & Analyze Trades",
    description: "Inside a journal, click '+ Log Trade' to record a trade. Add your setup, emotions, screenshots and rating. The more detail, the better your insights.",
  },
];
