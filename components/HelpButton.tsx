"use client";
import { useState } from "react";

const FAQS = [
  {
    cat: "Getting Started",
    items: [
      {
        q: "How do I create my first journal?",
        a: "Go to the Journal page and click '+ New Journal'. Give it a name, choose an instrument type (Forex, Futures, Stocks etc.), set your trading hours and risk settings, then add your personal rules. Your journal is ready to use immediately.",
      },
      {
        q: "What fields does every journal have?",
        a: "Every journal automatically includes: Symbol, Direction (Long/Short), Volume, Entry Price, Exit Price, Stop Loss, Take Profit, Break-Even, P&L, Commission, Swap, Setup, Emotions, Rules Followed, and Notes — perfectly aligned with MetaTrader 5 data.",
      },
    ],
  },
  {
    cat: "Logging Trades",
    items: [
      {
        q: "How do I log a trade manually?",
        a: "Open a journal, then click '+ Log Trade'. The 3-step wizard guides you through: (1) Date, symbol, and direction — (2) Entry/Exit prices, SL, TP, and P&L — (3) Setup type, emotions, rule compliance, and notes.",
      },
      {
        q: "How do I mark rule compliance?",
        a: "In Step 3 of the trade wizard, all your journal rules appear as checkboxes. Check each rule you followed for this trade. Unchecked rules count as broken and show up in your Rule Compliance statistics.",
      },
      {
        q: "How do I add emotions to a trade?",
        a: "In Step 3, tap the emotion tags that describe your state during this trade: Calm, Confident, Nervous, FOMO, Greedy, Fearful, Frustrated, or Euphoric. You can select multiple. This data feeds into the 'Emotions at Rule Breaks' widget.",
      },
    ],
  },
  {
    cat: "MT5 Integration",
    items: [
      {
        q: "How do I connect my MT5 broker account?",
        a: "Go to the Dashboard and find the 'MetaConnect' widget. Enter your broker server address, MT5 login number, and password, then click Connect. Your account is set up in the cloud — this usually takes under a minute.",
      },
      {
        q: "How does MT5 Sync work?",
        a: "Click 'MT5 Sync' in the journal view to import your latest trades. New trades land in the MT5 inbox as pending. You can then review them one by one (add setup, emotions, rules) or use 'Move all to journal' for quick bulk assignment.",
      },
      {
        q: "What is the MT5 inbox?",
        a: "The inbox holds all MT5 trades not yet reviewed. They show with a yellow badge and count. Reviewing means assigning a trade to a journal and optionally adding a setup, emotions, and rule compliance — turning raw broker data into a proper journal entry.",
      },
      {
        q: "Why does my MT5 connection show as offline?",
        a: "MT5 accounts are automatically put to sleep after 60 minutes of inactivity to save costs. They reconnect automatically when you visit the journal page. If it stays offline, try clicking 'Reconnect' in the MetaConnect widget.",
      },
      {
        q: "Why does the MT5 connection sometimes take several minutes?",
        a: "When connecting for the first time, our cloud infrastructure needs to provision a dedicated MetaTrader terminal for your broker, download the broker's server configuration, and establish a stable connection. This can take 2–5 minutes depending on your broker. Reconnecting an existing account is much faster (usually under 60 seconds) since the terminal is already configured. If the connection times out, simply try again — the setup continues in the background.",
      },
    ],
  },
  {
    cat: "Statistics",
    items: [
      {
        q: "How does the Statistics view work?",
        a: "Open a journal, then click the 'Statistics' tab in the top bar. All stats are filtered to that specific journal's trades only. Use the period filter (Today / Week / Month / Year / All / Custom) to narrow the timeframe.",
      },
      {
        q: "What is Rule Compliance?",
        a: "Rule Compliance shows how consistently you follow each of your journal rules. For example, 'No trade over 1% risk' at 80% means you followed this rule in 8 out of 10 trades. Aim for green (≥ 70%) across all rules.",
      },
      {
        q: "What are 'Emotions at Rule Breaks'?",
        a: "This widget shows which emotions were present most often in trades where you broke at least one rule. It reveals patterns like 'I break rules most often when I feel FOMO or Frustrated' — powerful self-awareness data.",
      },
      {
        q: "How do I add or remove widgets?",
        a: "In the Statistics tab, click 'Edit Widgets' in the top-right corner. A panel slides in showing all active and available widgets. Toggle any widget on or off — your layout is saved automatically.",
      },
    ],
  },
  {
    cat: "Account & Billing",
    items: [
      {
        q: "How long is the free trial?",
        a: "You get 7 days of full access for free — no credit card required. After the trial, you need a Pro subscription to continue accessing the dashboard.",
      },
      {
        q: "What is included in the Pro plan?",
        a: "Pro gives you unlimited journals, unlimited trade entries, MT5 auto-sync, full statistics with all widgets, and all future features for $29 / month.",
      },
      {
        q: "How do I cancel my subscription?",
        a: "You can cancel anytime. After cancellation, you retain full access until the end of the current billing period. Contact support or manage your subscription via the billing page.",
      },
    ],
  },
];

export default function HelpButton() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleItem = (key: string) => setExpanded(prev => prev === key ? null : key);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        title="Help & FAQ"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: "34px", height: "34px", borderRadius: "8px",
          border: "1px solid #1F2937", backgroundColor: "transparent",
          color: "#6B7280", cursor: "pointer", fontSize: "15px", fontWeight: 700,
          transition: "border-color 0.15s, color 0.15s", flexShrink: 0,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#8B5CF6"; (e.currentTarget as HTMLButtonElement).style.color = "#A78BFA"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#1F2937"; (e.currentTarget as HTMLButtonElement).style.color = "#6B7280"; }}
      >
        ?
      </button>

      {/* Side Panel */}
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }} onClick={() => setOpen(false)}>
          {/* Backdrop */}
          <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }} />

          {/* Panel */}
          <div
            style={{
              width: "420px", maxWidth: "95vw", backgroundColor: "#111827",
              borderLeft: "1px solid #1F2937", display: "flex", flexDirection: "column",
              height: "100vh", boxShadow: "-8px 0 32px rgba(0,0,0,0.6)",
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: "24px", borderBottom: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <h2 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "17px", margin: 0 }}>Help & FAQ</h2>
                <p style={{ color: "#6B7280", fontSize: "12px", marginTop: "3px" }}>Answers to the most common questions</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "22px", lineHeight: 1, padding: "4px" }}
              >
                ×
              </button>
            </div>

            {/* FAQ List */}
            <div style={{ flex: 1, overflowY: "auto", minHeight: 0, padding: "16px 20px" }}>
              {FAQS.map(cat => (
                <div key={cat.cat} style={{ marginBottom: "24px" }}>
                  {/* Category Label */}
                  <p style={{
                    fontSize: "10px", fontWeight: 700, textTransform: "uppercase",
                    letterSpacing: "0.08em", color: "#8B5CF6", marginBottom: "10px",
                    paddingLeft: "2px",
                  }}>
                    {cat.cat}
                  </p>

                  {/* Items */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {cat.items.map((item, idx) => {
                      const key = `${cat.cat}-${idx}`;
                      const isOpen = expanded === key;
                      return (
                        <div key={key} style={{
                          backgroundColor: "#0d1117", borderRadius: "10px",
                          border: `1px solid ${isOpen ? "rgba(139,92,246,0.3)" : "#1F2937"}`,
                          overflow: "hidden", transition: "border-color 0.15s",
                        }}>
                          {/* Question row */}
                          <button
                            onClick={() => toggleItem(key)}
                            style={{
                              width: "100%", padding: "12px 14px",
                              display: "flex", justifyContent: "space-between", alignItems: "center",
                              background: "none", border: "none", cursor: "pointer",
                              textAlign: "left", gap: "12px",
                            }}
                          >
                            <span style={{ color: isOpen ? "#F9FAFB" : "#D1D5DB", fontSize: "13px", fontWeight: 500, lineHeight: 1.4 }}>
                              {item.q}
                            </span>
                            <span style={{
                              color: isOpen ? "#A78BFA" : "#4B5563", fontSize: "16px",
                              flexShrink: 0, transition: "transform 0.2s",
                              display: "inline-block", transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                            }}>
                              +
                            </span>
                          </button>

                          {/* Answer */}
                          {isOpen && (
                            <div style={{ padding: "0 14px 14px", borderTop: "1px solid #1F2937" }}>
                              <p style={{ color: "#9CA3AF", fontSize: "13px", lineHeight: 1.6, margin: "10px 0 0" }}>
                                {item.a}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Footer */}
              <div style={{ marginTop: "8px", padding: "16px", backgroundColor: "#0d1117", borderRadius: "12px", border: "1px solid #1F2937" }}>
                <p style={{ color: "#6B7280", fontSize: "12px", lineHeight: 1.6, margin: 0 }}>
                  Still have questions? Reach out at{" "}
                  <span style={{ color: "#A78BFA" }}>support@tjtradehub.com</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
