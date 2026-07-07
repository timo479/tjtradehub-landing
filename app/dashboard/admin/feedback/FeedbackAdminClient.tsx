"use client";

import { useState, useEffect, useCallback } from "react";

interface FeedbackItem {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string;
  message: string;
  category: "bug" | "idea" | "question" | "other";
  page_url: string | null;
  status: "new" | "in_progress" | "closed";
  admin_note: string | null;
  created_at: string;
}

interface Counts {
  all: number;
  new: number;
  in_progress: number;
  closed: number;
}

const CATEGORY_META: Record<string, { label: string; emoji: string }> = {
  bug: { label: "Bug", emoji: "🐛" },
  idea: { label: "Idea", emoji: "💡" },
  question: { label: "Question", emoji: "❓" },
  other: { label: "Other", emoji: "💬" },
};

// New → Violet, In Progress → Orange, Closed → Green
const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "#A78BFA", bg: "rgba(139,92,246,0.15)" },
  in_progress: { label: "In Progress", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  closed: { label: "Closed", color: "#22C55E", bg: "rgba(34,197,94,0.15)" },
};

const TABS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "in_progress", label: "In Progress" },
  { key: "closed", label: "Closed" },
];

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
    " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status];
  if (!m) return null;
  return (
    <span style={{ color: m.color, background: m.bg, fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap" }}>
      {m.label}
    </span>
  );
}

export default function FeedbackAdminClient() {
  const [tab, setTab] = useState<string>("all");
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [counts, setCounts] = useState<Counts>({ all: 0, new: 0, in_progress: 0, closed: 0 });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<FeedbackItem | null>(null);
  const [note, setNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const qs = tab === "all" ? "" : `?status=${tab}`;
    const res = await fetch(`/api/admin/feedback${qs}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
      setCounts(data.counts ?? { all: 0, new: 0, in_progress: 0, closed: 0 });
    }
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const openDetail = (item: FeedbackItem) => {
    setSelected(item);
    setNote(item.admin_note ?? "");
    setNoteSaved(false);
  };

  const patch = async (id: string, body: { status?: string; admin_note?: string | null }) => {
    const res = await fetch(`/api/admin/feedback/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  };

  const changeStatus = async (status: string) => {
    if (!selected) return;
    const ok = await patch(selected.id, { status });
    if (ok) {
      const updated = { ...selected, status: status as FeedbackItem["status"] };
      setSelected(updated);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      load();
    }
  };

  const saveNote = async () => {
    if (!selected) return;
    setSavingNote(true);
    const value = note.trim() === "" ? null : note;
    const ok = await patch(selected.id, { admin_note: value });
    setSavingNote(false);
    if (ok) {
      const updated = { ...selected, admin_note: value };
      setSelected(updated);
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2500);
    }
  };

  const replyMailto = (item: FeedbackItem) => {
    const subject = encodeURIComponent(`Re: your feedback on TJ TradeHub`);
    const body = encodeURIComponent(
      `Hi ${item.user_name ?? ""},\n\nThanks for your feedback:\n\n"${item.message}"\n\n`
    );
    window.location.href = `mailto:${item.user_email}?subject=${subject}&body=${body}`;
  };

  const card: React.CSSProperties = {
    background: "#0b0b0f",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 14,
  };

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 18, flexWrap: "wrap" }}>
        {TABS.map((t) => {
          const active = tab === t.key;
          const count = counts[t.key as keyof Counts] ?? 0;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "7px 14px",
                borderRadius: 10,
                border: `1px solid ${active ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.08)"}`,
                background: active ? "rgba(139,92,246,0.12)" : "transparent",
                color: active ? "#A78BFA" : "#9CA3AF",
                fontSize: 13,
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              {t.label}
              <span style={{ fontSize: 11, color: active ? "#A78BFA" : "#6B7280", background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: "1px 7px" }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ ...card, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", color: "#6B7280", fontSize: 14 }}>Loading…</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#6B7280", fontSize: 14 }}>No feedback yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["User", "Category", "Message", "Page", "Date", "Status"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "12px 16px", fontSize: 10.5, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.07)", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((i) => {
                const cat = CATEGORY_META[i.category];
                return (
                  <tr
                    key={i.id}
                    onClick={() => openDetail(i)}
                    style={{ cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px", fontSize: 13 }}>
                      <div style={{ color: "#F9FAFB", fontWeight: 500 }}>{i.user_name ?? "—"}</div>
                      <div style={{ color: "#6B7280", fontSize: 11.5 }}>{i.user_email}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#D1D5DB", whiteSpace: "nowrap" }}>
                      {cat ? `${cat.emoji} ${cat.label}` : i.category}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, color: "#9CA3AF", maxWidth: 320 }}>
                      {i.message.length > 60 ? i.message.slice(0, 60) + "…" : i.message}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#6B7280", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {i.page_url ?? "—"}
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "#9CA3AF", whiteSpace: "nowrap" }}>{fmtDate(i.created_at)}</td>
                    <td style={{ padding: "12px 16px" }}><StatusBadge status={i.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ ...card, width: "100%", maxWidth: 560, maxHeight: "88vh", overflowY: "auto", padding: 24 }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ color: "#D1D5DB", fontSize: 14 }}>
                  {CATEGORY_META[selected.category] ? `${CATEGORY_META[selected.category].emoji} ${CATEGORY_META[selected.category].label}` : selected.category}
                </span>
                <StatusBadge status={selected.status} />
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
            </div>

            {/* Message */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: 14, marginBottom: 18 }}>
              <p style={{ color: "#F3F4F6", fontSize: 14, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{selected.message}</p>
            </div>

            {/* Meta */}
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 14px", fontSize: 13, marginBottom: 20 }}>
              <span style={{ color: "#6B7280" }}>User</span>
              <span style={{ color: "#D1D5DB" }}>{selected.user_name ?? "—"}</span>
              <span style={{ color: "#6B7280" }}>Email</span>
              <a href={`mailto:${selected.user_email}`} style={{ color: "#A78BFA", textDecoration: "none" }}>{selected.user_email}</a>
              <span style={{ color: "#6B7280" }}>Page</span>
              {selected.page_url ? (
                <a href={selected.page_url} target="_blank" rel="noopener noreferrer" style={{ color: "#A78BFA", textDecoration: "none", wordBreak: "break-all" }}>{selected.page_url}</a>
              ) : <span style={{ color: "#6B7280" }}>—</span>}
              <span style={{ color: "#6B7280" }}>Date</span>
              <span style={{ color: "#D1D5DB" }}>{fmtDate(selected.created_at)}</span>
            </div>

            {/* Status dropdown */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: "#9CA3AF", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 7 }}>Status</label>
              <select
                value={selected.status}
                onChange={(e) => changeStatus(e.target.value)}
                style={{ width: "100%", background: "#12101a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "9px 12px", color: "#F9FAFB", fontSize: 13, outline: "none", cursor: "pointer" }}
              >
                <option value="new">New</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Internal note (admin only) */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ color: "#9CA3AF", fontSize: 12, fontWeight: 600, display: "block", marginBottom: 7 }}>
                Internal note <span style={{ color: "#6B7280", fontWeight: 400 }}>(admins only — user never sees this)</span>
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Add an internal note…"
                style={{ width: "100%", resize: "vertical", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "10px 12px", color: "#F9FAFB", fontSize: 13, outline: "none", boxSizing: "border-box", lineHeight: 1.5 }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <button
                  onClick={saveNote}
                  disabled={savingNote}
                  style={{ padding: "7px 16px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#D1D5DB", fontSize: 12.5, fontWeight: 600, cursor: savingNote ? "default" : "pointer" }}
                >
                  {savingNote ? "Saving…" : "Save note"}
                </button>
                {noteSaved && <span style={{ color: "#22C55E", fontSize: 12 }}>✓ Saved</span>}
              </div>
            </div>

            {/* Reply via email */}
            <button
              onClick={() => replyMailto(selected)}
              style={{ width: "100%", padding: "11px 0", borderRadius: 10, border: "none", background: "#8B5CF6", color: "#fff", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}
            >
              Reply via Email
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
