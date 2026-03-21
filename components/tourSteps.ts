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
    description: "Let's take a quick tour of the key features. You can skip at any time.",
  },
  {
    target: "stats-cards",
    title: "Your Performance at a Glance",
    description: "These cards show your trading stats: trades this month, win rate, total P&L, and average rating — all updated in real-time.",
    placement: "bottom",
  },
  {
    target: "metaconnect",
    title: "MT4 / MT5 Auto-Sync",
    description: "Connect your MetaTrader account to automatically import trades in real-time. No manual entry needed.",
    placement: "top",
  },
  {
    target: "dashboard-stats",
    title: "Statistics Widget",
    description: "Deep-dive into your performance with detailed charts and analytics built from your journal data.",
    placement: "top",
  },
  {
    target: "quick-action-journal",
    title: "Your Trading Journal",
    description: "Log trades manually, track emotions, follow your rules checklist, and review your performance over time.",
    placement: "top",
  },
  {
    target: "quick-action-mt5",
    title: "MT5 Sync Status",
    description: "See the live status of your MetaTrader sync. Trades are imported automatically whenever you're active.",
    placement: "top",
  },
];

export const JOURNAL_STEPS: TourStep[] = [
  {
    target: null,
    title: "Welcome to the Journal 📓",
    description: "Your trading journal helps you track, analyze, and improve your trades systematically.",
  },
  {
    target: "journal-header",
    title: "Create Your First Journal",
    description: "Create separate journals for different strategies or instruments. Click '+ New Journal' to get started.",
    placement: "bottom",
  },
  {
    target: "journal-grid",
    title: "Your Journal Cards",
    description: "Each journal card shows key stats like win rate, P&L, and trade count. Click any card to view and manage its trades.",
    placement: "bottom",
  },
  {
    target: null,
    title: "Log a Trade Manually",
    description: "Open any journal, then click '+ Log Trade' to record a trade with all details: symbol, direction, P&L, emotions, and more.",
  },
  {
    target: null,
    title: "You're All Set! 🎉",
    description: "Start logging your trades and build the insights you need to become a consistently profitable trader.",
  },
];
