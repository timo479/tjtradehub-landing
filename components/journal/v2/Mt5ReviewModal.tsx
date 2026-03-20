"use client";
import { useState, useMemo } from "react";
import { TemplateDef, FieldDef } from "./DynamicTradeForm";

interface FieldValue {
  field_id: string;
  value: string;
  template_fields: { id: string; label: string; field_type: string };
}

interface Entry {
  id: string;
  trade_date: string;
  trade_field_values: FieldValue[];
}

interface Props {
  entry: Entry;
  templates: TemplateDef[];
  onClose: () => void;
  onSaved: () => void;
}

const MT5_LABELS = ["Symbol","Direction","Volume","Entry Price","Exit Price","P&L","Commission","Swap","Comment"];

const inputStyle: React.CSSProperties = {
  backgroundColor: "#0a0a0a",
  border: "1px solid #1F2937",
  borderRadius: "10px",
  color: "#F9FAFB",
  padding: "10px 14px",
  fontSize: "14px",
  outline: "none",
  width: "100%",
};

function FieldInput({ field, value, onChange, onToggleMulti }: {
  field: FieldDef;
  value: string | string[] | boolean | undefined;
  onChange: (v: string | string[] | boolean) => void;
  onToggleMulti: (opt: string) => void;
}) {
  const label = (
    <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>
      {field.label}{field.is_required && <span style={{ color: "#8B5CF6", marginLeft: "4px" }}>*</span>}
    </label>
  );

  if (field.field_type === "boolean") {
    const checked = value === true || value === "true";
    return (
      <div>
        {label}
        <button type="button" onClick={() => onChange(!checked)}
          style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <div style={{ width: "42px", height: "24px", borderRadius: "12px", backgroundColor: checked ? "#8B5CF6" : "#1F2937", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: "3px", left: checked ? "21px" : "3px", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#fff", transition: "left 0.2s" }} />
          </div>
          <span style={{ color: checked ? "#A78BFA" : "#6B7280", fontSize: "14px" }}>{checked ? "Yes" : "No"}</span>
        </button>
      </div>
    );
  }

  if (field.field_type === "select") {
    return (
      <div>
        {label}
        <select style={{ ...inputStyle, cursor: "pointer" }} value={(value as string) ?? ""} onChange={e => onChange(e.target.value)}>
          <option value="">— Select —</option>
          {(field.options ?? []).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  if (field.field_type === "multiselect") {
    const selected = (value as string[]) ?? [];
    return (
      <div>
        {label}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {(field.options ?? []).map(o => {
            const active = selected.includes(o);
            return (
              <button key={o} type="button" onClick={() => onToggleMulti(o)}
                style={{ padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 500, border: `1px solid ${active ? "#8B5CF6" : "#1F2937"}`, backgroundColor: active ? "rgba(139,92,246,0.15)" : "transparent", color: active ? "#A78BFA" : "#9CA3AF" }}>
                {o}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.field_type === "number") {
    return (
      <div>
        {label}
        <input type="number" step="any" style={inputStyle} placeholder="0" value={(value as string) ?? ""} onChange={e => onChange(e.target.value)} />
      </div>
    );
  }

  if (field.field_type === "file") {
    return (
      <div>
        {label}
        <div style={{ padding: "20px", borderRadius: "10px", border: "1px dashed #374151", backgroundColor: "#0a0a0a", textAlign: "center" }}>
          <p style={{ color: "#4B5563", fontSize: "13px" }}>📎 Screenshot upload coming soon</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {label}
      <input type="text" style={inputStyle} placeholder={field.label} value={(value as string) ?? ""} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

export default function Mt5ReviewModal({ entry, templates, onClose, onSaved }: Props) {
  const [selectedJournalId, setSelectedJournalId] = useState<string>("");
  const [values, setValues] = useState<Record<string, string | string[] | boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // MT5 data by label
  const mt5ByLabel = useMemo(() => {
    const map: Record<string, string> = {};
    for (const fv of entry.trade_field_values ?? []) {
      const label = fv.template_fields?.label;
      if (label) map[label] = fv.value;
    }
    return map;
  }, [entry]);

  // Journals available for review (exclude MetaAPI Import template)
  const reviewableTemplates = useMemo(
    () => templates.filter(t => t.name !== "MetaAPI Import"),
    [templates]
  );

  // Selected journal template
  const selectedJournal = useMemo(
    () => reviewableTemplates.find(t => t.id === selectedJournalId) ?? null,
    [reviewableTemplates, selectedJournalId]
  );

  // When journal changes, pre-fill matching MT5 fields
  const handleJournalSelect = (journalId: string) => {
    setSelectedJournalId(journalId);
    const journal = reviewableTemplates.find(t => t.id === journalId);
    if (!journal) { setValues({}); return; }

    const prefilled: Record<string, string | string[] | boolean> = {};
    for (const sec of journal.template_sections ?? []) {
      for (const field of sec.template_fields ?? []) {
        if (MT5_LABELS.includes(field.label) && mt5ByLabel[field.label] !== undefined) {
          const raw = mt5ByLabel[field.label];
          if (field.field_type === "boolean") prefilled[field.id] = raw === "true";
          else prefilled[field.id] = raw;
        }
      }
    }
    setValues(prefilled);
  };

  const setValue = (fieldId: string, val: string | string[] | boolean) =>
    setValues(prev => ({ ...prev, [fieldId]: val }));

  const toggleMulti = (fieldId: string, opt: string) => {
    const current = (values[fieldId] as string[]) ?? [];
    setValue(fieldId, current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt]);
  };

  const save = async () => {
    if (!selectedJournalId) { setError("Please select a journal"); return; }

    // Validate required
    for (const sec of selectedJournal?.template_sections ?? []) {
      for (const f of sec.template_fields ?? []) {
        if (!f.is_required) continue;
        const v = values[f.id];
        if (v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) {
          setError(`Required field missing: "${f.label}"`); return;
        }
      }
    }

    setSaving(true);
    setError(null);

    const fieldValues: Record<string, string | string[] | boolean> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v !== "" && v !== null && v !== undefined) fieldValues[k] = v;
    }

    const res = await fetch(`/api/v2/entries/${entry.id}/review`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ journal_id: selectedJournalId, field_values: fieldValues }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Failed to save"); setSaving(false); return; }
    onSaved();
  };

  // MT5 summary values for the header card
  const symbol    = mt5ByLabel["Symbol"] ?? "—";
  const direction = mt5ByLabel["Direction"] ?? null;
  const pnl       = mt5ByLabel["P&L"] ? parseFloat(mt5ByLabel["P&L"]) : null;
  const date      = new Date(entry.trade_date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
  const time      = new Date(entry.trade_date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  const sections = [...(selectedJournal?.template_sections ?? [])].sort((a, b) => a.order_index - b.order_index);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={onClose}>
      <div style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "20px", width: "100%", maxWidth: "640px", maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 28px", borderBottom: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h2 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "18px" }}>Review MT5 Trade</h2>
            <p style={{ color: "#6B7280", fontSize: "13px", marginTop: "2px" }}>Assign to a journal and add your review</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "20px" }}>✕</button>
        </div>

        {/* Scroll Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* MT5 Trade Summary Card */}
          <div style={{ backgroundColor: "#0a0a0a", border: "1px solid #1F2937", borderRadius: "14px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <div>
              <p style={{ color: "#4B5563", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>Instrument</p>
              <p style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "18px" }}>{symbol}</p>
            </div>
            {direction && (
              <div>
                <p style={{ color: "#4B5563", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>Direction</p>
                <span style={{ fontSize: "12px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px", backgroundColor: direction === "Long" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: direction === "Long" ? "#22c55e" : "#ef4444" }}>
                  {direction === "Long" ? "▲ LONG" : "▼ SHORT"}
                </span>
              </div>
            )}
            {pnl !== null && (
              <div>
                <p style={{ color: "#4B5563", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>P&L</p>
                <p style={{ color: pnl >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700, fontSize: "18px" }}>
                  {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)}
                </p>
              </div>
            )}
            {mt5ByLabel["Entry Price"] && mt5ByLabel["Exit Price"] && (
              <div>
                <p style={{ color: "#4B5563", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>Entry → Exit</p>
                <p style={{ color: "#9CA3AF", fontSize: "13px", fontWeight: 600 }}>
                  {parseFloat(mt5ByLabel["Entry Price"]).toFixed(5).replace(/\.?0+$/,"")} → {parseFloat(mt5ByLabel["Exit Price"]).toFixed(5).replace(/\.?0+$/,"")}
                </p>
              </div>
            )}
            <div style={{ marginLeft: "auto" }}>
              <p style={{ color: "#4B5563", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>Date</p>
              <p style={{ color: "#9CA3AF", fontSize: "13px" }}>{date} · {time}</p>
            </div>
          </div>

          {/* Journal Selector */}
          <div>
            <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>
              Add to Journal <span style={{ color: "#8B5CF6" }}>*</span>
            </label>
            {reviewableTemplates.length === 0 ? (
              <div style={{ padding: "14px", borderRadius: "10px", border: "1px solid rgba(245,158,11,0.3)", backgroundColor: "rgba(245,158,11,0.08)", color: "#F59E0B", fontSize: "13px" }}>
                No journals yet. Create one in Templates first.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {reviewableTemplates.map(t => {
                  const active = selectedJournalId === t.id;
                  return (
                    <button key={t.id} type="button" onClick={() => handleJournalSelect(t.id)}
                      style={{ padding: "8px 16px", borderRadius: "10px", cursor: "pointer", fontSize: "13px", fontWeight: 600, border: `1px solid ${active ? "#8B5CF6" : "#1F2937"}`, backgroundColor: active ? "rgba(139,92,246,0.15)" : "transparent", color: active ? "#A78BFA" : "#9CA3AF", transition: "all 0.15s" }}>
                      {t.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Journal Fields */}
          {selectedJournal && sections.map(section => {
            const fields = [...(section.template_fields ?? [])].sort((a, b) => a.order_index - b.order_index);
            return (
              <div key={section.id}>
                <h3 style={{ color: "#8B5CF6", fontWeight: 600, fontSize: "12px", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {section.name}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {fields.map(field => (
                    <FieldInput
                      key={field.id}
                      field={field}
                      value={values[field.id]}
                      onChange={val => setValue(field.id, val)}
                      onToggleMulti={opt => toggleMulti(field.id, opt)}
                    />
                  ))}
                </div>
              </div>
            );
          })}

          {error && (
            <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px", color: "#ef4444", fontSize: "13px" }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 28px", borderTop: "1px solid #1F2937", display: "flex", gap: "12px", flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "12px", borderRadius: "12px", border: "1px solid #1F2937", backgroundColor: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "14px" }}>
            Cancel
          </button>
          <button onClick={save} disabled={saving || !selectedJournalId}
            style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none", backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600, cursor: (saving || !selectedJournalId) ? "not-allowed" : "pointer", fontSize: "14px", opacity: (saving || !selectedJournalId) ? 0.5 : 1 }}>
            {saving ? "Saving..." : "Save Review"}
          </button>
        </div>
      </div>
    </div>
  );
}
