"use client";

import { useEffect, useState, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  template_id: string;
  phase: "vor" | "waehrend" | "nach";
  text: string;
  required: boolean;
  sort_order: number;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  checklist_items: ChecklistItem[];
}

// ─── Default items for first-time users ──────────────────────────────────────

const DEFAULT_ITEMS: Omit<ChecklistItem, "id" | "template_id">[] = [
  { phase: "vor", text: "Check economic calendar for news", required: true, sort_order: 0 },
  { phase: "vor", text: "Identify key support & resistance levels", required: true, sort_order: 1 },
  { phase: "vor", text: "Confirm trend direction on higher timeframe", required: false, sort_order: 2 },
  { phase: "vor", text: "Entry setup matches my strategy rules", required: true, sort_order: 3 },
  { phase: "vor", text: "Risk/Reward is at least 1:2", required: true, sort_order: 4 },
  { phase: "vor", text: "Position size calculated", required: true, sort_order: 5 },
  { phase: "waehrend", text: "Stop-loss is set", required: true, sort_order: 0 },
  { phase: "waehrend", text: "Take-profit is set", required: true, sort_order: 1 },
  { phase: "waehrend", text: "No emotional adjustments to the plan", required: false, sort_order: 2 },
  { phase: "nach", text: "Screenshot the trade", required: false, sort_order: 0 },
  { phase: "nach", text: "Log trade in journal", required: true, sort_order: 1 },
  { phase: "nach", text: "Rate trade execution (1–10)", required: false, sort_order: 2 },
  { phase: "nach", text: "Review what I did well / could improve", required: false, sort_order: 3 },
];

// ─── Phase config ─────────────────────────────────────────────────────────────

const PHASES: { key: ChecklistItem["phase"]; label: string; color: string; icon: React.ReactNode }[] = [
  {
    key: "vor",
    label: "Before Trade",
    color: "#8B5CF6",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    key: "waehrend",
    label: "During Trade",
    color: "#F59E0B",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    key: "nach",
    label: "After Trade",
    color: "#10B981",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ChecklistClient({ userId }: { userId: string }) {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [activeTemplateId, setActiveTemplateId] = useState<string>("");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [addingItem, setAddingItem] = useState<ChecklistItem["phase"] | null>(null);
  const [newItemText, setNewItemText] = useState("");
  const [addingTemplate, setAddingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [saving, setSaving] = useState(false);

  // Suppress unused warning – userId kept for future server-side calls if needed
  void userId;

  // ── Load checked state from localStorage ──────────────────────────────────
  const loadChecked = useCallback((templateId: string) => {
    try {
      const raw = localStorage.getItem(`tj_checklist_checked_${templateId}`);
      setChecked(raw ? JSON.parse(raw) : {});
    } catch {
      setChecked({});
    }
  }, []);

  const saveChecked = useCallback((templateId: string, next: Record<string, boolean>) => {
    localStorage.setItem(`tj_checklist_checked_${templateId}`, JSON.stringify(next));
  }, []);

  // ── Load templates from API ────────────────────────────────────────────────
  const loadTemplates = useCallback(async () => {
    const res = await fetch("/api/checklist/templates");
    if (!res.ok) return;
    const data: ChecklistTemplate[] = await res.json();
    setTemplates(data);
    return data;
  }, []);

  // ── Seed default template on first visit ──────────────────────────────────
  const seedDefault = useCallback(async () => {
    const res = await fetch("/api/checklist/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Default" }),
    });
    if (!res.ok) return null;
    const tmpl: ChecklistTemplate = await res.json();

    // Add default items
    await Promise.all(
      DEFAULT_ITEMS.map((item) =>
        fetch("/api/checklist/items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ template_id: tmpl.id, ...item }),
        })
      )
    );

    return loadTemplates();
  }, [loadTemplates]);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      let data = await loadTemplates();
      if (!data || data.length === 0) {
        data = await seedDefault() ?? [];
      }
      if (data && data.length > 0) {
        const first = data[0].id;
        setActiveTemplateId(first);
        loadChecked(first);
      }
      setLoading(false);
    })();
  }, [loadTemplates, seedDefault, loadChecked]);

  // ── Switch template ───────────────────────────────────────────────────────
  const switchTemplate = (id: string) => {
    setActiveTemplateId(id);
    loadChecked(id);
  };

  // ── Active template data ──────────────────────────────────────────────────
  const activeTemplate = templates.find((t) => t.id === activeTemplateId);
  const items = activeTemplate?.checklist_items ?? [];

  // ── Progress ──────────────────────────────────────────────────────────────
  const totalItems = items.length;
  const checkedCount = items.filter((i) => checked[i.id]).length;
  const progress = totalItems === 0 ? 0 : Math.round((checkedCount / totalItems) * 100);

  // ── Toggle check ─────────────────────────────────────────────────────────
  const toggleCheck = (itemId: string) => {
    const next = { ...checked, [itemId]: !checked[itemId] };
    setChecked(next);
    saveChecked(activeTemplateId, next);
  };

  // ── Reset ────────────────────────────────────────────────────────────────
  const reset = () => {
    setChecked({});
    localStorage.removeItem(`tj_checklist_checked_${activeTemplateId}`);
  };

  // ── Add item ─────────────────────────────────────────────────────────────
  const addItem = async (phase: ChecklistItem["phase"]) => {
    if (!newItemText.trim()) return;
    setSaving(true);
    const maxOrder = items.filter((i) => i.phase === phase).reduce((m, i) => Math.max(m, i.sort_order), -1);
    const res = await fetch("/api/checklist/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template_id: activeTemplateId, phase, text: newItemText.trim(), sort_order: maxOrder + 1 }),
    });
    if (res.ok) {
      await loadTemplates();
      setNewItemText("");
      setAddingItem(null);
    }
    setSaving(false);
  };

  // ── Toggle required ───────────────────────────────────────────────────────
  const toggleRequired = async (item: ChecklistItem) => {
    const res = await fetch(`/api/checklist/items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ required: !item.required }),
    });
    if (res.ok) await loadTemplates();
  };

  // ── Delete item ───────────────────────────────────────────────────────────
  const deleteItem = async (itemId: string) => {
    const res = await fetch(`/api/checklist/items/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      await loadTemplates();
      const next = { ...checked };
      delete next[itemId];
      setChecked(next);
      saveChecked(activeTemplateId, next);
    }
  };

  // ── Add template ─────────────────────────────────────────────────────────
  const addTemplate = async () => {
    if (!newTemplateName.trim()) return;
    setSaving(true);
    const res = await fetch("/api/checklist/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTemplateName.trim() }),
    });
    if (res.ok) {
      const tmpl = await res.json();
      await loadTemplates();
      switchTemplate(tmpl.id);
      setNewTemplateName("");
      setAddingTemplate(false);
    }
    setSaving(false);
  };

  // ── Delete template ───────────────────────────────────────────────────────
  const deleteTemplate = async (id: string) => {
    if (templates.length <= 1) return; // Keep at least one
    const res = await fetch(`/api/checklist/templates/${id}`, { method: "DELETE" });
    if (res.ok) {
      const remaining = templates.filter((t) => t.id !== id);
      setTemplates(remaining);
      if (activeTemplateId === id && remaining.length > 0) {
        switchTemplate(remaining[0].id);
      }
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "50vh" }}>
        <div style={{ width: 32, height: 32, border: "2px solid rgba(139,92,246,0.3)", borderTopColor: "#8B5CF6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Premium tokens ──
  const cardBg = "linear-gradient(145deg, #110c1e, #080808)";
  const cardBorder = "1px solid rgba(255,255,255,0.06)";
  const cardShadow = "0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)";
  const accentOf = (c: string) => (c === "#8B5CF6" ? "139,92,246" : c === "#F59E0B" ? "245,158,11" : "16,185,129");
  const done = progress === 100 && totalItems > 0;
  const ringColor = done ? "#10B981" : "#8B5CF6";
  const rSz = 78, rR = 32, rSw = 7, rCirc = 2 * Math.PI * rR, rOff = rCirc * (1 - progress / 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`
        @keyframes clIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes clPop { 0% { transform: scale(0); } 60% { transform: scale(1.25); } 100% { transform: scale(1); } }
        @keyframes clGrowX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes clRing { from { stroke-dashoffset: ${rCirc}; } }
        @keyframes clSpin { to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { [style*="animation"] { animation: none !important; } }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ position: "relative", overflow: "hidden", background: cardBg, border: done ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(139,92,246,0.22)", borderRadius: "18px", boxShadow: cardShadow, padding: "22px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px", animation: "clIn 0.5s cubic-bezier(.22,1,.36,1) both" }}>
        <div style={{ position: "absolute", top: "-50%", left: "8%", width: "380px", height: "220px", background: `radial-gradient(ellipse, rgba(${done ? "16,185,129" : "139,92,246"},0.1), transparent 70%)`, pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "14px", position: "relative", zIndex: 1 }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "13px", background: `rgba(${done ? "16,185,129" : "139,92,246"},0.12)`, border: `1px solid rgba(${done ? "16,185,129" : "139,92,246"},0.28)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={done ? "#34D399" : "#A78BFA"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
          </div>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#F9FAFB", letterSpacing: "-0.02em", lineHeight: 1.1, margin: 0 }}>Trade Checklist</h1>
            <p style={{ color: "#9CA3AF", fontSize: "13px", marginTop: "3px" }}>{done ? "All steps complete — trade with discipline." : `${checkedCount} of ${totalItems} steps completed`}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", position: "relative", zIndex: 1 }}>
          {/* completion ring */}
          <div style={{ position: "relative", width: rSz, height: rSz }}>
            <svg width={rSz} height={rSz} viewBox={`0 0 ${rSz} ${rSz}`}>
              <circle cx={rSz / 2} cy={rSz / 2} r={rR} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={rSw} />
              <circle cx={rSz / 2} cy={rSz / 2} r={rR} fill="none" stroke={ringColor} strokeWidth={rSw} strokeLinecap="round"
                strokeDasharray={rCirc} strokeDashoffset={rOff} transform={`rotate(-90 ${rSz / 2} ${rSz / 2})`}
                style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(.22,1,.36,1), stroke 0.3s", filter: `drop-shadow(0 0 5px ${ringColor}88)` }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#F9FAFB", fontWeight: 800, fontSize: "20px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{progress}%</span>
            </div>
          </div>
          <button onClick={reset} style={{ padding: "9px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#9CA3AF", fontSize: "13px", cursor: "pointer" }}>Reset</button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 100, height: 7, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: done ? "linear-gradient(90deg, #10B981, #34D399)" : "linear-gradient(90deg, #8B5CF6, #A78BFA)",
            borderRadius: 100,
            boxShadow: `0 0 12px ${done ? "rgba(16,185,129,0.6)" : "rgba(139,92,246,0.6)"}`,
            transition: "width 0.4s cubic-bezier(.22,1,.36,1), background 0.3s",
          }}
        />
      </div>

      {/* ── Template tabs ── */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        {templates.map((t) => (
          <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            <button
              onClick={() => switchTemplate(t.id)}
              style={{
                padding: "6px 14px",
                borderRadius: "8px",
                border: activeTemplateId === t.id ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.08)",
                background: activeTemplateId === t.id ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)",
                color: activeTemplateId === t.id ? "#A78BFA" : "#6B7280",
                fontSize: "13px",
                fontWeight: activeTemplateId === t.id ? 600 : 400,
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {t.name}
            </button>
            {templates.length > 1 && (
              <button
                onClick={() => deleteTemplate(t.id)}
                style={{ background: "transparent", border: "none", color: "#4B5563", cursor: "pointer", padding: "4px", lineHeight: 1 }}
                title="Delete template"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        ))}

        {/* Add template */}
        {addingTemplate ? (
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <input
              autoFocus
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") addTemplate(); if (e.key === "Escape") setAddingTemplate(false); }}
              placeholder="Template name"
              style={{
                padding: "5px 10px",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(139,92,246,0.4)",
                borderRadius: "8px",
                color: "#F9FAFB",
                fontSize: "13px",
                outline: "none",
                width: 140,
                fontFamily: "Inter, sans-serif",
              }}
            />
            <button onClick={addTemplate} disabled={saving} style={{ padding: "5px 10px", background: "#8B5CF6", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", cursor: "pointer" }}>
              Add
            </button>
            <button onClick={() => setAddingTemplate(false)} style={{ background: "transparent", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "13px" }}>
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAddingTemplate(true)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px dashed rgba(255,255,255,0.12)",
              background: "transparent",
              color: "#4B5563",
              fontSize: "13px",
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            + New Checklist
          </button>
        )}
      </div>

      {/* ── Phase cards ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {PHASES.map(({ key: phase, label, color, icon }, pi) => {
          const phaseItems = items.filter((i) => i.phase === phase).sort((a, b) => a.sort_order - b.sort_order);
          const phaseChecked = phaseItems.filter((i) => checked[i.id]).length;
          const phasePct = phaseItems.length ? Math.round((phaseChecked / phaseItems.length) * 100) : 0;
          const acc = accentOf(color);
          const phaseDone = phaseItems.length > 0 && phaseChecked === phaseItems.length;

          return (
            <div
              key={phase}
              style={{
                position: "relative",
                overflow: "hidden",
                background: cardBg,
                border: cardBorder,
                borderRadius: "16px",
                boxShadow: cardShadow,
                padding: "22px 24px",
                animation: `clIn 0.5s cubic-bezier(.22,1,.36,1) ${pi * 80}ms both`,
              }}
            >
              {/* accent edge */}
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: `linear-gradient(180deg, ${color}, ${color}33)` }} />
              {/* Phase header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                  <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: `rgba(${acc},0.12)`, border: `1px solid rgba(${acc},0.28)`, color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
                  <div>
                    <div style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "15px", lineHeight: 1.2 }}>{label}</div>
                    <div style={{ color: "#6B7280", fontSize: "11px", marginTop: "1px" }}>{phaseChecked} / {phaseItems.length} done</div>
                  </div>
                </div>
                {/* phase progress */}
                <div style={{ display: "flex", alignItems: "center", gap: "9px", flexShrink: 0 }}>
                  <div style={{ width: "70px", height: "5px", borderRadius: "3px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${phasePct}%`, background: color, borderRadius: "3px", transformOrigin: "left", animation: "clGrowX 0.7s cubic-bezier(.22,1,.36,1) both", boxShadow: `0 0 8px ${color}77` }} />
                  </div>
                  {phaseDone
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    : <span style={{ color, fontSize: "12px", fontWeight: 800, fontVariantNumeric: "tabular-nums", width: "34px", textAlign: "right" }}>{phasePct}%</span>}
                </div>
              </div>

              {/* Items */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {phaseItems.length === 0 && (
                  <p style={{ color: "#4B5563", fontSize: "13px", fontStyle: "italic" }}>No items yet. Add your first rule below.</p>
                )}
                {phaseItems.map((item, ii) => (
                  <div
                    key={item.id}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = `rgba(${acc},0.35)`; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = checked[item.id] ? `rgba(${acc},0.25)` : "rgba(255,255,255,0.05)"; }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "11px 13px",
                      borderRadius: "10px",
                      background: checked[item.id] ? `rgba(${acc},0.07)` : "rgba(255,255,255,0.02)",
                      border: `1px solid ${checked[item.id] ? `rgba(${acc},0.25)` : "rgba(255,255,255,0.05)"}`,
                      boxShadow: checked[item.id] ? `inset 3px 0 0 ${color}` : "inset 3px 0 0 transparent",
                      transition: "background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
                      animation: `clIn 0.4s ease ${ii * 35}ms both`,
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleCheck(item.id)}
                      style={{
                        width: 21,
                        height: 21,
                        borderRadius: "6px",
                        border: checked[item.id] ? "none" : "1.5px solid rgba(255,255,255,0.22)",
                        background: checked[item.id] ? color : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        boxShadow: checked[item.id] ? `0 0 10px ${color}66` : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {checked[item.id] && (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "clPop 0.3s cubic-bezier(.22,1.4,.36,1) both" }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>

                    {/* Text */}
                    <span
                      style={{
                        flex: 1,
                        fontSize: "14px",
                        color: checked[item.id] ? "#6B7280" : "#D1D5DB",
                        textDecoration: checked[item.id] ? "line-through" : "none",
                        transition: "color 0.15s ease",
                      }}
                    >
                      {item.text}
                    </span>

                    {/* Required badge */}
                    {item.required && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#EF4444",
                          background: "rgba(239,68,68,0.1)",
                          border: "1px solid rgba(239,68,68,0.2)",
                          borderRadius: 4,
                          padding: "1px 6px",
                          flexShrink: 0,
                        }}
                      >
                        REQ
                      </span>
                    )}

                    {/* Actions */}
                    <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                      <button
                        onClick={() => toggleRequired(item)}
                        title={item.required ? "Mark as optional" : "Mark as required"}
                        style={{ background: "transparent", border: "none", color: "#4B5563", cursor: "pointer", padding: "3px", lineHeight: 1 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill={item.required ? "#EF4444" : "none"} stroke={item.required ? "#EF4444" : "#4B5563"} strokeWidth="2">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        title="Delete item"
                        style={{ background: "transparent", border: "none", color: "#4B5563", cursor: "pointer", padding: "3px", lineHeight: 1 }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add item row */}
              <div style={{ marginTop: "12px" }}>
                {addingItem === phase ? (
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      autoFocus
                      value={newItemText}
                      onChange={(e) => setNewItemText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addItem(phase); if (e.key === "Escape") setAddingItem(null); }}
                      placeholder="Enter checklist item..."
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(139,92,246,0.3)",
                        borderRadius: "8px",
                        color: "#F9FAFB",
                        fontSize: "14px",
                        outline: "none",
                        fontFamily: "Inter, sans-serif",
                      }}
                    />
                    <button
                      onClick={() => addItem(phase)}
                      disabled={saving}
                      style={{ padding: "8px 14px", background: "#8B5CF6", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", cursor: "pointer", fontWeight: 600 }}
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setAddingItem(null); setNewItemText(""); }}
                      style={{ background: "transparent", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "13px" }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setAddingItem(phase); setNewItemText(""); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 0",
                      background: "transparent",
                      border: "none",
                      color: "#4B5563",
                      fontSize: "13px",
                      cursor: "pointer",
                      fontFamily: "Inter, sans-serif",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add item
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Completion banner ── */}
      {done && (
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "20px 24px",
            background: "linear-gradient(135deg, rgba(16,185,129,0.14), rgba(16,185,129,0.03) 70%)",
            border: "1px solid rgba(16,185,129,0.3)",
            borderRadius: "16px",
            boxShadow: "0 0 40px rgba(16,185,129,0.12)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            animation: "clIn 0.5s cubic-bezier(.22,1,.36,1) both",
          }}
        >
          <div style={{ width: "46px", height: "46px", borderRadius: "13px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "clPop 0.4s cubic-bezier(.22,1.4,.36,1) both" }}><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <div>
            <div style={{ color: "#34D399", fontWeight: 800, fontSize: "16px", letterSpacing: "-0.01em" }}>All steps completed</div>
            <div style={{ color: "#9CA3AF", fontSize: "13px", marginTop: "2px" }}>You&apos;re ready. Trade with discipline.</div>
          </div>
        </div>
      )}
    </div>
  );
}
