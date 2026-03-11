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

function getField(entry: Entry, label: string): string | null {
  const fv = entry.trade_field_values?.find(
    f => f.template_fields?.label?.toLowerCase() === label.toLowerCase()
  );
  return fv?.value ?? null;
}

function PnlBadge({ value }: { value: string | null }) {
  if (!value) return <span style={{ color: "#4B5563", fontSize: "14px" }}>—</span>;
  const n = parseFloat(value);
  const pos = n >= 0;
  return (
    <span style={{
      color: pos ? "#22c55e" : "#ef4444",
      fontWeight: 700,
      fontSize: "15px",
    }}>
      {pos ? "+" : ""}{n.toFixed(2)}
    </span>
  );
}

function DirectionBadge({ value }: { value: string | null }) {
  if (!value) return null;
  const isLong = value === "Long";
  return (
    <span style={{
      fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "5px",
      backgroundColor: isLong ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
      color: isLong ? "#22c55e" : "#ef4444",
      letterSpacing: "0.04em",
    }}>
      {isLong ? "LONG" : "SHORT"}
    </span>
  );
}

function RatingDots({ value }: { value: string | null }) {
  if (!value) return <span style={{ color: "#374151", fontSize: "12px" }}>—</span>;
  const n = Math.min(10, Math.max(1, parseInt(value)));
  return (
    <span style={{ color: "#8B5CF6", fontSize: "13px", fontWeight: 600 }}>
      {"★".repeat(Math.round(n / 2))}{"☆".repeat(5 - Math.round(n / 2))} <span style={{ color: "#6B7280", fontWeight: 400, fontSize: "11px" }}>{n}/10</span>
    </span>
  );
}

const EMOTION_COLORS: Record<string, string> = {
  Calm: "#22c55e", Confident: "#3b82f6", Nervous: "#f59e0b",
  Fearful: "#ef4444", Greedy: "#f97316", Uncertain: "#8b5cf6",
  Frustrated: "#ec4899", Euphoric: "#a78bfa",
};

function EmotionBadge({ value }: { value: string | null }) {
  if (!value) return <span style={{ color: "#374151", fontSize: "12px" }}>—</span>;
  const color = EMOTION_COLORS[value] ?? "#6B7280";
  return (
    <span style={{
      fontSize: "11px", padding: "2px 8px", borderRadius: "5px",
      backgroundColor: `${color}22`, color, fontWeight: 600,
    }}>
      {value}
    </span>
  );
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
        setActiveTemplate(prev => prev ?? tData[0] ?? null);
      } else if (tRes.status !== 401) {
        setLoadError(`Templates: ${(await tRes.json().catch(() => ({}))).error ?? tRes.status}`);
      }
      if (eRes.ok) setEntries(await eRes.json());
      else if (eRes.status !== 401) {
        setLoadError(prev => {
          const msg = `Entries: ${(tRes as Response).status}`;
          return prev ? `${prev} | ${msg}` : msg;
        });
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Connection error");
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
    for (const e of entries)
      for (const fv of e.trade_field_values ?? [])
        allLabels.add(fv.template_fields?.label ?? fv.field_id);
    const headers = ["Date", "Template", ...Array.from(allLabels)];
    const rows = entries.map(e => {
      const map: Record<string, string> = {};
      for (const fv of e.trade_field_values ?? []) map[fv.template_fields?.label ?? fv.field_id] = fv.value;
      return [
        new Date(e.trade_date).toLocaleDateString("en-GB"),
        e.journal_templates?.name ?? "",
        ...Array.from(allLabels).map(l => map[l] ?? ""),
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `trades-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const card: React.CSSProperties = { backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "16px", overflow: "hidden" };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
      <div style={{ color: "#6B7280", fontSize: "14px" }}>Loading...</div>
    </div>
  );

  if (loadError) return (
    <div style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "16px", padding: "24px", textAlign: "center" }}>
      <p style={{ color: "#ef4444", fontWeight: 600, marginBottom: "8px" }}>Failed to load</p>
      <p style={{ color: "#9CA3AF", fontSize: "13px", marginBottom: "16px" }}>{loadError}</p>
      <button onClick={load} style={{ padding: "8px 20px", borderRadius: "10px", border: "1px solid rgba(239,68,68,0.4)", backgroundColor: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "13px" }}>Try again</button>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "22px" }}>Trading Journal</h1>
          <p style={{ color: "#6B7280", fontSize: "13px", marginTop: "2px" }}>
            {entries.length} {entries.length === 1 ? "trade" : "trades"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {entries.length > 0 && (
            <button onClick={exportCsv} style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid #1F2937", backgroundColor: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "13px" }}>↓ CSV</button>
          )}
          {entries.length > 0 && (
            <button onClick={() => setView(v => v === "stats" ? "list" : "stats")}
              style={{ padding: "8px 14px", borderRadius: "10px", border: `1px solid ${view === "stats" ? "rgba(139,92,246,0.5)" : "#1F2937"}`, backgroundColor: view === "stats" ? "rgba(139,92,246,0.1)" : "transparent", color: view === "stats" ? "#A78BFA" : "#9CA3AF", cursor: "pointer", fontSize: "13px" }}>
              📊 Statistics
            </button>
          )}
          <button onClick={() => setView(v => v === "templates" ? "list" : "templates")}
            style={{ padding: "8px 14px", borderRadius: "10px", border: `1px solid ${view === "templates" ? "rgba(139,92,246,0.5)" : "#1F2937"}`, backgroundColor: view === "templates" ? "rgba(139,92,246,0.1)" : "transparent", color: view === "templates" ? "#A78BFA" : "#9CA3AF", cursor: "pointer", fontSize: "13px" }}>
            ⚙ Templates
          </button>
          {templates.length > 0 && view === "list" && (
            <button onClick={() => { if (activeTemplate) setShowTradeForm(true); }} disabled={!activeTemplate}
              style={{ padding: "8px 16px", borderRadius: "10px", border: "none", backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600, cursor: activeTemplate ? "pointer" : "not-allowed", fontSize: "13px", opacity: activeTemplate ? 1 : 0.5 }}>
              + Log trade
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {view === "stats" && <WidgetGrid entries={entries} />}

      {/* Templates View */}
      {view === "templates" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "16px" }}>Your Templates</h2>
            <button onClick={() => setShowBuilder(true)}
              style={{ padding: "8px 14px", borderRadius: "10px", border: "1px solid rgba(139,92,246,0.4)", backgroundColor: "rgba(139,92,246,0.1)", color: "#A78BFA", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              + New Template
            </button>
          </div>
          {templates.length === 0 ? (
            <div style={{ ...card, padding: "40px", textAlign: "center" }}>
              <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "20px" }}>No templates yet.</p>
              <button onClick={() => setShowBuilder(true)}
                style={{ padding: "10px 24px", borderRadius: "12px", border: "none", backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
                Create first template
              </button>
            </div>
          ) : templates.map(t => (
            <div key={t.id} style={{ ...card, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", border: activeTemplate?.id === t.id ? "1px solid rgba(139,92,246,0.5)" : "1px solid #1F2937" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "14px" }}>{t.name}</span>
                  {t.is_frozen && <span style={{ fontSize: "11px", padding: "2px 7px", borderRadius: "5px", backgroundColor: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>Frozen</span>}
                </div>
                <p style={{ color: "#6B7280", fontSize: "12px", marginTop: "3px" }}>
                  {t.template_sections?.reduce((s, sec) => s + (sec.template_fields?.length ?? 0), 0) ?? 0} fields
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => { setActiveTemplate(t); setView("list"); }}
                  style={{ padding: "6px 12px", borderRadius: "8px", border: `1px solid ${activeTemplate?.id === t.id ? "#8B5CF6" : "#1F2937"}`, backgroundColor: activeTemplate?.id === t.id ? "rgba(139,92,246,0.15)" : "transparent", color: activeTemplate?.id === t.id ? "#A78BFA" : "#9CA3AF", cursor: "pointer", fontSize: "12px" }}>
                  {activeTemplate?.id === t.id ? "✓ Active" : "Select"}
                </button>
                <button onClick={() => { if (confirm(`Delete "${t.name}"?`)) deleteTemplate(t.id); }}
                  style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "12px" }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Trade List */}
      {view === "list" && (
        <>
          {templates.length === 0 ? (
            <div style={{ ...card, padding: "60px 40px", textAlign: "center" }}>
              <p style={{ fontSize: "40px", marginBottom: "16px" }}>📋</p>
              <h2 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>Create your first journal template</h2>
              <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "24px" }}>Define which fields you want to track for each trade.</p>
              <button onClick={() => setShowBuilder(true)}
                style={{ padding: "12px 28px", borderRadius: "12px", border: "none", backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600, cursor: "pointer", fontSize: "15px" }}>
                Create template
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div style={{ ...card, padding: "60px 40px", textAlign: "center" }}>
              <p style={{ fontSize: "40px", marginBottom: "16px" }}>📈</p>
              <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "20px" }}>No trades logged yet.</p>
              <button onClick={() => { if (activeTemplate) setShowTradeForm(true); }}
                style={{ padding: "10px 24px", borderRadius: "12px", border: "none", backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>
                Log your first trade
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Column Headers */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px 90px 110px 120px 24px", gap: "12px", padding: "0 18px", alignItems: "center" }}>
                {["Instrument", "Direction", "P&L", "Rating", "Emotion", "Date", ""].map(h => (
                  <span key={h} style={{ color: "#374151", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</span>
                ))}
              </div>

              {entries.map(entry => {
                const symbol    = getField(entry, "Symbol");
                const direction = getField(entry, "Direction");
                const pnl       = getField(entry, "P&L");
                const rating    = getField(entry, "Rating");
                const emotion   = getField(entry, "Emotion");
                const notes     = getField(entry, "Notes");
                const setup     = getField(entry, "Setup");
                const mistake   = getField(entry, "Mistake");
                const followed  = getField(entry, "Followed Plan");
                const volume    = getField(entry, "Volume");
                const isExpanded = expandedId === entry.id;
                const date = new Date(entry.trade_date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
                const time = new Date(entry.trade_date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

                return (
                  <div key={entry.id} style={{ ...card, border: isExpanded ? "1px solid rgba(139,92,246,0.35)" : "1px solid #1F2937" }}>

                    {/* Main Row */}
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                      style={{ display: "grid", gridTemplateColumns: "1fr 90px 80px 90px 110px 120px 24px", gap: "12px", padding: "14px 18px", alignItems: "center", cursor: "pointer" }}>

                      {/* Instrument */}
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                        <div style={{ width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0, backgroundColor: pnl && parseFloat(pnl) >= 0 ? "#22c55e" : pnl ? "#ef4444" : "#374151" }} />
                        <span style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "14px", letterSpacing: "0.02em" }}>
                          {symbol ?? entry.journal_templates?.name ?? "Trade"}
                        </span>
                        {volume && <span style={{ color: "#4B5563", fontSize: "11px" }}>× {volume}</span>}
                      </div>

                      <DirectionBadge value={direction} />
                      <PnlBadge value={pnl} />
                      <RatingDots value={rating} />
                      <EmotionBadge value={emotion} />

                      {/* Date */}
                      <div>
                        <p style={{ color: "#9CA3AF", fontSize: "12px" }}>{date}</p>
                        <p style={{ color: "#4B5563", fontSize: "11px" }}>{time}</p>
                      </div>

                      {/* Chevron */}
                      <span style={{ color: "#374151", fontSize: "12px", textAlign: "right" }}>{isExpanded ? "▲" : "▼"}</span>
                    </div>

                    {/* Expanded Panel */}
                    {isExpanded && (
                      <div style={{ borderTop: "1px solid #1F2937", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "16px" }}>

                        {/* Review Fields */}
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
                          {[
                            { label: "Setup",         value: setup },
                            { label: "Followed Plan",  value: followed === "true" ? "✅ Yes" : followed === "false" ? "❌ No" : null },
                            { label: "Mistake",        value: mistake && mistake !== "None" ? mistake : null },
                            { label: "Notes",          value: notes },
                          ].map(({ label, value }) => (
                            <div key={label}>
                              <p style={{ color: "#4B5563", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "3px" }}>{label}</p>
                              {value
                                ? <p style={{ color: "#D1D5DB", fontSize: "13px" }}>{value}</p>
                                : <button onClick={(e) => { e.stopPropagation(); openEdit(entry); }}
                                    style={{ background: "none", border: "none", color: "#374151", fontSize: "12px", cursor: "pointer", padding: 0 }}>
                                    + Add
                                  </button>
                              }
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button onClick={() => openEdit(entry)}
                            style={{ padding: "7px 16px", borderRadius: "9px", border: "1px solid rgba(139,92,246,0.4)", backgroundColor: "transparent", color: "#A78BFA", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>
                            ✎ Edit trade
                          </button>
                          <button
                            onClick={() => { if (confirm("Delete this trade?")) deleteEntry(entry.id); }}
                            disabled={deleting === entry.id}
                            style={{ padding: "7px 14px", borderRadius: "9px", border: "1px solid rgba(239,68,68,0.25)", backgroundColor: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "12px", opacity: deleting === entry.id ? 0.5 : 1 }}>
                            {deleting === entry.id ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      {showBuilder && (
        <TemplateBuilder onClose={() => setShowBuilder(false)} onSaved={async () => { setShowBuilder(false); await load(); setView("list"); }} />
      )}
      {showTradeForm && activeTemplate && (
        <DynamicTradeForm template={activeTemplate} onClose={() => setShowTradeForm(false)} onSaved={async () => { setShowTradeForm(false); await load(); }} />
      )}
      {editState && (
        <DynamicTradeForm
          template={editState.template}
          entryId={editState.entry.id}
          initialDate={editState.initialDate}
          initialValues={editState.initialValues}
          onClose={() => setEditState(null)}
          onSaved={async () => { setEditState(null); await load(); }}
        />
      )}
    </div>
  );
}
