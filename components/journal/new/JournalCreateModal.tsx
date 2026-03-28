"use client";
import { useState } from "react";

interface Rule { id: string; text: string; }

interface Journal {
  id?: string;
  name: string;
  instrument_type: string;
  time_from: string;
  time_to: string;
  risk_per_trade: number | null;
  max_trades_per_day: number | null;
  starting_balance: number | null;
  rules: Rule[];
}

interface Props {
  initial?: Journal;
  onClose: () => void;
  onSaved: (journal: Journal & { id: string }) => void;
}

const PRESET_RULES = [
  { cat: "Risk", rules: ["No trade over 1% risk", "RRR minimum 1:2", "Max. 2% daily loss — then stop", "No overnight positions", "Calculate position size before every trade"] },
  { cat: "Setup", rules: ["Only trade with the trend", "Only A-setups", "No trade against HTF bias", "Entry only on confirmed setup", "No trade before major news", "No trade without a clear SL level"] },
  { cat: "Psychology", rules: ["No revenge trade after a loss", "Stop after 2 consecutive losses", "No FOMO trade", "Only trade at full focus", "No trading when in a bad mood"] },
  { cat: "Preparation", rules: ["Market analysis before session", "Check economic calendar", "Watchlist prepared", "No trading without morning routine"] },
];

const uid = () => Math.random().toString(36).slice(2, 10);

const inp: React.CSSProperties = { backgroundColor: "#1a2332", border: "1px solid #1F2937", borderRadius: "8px", padding: "9px 12px", color: "#F9FAFB", fontSize: "14px", outline: "none", width: "100%" };

export default function JournalCreateModal({ initial, onClose, onSaved }: Props) {
  const editing = !!initial?.id;
  const [name, setName] = useState(initial?.name ?? "");
  const [instrumentType, setInstrumentType] = useState(initial?.instrument_type ?? "Forex");
  const [timeFrom, setTimeFrom] = useState(initial?.time_from ?? "08:00");
  const [timeTo, setTimeTo] = useState(initial?.time_to ?? "17:00");
  const [riskPerTrade, setRiskPerTrade] = useState(String(initial?.risk_per_trade ?? ""));
  const [maxTrades, setMaxTrades] = useState(String(initial?.max_trades_per_day ?? ""));
  const [startingBalance, setStartingBalance] = useState(String(initial?.starting_balance ?? ""));
  const [rules, setRules] = useState<Rule[]>(initial?.rules ?? []);
  const [showPresets, setShowPresets] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRule = () => {
    if (rules.length >= 10) return;
    setRules(prev => [...prev, { id: uid(), text: "" }]);
  };

  const updateRule = (id: string, text: string) =>
    setRules(prev => prev.map(r => r.id === id ? { ...r, text } : r));

  const removeRule = (id: string) =>
    setRules(prev => prev.filter(r => r.id !== id));

  const addPreset = (text: string) => {
    if (rules.length >= 10) return;
    if (rules.some(r => r.text === text)) return;
    setRules(prev => [...prev, { id: uid(), text }]);
  };

  const save = async () => {
    if (!name.trim()) { setError("Journal name required"); return; }
    setSaving(true);
    setError(null);

    const cleanRules = rules.filter(r => r.text.trim()).map(r => ({ id: r.id, text: r.text.trim() }));
    const body = {
      name: name.trim(),
      instrument_type: instrumentType,
      time_from: timeFrom,
      time_to: timeTo,
      risk_per_trade: riskPerTrade ? parseFloat(riskPerTrade) : null,
      max_trades_per_day: maxTrades ? parseInt(maxTrades) : null,
      starting_balance: startingBalance ? parseFloat(startingBalance) : null,
      rules: cleanRules,
    };

    const url = editing ? `/api/v2/journals/${initial!.id}` : "/api/v2/journals";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();

    if (!res.ok) { setError(data.error ?? "Failed to save"); setSaving(false); return; }
    onSaved(editing ? { ...body, id: initial!.id!, rules: cleanRules } : data);
  };

  const label: React.CSSProperties = { color: "#9CA3AF", fontSize: "13px", fontWeight: 500, marginBottom: "6px", display: "block" };
  const row: React.CSSProperties = { display: "flex", gap: "12px" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={onClose}>
      <div style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "14px", width: "100%", maxWidth: "540px", maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <h3 style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "17px" }}>{editing ? "Edit Journal" : "Create New Journal"}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "22px", lineHeight: 1 }}>×</button>
        </div>

        {/* Scroll Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Name */}
          <div>
            <label style={label}>Journal Name</label>
            <input style={inp} placeholder="e.g. Forex, Futures..." value={name} onChange={e => setName(e.target.value)} />
          </div>

          {/* Instrument Type */}
          <div>
            <label style={label}>Instrument Type</label>
            <select style={{ ...inp, cursor: "pointer" }} value={instrumentType} onChange={e => setInstrumentType(e.target.value)}>
              {["Forex", "Futures", "Stocks", "Crypto", "Indices"].map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>

          {/* Trading Hours */}
          <div style={row}>
            <div style={{ flex: 1 }}>
              <label style={label}>Trading Hours From</label>
              <input type="time" style={inp} value={timeFrom} onChange={e => setTimeFrom(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>Trading Hours To</label>
              <input type="time" style={inp} value={timeTo} onChange={e => setTimeTo(e.target.value)} />
            </div>
          </div>

          {/* Risk + Max Trades */}
          <div style={row}>
            <div style={{ flex: 1 }}>
              <label style={label}>Risk per Trade (%)</label>
              <input type="number" step="0.1" style={inp} placeholder="e.g. 1" value={riskPerTrade} onChange={e => setRiskPerTrade(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>Max. Trades per Day</label>
              <input type="number" style={inp} placeholder="e.g. 3" value={maxTrades} onChange={e => setMaxTrades(e.target.value)} />
            </div>
          </div>

          {/* Starting Balance */}
          <div>
            <label style={label}>Starting Balance <span style={{ color: "#6B7280" }}>($) – for Risk Discipline tracking</span></label>
            <input type="number" step="0.01" style={inp} placeholder="e.g. 10000" value={startingBalance} onChange={e => setStartingBalance(e.target.value)} />
          </div>

          {/* Rules */}
          <div>
            <label style={label}>My Rules <span style={{ color: "#6B7280" }}>(max. 10)</span></label>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {rules.map(rule => (
                <div key={rule.id} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input style={{ ...inp, flex: 1 }} placeholder="Enter rule..." value={rule.text} onChange={e => updateRule(rule.id, e.target.value)} />
                  <button onClick={() => removeRule(rule.id)} style={{ padding: "8px 10px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "13px", flexShrink: 0 }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
              <button onClick={addRule} disabled={rules.length >= 10} style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid #374151", backgroundColor: "transparent", color: rules.length >= 10 ? "#374151" : "#9CA3AF", cursor: rules.length >= 10 ? "not-allowed" : "pointer", fontSize: "13px" }}>
                + Custom Rule
              </button>
              <button onClick={() => setShowPresets(v => !v)} style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${showPresets ? "rgba(139,92,246,0.5)" : "#374151"}`, backgroundColor: showPresets ? "rgba(139,92,246,0.1)" : "transparent", color: showPresets ? "#A78BFA" : "#9CA3AF", cursor: "pointer", fontSize: "13px" }}>
                💡 Suggestions
              </button>
            </div>

            {/* Preset Panel */}
            {showPresets && (
              <div style={{ marginTop: "12px", backgroundColor: "#0f1923", border: "1px solid #1F2937", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                {PRESET_RULES.map(cat => (
                  <div key={cat.cat}>
                    <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6B7280", marginBottom: "8px" }}>{cat.cat}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {cat.rules.map(r => {
                        const added = rules.some(x => x.text === r);
                        return (
                          <button key={r} onClick={() => addPreset(r)} disabled={added || rules.length >= 10}
                            style={{ padding: "5px 12px", borderRadius: "20px", border: `1px solid ${added ? "#22c55e" : "#374151"}`, backgroundColor: added ? "rgba(34,197,94,0.1)" : "transparent", color: added ? "#22c55e" : "#9CA3AF", fontSize: "12px", cursor: added || rules.length >= 10 ? "default" : "pointer" }}>
                            {r}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#ef4444", fontSize: "13px" }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "1px solid #1F2937", display: "flex", gap: "10px", justifyContent: "flex-end", flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #1F2937", backgroundColor: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding: "9px 20px", borderRadius: "8px", border: "none", backgroundColor: "#8B5CF6", color: "#fff", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontSize: "14px", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : editing ? "Save Changes" : "Create Journal"}
          </button>
        </div>
      </div>
    </div>
  );
}
