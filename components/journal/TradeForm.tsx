"use client";
import { useState, useEffect } from "react";

interface Strategy {
  id: string;
  name: string;
  strategy_rules: { id: string; label: string; order_index: number }[];
}

interface CustomField {
  id: string;
  label: string;
  field_type: "text" | "number" | "boolean" | "select";
  options?: string[];
}

interface Modules {
  prices: boolean;
  position: boolean;
  timeframe: boolean;
  session: boolean;
  psychology: boolean;
  notes: boolean;
  strategy: boolean;
  custom: boolean;
}

interface TradeData {
  id: string;
  trade_date: string;
  symbol: string;
  direction: string;
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
  discipline_score?: number;
  notes?: string;
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
  trade?: TradeData;
}

const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"];
const SESSIONS = ["London", "New York", "Asia", "London/NY Overlap", "NY/Asia Overlap"];
const EMOTIONS = ["Calm", "Nervous", "FOMO", "Greedy", "Uncertain", "Confident"];

export default function TradeForm({ onClose, onSaved, trade }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modules, setModules] = useState<Modules | null>(null);
  const [riskSettings, setRiskSettings] = useState<{ max_risk_per_trade?: string; max_daily_loss?: string } | null>(null);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [ruleChecks, setRuleChecks] = useState<Record<string, boolean>>({});
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    trade_date: trade?.trade_date ?? new Date().toISOString().split("T")[0],
    symbol: trade?.symbol ?? "",
    direction: trade?.direction?.toLowerCase() ?? "buy",
    entry_price: trade?.entry_price?.toString() ?? "",
    exit_price: trade?.exit_price?.toString() ?? "",
    stop_loss: trade?.stop_loss?.toString() ?? "",
    take_profit: trade?.take_profit?.toString() ?? "",
    lot_size: trade?.lot_size?.toString() ?? "",
    risk_amount: trade?.risk_amount?.toString() ?? "",
    pnl: trade?.profit_loss?.toString() ?? "",
    timeframe: trade?.timeframe ?? "",
    session: "",
    emotional_state: trade?.emotional_state ?? "",
    notes: trade?.notes ?? "",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/journal-config").then(r => r.json()),
      fetch("/api/strategies").then(r => r.json()),
      fetch("/api/custom-fields").then(r => r.json()),
    ]).then(([config, strats, fields]) => {
      setModules(config.modules);
      setRiskSettings(config.risk_settings ?? {});
      setStrategies(Array.isArray(strats) ? strats : []);
      setCustomFields(Array.isArray(fields) ? fields : []);
    });
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const checkedCount = Object.values(ruleChecks).filter(Boolean).length;
  const totalRules = selectedStrategy?.strategy_rules.length ?? 0;
  const autoScore = totalRules > 0 ? Math.round((checkedCount / totalRules) * 10) : null;

  const rMultiple = form.pnl && form.risk_amount && parseFloat(form.risk_amount) > 0
    ? (parseFloat(form.pnl) / parseFloat(form.risk_amount)).toFixed(2) : null;

  const riskWarning = (() => {
    if (!riskSettings || !form.risk_amount) return null;
    const actual = parseFloat(form.risk_amount);
    if (isNaN(actual)) return null;
    if (riskSettings.max_risk_per_trade) {
      const max = parseFloat(riskSettings.max_risk_per_trade);
      if (actual > max * 1.2) {
        return `⚠️ Risk limit exceeded! You are risking ${actual.toFixed(2)} CHF — your limit is ${max.toFixed(2)} CHF (+${(((actual - max) / max) * 100).toFixed(0)}% above your plan).`;
      }
    }
    return null;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...form,
        strategy_id: selectedStrategy?.id ?? null,
        rule_checks: ruleChecks,
        custom_values: customValues,
        discipline_score: autoScore,
        rule_break: selectedStrategy ? checkedCount < totalRules : false,
      };
      const url = trade ? `/api/trades/${trade.id}` : "/api/trades";
      const method = trade ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); setLoading(false); return; }
      onSaved();
      onClose();
    } catch { setError("Network error"); }
    setLoading(false);
  };

  const inputStyle = {
    backgroundColor: "#0a0a0a", border: "1px solid #1F2937",
    borderRadius: "10px", color: "#F9FAFB",
    padding: "10px 14px", width: "100%", fontSize: "14px", outline: "none",
  };
  const labelStyle: React.CSSProperties = { color: "#9CA3AF", fontSize: "12px", marginBottom: "6px", display: "block" };
  const selectStyle = { ...inputStyle, appearance: "none" as const, cursor: "pointer" };

  if (!modules) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", overflowY: "auto",
    }} onClick={onClose}>
      <div style={{
        backgroundColor: "#111827", border: "1px solid #1F2937",
        borderRadius: "20px", padding: "32px", width: "100%",
        maxWidth: "640px", margin: "auto",
      }} onClick={e => e.stopPropagation()}>

        <h2 style={{ color: "#F9FAFB", fontSize: "18px", fontWeight: 600, marginBottom: "24px" }}>
          {trade ? "Edit trade" : "Log trade"}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Date + Symbol – always visible */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" style={inputStyle} value={form.trade_date} onChange={e => set("trade_date", e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Symbol</label>
              <input type="text" style={inputStyle} placeholder="e.g. XAUUSD" value={form.symbol} onChange={e => set("symbol", e.target.value)} required />
            </div>
          </div>

          {/* Direction – always visible */}
          <div>
            <label style={labelStyle}>Direction</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {["buy", "sell"].map(d => (
                <button key={d} type="button" onClick={() => set("direction", d)} style={{
                  padding: "10px", borderRadius: "10px",
                  border: `1px solid ${form.direction === d ? (d === "buy" ? "#22c55e" : "#ef4444") : "#1F2937"}`,
                  backgroundColor: form.direction === d ? (d === "buy" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)") : "transparent",
                  color: form.direction === d ? (d === "buy" ? "#22c55e" : "#ef4444") : "#9CA3AF",
                  fontWeight: 600, fontSize: "14px", cursor: "pointer", textTransform: "uppercase",
                }}>
                  {d === "buy" ? "▲ Buy" : "▼ Sell"}
                </button>
              ))}
            </div>
          </div>

          {/* STRATEGIE MODUL */}
          {modules.strategy && strategies.length > 0 && (
            <div style={{ backgroundColor: "#0d1117", border: "1px solid #1F2937", borderRadius: "12px", padding: "16px" }}>
              <label style={{ ...labelStyle, marginBottom: "10px" }}>Strategy</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: selectedStrategy ? "14px" : "0" }}>
                {strategies.map(s => (
                  <button key={s.id} type="button" onClick={() => {
                    if (selectedStrategy?.id === s.id) { setSelectedStrategy(null); setRuleChecks({}); }
                    else { setSelectedStrategy(s); setRuleChecks({}); }
                  }} style={{
                    padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer",
                    border: `1px solid ${selectedStrategy?.id === s.id ? "#8B5CF6" : "#1F2937"}`,
                    backgroundColor: selectedStrategy?.id === s.id ? "rgba(139,92,246,0.15)" : "transparent",
                    color: selectedStrategy?.id === s.id ? "#A78BFA" : "#9CA3AF",
                  }}>{s.name}</button>
                ))}
              </div>
              {selectedStrategy && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <p style={{ color: "#6B7280", fontSize: "12px" }}>Rule checklist</p>
                    {autoScore !== null && (
                      <span style={{
                        padding: "2px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700,
                        backgroundColor: autoScore >= 7 ? "rgba(139,92,246,0.15)" : "rgba(239,68,68,0.15)",
                        color: autoScore >= 7 ? "#A78BFA" : "#ef4444",
                      }}>
                        {checkedCount}/{totalRules} → {autoScore}/10
                      </span>
                    )}
                  </div>
                  {selectedStrategy.strategy_rules.sort((a, b) => a.order_index - b.order_index).map(rule => (
                    <div key={rule.id} onClick={() => setRuleChecks(r => ({ ...r, [rule.id]: !r[rule.id] }))}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "10px 12px", borderRadius: "8px", cursor: "pointer",
                        backgroundColor: ruleChecks[rule.id] ? "rgba(34,197,94,0.05)" : "transparent",
                        border: `1px solid ${ruleChecks[rule.id] ? "rgba(34,197,94,0.2)" : "#1F2937"}`,
                        transition: "all 0.15s",
                      }}>
                      <div style={{
                        width: "18px", height: "18px", borderRadius: "5px", flexShrink: 0,
                        border: `2px solid ${ruleChecks[rule.id] ? "#22c55e" : "#374151"}`,
                        backgroundColor: ruleChecks[rule.id] ? "#22c55e" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {ruleChecks[rule.id] && <span style={{ color: "#000", fontSize: "11px", fontWeight: 700 }}>✓</span>}
                      </div>
                      <span style={{ color: ruleChecks[rule.id] ? "#F9FAFB" : "#9CA3AF", fontSize: "13px" }}>{rule.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PREISE MODUL */}
          {modules.prices && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Entry</label>
                <input type="number" step="any" style={inputStyle} placeholder="0.00" value={form.entry_price} onChange={e => set("entry_price", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Exit</label>
                <input type="number" step="any" style={inputStyle} placeholder="0.00" value={form.exit_price} onChange={e => set("exit_price", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>Stop Loss (optional)</label>
                <input type="number" step="any" style={inputStyle} placeholder="0.00" value={form.stop_loss} onChange={e => set("stop_loss", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Take Profit (optional)</label>
                <input type="number" step="any" style={inputStyle} placeholder="0.00" value={form.take_profit} onChange={e => set("take_profit", e.target.value)} />
              </div>
            </div>
          )}

          {/* POSITION MODUL */}
          {modules.position && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>Lots</label>
                <input type="number" step="any" style={inputStyle} placeholder="0.01" value={form.lot_size} onChange={e => set("lot_size", e.target.value)} required />
              </div>
              <div>
                <label style={labelStyle}>
                  Risk (CHF)
                  {rMultiple && <span style={{ marginLeft: "6px", color: parseFloat(rMultiple) >= 0 ? "#22c55e" : "#ef4444" }}>→ {parseFloat(rMultiple) >= 0 ? "+" : ""}{rMultiple}R</span>}
                </label>
                <input type="number" step="any" style={inputStyle} placeholder="e.g. 50" value={form.risk_amount} onChange={e => set("risk_amount", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>P&L (CHF) *</label>
                <input type="number" step="any" style={inputStyle} placeholder="-50 or +120" value={form.pnl} onChange={e => set("pnl", e.target.value)} required />
              </div>
            </div>
          )}

          {/* P&L wenn kein Position-Modul */}
          {!modules.position && (
            <div>
              <label style={labelStyle}>P&L (CHF) *</label>
              <input type="number" step="any" style={inputStyle} placeholder="-50 or +120" value={form.pnl} onChange={e => set("pnl", e.target.value)} required />
            </div>
          )}

          {/* TIMEFRAME + SESSION */}
          {(modules.timeframe || modules.session) && (
            <div style={{ display: "grid", gridTemplateColumns: modules.timeframe && modules.session ? "1fr 1fr" : "1fr", gap: "12px" }}>
              {modules.timeframe && (
                <div>
                  <label style={labelStyle}>Timeframe</label>
                  <select style={selectStyle} value={form.timeframe} onChange={e => set("timeframe", e.target.value)}>
                    <option value="">— select —</option>
                    {TIMEFRAMES.map(tf => <option key={tf} value={tf}>{tf}</option>)}
                  </select>
                </div>
              )}
              {modules.session && (
                <div>
                  <label style={labelStyle}>Session</label>
                  <select style={selectStyle} value={form.session} onChange={e => set("session", e.target.value)}>
                    <option value="">— select —</option>
                    {SESSIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* PSYCHOLOGIE MODUL */}
          {modules.psychology && (
            <div>
              <label style={labelStyle}>Emotional State</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {EMOTIONS.map(em => (
                  <button key={em} type="button" onClick={() => set("emotional_state", form.emotional_state === em ? "" : em)}
                    style={{
                      padding: "6px 14px", borderRadius: "8px", fontSize: "13px", cursor: "pointer",
                      border: `1px solid ${form.emotional_state === em ? "#8B5CF6" : "#1F2937"}`,
                      backgroundColor: form.emotional_state === em ? "rgba(139,92,246,0.15)" : "transparent",
                      color: form.emotional_state === em ? "#A78BFA" : "#6B7280",
                    }}>{em}</button>
                ))}
              </div>
            </div>
          )}

          {/* CUSTOM FELDER MODUL */}
          {modules.custom && customFields.length > 0 && (
            <div style={{ backgroundColor: "#0d1117", border: "1px solid #1F2937", borderRadius: "12px", padding: "16px" }}>
              <p style={{ color: "#6B7280", fontSize: "12px", marginBottom: "12px" }}>Custom Fields</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {customFields.map(f => (
                  <div key={f.id}>
                    <label style={labelStyle}>{f.label}</label>
                    {f.field_type === "text" && (
                      <input type="text" style={inputStyle} value={customValues[f.id] ?? ""} onChange={e => setCustomValues(v => ({ ...v, [f.id]: e.target.value }))} />
                    )}
                    {f.field_type === "number" && (
                      <input type="number" step="any" style={inputStyle} value={customValues[f.id] ?? ""} onChange={e => setCustomValues(v => ({ ...v, [f.id]: e.target.value }))} />
                    )}
                    {f.field_type === "boolean" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {["Yes", "No"].map(opt => (
                          <button key={opt} type="button" onClick={() => setCustomValues(v => ({ ...v, [f.id]: opt }))}
                            style={{
                              padding: "10px", borderRadius: "10px", cursor: "pointer",
                              border: `1px solid ${customValues[f.id] === opt ? "#8B5CF6" : "#1F2937"}`,
                              backgroundColor: customValues[f.id] === opt ? "rgba(139,92,246,0.1)" : "transparent",
                              color: customValues[f.id] === opt ? "#A78BFA" : "#9CA3AF",
                              fontWeight: 600, fontSize: "13px",
                            }}>{opt}</button>
                        ))}
                      </div>
                    )}
                    {f.field_type === "select" && (
                      <select style={selectStyle} value={customValues[f.id] ?? ""} onChange={e => setCustomValues(v => ({ ...v, [f.id]: e.target.value }))}>
                        <option value="">— select —</option>
                        {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NOTIZEN MODUL */}
          {modules.notes && (
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
                placeholder="Why this trade? What went well/poorly?"
                value={form.notes} onChange={e => set("notes", e.target.value)} />
            </div>
          )}

          {riskWarning && (
            <div style={{
              backgroundColor: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.4)",
              borderRadius: "12px", padding: "14px 16px",
              display: "flex", gap: "12px", alignItems: "flex-start",
            }}>
              <span style={{ fontSize: "20px", flexShrink: 0 }}>⚠️</span>
              <div>
                <p style={{ color: "#FCA5A5", fontWeight: 600, fontSize: "13px", marginBottom: "4px" }}>
                  Risk Management Violation
                </p>
                <p style={{ color: "#F87171", fontSize: "13px", lineHeight: "1.5" }}>
                  {riskWarning.replace("⚠️ ", "")}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px", color: "#ef4444", fontSize: "13px" }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #1F2937", backgroundColor: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "14px" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{
              flex: 2, padding: "12px", borderRadius: "12px", border: "none",
              backgroundColor: riskWarning ? "#dc2626" : "#8B5CF6",
              color: "#F9FAFB", fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px", opacity: loading ? 0.7 : 1,
              transition: "background-color 0.2s",
            }}>
              {loading ? "Saving..." : riskWarning ? "⚠️ Save anyway" : trade ? "Save changes" : "Save trade"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
