"use client";
import { useState, useMemo, useRef, useCallback, useEffect } from "react";

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

interface Screenshot {
  id: string;
  url: string;
  filename: string;
}

interface Entry {
  id: string;
  trade_date: string;
  trade_field_values: TradeFieldValue[];
  screenshots?: Screenshot[];
}

interface Props {
  journal: Journal;
  entry?: Entry;
  onClose: () => void;
  onSaved: () => void;
}

const DEFAULT_SYMBOLS = ["EUR/USD", "GBP/USD", "USD/JPY", "GBP/JPY", "NAS100", "US30", "XAUUSD"];
const CUSTOM_SYMBOLS_KEY = "tj-custom-symbols";
const CUSTOM_SETUPS_KEY = "tj-custom-setups";
const CUSTOM_EMOTIONS_KEY = "tj-custom-emotions";
const DEFAULT_SETUPS = ["Breakout", "Pullback", "OB Retest", "FVG", "Liquidity Grab", "Trend Follow"];
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

  // Always read/write dates as UTC – we store local time AS UTC to avoid timezone issues entirely
  const toUTCDate = (d: Date) =>
    `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    const d = entry ? new Date(entry.trade_date) : new Date();
    setDate(toUTCDate(d));
    setTime(`${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`);
  }, []);
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
  const [riskAmount, setRiskAmount] = useState(getInitialValue(entry, "Risk Amount"));
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

  // Custom symbols (persisted in localStorage)
  const [customSymbols, setCustomSymbols] = useState<string[]>([]);
  const [newSymbolInput, setNewSymbolInput] = useState("");
  const [showAddSymbol, setShowAddSymbol] = useState(false);
  const addSymbolRef = useRef<HTMLInputElement>(null);

  // Custom setups (persisted in localStorage)
  const [customSetups, setCustomSetups] = useState<string[]>([]);
  const [newSetupInput, setNewSetupInput] = useState("");
  const [showAddSetup, setShowAddSetup] = useState(false);
  const addSetupRef = useRef<HTMLInputElement>(null);

  // Custom emotions (persisted in localStorage)
  const [customEmotions, setCustomEmotions] = useState<string[]>([]);
  const [newEmotionInput, setNewEmotionInput] = useState("");
  const [showAddEmotion, setShowAddEmotion] = useState(false);
  const addEmotionRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { setCustomSymbols(JSON.parse(localStorage.getItem(CUSTOM_SYMBOLS_KEY) ?? "[]")); } catch { /* ignore */ }
    try { setCustomSetups(JSON.parse(localStorage.getItem(CUSTOM_SETUPS_KEY) ?? "[]")); } catch { /* ignore */ }
    try { setCustomEmotions(JSON.parse(localStorage.getItem(CUSTOM_EMOTIONS_KEY) ?? "[]")); } catch { /* ignore */ }
  }, []);

  const addCustomSymbol = () => {
    const s = newSymbolInput.trim().toUpperCase();
    if (!s || customSymbols.includes(s) || DEFAULT_SYMBOLS.includes(s)) { setNewSymbolInput(""); setShowAddSymbol(false); return; }
    const next = [...customSymbols, s];
    setCustomSymbols(next);
    localStorage.setItem(CUSTOM_SYMBOLS_KEY, JSON.stringify(next));
    setSymbol(s);
    setNewSymbolInput("");
    setShowAddSymbol(false);
  };

  const removeCustomSymbol = (s: string) => {
    const next = customSymbols.filter(c => c !== s);
    setCustomSymbols(next);
    localStorage.setItem(CUSTOM_SYMBOLS_KEY, JSON.stringify(next));
    if (symbol === s) setSymbol("");
  };

  const addCustomSetup = () => {
    const s = newSetupInput.trim();
    if (!s || customSetups.includes(s) || DEFAULT_SETUPS.includes(s)) { setNewSetupInput(""); setShowAddSetup(false); return; }
    const next = [...customSetups, s];
    setCustomSetups(next);
    localStorage.setItem(CUSTOM_SETUPS_KEY, JSON.stringify(next));
    setSetup(s);
    setNewSetupInput("");
    setShowAddSetup(false);
  };

  const removeCustomSetup = (s: string) => {
    const next = customSetups.filter(c => c !== s);
    setCustomSetups(next);
    localStorage.setItem(CUSTOM_SETUPS_KEY, JSON.stringify(next));
    if (setup === s) setSetup("");
  };

  const addCustomEmotion = () => {
    const s = newEmotionInput.trim();
    const defaultKeys = EMOTIONS.map(e => e.split(" ").slice(1).join(" "));
    if (!s || customEmotions.includes(s) || defaultKeys.includes(s)) { setNewEmotionInput(""); setShowAddEmotion(false); return; }
    const next = [...customEmotions, s];
    setCustomEmotions(next);
    localStorage.setItem(CUSTOM_EMOTIONS_KEY, JSON.stringify(next));
    setEmotions(prev => [...prev, s]);
    setNewEmotionInput("");
    setShowAddEmotion(false);
  };

  const removeCustomEmotion = (s: string) => {
    const next = customEmotions.filter(c => c !== s);
    setCustomEmotions(next);
    localStorage.setItem(CUSTOM_EMOTIONS_KEY, JSON.stringify(next));
    setEmotions(prev => prev.filter(e => e !== s));
  };
  const [slideBack, setSlideBack] = useState(false);
  const [savedEntryId, setSavedEntryId] = useState<string | null>(entry?.id ?? null);
  const [screenshots, setScreenshots] = useState<Screenshot[]>(entry?.screenshots ?? []);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const dateVal = date || toUTCDate(new Date());
    const timeVal = time || "00:00";
    // Store as plain UTC string – we treat the user's local time AS UTC intentionally
    // so that getUTCHours() always returns exactly what the user typed
    const tradeDate = `${dateVal}T${timeVal}:00`;

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
    set("Risk Amount", riskAmount);
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
    const entryId = editing ? entry!.id : data.id;
    setSavedEntryId(entryId);
    setSaving(false);
    goTo(4);
  };

  const uploadScreenshot = useCallback(async (file: File) => {
    if (!savedEntryId) return;
    if (screenshots.length >= 5) { setError("Max 5 screenshots per trade"); return; }
    if (!file.type.startsWith("image/")) { setError("Only images allowed"); return; }
    if (file.size > 10 * 1024 * 1024) { setError("File too large (max 10MB)"); return; }
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch(`/api/v2/entries/${savedEntryId}/screenshots`, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) setError(data.error ?? "Upload failed");
    else setScreenshots(prev => [...prev, data]);
    setUploading(false);
  }, [savedEntryId, screenshots.length]);

  const deleteScreenshot = async (screenshotId: string) => {
    if (!savedEntryId) return;
    await fetch(`/api/v2/entries/${savedEntryId}/screenshots?screenshot_id=${screenshotId}`, { method: "DELETE" });
    setScreenshots(prev => prev.filter(s => s.id !== screenshotId));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(f => uploadScreenshot(f));
  };

  const stepLabel = ["Trade", "Numbers", "Reflection", "Screenshots"];
  const panelKey = `step-${step}`;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={onClose}>
      <div style={{ background: "linear-gradient(145deg, #0f0f18, #090909)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "20px", boxShadow: "0 4px 32px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04)", width: "100%", maxWidth: "560px", maxHeight: "94vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

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
                {i < 3 && <div style={{ height: "2px", width: "60px", margin: "17px 8px 0", backgroundColor: done ? "#22c55e" : "#1F2937", transition: "background 0.25s" }} />}
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
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px", alignItems: "center" }}>
                {/* Default chips */}
                {DEFAULT_SYMBOLS.map(s => (
                  <button key={s} type="button" onClick={() => setSymbol(s)}
                    style={{ padding: "5px 13px", borderRadius: "20px", border: `1px solid ${symbol === s ? "#8B5CF6" : "#374151"}`, backgroundColor: symbol === s ? "rgba(139,92,246,0.15)" : "transparent", color: symbol === s ? "#A78BFA" : "#9CA3AF", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    {s}
                  </button>
                ))}
                {/* Custom chips */}
                {customSymbols.map(s => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: "2px", borderRadius: "20px", border: `1px solid ${symbol === s ? "#8B5CF6" : "#374151"}`, backgroundColor: symbol === s ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)", overflow: "hidden" }}>
                    <button type="button" onClick={() => setSymbol(s)}
                      style={{ padding: "5px 10px 5px 13px", background: "none", border: "none", color: symbol === s ? "#A78BFA" : "#9CA3AF", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      {s}
                    </button>
                    <button type="button" onClick={() => removeCustomSymbol(s)}
                      style={{ padding: "5px 8px 5px 2px", background: "none", border: "none", color: "#4B5563", fontSize: "13px", cursor: "pointer", lineHeight: 1 }}
                      title="Remove">×</button>
                  </div>
                ))}
                {/* Add button / inline input */}
                {showAddSymbol ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <input
                      ref={addSymbolRef}
                      autoFocus
                      value={newSymbolInput}
                      onChange={e => setNewSymbolInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomSymbol(); } if (e.key === "Escape") { setShowAddSymbol(false); setNewSymbolInput(""); } }}
                      placeholder="e.g. BTCUSD"
                      style={{ ...inp, width: "110px", padding: "4px 10px", fontSize: "12px", borderRadius: "20px" }}
                    />
                    <button type="button" onClick={addCustomSymbol}
                      style={{ padding: "4px 10px", borderRadius: "20px", border: "1px solid #8B5CF6", backgroundColor: "rgba(139,92,246,0.15)", color: "#A78BFA", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      Add
                    </button>
                    <button type="button" onClick={() => { setShowAddSymbol(false); setNewSymbolInput(""); }}
                      style={{ padding: "4px 8px", borderRadius: "20px", border: "1px solid #374151", backgroundColor: "transparent", color: "#6B7280", fontSize: "13px", cursor: "pointer" }}>
                      ×
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowAddSymbol(true)}
                    style={{ padding: "4px 11px", borderRadius: "20px", border: "1px dashed #374151", backgroundColor: "transparent", color: "#6B7280", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "14px", lineHeight: 1 }}>+</span> Add
                  </button>
                )}
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>P&L <span style={{ color: "#4B5563" }}>result</span></label>
                <input type="number" step="any" style={{ ...inp, fontSize: "18px", fontWeight: 700, textAlign: "center", padding: "14px", color: pnl === "" ? "#F9FAFB" : parseFloat(pnl) > 0 ? "#22c55e" : parseFloat(pnl) < 0 ? "#ef4444" : "#F9FAFB", border: `1px solid ${pnl === "" ? "#1F2937" : parseFloat(pnl) > 0 ? "rgba(34,197,94,0.4)" : parseFloat(pnl) < 0 ? "rgba(239,68,68,0.4)" : "#1F2937"}` }} placeholder="e.g. 120.00" value={pnl} onChange={e => setPnl(e.target.value)} />
              </div>
              <div>
                <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Risk Amount <span style={{ color: "#4B5563" }}>risked $</span></label>
                <input type="number" step="any" style={{ ...inp, fontSize: "18px", fontWeight: 700, textAlign: "center", padding: "14px" }} placeholder="e.g. 50.00" value={riskAmount} onChange={e => setRiskAmount(e.target.value)} />
              </div>
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
              <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "8px" }}>Setup</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px", alignItems: "center" }}>
                {/* Default setup chips */}
                {DEFAULT_SETUPS.map(s => (
                  <button key={s} type="button" onClick={() => setSetup(setup === s ? "" : s)}
                    style={{ padding: "5px 13px", borderRadius: "20px", border: `1px solid ${setup === s ? "#8B5CF6" : "#374151"}`, backgroundColor: setup === s ? "rgba(139,92,246,0.15)" : "transparent", color: setup === s ? "#A78BFA" : "#9CA3AF", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                    {s}
                  </button>
                ))}
                {/* Custom setup chips */}
                {customSetups.map(s => (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: "2px", borderRadius: "20px", border: `1px solid ${setup === s ? "#8B5CF6" : "#374151"}`, backgroundColor: setup === s ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)", overflow: "hidden" }}>
                    <button type="button" onClick={() => setSetup(setup === s ? "" : s)}
                      style={{ padding: "5px 10px 5px 13px", background: "none", border: "none", color: setup === s ? "#A78BFA" : "#9CA3AF", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      {s}
                    </button>
                    <button type="button" onClick={() => removeCustomSetup(s)}
                      style={{ padding: "5px 8px 5px 2px", background: "none", border: "none", color: "#4B5563", fontSize: "13px", cursor: "pointer", lineHeight: 1 }}
                      title="Remove">×</button>
                  </div>
                ))}
                {/* Add button / inline input */}
                {showAddSetup ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <input
                      ref={addSetupRef}
                      autoFocus
                      value={newSetupInput}
                      onChange={e => setNewSetupInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomSetup(); } if (e.key === "Escape") { setShowAddSetup(false); setNewSetupInput(""); } }}
                      placeholder="e.g. ICT CISD"
                      style={{ ...inp, width: "120px", padding: "4px 10px", fontSize: "12px", borderRadius: "20px" }}
                    />
                    <button type="button" onClick={addCustomSetup}
                      style={{ padding: "4px 10px", borderRadius: "20px", border: "1px solid #8B5CF6", backgroundColor: "rgba(139,92,246,0.15)", color: "#A78BFA", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      Add
                    </button>
                    <button type="button" onClick={() => { setShowAddSetup(false); setNewSetupInput(""); }}
                      style={{ padding: "4px 8px", borderRadius: "20px", border: "1px solid #374151", backgroundColor: "transparent", color: "#6B7280", fontSize: "13px", cursor: "pointer" }}>
                      ×
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowAddSetup(true)}
                    style={{ padding: "4px 11px", borderRadius: "20px", border: "1px dashed #374151", backgroundColor: "transparent", color: "#6B7280", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "14px", lineHeight: 1 }}>+</span> Add
                  </button>
                )}
              </div>
              <input style={inp} placeholder="or type a custom setup..." value={setup} onChange={e => setSetup(e.target.value)} />
            </div>

            <div>
              <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "8px" }}>How did you feel?</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
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
                {/* Custom emotion chips */}
                {customEmotions.map(e => {
                  const active = emotions.includes(e);
                  return (
                    <div key={e} style={{ display: "flex", alignItems: "center", gap: "2px", borderRadius: "20px", border: `1px solid ${active ? "#8B5CF6" : "#374151"}`, backgroundColor: active ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)", overflow: "hidden" }}>
                      <button type="button" onClick={() => toggleEmotion(e)}
                        style={{ padding: "6px 10px 6px 14px", background: "none", border: "none", color: active ? "#A78BFA" : "#9CA3AF", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}>
                        {e}
                      </button>
                      <button type="button" onClick={() => removeCustomEmotion(e)}
                        style={{ padding: "6px 8px 6px 2px", background: "none", border: "none", color: "#4B5563", fontSize: "13px", cursor: "pointer", lineHeight: 1 }}
                        title="Remove">×</button>
                    </div>
                  );
                })}
                {/* Add button / inline input */}
                {showAddEmotion ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <input
                      ref={addEmotionRef}
                      autoFocus
                      value={newEmotionInput}
                      onChange={e => setNewEmotionInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomEmotion(); } if (e.key === "Escape") { setShowAddEmotion(false); setNewEmotionInput(""); } }}
                      placeholder="e.g. Focused"
                      style={{ ...inp, width: "110px", padding: "4px 10px", fontSize: "12px", borderRadius: "20px" }}
                    />
                    <button type="button" onClick={addCustomEmotion}
                      style={{ padding: "4px 10px", borderRadius: "20px", border: "1px solid #8B5CF6", backgroundColor: "rgba(139,92,246,0.15)", color: "#A78BFA", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                      Add
                    </button>
                    <button type="button" onClick={() => { setShowAddEmotion(false); setNewEmotionInput(""); }}
                      style={{ padding: "4px 8px", borderRadius: "20px", border: "1px solid #374151", backgroundColor: "transparent", color: "#6B7280", fontSize: "13px", cursor: "pointer" }}>
                      ×
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setShowAddEmotion(true)}
                    style={{ padding: "4px 11px", borderRadius: "20px", border: "1px dashed #374151", backgroundColor: "transparent", color: "#6B7280", fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "14px", lineHeight: 1 }}>+</span> Add
                  </button>
                )}
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

          {/* STEP 4 – Screenshots */}
          {step === 4 && <>
            <div style={{ textAlign: "center", paddingBottom: "4px" }}>
              <div style={{ color: "#22c55e", fontSize: "32px", marginBottom: "8px" }}>✓</div>
              <p style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "15px", margin: "0 0 4px" }}>Trade saved!</p>
              <p style={{ color: "#6B7280", fontSize: "13px", margin: 0 }}>Add screenshots of your chart (optional)</p>
            </div>

            {/* Upload zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragOver ? "#8B5CF6" : "#374151"}`,
                borderRadius: "12px", padding: "28px 16px",
                textAlign: "center", cursor: "pointer",
                backgroundColor: dragOver ? "rgba(139,92,246,0.08)" : "#1a2332",
                transition: "all 0.2s",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: "none" }}
                onChange={e => handleFiles(e.target.files)}
              />
              {uploading ? (
                <p style={{ color: "#8B5CF6", fontSize: "14px", margin: 0 }}>Uploading...</p>
              ) : (
                <>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ margin: "0 auto 8px", display: "block" }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" stroke="#6B7280" strokeWidth="1.5"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="#6B7280"/>
                    <path d="M21 15l-5-5L5 21" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p style={{ color: "#9CA3AF", fontSize: "13px", margin: 0 }}>
                    Drop images here or <span style={{ color: "#8B5CF6" }}>click to upload</span>
                  </p>
                  <p style={{ color: "#4B5563", fontSize: "11px", margin: "4px 0 0" }}>
                    PNG, JPG, WebP · max 10MB · up to 5 screenshots
                  </p>
                </>
              )}
            </div>

            {/* Thumbnails */}
            {screenshots.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {screenshots.map(s => (
                  <div key={s.id} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", aspectRatio: "16/9", backgroundColor: "#0f172a" }}>
                    <img src={s.url} alt={s.filename} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      onClick={() => deleteScreenshot(s.id)}
                      style={{
                        position: "absolute", top: "4px", right: "4px",
                        width: "20px", height: "20px", borderRadius: "50%",
                        backgroundColor: "rgba(0,0,0,0.7)", border: "none",
                        color: "#ef4444", cursor: "pointer", fontSize: "12px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {error && <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", padding: "10px 14px", color: "#ef4444", fontSize: "13px" }}>{error}</div>}
          </>}
        </div>

        {/* Nav */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          {step > 1 && step < 4
            ? <button onClick={() => goTo(step - 1)} style={{ padding: "10px 20px", borderRadius: "10px", border: "1px solid #374151", backgroundColor: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "14px" }}>← Back</button>
            : <div />}
          {step < 3 && (
            <button onClick={() => goTo(step + 1)} style={{ padding: "10px 22px", borderRadius: "10px", border: "none", backgroundColor: "#8B5CF6", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
              {step === 1 ? "Numbers →" : "Reflection →"}
            </button>
          )}
          {step === 3 && (
            <button onClick={save} disabled={saving} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", backgroundColor: "#8B5CF6", color: "#fff", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontSize: "14px", opacity: saving ? 0.7 : 1 }}>
              {saving ? "Saving..." : editing ? "Save Changes ✓" : "Save Trade ✓"}
            </button>
          )}
          {step === 4 && (
            <button onClick={onSaved} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", backgroundColor: "#22c55e", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
              Done ✓
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes wzIn { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes wzBack { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
