"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import JournalCreateModal from "./JournalCreateModal";
import TradeWizard from "./TradeWizard";
import Mt5ReviewModal from "../v2/Mt5ReviewModal";
import JournalStats from "./JournalStats";
import { TemplateDef } from "../v2/DynamicTradeForm";
import OnboardingTour from "@/components/OnboardingTour";
import { JOURNAL_STEPS } from "@/components/tourSteps";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Rule { id: string; text: string; }
interface FieldDef { id: string; label: string; field_type: string; }
interface SectionDef { id: string; name: string; order_index: number; template_fields: FieldDef[]; }
interface Journal {
  id: string; name: string; instrument_type: string;
  time_from: string; time_to: string;
  risk_per_trade: number | null; max_trades_per_day: number | null;
  rules: Rule[]; is_frozen: boolean; created_at: string;
  template_sections: SectionDef[];
}
interface TradeFieldValue {
  field_id: string; value: string;
  template_fields: { id: string; label: string; field_type: string };
}
interface Trade {
  id: string; trade_date: string; template_id: string;
  source: string; is_reviewed: boolean; meta_deal_id: string | null;
  trade_field_values: TradeFieldValue[];
  journal_templates: { id: string; name: string };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getField(trade: Trade, label: string): string | null {
  return trade.trade_field_values?.find(f => f.template_fields?.label?.toLowerCase() === label.toLowerCase())?.value ?? null;
}
function getEmotions(trade: Trade): string[] {
  const raw = getField(trade, "Emotions"); if (!raw) return [];
  try { return JSON.parse(raw); } catch { return [raw]; }
}
function pnlNum(trade: Trade): number | null {
  const v = getField(trade, "P&L"); return v ? parseFloat(v) : null;
}
function isWin(trade: Trade): boolean | null {
  const p = pnlNum(trade); return p === null ? null : p > 0;
}
function calcStreak(trades: Trade[]): string {
  if (!trades.length) return "—";
  const sorted = [...trades].sort((a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime());
  let count = 0; let sign: boolean | null = null;
  for (const t of sorted) {
    const w = isWin(t); if (w === null) break;
    if (sign === null) sign = w;
    if (w === sign) count++; else break;
  }
  if (sign === null) return "—";
  return `${sign ? "+" : "-"}${count}`;
}

const EMOTION_COLORS: Record<string, string> = { Calm: "#22c55e", Confident: "#3b82f6", Nervous: "#f59e0b", FOMO: "#ef4444", Greedy: "#f97316", Fearful: "#ef4444", Frustrated: "#ec4899", Euphoric: "#a78bfa" };

// ─── Equity Curve SVG ─────────────────────────────────────────────────────────
function EquityCurve({ trades }: { trades: Trade[] }) {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
  const recent = [...trades].filter(t => new Date(t.trade_date) >= cutoff).sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
  if (recent.length < 1) return <span style={{ color: "#374151", fontSize: "12px" }}>No data</span>;
  let cum = 0; const pts = [0, ...recent.map(t => { const p = pnlNum(t) ?? 0; cum += p; return cum; })];
  const W = 220, H = 56; const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1;
  const coords = pts.map((p, i) => `${(i / (pts.length - 1)) * W},${H - ((p - min) / range) * (H - 4) - 2}`).join(" ");
  const isPos = pts[pts.length - 1] >= 0; const clr = isPos ? "#22c55e" : "#ef4444";
  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      <polyline points={coords} fill="none" stroke={clr} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
type Filter = "all" | "today" | "week" | "month" | "review";

export default function JournalNew({ journalTourCompleted = false }: { journalTourCompleted?: boolean }) {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [allEntries, setAllEntries] = useState<Trade[]>([]);
  const [allTemplates, setAllTemplates] = useState<TemplateDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJournal, setActiveJournal] = useState<Journal | null>(null);
  const [view, setView] = useState<"journals" | "trades" | "stats">("journals");

  // Trade list state
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Modals
  const [showCreateJournal, setShowCreateJournal] = useState(false);
  const [editJournal, setEditJournal] = useState<Journal | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [detailTrade, setDetailTrade] = useState<Trade | null>(null);
  const [detailScreenshots, setDetailScreenshots] = useState<{id:string;url:string;filename:string}[]>([]);
  const [reviewEntry, setReviewEntry] = useState<Trade | null>(null);

  // MT5 sync
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [metaConnected, setMetaConnected] = useState<boolean>(false);
  const [showInbox, setShowInbox] = useState(false);
  const [bulkJournalId, setBulkJournalId] = useState("");
  const [bulkMoving, setBulkMoving] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [jRes, eRes, tRes] = await Promise.all([
      fetch("/api/v2/journals"),
      fetch("/api/v2/entries"),
      fetch("/api/v2/templates"),
    ]);
    if (jRes.ok) {
      const jData: Journal[] = await jRes.json();
      setJournals(jData);
      setActiveJournal(prev => {
        if (prev) return jData.find(j => j.id === prev.id) ?? jData[0] ?? null;
        return jData[0] ?? null;
      });
    }
    if (eRes.ok) setAllEntries(await eRes.json());
    if (tRes.ok) setAllTemplates(await tRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/meta/settings")
      .then(r => r.ok ? r.json() : null)
      .then(d => setMetaConnected(!!(d?.connected && d?.state === "DEPLOYED" && d?.connectionStatus === "CONNECTED")))
      .catch(() => setMetaConnected(false));
  }, []);

  useEffect(() => {
    if (!detailTrade) { setDetailScreenshots([]); return; }
    fetch(`/api/v2/entries/${detailTrade.id}/screenshots`)
      .then(r => r.ok ? r.json() : [])
      .then(setDetailScreenshots);
  }, [detailTrade]);

  const openJournal = (j: Journal) => {
    setActiveJournal(j); setView("trades"); setFilter("all"); setSearch("");
  };

  const deleteJournal = async (j: Journal) => {
    if (!confirm(`Delete "${j.name}" and all its trades?`)) return;
    await fetch(`/api/v2/journals/${j.id}`, { method: "DELETE" });
    if (activeJournal?.id === j.id) { setActiveJournal(null); setView("journals"); }
    await load();
  };

  const deleteTrade = async (id: string) => {
    if (!confirm("Delete this trade?")) return;
    await fetch(`/api/v2/entries/${id}`, { method: "DELETE" });
    setAllEntries(prev => prev.filter(e => e.id !== id));
  };

  const mt5Sync = async () => {
    setSyncing(true); setSyncMsg(null);
    const res = await fetch("/api/meta/sync", { method: "POST" });
    const data = await res.json();
    if (res.ok) { setSyncMsg(`✅ ${data.synced} new, ${data.skipped} skipped`); await load(); }
    else setSyncMsg(`⚠️ ${data.error ?? "Sync failed"}`);
    setSyncing(false);
  };

  const bulkMove = async () => {
    if (!bulkJournalId) return;
    setBulkMoving(true);
    try {
      const res = await fetch("/api/v2/entries/bulk-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ journal_id: bulkJournalId, entry_ids: mt5Pending.map(e => e.id) }),
      });
      const data = await res.json();
      setBulkMoving(false);
      if (res.ok) {
        setShowBulkModal(false);
        setShowInbox(false);
        setBulkJournalId("");
        await load();
      } else {
        alert(data.error ?? "Failed");
      }
    } catch {
      setBulkMoving(false);
      alert("Request failed. Please try again.");
    }
  };

  // Trades for active journal
  const journalTrades = useMemo(
    () => allEntries.filter(e => e.template_id === activeJournal?.id),
    [allEntries, activeJournal]
  );

  // MT5 unreviewed from MetaAPI Import template (not in any user journal)
  const mt5Pending = useMemo(
    () => allEntries.filter(e => e.source === "mt5" && !e.is_reviewed && !journals.some(j => j.id === e.template_id)),
    [allEntries, journals]
  );

  // Stats helpers
  const today = new Date().toISOString().slice(0, 10);
  const todayTrades = journalTrades.filter(t => t.trade_date.slice(0, 10) === today);
  const todayPnl = todayTrades.reduce((s, t) => s + (pnlNum(t) ?? 0), 0);
  const todayWins = todayTrades.filter(t => (pnlNum(t) ?? 0) > 0).length;
  const todayWinRate = todayTrades.length ? Math.round((todayWins / todayTrades.length) * 100) : null;
  const rulesBroken = todayTrades.filter(t => {
    const raw = getField(t, "Rules Followed"); if (!raw) return false;
    try { return (JSON.parse(raw) as { compliant: boolean }[]).some(r => !r.compliant); } catch { return false; }
  }).length;
  const sevenDayCutoff = new Date(); sevenDayCutoff.setDate(sevenDayCutoff.getDate() - 7);
  const sevenDayTrades = journalTrades.filter(t => new Date(t.trade_date) >= sevenDayCutoff);
  const sevenDayWins = sevenDayTrades.filter(t => (pnlNum(t) ?? 0) > 0).length;
  const sevenDayWinRate = sevenDayTrades.length ? Math.round((sevenDayWins / sevenDayTrades.length) * 100) : null;
  const sevenDayPnl = sevenDayTrades.reduce((s, t) => s + (pnlNum(t) ?? 0), 0);

  // Filtered + sorted trade list
  const filteredTrades = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
    let list = journalTrades;

    if (filter === "today") list = list.filter(t => t.trade_date.slice(0, 10) === today);
    else if (filter === "week") list = list.filter(t => new Date(t.trade_date) >= weekAgo);
    else if (filter === "month") list = list.filter(t => new Date(t.trade_date) >= monthAgo);
    else if (filter === "review") list = list.filter(t => t.source === "mt5" && !t.is_reviewed);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        (getField(t, "Symbol") ?? "").toLowerCase().includes(q) ||
        (getField(t, "Setup") ?? "").toLowerCase().includes(q) ||
        (getField(t, "Notes") ?? "").toLowerCase().includes(q) ||
        getEmotions(t).some(e => e.toLowerCase().includes(q))
      );
    }

    return [...list].sort((a, b) => {
      let cmp = 0;
      if (sortCol === "date") cmp = new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime();
      else if (sortCol === "symbol") cmp = (getField(a, "Symbol") ?? "").localeCompare(getField(b, "Symbol") ?? "");
      else if (sortCol === "direction") cmp = (getField(a, "Direction") ?? "").localeCompare(getField(b, "Direction") ?? "");
      else if (sortCol === "setup") cmp = (getField(a, "Setup") ?? "").localeCompare(getField(b, "Setup") ?? "");
      else if (sortCol === "pnl") cmp = (pnlNum(a) ?? 0) - (pnlNum(b) ?? 0);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [journalTrades, filter, search, sortCol, sortDir, today]);

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir(col === "date" ? "desc" : "asc"); }
  };

  const sortArrow = (col: string) => sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  const reviewCount = mt5Pending.length;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: "#6B7280", fontSize: "14px" }}>
      Loading...
    </div>
  );

  // ─── Journals View ───────────────────────────────────────────────────────────
  if (view === "journals") return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

      {/* MT5 Inbox badge (global) */}
      {mt5Pending.length > 0 && (
        <div style={{ backgroundColor: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: "12px", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F59E0B", color: "#000", borderRadius: "50%", width: "22px", height: "22px", fontSize: "12px", fontWeight: 700 }}>{mt5Pending.length}</span>
            <span style={{ color: "#F59E0B", fontWeight: 600, fontSize: "14px" }}>MT5 trades waiting for review</span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => setShowBulkModal(true)}
              style={{ padding: "7px 16px", borderRadius: "8px", border: "none", backgroundColor: "#F59E0B", color: "#000", cursor: "pointer", fontSize: "13px", fontWeight: 700 }}>
              Move all to journal →
            </button>
            <button onClick={() => setShowInbox(v => !v)}
              style={{ padding: "7px 16px", borderRadius: "8px", border: "1px solid rgba(245,158,11,0.4)", backgroundColor: showInbox ? "rgba(245,158,11,0.15)" : "transparent", color: "#F59E0B", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>
              {showInbox ? "Hide" : "Review one by one"}
            </button>
          </div>
        </div>
      )}

      {/* MT5 Inbox list */}
      {showInbox && mt5Pending.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {mt5Pending.map(entry => {
            const sym = getField(entry, "Symbol"); const dir = getField(entry, "Direction"); const p = pnlNum(entry);
            return (
              <div key={entry.id} style={{ backgroundColor: "#111827", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "12px", padding: "12px 18px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#F59E0B", flexShrink: 0 }} />
                <span style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "15px", minWidth: "80px" }}>{sym ?? "—"}</span>
                {dir && <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "5px", backgroundColor: dir === "Long" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: dir === "Long" ? "#22c55e" : "#ef4444" }}>{dir === "Long" ? "▲ LONG" : "▼ SHORT"}</span>}
                {p !== null && <span style={{ color: p >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{p >= 0 ? "+" : ""}{p.toFixed(2)}</span>}
                <span style={{ color: "#6B7280", fontSize: "12px", marginLeft: "auto" }}>{new Date(entry.trade_date).toLocaleDateString("en-GB")}</span>
                <button onClick={() => setReviewEntry(entry)} style={{ padding: "7px 16px", borderRadius: "8px", border: "none", backgroundColor: "#F59E0B", color: "#000", fontWeight: 700, cursor: "pointer", fontSize: "12px" }}>Review →</button>
                <button onClick={() => deleteTrade(entry.id)} style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.25)", backgroundColor: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "12px" }}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Hero Banner (show if active journal has 7-day data) */}
      {activeJournal && sevenDayTrades.length > 0 && (
        <div style={{ background: "linear-gradient(135deg,#111827 0%,#1a1f2e 100%)", border: "1px solid #1F2937", borderRadius: "16px", padding: "24px 28px", display: "flex", gap: "32px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: "180px" }}>
            <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#6B7280", marginBottom: "8px" }}>7-Day Equity</p>
            <EquityCurve trades={journalTrades} />
          </div>
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            {[
              { label: "P&L (7 days)", value: `${sevenDayPnl >= 0 ? "+" : ""}${sevenDayPnl.toFixed(2)}`, color: sevenDayPnl >= 0 ? "#22c55e" : "#ef4444" },
              { label: "7-Day Win Rate", value: sevenDayWinRate !== null ? `${sevenDayWinRate}%` : "—", color: "#F9FAFB" },
              { label: "Streak", value: calcStreak(journalTrades), color: "#A78BFA" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#6B7280", marginBottom: "4px" }}>{label}</p>
                <p style={{ fontSize: "26px", fontWeight: 700, color }}>{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section Header */}
      <div data-tour="journal-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <h2 style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "20px" }}>My Journals</h2>
        <button onClick={() => setShowCreateJournal(true)} style={{ padding: "9px 18px", borderRadius: "8px", border: "none", backgroundColor: "#8B5CF6", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>+ New Journal</button>
      </div>

      {/* Journals Grid */}
      <div data-tour="journal-grid">
      {journals.length === 0 ? (
        <div style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "60px 40px", textAlign: "center" }}>
          <p style={{ fontSize: "40px", marginBottom: "16px" }}>📓</p>
          <h2 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>Create your first journal</h2>
          <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "24px" }}>Define your trading rules and start logging trades.</p>
          <button onClick={() => setShowCreateJournal(true)} style={{ padding: "12px 28px", borderRadius: "12px", border: "none", backgroundColor: "#8B5CF6", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "15px" }}>Create Journal</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "16px" }}>
          {journals.map(j => {
            const jTrades = allEntries.filter(e => e.template_id === j.id);
            const jWins = jTrades.filter(t => (pnlNum(t) ?? 0) > 0).length;
            const jWr = jTrades.length ? Math.round((jWins / jTrades.length) * 100) : null;
            const jPnl = jTrades.reduce((s, t) => s + (pnlNum(t) ?? 0), 0);
            const isActive = activeJournal?.id === j.id;
            return (
              <div key={j.id} onClick={() => openJournal(j)}
                style={{ backgroundColor: "#111827", border: `1px solid ${isActive ? "#8B5CF6" : "#1F2937"}`, borderRadius: "12px", padding: "20px", cursor: "pointer", transition: "transform 0.2s,box-shadow 0.2s,border-color 0.2s", position: "relative", boxShadow: isActive ? "0 0 0 1px #8B5CF6" : "none" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.borderColor = "#8B5CF6"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.borderColor = isActive ? "#8B5CF6" : "#1F2937"; }}>

                {/* Edit + Delete buttons (appear on hover via CSS-in-JS workaround via group) */}
                <div style={{ display: "flex", gap: "6px", position: "absolute", top: "12px", right: "12px" }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => setEditJournal(j)} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid #374151", backgroundColor: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "11px" }}>✎</button>
                  <button onClick={() => deleteJournal(j)} style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "11px" }}>✕</button>
                </div>

                <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                  <span style={{ padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 500, backgroundColor: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>{j.instrument_type}</span>
                  {j.rules.length > 0 && <span style={{ padding: "2px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: 500, backgroundColor: "rgba(34,197,94,0.12)", color: "#22c55e" }}>{j.rules.length} rules</span>}
                </div>
                <h3 style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "17px", marginBottom: "8px", paddingRight: "60px" }}>{j.name}</h3>
                <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "#6B7280", marginBottom: "8px" }}>
                  {j.time_from && j.time_to && <span>🕐 {j.time_from}–{j.time_to}</span>}
                  {j.risk_per_trade && <span>⚡ {j.risk_per_trade}% risk</span>}
                  {j.max_trades_per_day && <span>📊 max {j.max_trades_per_day}/day</span>}
                </div>
                <div style={{ display: "flex", gap: "16px", fontSize: "13px", borderTop: "1px solid #1F2937", paddingTop: "10px", marginTop: "4px" }}>
                  <span style={{ color: "#9CA3AF" }}>{jTrades.length} trades</span>
                  {jWr !== null && <span style={{ color: "#9CA3AF" }}>Win {jWr}%</span>}
                  {jTrades.length > 0 && <span style={{ color: jPnl >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{jPnl >= 0 ? "+" : ""}{jPnl.toFixed(2)}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Bulk Move Modal */}
      {showBulkModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setShowBulkModal(false)}>
          <div style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "16px", width: "100%", maxWidth: "420px", padding: "28px" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "17px", marginBottom: "8px" }}>Move all MT5 trades to journal</h3>
            <p style={{ color: "#6B7280", fontSize: "13px", marginBottom: "20px" }}>
              {mt5Pending.length} trade{mt5Pending.length !== 1 ? "s" : ""} will be moved. Trade data (Symbol, Direction, P&L etc.) is carried over automatically. You can add notes & emotions later via "Needs Review".
            </p>
            {journals.length === 0 ? (
              <p style={{ color: "#F59E0B", fontSize: "13px" }}>No journals yet — create one first.</p>
            ) : (
              <>
                <label style={{ color: "#9CA3AF", fontSize: "13px", display: "block", marginBottom: "8px" }}>Select Journal</label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                  {journals.map(j => (
                    <button key={j.id} onClick={() => setBulkJournalId(j.id)}
                      style={{ padding: "12px 16px", borderRadius: "10px", border: `1px solid ${bulkJournalId === j.id ? "#8B5CF6" : "#1F2937"}`, backgroundColor: bulkJournalId === j.id ? "rgba(139,92,246,0.15)" : "transparent", color: bulkJournalId === j.id ? "#A78BFA" : "#9CA3AF", cursor: "pointer", textAlign: "left", fontSize: "14px", fontWeight: 600, transition: "all 0.15s" }}>
                      {j.name}
                      <span style={{ fontSize: "12px", fontWeight: 400, color: "#6B7280", marginLeft: "8px" }}>{j.instrument_type}</span>
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button onClick={() => setShowBulkModal(false)} style={{ padding: "9px 18px", borderRadius: "8px", border: "1px solid #1F2937", backgroundColor: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "14px" }}>Cancel</button>
                  <button onClick={bulkMove} disabled={!bulkJournalId || bulkMoving}
                    style={{ padding: "9px 20px", borderRadius: "8px", border: "none", backgroundColor: "#F59E0B", color: "#000", fontWeight: 700, cursor: (!bulkJournalId || bulkMoving) ? "not-allowed" : "pointer", fontSize: "14px", opacity: (!bulkJournalId || bulkMoving) ? 0.6 : 1 }}>
                    {bulkMoving ? "Moving..." : `Move ${mt5Pending.length} trades →`}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateJournal && <JournalCreateModal onClose={() => setShowCreateJournal(false)} onSaved={async () => { setShowCreateJournal(false); await load(); }} />}
      {editJournal && <JournalCreateModal initial={editJournal} onClose={() => setEditJournal(null)} onSaved={async () => { setEditJournal(null); await load(); }} />}
      {reviewEntry && <Mt5ReviewModal entry={reviewEntry} templates={allTemplates as TemplateDef[]} onClose={() => setReviewEntry(null)} onSaved={async () => { setReviewEntry(null); setShowInbox(false); await load(); }} />}

      <OnboardingTour tour="journal" steps={JOURNAL_STEPS} alreadyCompleted={journalTourCompleted} />
    </div>
  );

  // ─── Trades View ─────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
        <button onClick={() => setView("journals")} style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid #374151", backgroundColor: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "13px" }}>← Journals</button>
        <div>
          <h1 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "20px" }}>{activeJournal?.name}</h1>
          <p style={{ color: "#6B7280", fontSize: "12px" }}>{journalTrades.length} trade{journalTrades.length !== 1 ? "s" : ""}</p>
        </div>
        {/* View Tabs */}
        <div style={{ display: "flex", gap: "4px", backgroundColor: "#0f1923", borderRadius: "10px", padding: "3px" }}>
          <button onClick={() => setView("trades")}
            style={{ padding: "6px 14px", borderRadius: "8px", border: "none", backgroundColor: view === "trades" ? "#1F2937" : "transparent", color: view === "trades" ? "#F9FAFB" : "#6B7280", cursor: "pointer", fontSize: "13px", fontWeight: view === "trades" ? 600 : 400 }}>
            Trades
          </button>
          <button onClick={() => setView("stats")}
            style={{ padding: "6px 14px", borderRadius: "8px", border: "none", backgroundColor: view === "stats" ? "#1F2937" : "transparent", color: view === "stats" ? "#A78BFA" : "#6B7280", cursor: "pointer", fontSize: "13px", fontWeight: view === "stats" ? 600 : 400 }}>
            📊 Statistics
          </button>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          {syncMsg && <span style={{ fontSize: "12px", color: syncMsg.startsWith("✅") ? "#22c55e" : "#ef4444" }}>{syncMsg}</span>}
          {(() => {
            const dotColor = metaConnected ? "#00c896" : "#ef4444";
            return (
              <button onClick={mt5Sync} disabled={syncing} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", border: `1px solid ${dotColor}`, backgroundColor: "transparent", color: dotColor, cursor: syncing ? "not-allowed" : "pointer", fontSize: "13px", opacity: syncing ? 0.6 : 1 }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}`, flexShrink: 0, animation: metaConnected ? "pulse 1.8s infinite" : "none" }} />
                {syncing ? "Syncing..." : "MT5 Sync"}
              </button>
            );
          })()}
          {view === "trades" && <button onClick={() => setShowWizard(true)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#8B5CF6", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>+ Log Trade</button>}
        </div>
      </div>

      {/* Statistics View */}
      {view === "stats" && activeJournal && (
        <JournalStats entries={journalTrades} journal={activeJournal} />
      )}

      {/* Trades View */}
      {view === "trades" && <>

      {/* Quickview Stats */}
      {todayTrades.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "10px" }}>
          {[
            { label: "Trades Today", value: String(todayTrades.length), color: "#F9FAFB" },
            { label: "P&L Today", value: `${todayPnl >= 0 ? "+" : ""}${todayPnl.toFixed(2)}`, color: todayPnl >= 0 ? "#22c55e" : "#ef4444" },
            { label: "Rules Broken", value: String(rulesBroken), color: rulesBroken > 0 ? "#ef4444" : "#22c55e" },
            { label: "Win Rate Today", value: todayWinRate !== null ? `${todayWinRate}%` : "—", color: "#F9FAFB" },
            { label: "Current Streak", value: calcStreak(journalTrades), color: "#A78BFA" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "12px", padding: "14px 16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: "#6B7280", marginBottom: "6px" }}>{label}</p>
              <p style={{ fontSize: "22px", fontWeight: 700, color }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter + Search */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {(["all", "today", "week", "month"] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${filter === f ? "rgba(139,92,246,0.5)" : "#374151"}`, backgroundColor: filter === f ? "rgba(139,92,246,0.1)" : "transparent", color: filter === f ? "#A78BFA" : "#9CA3AF", cursor: "pointer", fontSize: "13px" }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          {reviewCount > 0 && (
            <button onClick={() => setShowInbox(true)}
              style={{ padding: "6px 14px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.25)", backgroundColor: showInbox ? "rgba(239,68,68,0.12)" : "transparent", color: showInbox ? "#f87171" : "#ef4444", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "5px" }}>
              Needs Review <span style={{ backgroundColor: "#ef4444", color: "#fff", fontSize: "10px", fontWeight: 700, borderRadius: "8px", padding: "0 5px", minWidth: "16px", textAlign: "center" }}>{reviewCount}</span>
            </button>
          )}
        </div>
        <input style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "8px", padding: "7px 12px", color: "#F9FAFB", fontSize: "13px", outline: "none", width: "280px", maxWidth: "100%" }}
          placeholder="Search symbol, setup, notes, emotions..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Trade Table */}
      {filteredTrades.length === 0 ? (
        <div style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "60px 40px", textAlign: "center" }}>
          <p style={{ fontSize: "36px", marginBottom: "14px" }}>📈</p>
          <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "20px" }}>{journalTrades.length === 0 ? "No trades yet." : "No trades match the current filter."}</p>
          {journalTrades.length === 0 && (
            <button onClick={() => setShowWizard(true)} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", backgroundColor: "#8B5CF6", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>Log your first trade</button>
          )}
        </div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid #1F2937" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: "#0f1923" }}>
                {[
                  { key: "date", label: "Date" }, { key: "symbol", label: "Symbol" },
                  { key: "direction", label: "Direction" }, { key: "setup", label: "Setup" },
                  { key: "pnl", label: "P&L" }, { key: "emotions", label: "Emotions" },
                  { key: "", label: "" },
                ].map(({ key, label }) => (
                  <th key={label} onClick={key ? () => toggleSort(key) : undefined}
                    style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #1F2937", cursor: key ? "pointer" : "default", userSelect: "none", whiteSpace: "nowrap" }}>
                    {label}{key ? sortArrow(key) : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map(trade => {
                const sym = getField(trade, "Symbol");
                const dir = getField(trade, "Direction");
                const setup = getField(trade, "Setup");
                const p = pnlNum(trade);
                const emos = getEmotions(trade);
                const d = new Date(trade.trade_date);
                const dateStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
                const timeStr = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
                return (
                  <tr key={trade.id} onClick={() => setDetailTrade(trade)}
                    style={{ borderBottom: "1px solid #1F2937", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = ""}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ color: "#9CA3AF", fontSize: "13px" }}>{dateStr}</div>
                      <div style={{ color: "#4B5563", fontSize: "11px" }}>{timeStr}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: p !== null ? (p >= 0 ? "#22c55e" : "#ef4444") : "#374151", flexShrink: 0 }} />
                        <span style={{ color: "#F9FAFB", fontWeight: 700 }}>{sym ?? "—"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {dir && <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "5px", backgroundColor: dir === "Long" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: dir === "Long" ? "#22c55e" : "#ef4444" }}>{dir === "Long" ? "▲ LONG" : "▼ SHORT"}</span>}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#9CA3AF", fontSize: "13px" }}>{setup ?? <span style={{ color: "#374151" }}>—</span>}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {p !== null ? <span style={{ color: p >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700, fontSize: "15px" }}>{p >= 0 ? "+" : ""}{p.toFixed(2)}</span> : <span style={{ color: "#374151" }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {emos.slice(0, 2).map(e => <span key={e} style={{ padding: "2px 7px", borderRadius: "10px", fontSize: "11px", backgroundColor: `${EMOTION_COLORS[e] ?? "#6B7280"}22`, color: EMOTION_COLORS[e] ?? "#6B7280", fontWeight: 500 }}>{e}</span>)}
                        {emos.length > 2 && <span style={{ color: "#6B7280", fontSize: "11px" }}>+{emos.length - 2}</span>}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {(trade.trade_screenshots?.length ?? 0) > 0 && (
                          <span title={`${trade.trade_screenshots!.length} screenshot${trade.trade_screenshots!.length > 1 ? "s" : ""}`} style={{ display: "flex", alignItems: "center", gap: "3px", padding: "3px 7px", borderRadius: "6px", backgroundColor: "rgba(139,92,246,0.1)", color: "#A78BFA", fontSize: "11px" }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
                            {trade.trade_screenshots!.length}
                          </span>
                        )}
                        <button onClick={() => setEditTrade(trade)} style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid rgba(139,92,246,0.3)", backgroundColor: "transparent", color: "#A78BFA", cursor: "pointer", fontSize: "12px" }}>✎</button>
                        <button onClick={() => deleteTrade(trade.id)} style={{ padding: "5px 10px", borderRadius: "6px", border: "1px solid rgba(239,68,68,0.25)", backgroundColor: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "12px" }}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Trade Detail Modal */}
      {detailTrade && activeJournal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, backgroundColor: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }} onClick={() => setDetailTrade(null)}>
          <div style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "16px", width: "100%", maxWidth: "620px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "17px" }}>{getField(detailTrade, "Symbol") ?? "Trade"} — {getField(detailTrade, "Direction")}</h3>
                <p style={{ color: "#6B7280", fontSize: "12px", marginTop: "2px" }}>{new Date(detailTrade.trade_date).toLocaleString("en-GB")}</p>
              </div>
              <button onClick={() => setDetailTrade(null)} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "22px" }}>×</button>
            </div>
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* P&L Hero */}
              {pnlNum(detailTrade) !== null && (
                <div style={{ backgroundColor: pnlNum(detailTrade)! >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${pnlNum(detailTrade)! >= 0 ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                  <p style={{ color: "#6B7280", fontSize: "12px", marginBottom: "4px" }}>P&L</p>
                  <p style={{ color: pnlNum(detailTrade)! >= 0 ? "#22c55e" : "#ef4444", fontWeight: 800, fontSize: "32px" }}>{pnlNum(detailTrade)! >= 0 ? "+" : ""}{pnlNum(detailTrade)!.toFixed(2)}</p>
                </div>
              )}
              {/* Price grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px" }}>
                {[["Entry Price","Entry"],["Exit Price","Exit"],["Stop Loss","SL"],["Take Profit","TP"],["BE","BE"],["Volume","Volume"],["Commission","Comm."],["Swap","Swap"]].map(([lbl, short]) => {
                  const v = getField(detailTrade, lbl); if (!v) return null;
                  return <div key={lbl} style={{ backgroundColor: "#0f1923", borderRadius: "8px", padding: "10px 12px" }}><p style={{ color: "#6B7280", fontSize: "10px", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "3px" }}>{short}</p><p style={{ color: "#D1D5DB", fontSize: "14px", fontWeight: 600 }}>{v}</p></div>;
                })}
              </div>
              {/* Setup */}
              {getField(detailTrade, "Setup") && <div><p style={{ color: "#6B7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "4px" }}>Setup</p><p style={{ color: "#D1D5DB", fontSize: "14px" }}>{getField(detailTrade, "Setup")}</p></div>}
              {/* Emotions */}
              {getEmotions(detailTrade).length > 0 && <div><p style={{ color: "#6B7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "6px" }}>Emotions</p><div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>{getEmotions(detailTrade).map(e => <span key={e} style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "12px", backgroundColor: `${EMOTION_COLORS[e] ?? "#6B7280"}22`, color: EMOTION_COLORS[e] ?? "#6B7280", fontWeight: 500 }}>{e}</span>)}</div></div>}
              {/* Rules */}
              {(() => {
                const raw = getField(detailTrade, "Rules Followed"); if (!raw) return null;
                try {
                  const arr: { id: string; text: string; compliant: boolean }[] = JSON.parse(raw);
                  return (
                    <div><p style={{ color: "#6B7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "8px" }}>Rules</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {arr.map(r => <div key={r.id} style={{ padding: "6px 10px", borderRadius: "8px", fontSize: "13px", backgroundColor: r.compliant ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: r.compliant ? "#22c55e" : "#ef4444" }}>{r.compliant ? "✓" : "✗"} {r.text}</div>)}
                      </div>
                    </div>
                  );
                } catch { return null; }
              })()}
              {/* Notes */}
              {getField(detailTrade, "Notes") && <div><p style={{ color: "#6B7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "4px" }}>Notes</p><p style={{ color: "#D1D5DB", fontSize: "14px", lineHeight: 1.6 }}>{getField(detailTrade, "Notes")}</p></div>}
              {/* Screenshots */}
              {detailScreenshots.length > 0 && (
                <div>
                  <p style={{ color: "#6B7280", fontSize: "11px", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "8px" }}>Screenshots</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                    {detailScreenshots.map(s => (
                      <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", borderRadius: "8px", overflow: "hidden", aspectRatio: "16/9", backgroundColor: "#0f1923" }}>
                        <img src={s.url} alt={s.filename} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "opacity 0.2s" }} onMouseEnter={e => (e.currentTarget.style.opacity="0.8")} onMouseLeave={e => (e.currentTarget.style.opacity="1")} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", paddingTop: "8px" }}>
                <button onClick={() => { setEditTrade(detailTrade); setDetailTrade(null); }} style={{ padding: "8px 18px", borderRadius: "8px", border: "1px solid rgba(139,92,246,0.4)", backgroundColor: "transparent", color: "#A78BFA", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>✎ Edit</button>
                <button onClick={() => { deleteTrade(detailTrade.id); setDetailTrade(null); }} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.25)", backgroundColor: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "13px" }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wizards + Modals */}
      {showWizard && activeJournal && <TradeWizard journal={activeJournal} onClose={() => setShowWizard(false)} onSaved={async () => { setShowWizard(false); await load(); }} />}
      {editTrade && activeJournal && <TradeWizard journal={activeJournal} entry={editTrade} onClose={() => setEditTrade(null)} onSaved={async () => { setEditTrade(null); await load(); }} />}
      {reviewEntry && <Mt5ReviewModal entry={reviewEntry} templates={allTemplates as TemplateDef[]} onClose={() => setReviewEntry(null)} onSaved={async () => { setReviewEntry(null); await load(); }} />}

      </> /* end trades view */}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
    </div>
  );
}
