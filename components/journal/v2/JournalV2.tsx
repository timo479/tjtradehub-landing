"use client";
import { useCallback, useEffect, useState } from "react";
import TemplateBuilder from "./TemplateBuilder";
import DynamicTradeForm, { TemplateDef } from "./DynamicTradeForm";
import WidgetGrid from "./WidgetGrid";

interface FieldValue {
  id: string;
  field_id: string;
  value: string;
  template_fields: { id: string; label: string; field_type: string };
}

interface Entry {
  id: string;
  trade_date: string;
  template_id: string;
  template_version: number;
  journal_templates: { id: string; name: string; version: number };
  trade_field_values: FieldValue[];
}

type View = "list" | "templates" | "stats";

interface EditState {
  entry: Entry;
  template: TemplateDef;
  initialValues: Record<string, string | string[] | boolean>;
  initialDate: string;
}


export default function JournalV2() {
  const [templates, setTemplates] = useState<TemplateDef[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useState<View>("list");
  const [showBuilder, setShowBuilder] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<TemplateDef | null>(null);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [tRes, eRes] = await Promise.all([
        fetch("/api/v2/templates"),
        fetch("/api/v2/entries"),
      ]);
      if (tRes.ok) {
        const tData: TemplateDef[] = await tRes.json();
        setTemplates(tData);
        const active = tData[0] ?? null;
        setActiveTemplate(prev => prev ?? active);
      } else if (tRes.status !== 401) {
        const err = await tRes.json().catch(() => ({}));
        setLoadError(`Templates: ${err.error ?? tRes.status}`);
      }
      if (eRes.ok) setEntries(await eRes.json());
      else if (eRes.status !== 401) {
        const err = await eRes.json().catch(() => ({}));
        setLoadError(prev => prev ? prev + ` | Entries: ${err.error ?? eRes.status}` : `Entries: ${err.error ?? eRes.status}`);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Verbindungsfehler");
    }
    setLoading(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const deleteEntry = async (id: string) => {
    setDeleting(id);
    await fetch(`/api/v2/entries/${id}`, { method: "DELETE" });
    setEntries(prev => prev.filter(e => e.id !== id));
    setDeleting(null);
  };

  const deleteTemplate = async (id: string) => {
    await fetch(`/api/v2/templates/${id}`, { method: "DELETE" });
    setTemplates(prev => {
      const next = prev.filter(t => t.id !== id);
      if (activeTemplate?.id === id) setActiveTemplate(next[0] ?? null);
      return next;
    });
  };

  const openEdit = (entry: Entry) => {
    const template = templates.find(t => t.id === entry.template_id);
    if (!template) return;
    const initialValues: Record<string, string | string[] | boolean> = {};
    for (const fv of entry.trade_field_values ?? []) {
      const ft = fv.template_fields?.field_type;
      if (ft === "boolean") initialValues[fv.field_id] = fv.value === "true";
      else if (ft === "multiselect") {
        try { initialValues[fv.field_id] = JSON.parse(fv.value); } catch { initialValues[fv.field_id] = fv.value; }
      } else {
        initialValues[fv.field_id] = fv.value;
      }
    }
    const initialDate = entry.trade_date
      ? new Date(entry.trade_date).toISOString().slice(0, 16)
      : new Date().toISOString().slice(0, 16);
    setEditState({ entry, template, initialValues, initialDate });
  };

  const exportCsv = () => {
    if (entries.length === 0) return;
    const allLabels = new Set<string>();
    for (const e of entries) {
      for (const fv of e.trade_field_values ?? []) {
        allLabels.add(fv.template_fields?.label ?? fv.field_id);
      }
    }
    const headers = ["Datum", "Template", ...Array.from(allLabels)];
    const rows = entries.map(e => {
      const map: Record<string, string> = {};
      for (const fv of e.trade_field_values ?? []) {
        map[fv.template_fields?.label ?? fv.field_id] = renderValue(fv);
      }
      return [
        new Date(e.trade_date).toLocaleDateString("de-CH"),
        e.journal_templates?.name ?? "",
        ...Array.from(allLabels).map(l => map[l] ?? ""),
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trades-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const renderValue = (fv: FieldValue) => {
    if (!fv.template_fields) return fv.value;
    const ft = fv.template_fields.field_type;
    if (ft === "boolean") return fv.value === "true" ? "✅ Ja" : "❌ Nein";
    try {
      const parsed = JSON.parse(fv.value);
      if (Array.isArray(parsed)) return parsed.join(", ");
    } catch { /* not json */ }
    return fv.value;
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#111827",
    border: "1px solid #1F2937",
    borderRadius: "16px",
    overflow: "hidden",
  };

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
        <div style={{ color: "#6B7280", fontSize: "14px" }}>Laden...</div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
        <p style={{ color: "#ef4444", fontWeight: 600, marginBottom: "8px" }}>Fehler beim Laden</p>
        <p style={{ color: "#9CA3AF", fontSize: "13px", marginBottom: "16px" }}>{loadError}</p>
        <button onClick={() => load()} style={{ padding: "8px 20px", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.4)", backgroundColor: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "13px" }}>
          Erneut versuchen
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "22px" }}>Trading Journal</h1>
          <p style={{ color: "#6B7280", fontSize: "13px", marginTop: "2px" }}>
            {entries.length} Einträge · {templates.length} {templates.length === 1 ? "Template" : "Templates"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {entries.length > 0 && (
            <button
              onClick={exportCsv}
              style={{ padding: "9px 16px", borderRadius: "10px", border: "1px solid #1F2937", backgroundColor: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "13px" }}>
              ↓ CSV
            </button>
          )}
          {entries.length > 0 && (
            <button
              onClick={() => setView(v => v === "stats" ? "list" : "stats")}
              style={{ padding: "9px 16px", borderRadius: "10px", border: `1px solid ${view === "stats" ? "rgba(139,92,246,0.5)" : "#1F2937"}`, backgroundColor: view === "stats" ? "rgba(139,92,246,0.1)" : "transparent", color: view === "stats" ? "#A78BFA" : "#9CA3AF", cursor: "pointer", fontSize: "13px" }}>
              📊 Statistiken
            </button>
          )}
          <button
            onClick={() => setView(v => v === "templates" ? "list" : "templates")}
            style={{ padding: "9px 16px", borderRadius: "10px", border: `1px solid ${view === "templates" ? "rgba(139,92,246,0.5)" : "#1F2937"}`, backgroundColor: view === "templates" ? "rgba(139,92,246,0.1)" : "transparent", color: view === "templates" ? "#A78BFA" : "#9CA3AF", cursor: "pointer", fontSize: "13px" }}>
            ⚙ Templates
          </button>
          {templates.length > 0 && view === "list" && (
            <button
              onClick={() => { if (activeTemplate) setShowTradeForm(true); }}
              disabled={!activeTemplate}
              style={{ padding: "9px 18px", borderRadius: "10px", border: "none", backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600, cursor: activeTemplate ? "pointer" : "not-allowed", fontSize: "13px", opacity: activeTemplate ? 1 : 0.5 }}>
              + Trade erfassen
            </button>
          )}
        </div>
      </div>

      {/* Stats View */}
      {view === "stats" && <WidgetGrid entries={entries} />}

      {/* TEMPLATE MANAGER VIEW */}
      {view === "templates" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "16px" }}>Deine Templates</h2>
            <button
              onClick={() => setShowBuilder(true)}
              style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(139,92,246,0.4)", backgroundColor: "rgba(139,92,246,0.1)", color: "#A78BFA", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              + Neues Template
            </button>
          </div>

          {templates.length === 0 ? (
            <div style={{ ...cardStyle, padding: "40px", textAlign: "center" }}>
              <p style={{ color: "#4B5563", fontSize: "24px", marginBottom: "12px" }}>📋</p>
              <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "20px" }}>Noch kein Template erstellt.</p>
              <button
                onClick={() => setShowBuilder(true)}
                style={{ padding: "10px 24px", borderRadius: "12px", border: "none", backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
                Erstes Template erstellen
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {templates.map(t => (
                <div key={t.id} style={{ ...cardStyle, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", border: activeTemplate?.id === t.id ? "1px solid rgba(139,92,246,0.5)" : "1px solid #1F2937" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "14px" }}>{t.name}</span>
                      <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", backgroundColor: "#1F2937", color: "#6B7280" }}>v{t.version}</span>
                      {t.is_frozen && <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", backgroundColor: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>🔒 Eingefroren</span>}
                    </div>
                    <p style={{ color: "#6B7280", fontSize: "12px", marginTop: "4px" }}>
                      {t.template_sections?.reduce((sum, s) => sum + (s.template_fields?.length ?? 0), 0) ?? 0} Felder · {t.template_sections?.length ?? 0} Sektionen
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => { setActiveTemplate(t); setView("list"); }}
                      style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${activeTemplate?.id === t.id ? "#8B5CF6" : "#1F2937"}`, backgroundColor: activeTemplate?.id === t.id ? "rgba(139,92,246,0.15)" : "transparent", color: activeTemplate?.id === t.id ? "#A78BFA" : "#9CA3AF", cursor: "pointer", fontSize: "12px" }}>
                      {activeTemplate?.id === t.id ? "✓ Aktiv" : "Auswählen"}
                    </button>
                    <button
                      onClick={() => { if (confirm(`Template "${t.name}" löschen?`)) deleteTemplate(t.id); }}
                      style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "12px" }}>
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* JOURNAL LIST VIEW */}
      {view === "list" && (
        <>
          {/* No Template */}
          {templates.length === 0 && (
            <div style={{ ...cardStyle, padding: "60px 40px", textAlign: "center" }}>
              <p style={{ fontSize: "48px", marginBottom: "16px" }}>📋</p>
              <h2 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>Erstelle dein erstes Journal-Template</h2>
              <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "24px" }}>
                Definiere welche Felder du für jeden Trade erfassen möchtest.
              </p>
              <button
                onClick={() => setShowBuilder(true)}
                style={{ padding: "12px 28px", borderRadius: "12px", border: "none", backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600, cursor: "pointer", fontSize: "15px" }}>
                Template erstellen
              </button>
            </div>
          )}

          {/* Template Selector (if multiple) */}
          {templates.length > 1 && (
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {templates.map(t => (
                <button key={t.id} onClick={() => setActiveTemplate(t)}
                  style={{ padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "13px", border: `1px solid ${activeTemplate?.id === t.id ? "#8B5CF6" : "#1F2937"}`, backgroundColor: activeTemplate?.id === t.id ? "rgba(139,92,246,0.15)" : "transparent", color: activeTemplate?.id === t.id ? "#A78BFA" : "#9CA3AF" }}>
                  {t.name} <span style={{ opacity: 0.6, fontSize: "11px" }}>v{t.version}</span>
                </button>
              ))}
            </div>
          )}

          {/* Entries */}
          {templates.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {entries.length === 0 ? (
                <div style={{ ...cardStyle, padding: "40px", textAlign: "center" }}>
                  <p style={{ color: "#4B5563", fontSize: "32px", marginBottom: "12px" }}>📈</p>
                  <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "20px" }}>
                    Noch kein Trade erfasst.{activeTemplate ? ` Template: "${activeTemplate.name}"` : ""}
                  </p>
                  <button
                    onClick={() => { if (activeTemplate) setShowTradeForm(true); }}
                    style={{ padding: "10px 24px", borderRadius: "12px", border: "none", backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
                    Ersten Trade erfassen
                  </button>
                </div>
              ) : (
                entries.map(entry => {
                  const isExpanded = expandedId === entry.id;
                  const fvs = [...(entry.trade_field_values ?? [])];
                  // Find a "label" field for preview
                  const preview = fvs.find(fv => fv.template_fields?.field_type === "text")?.value
                    ?? fvs[0]?.value
                    ?? "—";

                  return (
                    <div key={entry.id} style={{ ...cardStyle, border: isExpanded ? "1px solid rgba(139,92,246,0.3)" : "1px solid #1F2937" }}>
                      {/* Row */}
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                        style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#8B5CF6", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ color: "#F9FAFB", fontSize: "14px", fontWeight: 500, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {preview}
                          </span>
                          <span style={{ color: "#4B5563", fontSize: "12px" }}>
                            {formatDate(entry.trade_date)} · {entry.journal_templates?.name ?? "Template"}
                          </span>
                        </div>
                        <span style={{ color: "#4B5563", fontSize: "13px" }}>{isExpanded ? "▲" : "▼"}</span>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div style={{ borderTop: "1px solid #1F2937", padding: "16px 18px" }}>
                          {fvs.length === 0 ? (
                            <p style={{ color: "#4B5563", fontSize: "13px" }}>Keine Felder erfasst.</p>
                          ) : (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                              {fvs.map(fv => (
                                <div key={fv.id}>
                                  <p style={{ color: "#6B7280", fontSize: "11px", marginBottom: "2px" }}>{fv.template_fields?.label ?? fv.field_id}</p>
                                  <p style={{ color: "#F9FAFB", fontSize: "13px", fontWeight: 500 }}>{renderValue(fv)}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                            <button
                              onClick={() => openEdit(entry)}
                              style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid rgba(139,92,246,0.4)", backgroundColor: "transparent", color: "#A78BFA", cursor: "pointer", fontSize: "12px" }}>
                              ✎ Bearbeiten
                            </button>
                            <button
                              onClick={() => { if (confirm("Trade löschen?")) deleteEntry(entry.id); }}
                              disabled={deleting === entry.id}
                              style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "12px", opacity: deleting === entry.id ? 0.5 : 1 }}>
                              {deleting === entry.id ? "Löschen..." : "Trade löschen"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showBuilder && (
        <TemplateBuilder
          onClose={() => setShowBuilder(false)}
          onSaved={async () => {
            setShowBuilder(false);
            await load();
            setView("list");
          }}
        />
      )}

      {showTradeForm && activeTemplate && (
        <DynamicTradeForm
          template={activeTemplate}
          onClose={() => setShowTradeForm(false)}
          onSaved={async () => {
            setShowTradeForm(false);
            await load();
          }}
        />
      )}

      {editState && (
        <DynamicTradeForm
          template={editState.template}
          entryId={editState.entry.id}
          initialDate={editState.initialDate}
          initialValues={editState.initialValues}
          onClose={() => setEditState(null)}
          onSaved={async () => {
            setEditState(null);
            await load();
          }}
        />
      )}
    </div>
  );
}
