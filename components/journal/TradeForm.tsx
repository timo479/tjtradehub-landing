"use client";
import { useState } from "react";

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

const SETUPS = ["Breakout", "Retest", "Trend Follow", "Range", "News", "Scalp", "Swing", "Reversal"];
const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"];
const EMOTIONS = ["Ruhig", "Nervös", "FOMO", "Gierig", "Unsicher", "Confident"];

export default function TradeForm({ onClose, onSaved, trade }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    setup_type: trade?.setup_type ?? "",
    timeframe: trade?.timeframe ?? "",
    emotional_state: trade?.emotional_state ?? "",
    rule_break: trade ? !trade.followed_plan : false,
    discipline_score: trade?.discipline_score?.toString() ?? "7",
    notes: trade?.notes ?? "",
  });

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const rMultiple =
    form.pnl && form.risk_amount && parseFloat(form.risk_amount) > 0
      ? (parseFloat(form.pnl) / parseFloat(form.risk_amount)).toFixed(2)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const url = trade ? `/api/trades/${trade.id}` : "/api/trades";
      const method = trade ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Fehler beim Speichern");
        setLoading(false);
        return;
      }
      onSaved();
      onClose();
    } catch {
      setError("Netzwerkfehler");
    }
    setLoading(false);
  };

  const inputStyle = {
    backgroundColor: "#0a0a0a",
    border: "1px solid #1F2937",
    borderRadius: "10px",
    color: "#F9FAFB",
    padding: "10px 14px",
    width: "100%",
    fontSize: "14px",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    color: "#9CA3AF",
    fontSize: "12px",
    marginBottom: "6px",
    display: "block",
  };

  const selectStyle = {
    ...inputStyle,
    appearance: "none" as const,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        backgroundColor: "rgba(0,0,0,0.8)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px",
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#111827",
          border: "1px solid #1F2937",
          borderRadius: "20px",
          padding: "32px",
          width: "100%",
          maxWidth: "600px",
          margin: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ color: "#F9FAFB", fontSize: "18px", fontWeight: 600, marginBottom: "24px" }}>
          {trade ? "Trade bearbeiten" : "Trade erfassen"}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Date + Symbol */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Datum</label>
              <input type="date" style={inputStyle} value={form.trade_date}
                onChange={(e) => set("trade_date", e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Symbol</label>
              <input type="text" style={inputStyle} placeholder="z.B. XAUUSD" value={form.symbol}
                onChange={(e) => set("symbol", e.target.value)} required />
            </div>
          </div>

          {/* Direction */}
          <div>
            <label style={labelStyle}>Richtung</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {["buy", "sell"].map((d) => (
                <button key={d} type="button" onClick={() => set("direction", d)}
                  style={{
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

          {/* Setup + Timeframe */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Setup-Typ</label>
              <select style={selectStyle} value={form.setup_type}
                onChange={(e) => set("setup_type", e.target.value)}>
                <option value="">— wählen —</option>
                {SETUPS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Timeframe</label>
              <select style={selectStyle} value={form.timeframe}
                onChange={(e) => set("timeframe", e.target.value)}>
                <option value="">— wählen —</option>
                {TIMEFRAMES.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
              </select>
            </div>
          </div>

          {/* Entry / Exit / Lots */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Entry</label>
              <input type="number" step="any" style={inputStyle} placeholder="0.00"
                value={form.entry_price} onChange={(e) => set("entry_price", e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Exit</label>
              <input type="number" step="any" style={inputStyle} placeholder="0.00"
                value={form.exit_price} onChange={(e) => set("exit_price", e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>Lots</label>
              <input type="number" step="any" style={inputStyle} placeholder="0.01"
                value={form.lot_size} onChange={(e) => set("lot_size", e.target.value)} required />
            </div>
          </div>

          {/* Stop Loss + Take Profit */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Stop Loss (optional)</label>
              <input type="number" step="any" style={inputStyle} placeholder="0.00"
                value={form.stop_loss} onChange={(e) => set("stop_loss", e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Take Profit (optional)</label>
              <input type="number" step="any" style={inputStyle} placeholder="0.00"
                value={form.take_profit} onChange={(e) => set("take_profit", e.target.value)} />
            </div>
          </div>

          {/* P&L + Risk Amount */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>P&L (CHF)</label>
              <input type="number" step="any" style={inputStyle} placeholder="-50 oder +120"
                value={form.pnl} onChange={(e) => set("pnl", e.target.value)} required />
            </div>
            <div>
              <label style={labelStyle}>
                Risiko (CHF)
                {rMultiple && (
                  <span style={{ marginLeft: "8px", color: parseFloat(rMultiple) >= 0 ? "#22c55e" : "#ef4444" }}>
                    → {parseFloat(rMultiple) >= 0 ? "+" : ""}{rMultiple}R
                  </span>
                )}
              </label>
              <input type="number" step="any" style={inputStyle} placeholder="z.B. 50"
                value={form.risk_amount} onChange={(e) => set("risk_amount", e.target.value)} />
            </div>
          </div>

          {/* Emotional State + Rule Break */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Emotionaler Zustand</label>
              <select style={selectStyle} value={form.emotional_state}
                onChange={(e) => set("emotional_state", e.target.value)}>
                <option value="">— wählen —</option>
                {EMOTIONS.map((em) => <option key={em} value={em}>{em}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Regelbruch?</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "0px" }}>
                {[false, true].map((val) => (
                  <button key={String(val)} type="button" onClick={() => set("rule_break", val)}
                    style={{
                      padding: "10px", borderRadius: "10px",
                      border: `1px solid ${form.rule_break === val ? (val ? "#ef4444" : "#22c55e") : "#1F2937"}`,
                      backgroundColor: form.rule_break === val ? (val ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)") : "transparent",
                      color: form.rule_break === val ? (val ? "#ef4444" : "#22c55e") : "#9CA3AF",
                      fontWeight: 600, fontSize: "13px", cursor: "pointer",
                    }}>
                    {val ? "✕ Ja" : "✓ Nein"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Discipline Score */}
          <div>
            <label style={labelStyle}>
              Discipline Score: <strong style={{ color: "#8B5CF6" }}>{form.discipline_score}/10</strong>
            </label>
            <input type="range" min="1" max="10" value={form.discipline_score}
              onChange={(e) => set("discipline_score", e.target.value)}
              style={{ width: "100%", accentColor: "#8B5CF6" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
              <span style={{ color: "#6B7280", fontSize: "11px" }}>Regeln gebrochen</span>
              <span style={{ color: "#6B7280", fontSize: "11px" }}>Perfekt ausgeführt</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Notizen</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "80px" }}
              placeholder="Warum dieser Trade? Was lief gut/schlecht?"
              value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>

          {/* Error */}
          {error && (
            <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "10px", padding: "12px", color: "#ef4444", fontSize: "13px" }}>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
            <button type="button" onClick={onClose}
              style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #1F2937",
                backgroundColor: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "14px" }}>
              Abbrechen
            </button>
            <button type="submit" disabled={loading}
              style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none",
                backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer", fontSize: "14px", opacity: loading ? 0.7 : 1 }}>
              {loading ? "Speichern..." : trade ? "Änderungen speichern" : "Trade speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
