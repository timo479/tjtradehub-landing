"use client";
import { useState, useEffect, useCallback } from "react";
import TradeForm from "./TradeForm";
import TradeCalendar from "./TradeCalendar";
import JournalSettings from "./JournalSettings";

interface Trade {
  id: string;
  trade_date: string;
  symbol: string;
  direction: "BUY" | "SELL";
  entry_price: number;
  exit_price: number;
  stop_loss?: number;
  take_profit?: number;
  lot_size: number;
  risk_amount?: number;
  profit_loss: number;
  setup_type?: string;
  timeframe?: string;
  emotional_state?: string;
  followed_plan: boolean;
  rule_break?: boolean;
  discipline_score?: number;
  notes?: string;
}

export default function JournalClient() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTrades = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/trades");
    const data = await res.json();
    setTrades(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTrades(); }, [fetchTrades]);

  const deleteTrade = async (id: string) => {
    if (!confirm("Trade löschen?")) return;
    await fetch(`/api/trades/${id}`, { method: "DELETE" });
    fetchTrades();
  };

  // Stats
  const totalPnl = trades.reduce((s, t) => s + t.profit_loss, 0);
  const wins = trades.filter((t) => t.profit_loss > 0);
  const losses = trades.filter((t) => t.profit_loss < 0);
  const winRate = trades.length ? Math.round((wins.length / trades.length) * 100) : 0;
  const disciplineTrades = trades.filter((t) => t.discipline_score != null);
  const avgDiscipline = disciplineTrades.length
    ? (disciplineTrades.reduce((s, t) => s + t.discipline_score!, 0) / disciplineTrades.length).toFixed(1)
    : null;

  const grossWin = wins.reduce((s, t) => s + t.profit_loss, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.profit_loss, 0));
  const profitFactor = grossLoss > 0 ? (grossWin / grossLoss).toFixed(2) : wins.length > 0 ? "∞" : null;

  const tradesWithR = trades.filter((t) => t.risk_amount && t.risk_amount > 0);
  const avgR = tradesWithR.length
    ? (tradesWithR.reduce((s, t) => s + t.profit_loss / t.risk_amount!, 0) / tradesWithR.length).toFixed(2)
    : null;

  const pnlColor = totalPnl >= 0 ? "#22c55e" : "#ef4444";

  const statCards = [
    { label: "Total Trades", value: trades.length.toString() },
    { label: "Win Rate", value: trades.length ? `${winRate}%` : "—" },
    {
      label: "Total P&L",
      value: trades.length ? `${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)} CHF` : "—",
      color: trades.length ? pnlColor : undefined,
    },
    { label: "Ø Discipline", value: avgDiscipline ? `${avgDiscipline}/10` : "—" },
    {
      label: "Profit Factor",
      value: profitFactor ?? "—",
      color: profitFactor && profitFactor !== "—" && parseFloat(profitFactor) >= 1 ? "#22c55e" : profitFactor === "∞" ? "#22c55e" : "#ef4444",
    },
    {
      label: "Ø R-Multiple",
      value: avgR ? `${parseFloat(avgR) >= 0 ? "+" : ""}${avgR}R` : "—",
      color: avgR ? (parseFloat(avgR) >= 0 ? "#22c55e" : "#ef4444") : undefined,
    },
  ];

  return (
    <div>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
        {statCards.map((card) => (
          <div key={card.label} style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "20px" }}>
            <p style={{ color: "#9CA3AF", fontSize: "12px", marginBottom: "8px" }}>{card.label}</p>
            <p style={{ color: card.color ?? "#F9FAFB", fontSize: "26px", fontWeight: 700 }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <TradeCalendar trades={trades} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <h2 style={{ color: "#F9FAFB", fontSize: "18px", fontWeight: 600 }}>Trade-Journal</h2>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setShowSettings(true)}
            style={{ backgroundColor: "transparent", color: "#9CA3AF", border: "1px solid #1F2937", borderRadius: "12px",
              padding: "10px 16px", fontWeight: 500, fontSize: "14px", cursor: "pointer" }}>
            ⚙️ Journal einrichten
          </button>
          <button onClick={() => setShowForm(true)}
            style={{ backgroundColor: "#8B5CF6", color: "#F9FAFB", border: "none", borderRadius: "12px",
              padding: "10px 20px", fontWeight: 600, fontSize: "14px", cursor: "pointer" }}>
            + Trade erfassen
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p style={{ color: "#6B7280", textAlign: "center", padding: "60px" }}>Laden...</p>
      ) : trades.length === 0 ? (
        <div style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "16px",
          padding: "60px", textAlign: "center" }}>
          <p style={{ color: "#9CA3AF", marginBottom: "16px" }}>Noch keine Trades erfasst.</p>
          <button onClick={() => setShowForm(true)}
            style={{ backgroundColor: "#8B5CF6", color: "#F9FAFB", border: "none", borderRadius: "12px",
              padding: "10px 24px", fontWeight: 600, cursor: "pointer" }}>
            Ersten Trade erfassen
          </button>
        </div>
      ) : (
        <div style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", minWidth: "900px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1F2937" }}>
                  {["Datum", "Symbol", "Dir.", "Setup", "TF", "P&L", "R-Mult.", "Disc.", "Emotion", "Regel", ""].map((h) => (
                    <th key={h} style={{ padding: "14px 16px", textAlign: "left", color: "#6B7280",
                      fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t, i) => {
                  const rMult = t.risk_amount && t.risk_amount > 0
                    ? (t.profit_loss / t.risk_amount).toFixed(2)
                    : null;
                  const isExpanded = expandedId === t.id;

                  return (
                    <>
                      <tr key={t.id}
                        style={{
                          borderBottom: "1px solid #1F2937",
                          transition: "background 0.15s",
                          cursor: "pointer",
                        }}
                        onClick={() => setExpandedId(isExpanded ? null : t.id)}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0d1117")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}>
                        <td style={{ padding: "14px 16px", color: "#9CA3AF", whiteSpace: "nowrap" }}>{t.trade_date}</td>
                        <td style={{ padding: "14px 16px", color: "#F9FAFB", fontWeight: 600 }}>{t.symbol}</td>
                        <td style={{ padding: "14px 16px" }}>
                          <span style={{
                            padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                            backgroundColor: t.direction === "BUY" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                            color: t.direction === "BUY" ? "#22c55e" : "#ef4444",
                          }}>
                            {t.direction === "BUY" ? "▲ BUY" : "▼ SELL"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", color: "#9CA3AF", fontSize: "13px" }}>
                          {t.setup_type || <span style={{ color: "#374151" }}>—</span>}
                        </td>
                        <td style={{ padding: "14px 16px", color: "#9CA3AF", fontSize: "13px" }}>
                          {t.timeframe || <span style={{ color: "#374151" }}>—</span>}
                        </td>
                        <td style={{ padding: "14px 16px", fontWeight: 600,
                          color: t.profit_loss >= 0 ? "#22c55e" : "#ef4444", whiteSpace: "nowrap" }}>
                          {t.profit_loss >= 0 ? "+" : ""}{t.profit_loss.toFixed(2)}
                        </td>
                        <td style={{ padding: "14px 16px", fontWeight: 600,
                          color: rMult ? (parseFloat(rMult) >= 0 ? "#22c55e" : "#ef4444") : "#374151" }}>
                          {rMult ? `${parseFloat(rMult) >= 0 ? "+" : ""}${rMult}R` : "—"}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          {t.discipline_score != null ? (
                            <span style={{
                              padding: "3px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                              backgroundColor: t.discipline_score >= 7 ? "rgba(139,92,246,0.1)" : "rgba(239,68,68,0.1)",
                              color: t.discipline_score >= 7 ? "#8B5CF6" : "#ef4444",
                            }}>
                              {t.discipline_score}/10
                            </span>
                          ) : <span style={{ color: "#374151" }}>—</span>}
                        </td>
                        <td style={{ padding: "14px 16px", color: "#9CA3AF", fontSize: "13px" }}>
                          {t.emotional_state || <span style={{ color: "#374151" }}>—</span>}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          {!t.followed_plan ? (
                            <span style={{ color: "#ef4444", fontSize: "12px", fontWeight: 600 }}>✕ Ja</span>
                          ) : (
                            <span style={{ color: "#22c55e", fontSize: "12px", fontWeight: 600 }}>✓ Nein</span>
                          )}
                        </td>
                        <td style={{ padding: "14px 16px" }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button onClick={() => { setEditTrade(t); setShowForm(true); }}
                              style={{ background: "none", border: "none", color: "#6B7280",
                                cursor: "pointer", fontSize: "14px", padding: "4px" }}
                              title="Bearbeiten">✏️</button>
                            <button onClick={() => deleteTrade(t.id)}
                              style={{ background: "none", border: "none", color: "#4B5563",
                                cursor: "pointer", fontSize: "16px", padding: "4px" }}
                              title="Löschen">✕</button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${t.id}-expand`} style={{ backgroundColor: "#0d1117", borderBottom: "1px solid #1F2937" }}>
                          <td colSpan={11} style={{ padding: "16px 20px" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", fontSize: "13px" }}>
                              <div>
                                <span style={{ color: "#6B7280" }}>Entry</span>
                                <p style={{ color: "#F9FAFB", marginTop: "2px" }}>{t.entry_price}</p>
                              </div>
                              <div>
                                <span style={{ color: "#6B7280" }}>Exit</span>
                                <p style={{ color: "#F9FAFB", marginTop: "2px" }}>{t.exit_price}</p>
                              </div>
                              <div>
                                <span style={{ color: "#6B7280" }}>Stop Loss</span>
                                <p style={{ color: t.stop_loss ? "#ef4444" : "#374151", marginTop: "2px" }}>
                                  {t.stop_loss ?? "—"}
                                </p>
                              </div>
                              <div>
                                <span style={{ color: "#6B7280" }}>Take Profit</span>
                                <p style={{ color: t.take_profit ? "#22c55e" : "#374151", marginTop: "2px" }}>
                                  {t.take_profit ?? "—"}
                                </p>
                              </div>
                              <div>
                                <span style={{ color: "#6B7280" }}>Lots</span>
                                <p style={{ color: "#F9FAFB", marginTop: "2px" }}>{t.lot_size}</p>
                              </div>
                              <div>
                                <span style={{ color: "#6B7280" }}>Risiko (CHF)</span>
                                <p style={{ color: "#F9FAFB", marginTop: "2px" }}>{t.risk_amount ?? "—"}</p>
                              </div>
                              {t.notes && (
                                <div style={{ gridColumn: "span 2" }}>
                                  <span style={{ color: "#6B7280" }}>Notizen</span>
                                  <p style={{ color: "#9CA3AF", marginTop: "2px", lineHeight: "1.5" }}>{t.notes}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <TradeForm
          onClose={() => { setShowForm(false); setEditTrade(null); }}
          onSaved={fetchTrades}
          trade={editTrade ?? undefined}
        />
      )}
      {showSettings && (
        <JournalSettings
          onClose={() => setShowSettings(false)}
          onSaved={() => { setShowSettings(false); fetchTrades(); }}
        />
      )}
    </div>
  );
}
