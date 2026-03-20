"use client";
import { useState, useMemo } from "react";

interface Rule { id: string; text: string; }
interface FieldDef { id: string; label: string; field_type: string; }
interface SectionDef { id: string; name: string; template_fields: FieldDef[]; }

interface Journal {
  id: string;
  rules: Rule[];
  template_sections: SectionDef[];
}

interface TradeFieldValue {
  field_id: string;
  value: string;
  template_fields: { label: string };
}

interface Entry {
  id: string;
  trade_date: string;
  trade_field_values: TradeFieldValue[];
}

interface Props {
  journal: Journal;
  entry?: Entry;
  onClose: () => void;
  onSaved: () => void;
}

const SYMBOL_CHIPS = ["EUR/USD", "GBP/USD", "USD/JPY", "GBP/JPY", "NAS100", "US30", "XAUUSD"];
const EMOTIONS = ["😌 Calm", "🎯 Confident", "😰 Nervous", "🔥 FOMO", "💰 Greedy", "😨 Fearful", "😤 Frustrated", "🚀 Euphoric"];

const inp: React.CSSProperties = { backgroundColor: "#1a2332", border: "1px solid #1F2937", borderRadius: "8px", padding: "9px 12px", color: "#F9FAFB", fontSize: "14px", outline: "none", width: "100%" };

function buildFieldMap(journal: Journal): Record<string, string> {
  const map: Record<string, string> = {};
  for (const sec of journal.template_sections ?? []) {
    for (const f of sec.template_fields ?? []) map[f.label] = f.id;
  }
  return map;
}

function getInitialValue(entry: Entry | undefined, label: string): string {
  if (!entry) return "";
  const fv = entry.trade_field_values?.find(f => f.template_fields?.label === label);
  return fv?.value ?? "";
}

export default function TradeWizard({ journal, entry, onClose, onSaved }: Props) {
  const editing = !!entry;
  const fieldMap = useMemo(() => buildFieldMap(journal), [journal]);

  const initDate = entry
    ? new Date(entry.trade_date).toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const initTime = entry
    ? new Date(entry.trade_date).toTimeString().slice(0, 5)
    : new Date().toTimeString().slice(0, 5);

  // Step 1
  const [date, setDate] = useState(initDate);
  const [time, setTime] = useState(initTime);
  const [symbol, setSymbol] = useState(getInitialValue(entry, "Symbol"));
  const [direction, setDirection] = useState(getInitialValue(entry, "Direction"));

  // Step 2
  const [entryPrice, setEntryPrice] = useState(getInitialValue(entry, "Entry Price"));
  const [exitPrice, setExitPrice] = useState(getInitialValue(entry, "Exit Price"));
  const [sl, setSl] = useState(getInitialValue(entry, "Stop Loss"));
  const [tp, setTp] = useState(getInitialValue(entry, "Take Profit"));
  const [be, setBe] = useState(getInitialValue(entry, "BE"));
  const [volume, setVolume] = useState(getInitialValue(entry, "Volume"));
  const [pnl, setPnl] = useState(getInitialValue(entry, "P&L"));
  const [commission, setCommission] = useState(getInitialValue(entry, "Commission"));
  const [swap, setSwap] = useState(getInitialValue(entry, "Swap"));

  // Step 3
  const [setup, setSetup] = useState(getInitialValue(entry, "Setup"));
  const [emotions, setEmotions] = useState<string[]>(() => {
    const raw = getInitialValue(entry, "Emotions");
    if (!raw) return [];
    try { return JSON.parse(raw); } catch { return raw ? [raw] : []; }
  });
  const [emotionNote, setEmotionNote] = useState(getInitialValue(entry, "Emotion Note"));
  const [rulesFollowed, setRulesFollowed] = useState<Record<string, boolean>>(() => {
    const raw = getInitialValue(entry, "Rules Followed");
    if (!raw) return {};
    try {
      const parsed: { id: string; compliant: boolean }[] = JSON.parse(raw);
      return Object.fromEntries(parsed.map(r => [r.id, r.compliant]));
    } catch { return {}; }
  });
  const [notes, setNotes] = useState(getInitialValue(entry, "Notes"));

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slideBack, setSlideBack] = useState(false);

  const goTo = (n: number) => {
    setSlideBack(n < step);
    setTimeout(() => { setStep(n); setSlideBack(false); }, 10);
  };

  const toggleEmotion = (e: string) =>
    setEmotions(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]);

  const save = async () => {
    if (!symbol.trim()) { setError("Symbol is required"); return; }
    if (!direction) { setError("Direction is required"); return; }

    setSaving(true);
    setError(null);

    const tradeDate = new Date(`${date}T${time || "00:00"}`).toISOString();

    const rulesArr = journal.rules.map(r => ({ id: r.id, text: r.text, compliant: rulesFollowed[r.id] ?? true }));

    const fieldValues: Record<string, string> = {};
    const set = (label: string, val: string) => { if (fieldMap[label] && val.trim()) fieldValues[fieldMap[label]] = val; };

    set("Symbol", symbol.trim());
    set("Direction", direction);
    set("Volume", volume);
    set("Entry Price", entryPrice);
    set("Exit Price", exitPrice);
    set("Stop Loss", sl);
    set("Take Profit", tp);
    set("BE", be);
    set("P&L", pnl);
    set("Commission", commission);
    set("Swap", swap);
    set("Setup", setup);
    set("Emotion Note", emotionNote);
    set("Notes", notes);
    if (emotions.length > 0 && fieldMap["Emotions"]) fieldValues[fieldMap["Emotions"]] = JSON.stringify(emotions);
    if (rulesArr.length > 0 && fieldMap["Rules Followed"]) fieldValues[fieldMap["Rules Followed"]] = JSON.stringify(rulesArr);

    const url = editing ? `/api/v2/entries/${entry!.id}` : "/api/v2/entries";
    const body = editing
      ? { trade_date: tradeDate, field_values: fieldValues }
      : { template_id: journal.id, template_version: 1, trade_date: tradeDate, field_values: fieldValues };

    const res = await fetch(url, { method: editing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to save"); setSaving(false); return; }
    onSaved();
  };

  const stepLabel = ["Trade", "Numbers", "Reflection"];
  const panelKey = `step-${step}`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={onClose}>
      <div style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "20px", width: "100%", maxWidth: "560px", maxHeight: "94vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <h2 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "17px" }}>{editing ? "Edit Trade" : "Log Trade"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "22px" }}>×</button>
        </div>

        {/* Step Indicator */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "20px 28px 0", gap: 0, flexShrink: 0 }}>
          {stepLabel.map((label, i) => {
            const n = i + 1;
            const active = step === n;
            const done = step > n;
            return (
              <div key={n} style={{ display: "flex", alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, transition: "all 0.25s", border: `2px solid ${done ? "#22c55e" : active ? "#8B5CF6" : "#374151"}`, backgroundColor: done ? "rgba(34,197,94,0.15)" : active ? "#8B5CF6" : "#1a2332", color: done ? "#22c55e" : active ? "#fff" : "#6B7280" }}>
                    {done ? "✓" : n}
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 500, color: done ? "#22c55e" : active ? "#F9FAFB" : "#6B7280", whiteSpace: "nowrap" }}>{label}</span>
                </div>
                {i < 2 && <div style={{ height: "2px", width: "60px", margin: "17px 8px 0", backgroundColor: done ? "#22c55e" : "#1F2937", transition: "background 0.25s" }} />}
              </div>
            );
          })}
        </div>

        {/* Panel */}
        <div key={panelKey} style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px", animation: slideBack ? "wzBack 0.2s ease" : "wzIn 0.2s ease" }}>

          {/* STEP 1 */}
          {step === 1 && <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Date</label>
                <input type="date" style={inp} value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div>
                <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Time</label>
                <input type="time" style={inp} value={time} onChange={e => setTime(e.target.value)} />
              </div>
            </div>

            <div>
              <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "8px" }}>Symbol</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                {SYMBOL_CHIPS.map(s => (
                  <button key={s} type="button" onClick={() => setSymbol(s)}
                    style={{ padding: "5px 13px", borderRadius: "20px", border: `1px solid ${symbol === s ? "#8B5CF6" : "#374151"}`, backgroundColor: symbol === s ? "rgba(139,92,246,0.15)" : "transparent", color: symbol === s ? "#A78BFA" : "#9CA3AF", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    {s}
                  </button>
                ))}
              </div>
              <input style={inp} placeholder="or type your own symbol..." value={symbol} onChange={e => setSymbol(e.target.value)} />
            </div>

            <div>
              <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "8px" }}>Direction</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {[
                  { val: "Long", label: "▲ Long", clr: "#22c55e", bg: "rgba(34,197,94,0.15)" },
                  { val: "Short", label: "▼ Short", clr: "#ef4444", bg: "rgba(239,68,68,0.15)" },
                ].map(({ val, label: lbl, clr, bg }) => (
                  <button key={val} type="button" onClick={() => setDirection(val)}
                    style={{ padding: "20px 12px", borderRadius: "12px", border: `2px solid ${direction === val ? clr : "#374151"}`, backgroundColor: direction === val ? bg : "#1a2332", color: direction === val ? clr : "#9CA3AF", fontSize: "20px", fontWeight: 700, cursor: "pointer", transition: "all 0.2s", boxShadow: direction === val ? `0 0 0 1px ${clr}, 0 4px 20px ${bg}` : "none" }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          </>}

          {/* STEP 2 */}
          {step === 2 && <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              {[
                { label: "Entry Price", val: entryPrice, set: setEntryPrice },
                { label: "Exit Price",  val: exitPrice,  set: setExitPrice },
                { label: "Stop Loss",   val: sl,          set: setSl },
                { label: "Take Profit", val: tp,          set: setTp },
                { label: "BE",          val: be,          set: setBe },
                { label: "Volume",      val: volume,      set: setVolume },
              ].map(({ label: lbl, val, set }) => (
                <div key={lbl}>
                  <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>{lbl}</label>
                  <input type="number" step="any" style={inp} placeholder="0.00" value={val} onChange={e => set(e.target.value)} />
                </div>
              ))}
            </div>

            <div>
              <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>P&L <span style={{ color: "#6B7280" }}>result in account currency</span></label>
              <input type="number" step="any" style={{ ...inp, fontSize: "20px", fontWeight: 700, textAlign: "center", padding: "14px" }} placeholder="e.g. 120.00 or -45.00" value={pnl} onChange={e => setPnl(e.target.value)} />
            </div>

            <details style={{ border: "1px solid #1F2937", borderRadius: "10px", overflow: "hidden" }}>
              <summary style={{ padding: "10px 16px", fontSize: "13px", color: "#6B7280", cursor: "pointer", backgroundColor: "#1a2332", userSelect: "none", listStyle: "none" }}>
                ▸ Commission &amp; Swap <span style={{ color: "#4B5563" }}>(optional)</span>
              </summary>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", padding: "12px 16px", backgroundColor: "#1a2332" }}>
                <div>
                  <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Commission</label>
                  <input type="number" step="any" style={inp} placeholder="0.00" value={commission} onChange={e => setCommission(e.target.value)} />
                </div>
                <div>
                  <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Swap</label>
                  <input type="number" step="any" style={inp} placeholder="0.00" value={swap} onChange={e => setSwap(e.target.value)} />
                </div>
              </div>
            </details>
          </>}

          {/* STEP 3 */}
          {step === 3 && <>
            <div>
              <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Setup</label>
              <input style={inp} placeholder="e.g. Breakout, Pullback, OB retest..." value={setup} onChange={e => setSetup(e.target.value)} />
            </div>

            <div>
              <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "8px" }}>How did you feel?</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {EMOTIONS.map(e => {
                  const key = e.split(" ").slice(1).join(" ");
                  const active = emotions.includes(key);
                  return (
                    <button key={key} type="button" onClick={() => toggleEmotion(key)}
                      style={{ padding: "6px 14px", borderRadius: "20px", border: `1px solid ${active ? "#8B5CF6" : "#374151"}`, backgroundColor: active ? "rgba(139,92,246,0.15)" : "transparent", color: active ? "#A78BFA" : "#9CA3AF", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                      {e}
                    </button>
                  );
                })}
              </div>
              <input style={{ ...inp, marginTop: "10px" }} placeholder="Additional emotion note (optional)" value={emotionNote} onChange={e => setEmotionNote(e.target.value)} />
            </div>

            {journal.rules.length > 0 && (
              <div>
                <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "10px" }}>My Rules — followed?</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {journal.rules.map(r => (
                    <label key={r.id} style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "14px", color: "#D1D5DB" }}>
                      <input type="checkbox" checked={rulesFollowed[r.id] !== false} onChange={e => setRulesFollowed(prev => ({ ...prev, [r.id]: e.target.checked }))}
                        style={{ width: "16px", height: "16px", accentColor: "#8B5CF6", cursor: "pointer" }} />
                      {r.text}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Notes</label>
              <textarea style={{ ...inp, minHeight: "90px", resize: "vertical" }} placeholder="What went well? What would you do differently?" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            {error && <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#ef4444", fontSize: "13px" }}>{error}</div>}
          </>}
        </div>

        {/* Nav */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          {step > 1
            ? <button onClick={() => goTo(step - 1)} style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid #374151", backgroundColor: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "14px" }}>← Back</button>
            : <div />}
          {step < 3
            ? <button onClick={() => goTo(step + 1)} style={{ padding: "10px 22px", borderRadius: "10px", border: "none", backgroundColor: "#8B5CF6", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
                {step === 1 ? "Numbers →" : "Reflection →"}
              </button>
            : <button onClick={save} disabled={saving} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", backgroundColor: "#8B5CF6", color: "#fff", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontSize: "14px", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : editing ? "Save Changes ✓" : "Save Trade ✓"}
              </button>}
        </div>
      </div>

      <style>{`
        @keyframes wzIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes wzBack { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
