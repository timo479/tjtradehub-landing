"use client";
import { useState } from "react";

export interface FieldDef {
  id: string;
  label: string;
  field_type: "text" | "number" | "boolean" | "select" | "multiselect" | "datetime" | "file";
  is_required: boolean;
  options: string[] | null;
  order_index: number;
}

export interface SectionDef {
  id: string;
  name: string;
  order_index: number;
  template_fields: FieldDef[];
}

export interface TemplateDef {
  id: string;
  name: string;
  version: number;
  is_frozen: boolean;
  template_sections: SectionDef[];
}

interface Props {
  template: TemplateDef;
  onClose: () => void;
  onSaved: () => void;
  entryId?: string;
  initialDate?: string;
  initialValues?: Record<string, string | string[] | boolean>;
}

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

export default function DynamicTradeForm({ template, onClose, onSaved, entryId, initialDate, initialValues }: Props) {
  const [values, setValues] = useState<Record<string, string | string[] | boolean>>(initialValues ?? {});
  const [tradeDate, setTradeDate] = useState(initialDate ?? new Date().toISOString().slice(0, 16));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sections = [...(template.template_sections ?? [])].sort((a, b) => a.order_index - b.order_index);

  const setValue = (fieldId: string, val: string | string[] | boolean) => {
    setValues(prev => ({ ...prev, [fieldId]: val }));
  };

  const toggleMulti = (fieldId: string, opt: string) => {
    const current = (values[fieldId] as string[]) ?? [];
    setValue(fieldId, current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt]);
  };

  const save = async () => {
    // Validate required
    for (const sec of sections) {
      const fields = [...(sec.template_fields ?? [])].sort((a, b) => a.order_index - b.order_index);
      for (const f of fields) {
        if (!f.is_required) continue;
        const v = values[f.id];
        if (v === undefined || v === "" || v === null || (Array.isArray(v) && v.length === 0)) {
          setError(`Pflichtfeld fehlt: "${f.label}"`);
          return;
        }
      }
    }

    setSaving(true);
    setError(null);

    const fieldValues: Record<string, string | string[] | boolean> = {};
    for (const [k, v] of Object.entries(values)) {
      if (v !== "" && v !== null && v !== undefined) fieldValues[k] = v;
    }

    const res = await fetch(entryId ? `/api/v2/entries/${entryId}` : "/api/v2/entries", {
      method: entryId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_id: template.id,
        template_version: template.version,
        trade_date: new Date(tradeDate).toISOString(),
        field_values: fieldValues,
      }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    onSaved();
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={onClose}>
      <div style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "20px", width: "100%", maxWidth: "640px", maxHeight: "92vh", overflow: "hidden", display: "flex", flexDirection: "column" }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "24px 28px", borderBottom: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <div>
            <h2 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "18px" }}>{entryId ? "Trade bearbeiten" : "Trade erfassen"}</h2>
            <p style={{ color: "#6B7280", fontSize: "13px", marginTop: "2px" }}>{template.name} · v{template.version}</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "20px" }}>✕</button>
        </div>

        {/* Scroll Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* Trade Date */}
          <div>
            <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Trade Datum & Uhrzeit *</label>
            <input
              type="datetime-local"
              style={inputStyle}
              value={tradeDate}
              onChange={e => setTradeDate(e.target.value)}
            />
          </div>

          {/* Dynamic Sections */}
          {sections.map(section => {
            const fields = [...(section.template_fields ?? [])].sort((a, b) => (a as unknown as { order_index: number }).order_index - (b as unknown as { order_index: number }).order_index);
            return (
              <div key={section.id}>
                <h3 style={{ color: "#8B5CF6", fontWeight: 600, fontSize: "13px", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
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
          <button onClick={save} disabled={saving} style={{ flex: 2, padding: "12px", borderRadius: "12px", border: "none", backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer", fontSize: "14px", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving..." : entryId ? "Save changes" : "Save trade"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldInput({ field, value, onChange, onToggleMulti }: {
  field: FieldDef;
  value: string | string[] | boolean | undefined;
  onChange: (v: string | string[] | boolean) => void;
  onToggleMulti: (opt: string) => void;
}) {
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
        <button
          type="button"
          onClick={() => onChange(!checked)}
          style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <div style={{ width: "42px", height: "24px", borderRadius: "12px", backgroundColor: checked ? "#8B5CF6" : "#1F2937", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: "3px", left: checked ? "21px" : "3px", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#fff", transition: "left 0.2s" }} />
          </div>
          <span style={{ color: checked ? "#A78BFA" : "#6B7280", fontSize: "14px" }}>{checked ? "Ja" : "Nein"}</span>
        </button>
      </div>
    );
  }

  if (field.field_type === "select") {
    const opts = field.options ?? [];
    return (
      <div>
        {label}
        <select
          style={{ ...inputStyle, cursor: "pointer" }}
          value={(value as string) ?? ""}
          onChange={e => onChange(e.target.value)}>
          <option value="">— Auswählen —</option>
          {opts.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  if (field.field_type === "multiselect") {
    const opts = field.options ?? [];
    const selected = (value as string[]) ?? [];
    return (
      <div>
        {label}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {opts.map(o => {
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

  if (field.field_type === "datetime") {
    return (
      <div>
        {label}
        <input type="datetime-local" style={inputStyle} value={(value as string) ?? ""} onChange={e => onChange(e.target.value)} />
      </div>
    );
  }

  if (field.field_type === "file") {
    return (
      <div>
        {label}
        <div style={{ padding: "20px", borderRadius: "10px", border: "1px dashed #374151", backgroundColor: "#0a0a0a", textAlign: "center" }}>
          <p style={{ color: "#4B5563", fontSize: "13px" }}>📎 Screenshot-Upload kommt bald</p>
        </div>
      </div>
    );
  }

  // text fallback
  return (
    <div>
      {label}
      <input type="text" style={inputStyle} placeholder={field.label} value={(value as string) ?? ""} onChange={e => onChange(e.target.value)} />
    </div>
  );
}
