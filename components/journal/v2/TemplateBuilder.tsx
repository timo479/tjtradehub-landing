"use client";
import { useState } from "react";

export type FieldType = "text" | "number" | "boolean" | "select" | "multiselect" | "datetime" | "file";

export interface FieldDef {
  id: string;
  label: string;
  field_type: FieldType;
  is_required: boolean;
  options: string[];
}

export interface SectionDef {
  id: string;
  name: string;
  fields: FieldDef[];
}

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

const FIELD_TYPES: { value: FieldType; label: string; icon: string }[] = [
  { value: "text",        label: "Text",         icon: "T"  },
  { value: "number",      label: "Number",       icon: "#"  },
  { value: "boolean",     label: "Yes / No",     icon: "✓"  },
  { value: "select",      label: "Select",       icon: "▾"  },
  { value: "multiselect", label: "Multi-Select", icon: "☑"  },
  { value: "datetime",    label: "Date & Time",  icon: "📅" },
  { value: "file",        label: "File",         icon: "📎" },
];

const STANDARD_TEMPLATE: SectionDef[] = [
  {
    id: "s1", name: "Trade Info",
    fields: [
      { id: "f1", label: "Symbol / Asset",    field_type: "text",     is_required: true,  options: [] },
      { id: "f2", label: "Date & Time",        field_type: "datetime", is_required: true,  options: [] },
      { id: "f3", label: "Direction",         field_type: "select",   is_required: true,  options: ["Long", "Short"] },
      { id: "f4", label: "Setup Name",        field_type: "text",     is_required: true,  options: [] },
      { id: "f5", label: "Instrument",        field_type: "select",   is_required: true,  options: ["Stocks", "Futures", "Forex", "Crypto", "Options", "CFDs"] },
      { id: "f6", label: "P&L",              field_type: "number",   is_required: false, options: [] },
    ],
  },
  {
    id: "s2", name: "Discipline Checks",
    fields: [
      { id: "f7",  label: "Setup followed?",       field_type: "boolean", is_required: true, options: [] },
      { id: "f8",  label: "Stop-Loss set?",        field_type: "boolean", is_required: true, options: [] },
      { id: "f9",  label: "Revenge Trade?",        field_type: "boolean", is_required: true, options: [] },
      { id: "f10", label: "Exited too early?",     field_type: "boolean", is_required: true, options: [] },
    ],
  },
  {
    id: "s3", name: "Psychology & Notes",
    fields: [
      { id: "f11", label: "Emotions",         field_type: "multiselect", is_required: false, options: ["Greedy", "Fearful", "Impatient", "Confident", "Calm", "Nervous"] },
      { id: "f12", label: "Notes",            field_type: "text",        is_required: false, options: [] },
      { id: "f13", label: "Chart Screenshot", field_type: "file",        is_required: false, options: [] },
    ],
  },
];

const uid = () => Math.random().toString(36).slice(2);

const inp: React.CSSProperties = {
  backgroundColor: "#0a0a0a",
  border: "1px solid #1F2937",
  borderRadius: "10px",
  color: "#F9FAFB",
  padding: "10px 14px",
  fontSize: "14px",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export default function TemplateBuilder({ onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [sections, setSections] = useState<SectionDef[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field-Add Modal State
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState<FieldType>("text");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldOptions, setFieldOptions] = useState<string[]>([]);
  const [optionInput, setOptionInput] = useState("");

  const totalFields = sections.reduce((s, sec) => s + sec.fields.length, 0);

  const loadStandard = () => {
    setName("My Trading Journal");
    setSections(STANDARD_TEMPLATE.map(s => ({ ...s, id: uid(), fields: s.fields.map(f => ({ ...f, id: uid() })) })));
  };

  const addSection = () => {
    if (sections.length >= 3) return;
    setSections(prev => [...prev, { id: uid(), name: `Section ${prev.length + 1}`, fields: [] }]);
  };

  const openAddField = (sectionId: string) => {
    setAddingTo(sectionId);
    setFieldLabel("");
    setFieldType("text");
    setFieldRequired(false);
    setFieldOptions([]);
    setOptionInput("");
  };

  const closeAddField = () => setAddingTo(null);

  const addOption = () => {
    if (!optionInput.trim()) return;
    setFieldOptions(prev => [...prev, optionInput.trim()]);
    setOptionInput("");
  };

  const confirmField = () => {
    if (!fieldLabel.trim() || !addingTo) return;
    const field: FieldDef = {
      id: uid(),
      label: fieldLabel.trim(),
      field_type: fieldType,
      is_required: fieldRequired,
      options: fieldOptions,
    };
    setSections(prev => prev.map(s => s.id === addingTo ? { ...s, fields: [...s.fields, field] } : s));
    closeAddField();
  };

  const removeField = (sectionId: string, fieldId: string) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, fields: s.fields.filter(f => f.id !== fieldId) } : s));
  };

  const removeSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
  };

  const save = async () => {
    if (!name.trim()) { setError("Template needs a name"); return; }
    if (sections.length === 0) { setError("At least one section required"); return; }
    if (totalFields === 0) { setError("At least one field required"); return; }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/v2/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, sections }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    onSaved();
  };

  return (
    <>
      {/* Main Modal */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 50, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
        onClick={onClose}
      >
        <div
          style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "20px", width: "100%", maxWidth: "700px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ padding: "22px 28px", borderBottom: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <div>
              <h2 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "18px", margin: 0 }}>Create Journal Template</h2>
              <p style={{ color: "#6B7280", fontSize: "13px", marginTop: "4px", marginBottom: 0 }}>
                {totalFields}/20 fields · {sections.length}/3 sections
              </p>
            </div>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "22px", lineHeight: 1, padding: "4px" }}>✕</button>
          </div>

          {/* Scrollable Content */}
          <div style={{ flex: 1, overflowY: "scroll", padding: "24px 28px", display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* Template Name */}
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Template Name *</label>
                <input
                  style={inp}
                  placeholder='e.g. "My Trading Journal"'
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <button
                onClick={loadStandard}
                style={{ padding: "10px 16px", borderRadius: "10px", border: "1px solid rgba(139,92,246,0.5)", backgroundColor: "rgba(139,92,246,0.1)", color: "#A78BFA", fontSize: "13px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
              >
                Load template
              </button>
            </div>

            {/* Sections */}
            {sections.map((section, si) => (
              <div key={section.id} style={{ backgroundColor: "#0d1117", border: "1px solid #1F2937", borderRadius: "14px" }}>
                {/* Section Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderBottom: "1px solid #1F2937" }}>
                  <span style={{ color: "#6B7280", fontSize: "11px", fontWeight: 700, backgroundColor: "#1F2937", borderRadius: "6px", padding: "2px 8px", flexShrink: 0 }}>S{si + 1}</span>
                  <input
                    style={{ ...inp, padding: "6px 10px", backgroundColor: "transparent", border: "none", fontSize: "14px", fontWeight: 600, flex: 1 }}
                    value={section.name}
                    onChange={e => setSections(prev => prev.map(s => s.id === section.id ? { ...s, name: e.target.value } : s))}
                    placeholder="Section name"
                  />
                  <button onClick={() => removeSection(section.id)} style={{ background: "none", border: "none", color: "#4B5563", cursor: "pointer", fontSize: "16px", padding: "4px", flexShrink: 0 }}>✕</button>
                </div>

                {/* Fields */}
                <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {section.fields.map(field => (
                    <div key={field.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", backgroundColor: "#111827", borderRadius: "10px", border: "1px solid #1F2937" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#6B7280", backgroundColor: "#1F2937", borderRadius: "4px", padding: "2px 6px", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {FIELD_TYPES.find(t => t.value === field.field_type)?.label}
                      </span>
                      <span style={{ color: "#F9FAFB", fontSize: "13px", flex: 1 }}>{field.label}</span>
                      {field.options.length > 0 && (
                        <span style={{ color: "#4B5563", fontSize: "11px", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{field.options.join(", ")}</span>
                      )}
                      {field.is_required && <span style={{ color: "#8B5CF6", fontSize: "11px", flexShrink: 0 }}>Required</span>}
                      <button onClick={() => removeField(section.id, field.id)} style={{ background: "none", border: "none", color: "#374151", cursor: "pointer", fontSize: "16px", padding: "2px", flexShrink: 0 }}>✕</button>
                    </div>
                  ))}

                  <button
                    onClick={() => openAddField(section.id)}
                    disabled={totalFields >= 20}
                    style={{ padding: "10px", borderRadius: "10px", border: "1px dashed #1F2937", backgroundColor: "transparent", color: totalFields >= 20 ? "#374151" : "#6B7280", cursor: totalFields >= 20 ? "not-allowed" : "pointer", fontSize: "13px" }}
                  >
                    + Add field{totalFields >= 20 ? " (Max. reached)" : ""}
                  </button>
                </div>
              </div>
            ))}

            {/* Add Section */}
            {sections.length < 3 && (
              <button
                onClick={addSection}
                style={{ padding: "14px", borderRadius: "14px", border: "1px dashed #374151", backgroundColor: "transparent", color: "#6B7280", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}
              >
                + Add section ({sections.length}/3)
              </button>
            )}

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
              {saving ? "Creating..." : "Create template"}
            </button>
          </div>
        </div>
      </div>

      {/* Add Field Modal (separate overlay, higher z-index) */}
      {addingTo && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 60, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={closeAddField}
        >
          <div
            style={{ backgroundColor: "#111827", border: "1px solid rgba(139,92,246,0.4)", borderRadius: "18px", width: "100%", maxWidth: "480px", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <h3 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "16px", margin: 0 }}>Add Field</h3>
              <button onClick={closeAddField} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "20px", lineHeight: 1, padding: "4px" }}>✕</button>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: "scroll", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Field Name */}
              <div>
                <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Field name *</label>
                <input
                  style={inp}
                  placeholder='e.g. "P&L", "Symbol", "Notes"'
                  value={fieldLabel}
                  onChange={e => setFieldLabel(e.target.value)}
                  autoFocus
                />
              </div>

              {/* Field Type */}
              <div>
                <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "8px" }}>Field type</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {FIELD_TYPES.map(ft => (
                    <button
                      key={ft.value}
                      type="button"
                      onClick={() => { setFieldType(ft.value); setFieldOptions([]); }}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "10px",
                        cursor: "pointer",
                        textAlign: "left",
                        border: `1px solid ${fieldType === ft.value ? "#8B5CF6" : "#1F2937"}`,
                        backgroundColor: fieldType === ft.value ? "rgba(139,92,246,0.15)" : "#0d1117",
                        color: fieldType === ft.value ? "#A78BFA" : "#9CA3AF",
                        fontSize: "13px",
                        fontWeight: fieldType === ft.value ? 600 : 400,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "15px" }}>{ft.icon}</span>
                      {ft.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options for select/multiselect */}
              {(fieldType === "select" || fieldType === "multiselect") && (
                <div>
                  <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "8px" }}>Options</label>
                  {fieldOptions.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                      {fieldOptions.map((opt, i) => (
                        <span key={i} style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 10px", backgroundColor: "#1F2937", borderRadius: "8px", fontSize: "12px", color: "#F9FAFB" }}>
                          {opt}
                          <button
                            type="button"
                            onClick={() => setFieldOptions(prev => prev.filter((_, j) => j !== i))}
                            style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", padding: "0 0 0 2px", fontSize: "13px", lineHeight: 1 }}
                          >✕</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      style={{ ...inp, flex: 1, padding: "8px 12px" }}
                      placeholder="Add option + Enter"
                      value={optionInput}
                      onChange={e => setOptionInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                    />
                    <button
                      type="button"
                      onClick={addOption}
                      style={{ padding: "8px 14px", borderRadius: "10px", backgroundColor: "#1F2937", border: "none", color: "#9CA3AF", cursor: "pointer", fontSize: "13px", flexShrink: 0 }}
                    >+</button>
                  </div>
                </div>
              )}

              {/* Required */}
              <button
                type="button"
                onClick={() => setFieldRequired(r => !r)}
                style={{ display: "flex", alignItems: "center", gap: "10px", background: "none", border: "none", cursor: "pointer", padding: 0, alignSelf: "flex-start" }}
              >
                <div style={{ width: "18px", height: "18px", borderRadius: "5px", border: `2px solid ${fieldRequired ? "#8B5CF6" : "#374151"}`, backgroundColor: fieldRequired ? "#8B5CF6" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {fieldRequired && <span style={{ color: "#fff", fontSize: "11px", lineHeight: 1 }}>✓</span>}
                </div>
                <span style={{ color: "#9CA3AF", fontSize: "13px" }}>Required field</span>
              </button>
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid #1F2937", display: "flex", gap: "10px", flexShrink: 0 }}>
              <button onClick={closeAddField} style={{ flex: 1, padding: "11px", borderRadius: "11px", border: "1px solid #1F2937", backgroundColor: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "14px" }}>
                Cancel
              </button>
              <button
                onClick={confirmField}
                disabled={!fieldLabel.trim()}
                style={{ flex: 2, padding: "11px", borderRadius: "11px", border: "none", backgroundColor: fieldLabel.trim() ? "#8B5CF6" : "#1F2937", color: "#F9FAFB", fontWeight: 600, cursor: fieldLabel.trim() ? "pointer" : "not-allowed", fontSize: "14px" }}
              >
                Add field
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
