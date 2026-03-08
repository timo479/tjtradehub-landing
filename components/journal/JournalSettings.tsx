"use client";
import { useState, useEffect } from "react";

interface Strategy {
  id: string;
  name: string;
  description?: string;
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

interface RiskSettings {
  max_risk_per_trade?: string;
  max_daily_loss?: string;
  account_size?: string;
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

const MODULE_LIST = [
  { key: "strategy", label: "Strategy & Rule Checklist", desc: "Define your trading rules – Discipline Score is calculated automatically", icon: "🎯" },
  { key: "prices", label: "Prices", desc: "Entry, Exit, Stop Loss, Take Profit", icon: "💰" },
  { key: "position", label: "Position & Risk", desc: "Lots, Risk CHF, R-Multiple", icon: "📐" },
  { key: "timeframe", label: "Timeframe", desc: "Which timeframe for the trade", icon: "⏱️" },
  { key: "session", label: "Session", desc: "London, New York, Asia, Overlap", icon: "🌍" },
  { key: "psychology", label: "Psychology", desc: "Emotional state during the trade", icon: "🧠" },
  { key: "notes", label: "Notes", desc: "Free-text notes for the trade", icon: "📝" },
  { key: "custom", label: "Custom Fields", desc: "Enable any custom fields you need", icon: "🔧" },
];

export default function JournalSettings({ onClose, onSaved }: Props) {
  const [tab, setTab] = useState<"modules" | "strategies" | "custom" | "risk">("modules");
  const [modules, setModules] = useState<Modules>({
    prices: true, position: true, timeframe: true,
    session: false, psychology: false, notes: true,
    strategy: true, custom: false,
  });
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [saving, setSaving] = useState(false);
  const [riskSettings, setRiskSettings] = useState<RiskSettings>({});

  // Strategy form
  const [showStrategyForm, setShowStrategyForm] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<Strategy | null>(null);
  const [stratName, setStratName] = useState("");
  const [stratDesc, setStratDesc] = useState("");
  const [stratRules, setStratRules] = useState<string[]>([""]);

  // Custom field form
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState<"text" | "number" | "boolean" | "select">("text");
  const [fieldOptions, setFieldOptions] = useState("");

  useEffect(() => {
    fetch("/api/journal-config").then(r => r.json()).then(d => {
      if (d.modules) setModules(d.modules);
      if (d.risk_settings) setRiskSettings(d.risk_settings);
    });
    fetch("/api/strategies").then(r => r.json()).then(d => setStrategies(Array.isArray(d) ? d : []));
    fetch("/api/custom-fields").then(r => r.json()).then(d => setCustomFields(Array.isArray(d) ? d : []));
  }, []);

  const saveModules = async () => {
    setSaving(true);
    await fetch("/api/journal-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modules }),
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  const saveRiskSettings = async () => {
    setSaving(true);
    await fetch("/api/journal-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ risk_settings: riskSettings }),
    });
    setSaving(false);
    onSaved();
    onClose();
  };

  const saveStrategy = async () => {
    const rules = stratRules.filter(r => r.trim());
    if (!stratName.trim() || !rules.length) return;
    if (editingStrategy) {
      await fetch(`/api/strategies/${editingStrategy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: stratName, description: stratDesc, rules }),
      });
    } else {
      await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: stratName, description: stratDesc, rules }),
      });
    }
    const res = await fetch("/api/strategies");
    setStrategies(await res.json());
    setShowStrategyForm(false);
    setEditingStrategy(null);
    setStratName(""); setStratDesc(""); setStratRules([""]);
  };

  const deleteStrategy = async (id: string) => {
    if (!confirm("Delete strategy?")) return;
    await fetch(`/api/strategies/${id}`, { method: "DELETE" });
    setStrategies(s => s.filter(x => x.id !== id));
  };

  const openEditStrategy = (s: Strategy) => {
    setEditingStrategy(s);
    setStratName(s.name);
    setStratDesc(s.description ?? "");
    setStratRules(s.strategy_rules.sort((a, b) => a.order_index - b.order_index).map(r => r.label));
    setShowStrategyForm(true);
  };

  const saveCustomField = async () => {
    if (!fieldLabel.trim()) return;
    const options = fieldType === "select" ? fieldOptions.split(",").map(o => o.trim()).filter(Boolean) : undefined;
    await fetch("/api/custom-fields", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: fieldLabel, field_type: fieldType, options }),
    });
    const res = await fetch("/api/custom-fields");
    setCustomFields(await res.json());
    setShowFieldForm(false);
    setFieldLabel(""); setFieldType("text"); setFieldOptions("");
  };

  const deleteCustomField = async (id: string) => {
    await fetch(`/api/custom-fields/${id}`, { method: "DELETE" });
    setCustomFields(f => f.filter(x => x.id !== id));
  };

  const inputStyle = {
    backgroundColor: "#0a0a0a", border: "1px solid #1F2937",
    borderRadius: "10px", color: "#F9FAFB",
    padding: "10px 14px", width: "100%", fontSize: "14px", outline: "none",
  };

  const tabStyle = (active: boolean) => ({
    padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
    fontSize: "14px", fontWeight: active ? 600 : 400,
    backgroundColor: active ? "#8B5CF6" : "transparent",
    color: active ? "#F9FAFB" : "#6B7280",
  });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      backgroundColor: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "20px",
    }} onClick={onClose}>
      <div style={{
        backgroundColor: "#111827", border: "1px solid #1F2937",
        borderRadius: "20px", width: "100%", maxWidth: "680px",
        maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "24px 28px", borderBottom: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "18px" }}>Configure Journal</h2>
            <p style={{ color: "#6B7280", fontSize: "13px", marginTop: "2px" }}>Build your journal exactly the way you need it</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "20px" }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ padding: "16px 28px", borderBottom: "1px solid #1F2937", display: "flex", gap: "8px" }}>
          {([["modules", "Modules"], ["strategies", "Strategies"], ["custom", "Custom Fields"], ["risk", "⚠️ Risk"]] as const).map(([key, label]) => (
            <button key={key} style={tabStyle(tab === key)} onClick={() => setTab(key)}>{label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

          {/* MODULES TAB */}
          {tab === "modules" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {MODULE_LIST.map(m => (
                <div key={m.key} style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", borderRadius: "12px",
                  backgroundColor: modules[m.key as keyof Modules] ? "rgba(139,92,246,0.05)" : "#0d1117",
                  border: `1px solid ${modules[m.key as keyof Modules] ? "rgba(139,92,246,0.3)" : "#1F2937"}`,
                  cursor: "pointer", transition: "all 0.15s",
                }} onClick={() => setModules(prev => ({ ...prev, [m.key]: !prev[m.key as keyof Modules] }))}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "20px" }}>{m.icon}</span>
                    <div>
                      <p style={{ color: "#F9FAFB", fontWeight: 500, fontSize: "14px" }}>{m.label}</p>
                      <p style={{ color: "#6B7280", fontSize: "12px", marginTop: "2px" }}>{m.desc}</p>
                    </div>
                  </div>
                  <div style={{
                    width: "44px", height: "24px", borderRadius: "12px",
                    backgroundColor: modules[m.key as keyof Modules] ? "#8B5CF6" : "#1F2937",
                    position: "relative", transition: "background 0.2s", flexShrink: 0,
                  }}>
                    <div style={{
                      position: "absolute", top: "3px",
                      left: modules[m.key as keyof Modules] ? "22px" : "3px",
                      width: "18px", height: "18px", borderRadius: "50%",
                      backgroundColor: "#F9FAFB", transition: "left 0.2s",
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STRATEGIES TAB */}
          {tab === "strategies" && (
            <div>
              {!showStrategyForm ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <p style={{ color: "#9CA3AF", fontSize: "13px" }}>
                      Define your trading strategies with rule checklists. The Discipline Score is calculated automatically.
                    </p>
                    <button onClick={() => setShowStrategyForm(true)} style={{
                      backgroundColor: "#8B5CF6", color: "#F9FAFB", border: "none",
                      borderRadius: "10px", padding: "8px 16px", fontSize: "13px",
                      fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", marginLeft: "16px",
                    }}>+ Strategy</button>
                  </div>
                  {strategies.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#4B5563" }}>
                      <p style={{ fontSize: "14px" }}>No strategies defined yet.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {strategies.map(s => (
                        <div key={s.id} style={{ backgroundColor: "#0d1117", border: "1px solid #1F2937", borderRadius: "12px", padding: "16px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                            <div>
                              <p style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "14px" }}>{s.name}</p>
                              {s.description && <p style={{ color: "#6B7280", fontSize: "12px", marginTop: "2px" }}>{s.description}</p>}
                            </div>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button onClick={() => openEditStrategy(s)} style={{ background: "none", border: "1px solid #1F2937", borderRadius: "6px", color: "#9CA3AF", cursor: "pointer", padding: "4px 10px", fontSize: "12px" }}>Edit</button>
                              <button onClick={() => deleteStrategy(s.id)} style={{ background: "none", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", color: "#ef4444", cursor: "pointer", padding: "4px 10px", fontSize: "12px" }}>Delete</button>
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {s.strategy_rules.sort((a, b) => a.order_index - b.order_index).map(r => (
                              <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{ color: "#374151", fontSize: "12px" }}>☐</span>
                                <span style={{ color: "#9CA3AF", fontSize: "13px" }}>{r.label}</span>
                              </div>
                            ))}
                          </div>
                          <p style={{ color: "#4B5563", fontSize: "11px", marginTop: "10px" }}>{s.strategy_rules.length} rule{s.strategy_rules.length !== 1 ? "s" : ""}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                    <button onClick={() => { setShowStrategyForm(false); setEditingStrategy(null); setStratName(""); setStratDesc(""); setStratRules([""]); }}
                      style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: "18px" }}>←</button>
                    <h3 style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "16px" }}>
                      {editingStrategy ? "Edit strategy" : "New strategy"}
                    </h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Name *</label>
                      <input style={inputStyle} placeholder='e.g. "London Breakout"' value={stratName} onChange={e => setStratName(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Description (optional)</label>
                      <input style={inputStyle} placeholder="Short description of the strategy" value={stratDesc} onChange={e => setStratDesc(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "8px" }}>Rules (checklist) *</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {stratRules.map((rule, i) => (
                          <div key={i} style={{ display: "flex", gap: "8px" }}>
                            <input style={{ ...inputStyle, flex: 1 }}
                              placeholder={`Rule ${i + 1}, e.g. "Trend confirmed on H4"`}
                              value={rule} onChange={e => {
                                const updated = [...stratRules];
                                updated[i] = e.target.value;
                                setStratRules(updated);
                              }} />
                            {stratRules.length > 1 && (
                              <button onClick={() => setStratRules(stratRules.filter((_, j) => j !== i))}
                                style={{ background: "none", border: "1px solid #1F2937", borderRadius: "8px", color: "#4B5563", cursor: "pointer", padding: "0 12px", fontSize: "16px" }}>✕</button>
                            )}
                          </div>
                        ))}
                        <button onClick={() => setStratRules([...stratRules, ""])}
                          style={{ backgroundColor: "transparent", border: "1px dashed #374151", borderRadius: "10px", color: "#6B7280", cursor: "pointer", padding: "10px", fontSize: "13px" }}>
                          + Add rule
                        </button>
                      </div>
                    </div>
                    <button onClick={saveStrategy} style={{
                      backgroundColor: "#8B5CF6", color: "#F9FAFB", border: "none",
                      borderRadius: "12px", padding: "12px", fontWeight: 600, cursor: "pointer", fontSize: "14px",
                    }}>
                      {editingStrategy ? "Save changes" : "Create strategy"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CUSTOM FIELDS TAB */}
          {tab === "custom" && (
            <div>
              {!showFieldForm ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <p style={{ color: "#9CA3AF", fontSize: "13px" }}>Add custom fields that fit your trading system.</p>
                    <button onClick={() => setShowFieldForm(true)} style={{
                      backgroundColor: "#8B5CF6", color: "#F9FAFB", border: "none",
                      borderRadius: "10px", padding: "8px 16px", fontSize: "13px",
                      fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", marginLeft: "16px",
                    }}>+ Feld</button>
                  </div>
                  {customFields.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#4B5563", fontSize: "14px" }}>
                      No custom fields yet. First enable the "Custom Fields" module.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {customFields.map(f => (
                        <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#0d1117", border: "1px solid #1F2937", borderRadius: "10px", padding: "12px 16px" }}>
                          <div>
                            <p style={{ color: "#F9FAFB", fontSize: "14px", fontWeight: 500 }}>{f.label}</p>
                            <p style={{ color: "#6B7280", fontSize: "12px", marginTop: "2px" }}>
                              {f.field_type === "text" ? "Text" : f.field_type === "number" ? "Number" : f.field_type === "boolean" ? "Yes/No" : `Select: ${f.options?.join(", ")}`}
                            </p>
                          </div>
                          <button onClick={() => deleteCustomField(f.id)} style={{ background: "none", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "6px", color: "#ef4444", cursor: "pointer", padding: "4px 10px", fontSize: "12px" }}>Delete</button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                    <button onClick={() => setShowFieldForm(false)}
                      style={{ background: "none", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: "18px" }}>←</button>
                    <h3 style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "16px" }}>New Field</h3>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Field name *</label>
                      <input style={inputStyle} placeholder='e.g. "HTF Bias", "Spread", "News Event"' value={fieldLabel} onChange={e => setFieldLabel(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "8px" }}>Field type</label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                        {([["text", "Text", "Free text"], ["number", "Number", "Numeric value"], ["boolean", "Yes / No", "Toggle"], ["select", "Select", "Dropdown"]] as const).map(([val, label, desc]) => (
                          <button key={val} type="button" onClick={() => setFieldType(val)}
                            style={{
                              padding: "10px", borderRadius: "10px", textAlign: "left",
                              border: `1px solid ${fieldType === val ? "#8B5CF6" : "#1F2937"}`,
                              backgroundColor: fieldType === val ? "rgba(139,92,246,0.1)" : "transparent",
                              cursor: "pointer",
                            }}>
                            <p style={{ color: fieldType === val ? "#8B5CF6" : "#F9FAFB", fontSize: "13px", fontWeight: 600 }}>{label}</p>
                            <p style={{ color: "#6B7280", fontSize: "11px", marginTop: "2px" }}>{desc}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                    {fieldType === "select" && (
                      <div>
                        <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Options (comma-separated)</label>
                        <input style={inputStyle} placeholder='e.g. "Long, Short, Neutral"' value={fieldOptions} onChange={e => setFieldOptions(e.target.value)} />
                      </div>
                    )}
                    <button onClick={saveCustomField} style={{
                      backgroundColor: "#8B5CF6", color: "#F9FAFB", border: "none",
                      borderRadius: "12px", padding: "12px", fontWeight: 600, cursor: "pointer", fontSize: "14px",
                    }}>Create field</button>
                  </div>
                </div>
              )}
            </div>
          )}
          {/* RISK TAB */}
          {tab === "risk" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ backgroundColor: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "14px 16px" }}>
                <p style={{ color: "#FCA5A5", fontSize: "13px", lineHeight: "1.5" }}>
                  If you exceed your defined limit by more than <strong>20%</strong> when logging a trade, you will be warned before saving.
                </p>
              </div>

              <div>
                <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>
                  Max. risk per trade (CHF)
                </label>
                <input
                  type="number" step="any"
                  style={inputStyle}
                  placeholder="e.g. 50"
                  value={riskSettings.max_risk_per_trade ?? ""}
                  onChange={e => setRiskSettings(r => ({ ...r, max_risk_per_trade: e.target.value }))}
                />
                <p style={{ color: "#4B5563", fontSize: "11px", marginTop: "4px" }}>
                  Warning above &gt; {riskSettings.max_risk_per_trade ? (parseFloat(riskSettings.max_risk_per_trade) * 1.2).toFixed(2) : "—"} CHF
                </p>
              </div>

              <div>
                <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>
                  Max. daily loss (CHF)
                </label>
                <input
                  type="number" step="any"
                  style={inputStyle}
                  placeholder="e.g. 150"
                  value={riskSettings.max_daily_loss ?? ""}
                  onChange={e => setRiskSettings(r => ({ ...r, max_daily_loss: e.target.value }))}
                />
                <p style={{ color: "#4B5563", fontSize: "11px", marginTop: "4px" }}>
                  Warning when daily P&L drops below -{riskSettings.max_daily_loss ?? "—"} CHF
                </p>
              </div>

              <div>
                <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>
                  Account size (CHF) <span style={{ color: "#4B5563" }}>optional</span>
                </label>
                <input
                  type="number" step="any"
                  style={inputStyle}
                  placeholder="e.g. 10000"
                  value={riskSettings.account_size ?? ""}
                  onChange={e => setRiskSettings(r => ({ ...r, account_size: e.target.value }))}
                />
                {riskSettings.account_size && riskSettings.max_risk_per_trade && (
                  <p style={{ color: "#4B5563", fontSize: "11px", marginTop: "4px" }}>
                    = {((parseFloat(riskSettings.max_risk_per_trade) / parseFloat(riskSettings.account_size)) * 100).toFixed(2)}% of account per trade
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        {(tab === "modules" || tab === "risk") && (
          <div style={{ padding: "16px 28px", borderTop: "1px solid #1F2937", display: "flex", gap: "12px" }}>
            <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #1F2937", backgroundColor: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "14px" }}>
              Cancel
            </button>
            <button onClick={tab === "risk" ? saveRiskSettings : saveModules} disabled={saving}
              style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none", backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
