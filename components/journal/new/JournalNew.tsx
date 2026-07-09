"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  starting_balance: number | null;
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
function riskAmt(trade: Trade): number | null {
  const v = getField(trade, "Risk Amount"); const n = v ? parseFloat(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}
function rMultiple(trade: Trade): number | null {
  const p = pnlNum(trade); const r = riskAmt(trade);
  return p !== null && r ? p / r : null;
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

// ─── Mini Sparkline (per-journal cumulative P&L) ──────────────────────────────
function MiniSparkline({ trades, gradId }: { trades: Trade[]; gradId: string }) {
  const sorted = [...trades].filter(t => pnlNum(t) !== null).sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
  const W = 260, H = 46;
  if (sorted.length < 2) {
    return <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", color: "#4B5563", fontSize: "11px", border: "1px dashed rgba(255,255,255,0.06)", borderRadius: "8px" }}>Not enough data yet</div>;
  }
  let cum = 0; const pts = sorted.map(t => { cum += pnlNum(t)!; return cum; });
  const min = Math.min(0, ...pts), max = Math.max(0, ...pts), range = max - min || 1;
  const sx = (i: number) => (i / (pts.length - 1)) * W;
  const sy = (v: number) => H - ((v - min) / range) * (H - 8) - 4;
  const z = sy(0);
  const line = pts.map((v, i) => `${i === 0 ? "M" : "L"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  const fill = `${line} L${W},${z.toFixed(1)} L0,${z.toFixed(1)} Z`;
  const pos = pts[pts.length - 1] >= 0; const clr = pos ? "#22c55e" : "#ef4444";
  const id = `spark-${gradId}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H} style={{ display: "block" }}>
      <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={clr} stopOpacity="0.28" /><stop offset="100%" stopColor={clr} stopOpacity="0" /></linearGradient></defs>
      <line x1="0" y1={z} x2={W} y2={z} stroke="rgba(255,255,255,0.07)" strokeWidth="1" strokeDasharray="3,3" />
      <path d={fill} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={clr} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 4px ${clr}55)` }} />
    </svg>
  );
}

// ─── Premium Equity Hero chart (smooth, glowing, last 7 days) ─────────────────
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return "";
  let d = `M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}
function EquityHero({ trades }: { trades: Trade[] }) {
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
  const recent = [...trades].filter(t => new Date(t.trade_date) >= cutoff && pnlNum(t) !== null)
    .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
  const W = 560, H = 158, PL = 6, PR = 14, PT = 14, PB = 12;
  const cW = W - PL - PR, cH = H - PT - PB;
  if (recent.length < 2) return <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center", color: "#4B5563", fontSize: "13px" }}>Not enough data this week</div>;
  let cum = 0; const vals = [0, ...recent.map(t => { cum += pnlNum(t)!; return cum; })];
  const min = Math.min(...vals), max = Math.max(...vals), range = max - min || 1;
  const sx = (i: number) => PL + (i / (vals.length - 1)) * cW;
  const sy = (v: number) => PT + cH - ((v - min) / range) * cH;
  const z = sy(0);
  const pts = vals.map((v, i) => ({ x: sx(i), y: sy(v) }));
  const line = smoothPath(pts);
  const fill = `${line} L${pts[pts.length - 1].x.toFixed(1)},${z.toFixed(1)} L${pts[0].x.toFixed(1)},${z.toFixed(1)} Z`;
  const last = vals[vals.length - 1], pos = last >= 0;
  const c1 = pos ? "#34d399" : "#f87171", c2 = pos ? "#16a34a" : "#dc2626";
  const lx = pts[pts.length - 1].x, ly = pts[pts.length - 1].y;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id="eqhero-stroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor={c2} /><stop offset="100%" stopColor={c1} /></linearGradient>
        <linearGradient id="eqhero-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={c1} stopOpacity="0.3" /><stop offset="100%" stopColor={c1} stopOpacity="0" /></linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map(f => <line key={f} x1={PL} y1={PT + cH * f} x2={W - PR} y2={PT + cH * f} stroke="rgba(148,163,184,0.1)" strokeWidth="1" strokeDasharray="3,4" />)}
      <line x1={PL} y1={z} x2={W - PR} y2={z} stroke="rgba(148,163,184,0.22)" strokeWidth="1" />
      <path d={fill} fill="url(#eqhero-fill)" style={{ animation: "tjHeroFade 1s ease 0.35s both" }} />
      <path d={line} fill="none" stroke="url(#eqhero-stroke)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} style={{ animation: "tjEqDraw 1.15s cubic-bezier(.6,0,.2,1) both", filter: `drop-shadow(0 2px 8px ${c1}66)` }} />
      <circle cx={lx} cy={ly} r="9" fill={c1} style={{ animation: "tjHalo 2.4s ease-in-out infinite" }} />
      <circle cx={lx} cy={ly} r="4" fill="#fff" stroke={c1} strokeWidth="2.5" style={{ filter: `drop-shadow(0 0 6px ${c1})`, animation: "tjHeroFade 0.3s ease 1.2s both" }} />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
type Filter = "all" | "today" | "week" | "month" | "review";

export default function JournalNew({ journalTourCompleted = false, darkMode: darkModeProp, toggleTheme: toggleThemeProp, userName, isPro = false }: { journalTourCompleted?: boolean; darkMode?: boolean; toggleTheme?: () => void; userName?: string | null; isPro?: boolean }) {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [allEntries, setAllEntries] = useState<Trade[]>([]);
  const [allTemplates, setAllTemplates] = useState<TemplateDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeJournal, setActiveJournal] = useState<Journal | null>(null);
  const [view, setView] = useState<"journals" | "trades" | "stats">("journals");
  const [jMenuOpen, setJMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

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
  const [metaAccountBalance, setMetaAccountBalance] = useState<number | null>(null);
  const [showInbox, setShowInbox] = useState(false);
  const [bulkJournalId, setBulkJournalId] = useState("");
  const [bulkMoving, setBulkMoving] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [darkModeInternal, setDarkModeInternal] = useState(true);
  const darkMode = darkModeProp !== undefined ? darkModeProp : darkModeInternal;

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

  // URL ?view=stats|trades drives the opened view. From the list, open the
  // last-used (or first) journal in that view (so the header "Statistics" entry
  // lands straight in stats, and a refresh keeps you in the journal). When
  // already inside a journal, just sync the tab to the URL.
  useEffect(() => {
    if (loading || journals.length === 0) return;
    const v = searchParams.get("view");
    if (v !== "stats" && v !== "trades") return;
    if (view === v) return;
    if (view === "journals") {
      let target: Journal | null = null;
      try { const last = localStorage.getItem("tj-journal-last"); target = journals.find(j => j.id === last) ?? null; } catch {}
      target = target ?? activeJournal ?? journals[0];
      if (target) { setActiveJournal(target); setView(v); }
    } else {
      setView(v);
    }
  }, [searchParams, loading, journals, view, activeJournal]);

  // Demo-Tour (?demo=1): auf Steuer-Events vom AppDemoTour-Overlay hören.
  // Entkoppelt — die Tour-UI lebt in JournalLayoutClient, hier nur die Setter.
  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail ?? {};
      if (d.createModal !== undefined) setShowCreateJournal(!!d.createModal);
      if (d.wizard !== undefined) setShowWizard(!!d.wizard);
      if (d.openFirst) {
        if (journals[0]) { setActiveJournal(journals[0]); setView("trades"); }
      } else if (d.view) {
        setView(d.view as "journals" | "trades" | "stats");
      }
    };
    window.addEventListener("journal-demo:action", handler);
    return () => window.removeEventListener("journal-demo:action", handler);
  }, [journals]);

  useEffect(() => {
    fetch("/api/meta/settings")
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const connected = !!(d?.connected && d?.state === "DEPLOYED" && d?.connectionStatus === "CONNECTED");
        setMetaConnected(connected);
        if (connected) {
          fetch("/api/meta/account")
            .then(r => r.ok ? r.json() : null)
            .then(info => { if (info?.balance != null) setMetaAccountBalance(info.balance); })
            .catch(() => {});
        }
      })
      .catch(() => setMetaConnected(false));
  }, []);

  useEffect(() => {
    if (!detailTrade) { setDetailScreenshots([]); return; }
    fetch(`/api/v2/entries/${detailTrade.id}/screenshots`)
      .then(r => r.ok ? r.json() : [])
      .then(setDetailScreenshots);
  }, [detailTrade]);

  useEffect(() => {
    if (darkModeProp === undefined) {
      try { const s = localStorage.getItem("tj-journal-theme"); if (s !== null) setDarkModeInternal(s === "dark"); } catch {}
    }
  }, [darkModeProp]);

  const toggleTheme = toggleThemeProp ?? (() => setDarkModeInternal(d => {
    const n = !d;
    try { localStorage.setItem("tj-journal-theme", n ? "dark" : "light"); } catch {}
    return n;
  }));

  const openJournal = (j: Journal, target: "trades" | "stats" = "trades") => {
    setActiveJournal(j); setView(target); setFilter("all"); setSearch("");
    try { localStorage.setItem("tj-journal-last", j.id); } catch {}
    router.replace(`/dashboard/journal?view=${target}`, { scroll: false });
  };

  // Switch the active journal without leaving the current view (top-bar dropdown).
  const switchJournal = (j: Journal) => {
    setActiveJournal(j); setFilter("all"); setSearch("");
    try { localStorage.setItem("tj-journal-last", j.id); } catch {}
  };

  // Change the Trades/Statistics tab and mirror it in the URL, so the header
  // "Statistics" link is a real navigation and its highlight stays correct.
  const goView = (v: "trades" | "stats") => {
    setView(v);
    router.replace(`/dashboard/journal?view=${v}`, { scroll: false });
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
  const anySevenDay = allEntries.some(e => new Date(e.trade_date) >= sevenDayCutoff && journals.some(j => j.id === e.template_id));

  // Filtered + sorted trade list
  const filteredTrades = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
    let list = journalTrades;

    if (filter === "today") list = list.filter(t => t.trade_date.slice(0, 10) === today);
    else if (filter === "week") list = list.filter(t => new Date(t.trade_date) >= weekAgo);
    else if (filter === "month") list = list.filter(t => new Date(t.trade_date) >= monthAgo);
    else if (filter === "review") list = list.filter(t => t.source === "mt5" && !getField(t, "Setup") && getEmotions(t).length === 0);

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
      else if (sortCol === "r") cmp = (rMultiple(a) ?? -Infinity) - (rMultiple(b) ?? -Infinity);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [journalTrades, filter, search, sortCol, sortDir, today]);

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir(col === "date" ? "desc" : "asc"); }
  };

  const sortArrow = (col: string) => sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : "";

  const reviewCount = journalTrades.filter(t => t.source === "mt5" && !getField(t, "Setup") && getEmotions(t).length === 0).length;
  useEffect(() => { if (filter === "review" && reviewCount === 0) setFilter("all"); }, [reviewCount, filter]);

  const T = {
    bgCard:     darkMode ? "linear-gradient(145deg, #0f0f18, #090909)" : "linear-gradient(145deg, #ffffff, #f9fafb)",
    bgInput:    darkMode ? "#111827" : "#f9fafb",
    bgHeader:   darkMode ? "#0f1923" : "#f3f4f6",
    text1:      darkMode ? "#F9FAFB" : "#111827",
    text2:      darkMode ? "#D1D5DB" : "#374151",
    text3:      darkMode ? "#9CA3AF" : "#4B5563",
    text4:      "#6B7280",
    text5:      darkMode ? "#4B5563" : "#9CA3AF",
    text6:      darkMode ? "#374151" : "#D1D5DB",
    border:     darkMode ? "#1F2937" : "#E5E7EB",
    border2:    darkMode ? "#374151" : "#D1D5DB",
    borderSoft: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
    shadow:     darkMode ? "0 4px 32px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04)" : "0 1px 8px rgba(0,0,0,0.07)",
    rowHover:   darkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
  };

  const ThemeToggle = (
    <button onClick={toggleTheme} title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
      style={{ padding: "7px 10px", borderRadius: "8px", border: `1px solid ${T.border2}`, backgroundColor: "transparent", color: T.text3, cursor: "pointer", lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {darkMode ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px", color: T.text4, fontSize: "14px" }}>
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
              <div key={entry.id} style={{ background: T.bgCard, border: "1px solid rgba(245,158,11,0.2)", borderRadius: "12px", padding: "12px 18px", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
                <div style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#F59E0B", flexShrink: 0 }} />
                <span style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "15px", minWidth: "80px" }}>{sym ?? "—"}</span>
                {dir && <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "5px", backgroundColor: dir === "Long" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: dir === "Long" ? "#22c55e" : "#ef4444" }}>{dir === "Long" ? "▲ LONG" : "▼ SHORT"}</span>}
                {p !== null && <span style={{ color: p >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{p >= 0 ? "+" : ""}{p.toFixed(2)}</span>}
                <span style={{ color: T.text4, fontSize: "12px", marginLeft: "auto" }}>{new Date(entry.trade_date).toLocaleDateString("en-GB")}</span>
                <button onClick={() => setReviewEntry(entry)} style={{ padding: "7px 16px", borderRadius: "8px", border: "none", backgroundColor: "#F59E0B", color: "#000", fontWeight: 700, cursor: "pointer", fontSize: "12px" }}>Review →</button>
                <button onClick={() => deleteTrade(entry.id)} style={{ padding: "7px 10px", borderRadius: "8px", border: "1px solid rgba(239,68,68,0.25)", backgroundColor: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "12px" }}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Hero Banner (show if active journal has 7-day data) */}
      {activeJournal && anySevenDay && (() => {
        const pos = sevenDayPnl >= 0;
        const streak = calcStreak(journalTrades);
        const streakUp = streak.startsWith("+");
        const pct = activeJournal.starting_balance ? (sevenDayPnl / activeJournal.starting_balance) * 100 : null;
        const wr = sevenDayWinRate;
        const R = 24, CX = 28, CY = 28, sw = 6, circ = 2 * Math.PI * R, frac = (wr ?? 0) / 100;
        const wrColor = (wr ?? 0) >= 50 ? "#22c55e" : "#ef4444";
        return (
          <div data-tour="equity-hero" style={{ position: "relative", overflow: "hidden", background: darkMode ? "linear-gradient(135deg, #0e0a1a, #080808)" : T.bgCard, border: "1px solid rgba(139,92,246,0.22)", borderRadius: "20px", boxShadow: `${T.shadow}, inset 0 1px 0 rgba(255,255,255,0.05)`, padding: "22px 26px", display: "flex", gap: "26px", alignItems: "stretch", flexWrap: "wrap" }}>
            {/* ambient glow */}
            <div style={{ position: "absolute", top: "-55%", left: "10%", width: "460px", height: "280px", background: `radial-gradient(ellipse, ${pos ? "rgba(34,197,94,0.10)" : "rgba(239,68,68,0.10)"}, transparent 70%)`, pointerEvents: "none" }} />

            {/* Left: title + chart */}
            <div style={{ flex: "2 1 340px", minWidth: "290px", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
              <div style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: journals.length > 1 ? "9px" : 0 }}>
                  <span style={{ color: T.text4, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>7-Day Performance</span>
                  {journals.length <= 1 && <>
                    <span style={{ color: T.text1, fontSize: "13px", fontWeight: 700 }}>{activeJournal.name}</span>
                    <span style={{ padding: "2px 9px", borderRadius: "20px", fontSize: "10px", fontWeight: 600, backgroundColor: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>{activeJournal.instrument_type}</span>
                  </>}
                </div>
                {journals.length > 1 && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {journals.map(j => {
                      const sel = activeJournal.id === j.id;
                      return (
                        <button key={j.id} onClick={() => setActiveJournal(j)}
                          style={{ padding: "4px 12px", borderRadius: "20px", border: `1px solid ${sel ? "#8B5CF6" : T.border2}`, background: sel ? "rgba(139,92,246,0.18)" : "transparent", color: sel ? "#c4b5fd" : T.text4, fontSize: "12px", fontWeight: sel ? 700 : 500, cursor: "pointer", transition: "all .15s", whiteSpace: "nowrap" }}
                          onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.4)"; }}
                          onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLButtonElement).style.borderColor = T.border2; }}>
                          {j.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", minHeight: "150px" }}>
                <div style={{ width: "100%" }}><EquityHero key={activeJournal.id} trades={journalTrades} /></div>
              </div>
            </div>

            {/* Divider */}
            <div className="tj-hero-div" style={{ width: "1px", background: T.borderSoft, alignSelf: "stretch" }} />

            {/* Right: stats */}
            <div style={{ flex: "1 1 230px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: "20px", position: "relative", zIndex: 1 }}>
              {/* P&L hero */}
              <div>
                <p style={{ color: T.text4, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>Net P&amp;L · 7 days</p>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: "9px", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 800, fontSize: "34px", lineHeight: 1, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", background: pos ? "linear-gradient(135deg, #86efac, #22c55e)" : "linear-gradient(135deg, #fca5a5, #ef4444)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>{pos ? "+" : ""}{sevenDayPnl.toFixed(2)}</span>
                  {pct !== null && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "2px", padding: "2px 7px", borderRadius: "20px", background: pos ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${pos ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, color: pos ? "#22c55e" : "#ef4444", fontSize: "10px", fontWeight: 700 }}>{pos ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}%</span>
                  )}
                </div>
              </div>

              {/* Win ring + Streak */}
              <div style={{ display: "flex", gap: "24px", alignItems: "center", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                  <div style={{ position: "relative", width: "56px", height: "56px", flexShrink: 0 }}>
                    <svg width="56" height="56" viewBox="0 0 56 56">
                      <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth={sw} />
                      <circle cx={CX} cy={CY} r={R} fill="none" stroke={wrColor} strokeWidth={sw} strokeLinecap="round" strokeDasharray={`${(circ * frac).toFixed(1)} ${(circ * (1 - frac)).toFixed(1)}`} transform={`rotate(-90 ${CX} ${CY})`} style={{ filter: `drop-shadow(0 0 4px ${wrColor}66)` }} />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: T.text1, fontWeight: 800, fontSize: "14px", fontVariantNumeric: "tabular-nums" }}>{wr !== null ? `${wr}%` : "—"}</span>
                    </div>
                  </div>
                  <span style={{ color: T.text4, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.3 }}>Win<br />Rate</span>
                </div>
                <div>
                  <p style={{ color: T.text4, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px" }}>Streak</p>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: streakUp ? "#22c55e" : streak.startsWith("-") ? "#ef4444" : T.text4, fontWeight: 800, fontSize: "24px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                    {streakUp && <svg width="16" height="16" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><path d="M12 2c1 3-1 4-1 6a3 3 0 0 0 6 0c0-1 0-2-1-3 2 1 4 4 4 8a8 8 0 1 1-16 0c0-3 2-6 4-7 0 2 1 3 2 3 1 0 1-1 1-2 0-3-3-4-2-8z" /></svg>}
                    {streak}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Section Header */}
      <div data-tour="journal-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ color: T.text1, fontWeight: 800, fontSize: "26px", letterSpacing: "-0.02em", lineHeight: 1.1 }}>My Journals</h2>
          {journals.length > 0 && <p style={{ color: T.text4, fontSize: "13px", marginTop: "3px" }}>{journals.length} journal{journals.length !== 1 ? "s" : ""} · {allEntries.filter(e => journals.some(j => j.id === e.template_id)).length} trades logged</p>}
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {ThemeToggle}
          {(() => {
            const gated = !isPro && journals.length >= 1;
            return (
              <button
                onClick={() => { if (gated) { window.location.href = "/billing"; } else { setShowCreateJournal(true); } }}
                title={gated ? "Basic includes 1 journal — upgrade to Pro for unlimited" : undefined}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 18px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #8B5CF6, #7c3aed)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "14px", boxShadow: "0 4px 16px rgba(139,92,246,0.35)" }}
              >
                {gated ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                )}
                {gated ? "Unlock more journals" : "New Journal"}
              </button>
            );
          })()}
        </div>
      </div>

      {/* Journals Grid */}
      <div data-tour="journal-grid">
      {journals.length === 0 ? (
        <div style={{ background: T.bgCard, border: `1px solid ${T.borderSoft}`, borderRadius: "16px", boxShadow: T.shadow, padding: "60px 40px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "56px", height: "56px", borderRadius: "16px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.25)", marginBottom: "18px" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
          </div>
          <h2 style={{ color: T.text1, fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>Create your first journal</h2>
          <p style={{ color: T.text4, fontSize: "14px", marginBottom: "24px" }}>Define your trading rules and start logging trades.</p>
          <button onClick={() => setShowCreateJournal(true)} style={{ padding: "12px 28px", borderRadius: "12px", border: "none", backgroundColor: "#8B5CF6", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "15px" }}>Create Journal</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: "18px" }}>
          {journals.map(j => {
            const jTrades = allEntries.filter(e => e.template_id === j.id);
            const jWins = jTrades.filter(t => (pnlNum(t) ?? 0) > 0).length;
            const jWr = jTrades.length ? Math.round((jWins / jTrades.length) * 100) : null;
            const jPnl = jTrades.reduce((s, t) => s + (pnlNum(t) ?? 0), 0);
            const isActive = activeJournal?.id === j.id;
            const baseShadow = isActive ? `0 0 0 1px #8B5CF6, 0 0 30px rgba(139,92,246,0.18), ${T.shadow}` : T.shadow;
            const metaIcon = (path: React.ReactNode) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>{path}</svg>;
            return (
              <div key={j.id} onClick={() => openJournal(j)}
                style={{ background: T.bgCard, border: `1px solid ${isActive ? "#8B5CF6" : T.borderSoft}`, borderRadius: "18px", padding: "18px 20px", cursor: "pointer", transition: "transform .2s ease, border-color .2s ease, box-shadow .2s ease", position: "relative", overflow: "hidden", boxShadow: baseShadow }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(-3px)"; el.style.borderColor = "rgba(139,92,246,0.45)"; el.style.boxShadow = `0 0 0 1px rgba(139,92,246,0.45), 0 12px 44px rgba(0,0,0,0.5)`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLDivElement; el.style.transform = "translateY(0)"; el.style.borderColor = isActive ? "#8B5CF6" : T.borderSoft; el.style.boxShadow = baseShadow; }}>

                {/* ambient glow (active) */}
                {isActive && <div style={{ position: "absolute", top: "-40%", right: "-15%", width: "200px", height: "140px", background: "radial-gradient(ellipse, rgba(139,92,246,0.16), transparent 70%)", pointerEvents: "none" }} />}

                {/* Top: badges + actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "12px", position: "relative", zIndex: 1 }}>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>{j.instrument_type}</span>
                    {j.rules.length > 0 && <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 600, backgroundColor: "rgba(34,197,94,0.12)", color: "#22c55e" }}>{j.rules.length} rules</span>}
                    {isActive && <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: 700, backgroundColor: "rgba(139,92,246,0.2)", color: "#c4b5fd" }}>● Active</span>}
                  </div>
                  <div style={{ display: "flex", gap: "6px", flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                    <button title="Edit" onClick={() => setEditJournal(j)} style={{ padding: "4px 8px", borderRadius: "7px", border: `1px solid ${T.border2}`, backgroundColor: "transparent", color: T.text3, cursor: "pointer", fontSize: "11px" }}>✎</button>
                    <button title="Delete" onClick={() => deleteJournal(j)} style={{ padding: "4px 8px", borderRadius: "7px", border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "11px" }}>✕</button>
                  </div>
                </div>

                {/* Name */}
                <h3 style={{ color: T.text1, fontWeight: 700, fontSize: "18px", marginBottom: "10px", letterSpacing: "-0.01em", position: "relative", zIndex: 1 }}>{j.name}</h3>

                {/* Meta row */}
                <div style={{ display: "flex", gap: "14px", fontSize: "12px", color: T.text4, flexWrap: "wrap", position: "relative", zIndex: 1 }}>
                  {j.time_from && j.time_to && <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>{metaIcon(<><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></>)}{j.time_from}–{j.time_to}</span>}
                  {j.risk_per_trade != null && <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>{metaIcon(<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />)}{j.risk_per_trade}% risk</span>}
                  {j.max_trades_per_day != null && <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>{metaIcon(<><line x1="6" y1="20" x2="6" y2="12" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="18" y1="20" x2="18" y2="14" /></>)}max {j.max_trades_per_day}/day</span>}
                </div>

                {/* Sparkline */}
                <div style={{ margin: "14px 0 12px", position: "relative", zIndex: 1 }}>
                  <MiniSparkline trades={jTrades} gradId={j.id} />
                </div>

                {/* Footer: Net P&L hero + win/trades */}
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", borderTop: `1px solid ${T.borderSoft}`, paddingTop: "12px", position: "relative", zIndex: 1 }}>
                  <div>
                    <p style={{ color: T.text4, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: "3px" }}>Net P&L</p>
                    <p style={{ color: jTrades.length ? (jPnl >= 0 ? "#22c55e" : "#ef4444") : T.text5, fontWeight: 800, fontSize: "23px", lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{jTrades.length ? `${jPnl >= 0 ? "+" : ""}${jPnl.toFixed(2)}` : "—"}</p>
                  </div>
                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "3px" }}>
                    {jWr !== null && <span style={{ fontSize: "12px" }}><span style={{ color: T.text4 }}>Win </span><span style={{ color: jWr >= 50 ? "#22c55e" : "#ef4444", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{jWr}%</span></span>}
                    <span style={{ color: T.text4, fontSize: "12px", fontVariantNumeric: "tabular-nums" }}>{jTrades.length} trade{jTrades.length !== 1 ? "s" : ""}</span>
                  </div>
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
          <div style={{ background: T.bgCard, border: `1px solid ${T.borderSoft}`, borderRadius: "16px", boxShadow: T.shadow, width: "100%", maxWidth: "420px", padding: "28px" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: T.text1, fontWeight: 700, fontSize: "17px", marginBottom: "8px" }}>Move all MT5 trades to journal</h3>
            <p style={{ color: T.text4, fontSize: "13px", marginBottom: "20px" }}>
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
                      style={{ padding: "12px 16px", borderRadius: "10px", border: `1px solid ${bulkJournalId === j.id ? "#8B5CF6" : T.border}`, backgroundColor: bulkJournalId === j.id ? "rgba(139,92,246,0.15)" : "transparent", color: bulkJournalId === j.id ? "#A78BFA" : T.text3, cursor: "pointer", textAlign: "left", fontSize: "14px", fontWeight: 600, transition: "all 0.15s" }}>
                      {j.name}
                      <span style={{ fontSize: "12px", fontWeight: 400, color: T.text4, marginLeft: "8px" }}>{j.instrument_type}</span>
                    </button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button onClick={() => setShowBulkModal(false)} style={{ padding: "9px 18px", borderRadius: "8px", border: `1px solid ${T.border}`, backgroundColor: "transparent", color: T.text3, cursor: "pointer", fontSize: "14px" }}>Cancel</button>
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
        <button onClick={() => { setView("journals"); router.replace("/dashboard/journal", { scroll: false }); }} style={{ padding: "7px 14px", borderRadius: "8px", border: `1px solid ${T.border2}`, backgroundColor: "transparent", color: T.text3, cursor: "pointer", fontSize: "13px" }}>← Journals</button>
        <div style={{ position: "relative" }}>
          {journals.length > 1 ? (
            <button onClick={() => setJMenuOpen(o => !o)} style={{ display: "flex", alignItems: "center", gap: "8px", background: "transparent", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}>
              <h1 style={{ color: T.text1, fontWeight: 700, fontSize: "20px" }}>{activeJournal?.name}</h1>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.text4} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: jMenuOpen ? "rotate(180deg)" : "none", transition: "transform .18s", flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
            </button>
          ) : (
            <h1 style={{ color: T.text1, fontWeight: 700, fontSize: "20px" }}>{activeJournal?.name}</h1>
          )}
          <p style={{ color: T.text4, fontSize: "12px" }}>{journalTrades.length} trade{journalTrades.length !== 1 ? "s" : ""}</p>
          {jMenuOpen && journals.length > 1 && (
            <>
              <div onClick={() => setJMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
              <div style={{ position: "absolute", top: "36px", left: 0, minWidth: "230px", zIndex: 41, background: T.bgHeader, border: `1px solid ${T.border2}`, borderRadius: "12px", padding: "6px", boxShadow: "0 16px 40px rgba(0,0,0,0.55)" }}>
                <div style={{ padding: "6px 10px 8px", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: T.text4 }}>Switch journal</div>
                {journals.map(j => {
                  const sel = activeJournal?.id === j.id;
                  return (
                    <button key={j.id} onClick={() => { switchJournal(j); setJMenuOpen(false); }}
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", width: "100%", padding: "9px 10px", borderRadius: "8px", border: "none", background: sel ? "rgba(139,92,246,0.14)" : "transparent", color: sel ? "#C4B5FD" : T.text3, fontSize: "13px", fontWeight: sel ? 600 : 500, cursor: "pointer", textAlign: "left" }}
                      onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLButtonElement).style.background = T.bgInput; }}
                      onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{j.name}</span>
                      {sel && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
        {/* View Tabs — active tab glows (gradient + shadow); both same size w/ icon */}
        <div style={{ display: "flex", gap: "4px", backgroundColor: T.bgHeader, borderRadius: "11px", padding: "4px", border: `1px solid ${T.border2}` }}>
          <button onClick={() => goView("trades")}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: view === "trades" ? "linear-gradient(135deg, #8B5CF6, #7C3AED)" : "transparent", color: view === "trades" ? "#fff" : T.text3, cursor: "pointer", fontSize: "13.5px", fontWeight: view === "trades" ? 700 : 500, display: "flex", alignItems: "center", gap: "7px", boxShadow: view === "trades" ? "0 2px 14px rgba(139,92,246,0.55)" : "none", transition: "all .18s" }}
            onMouseEnter={e => { if (view !== "trades") (e.currentTarget as HTMLButtonElement).style.color = T.text1; }}
            onMouseLeave={e => { if (view !== "trades") (e.currentTarget as HTMLButtonElement).style.color = T.text3; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
            Trades
          </button>
          <button onClick={() => goView("stats")}
            style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: view === "stats" ? "linear-gradient(135deg, #8B5CF6, #7C3AED)" : "transparent", color: view === "stats" ? "#fff" : T.text3, cursor: "pointer", fontSize: "13.5px", fontWeight: view === "stats" ? 700 : 500, display: "flex", alignItems: "center", gap: "7px", boxShadow: view === "stats" ? "0 2px 14px rgba(139,92,246,0.55)" : "none", transition: "all .18s" }}
            onMouseEnter={e => { if (view !== "stats") (e.currentTarget as HTMLButtonElement).style.color = T.text1; }}
            onMouseLeave={e => { if (view !== "stats") (e.currentTarget as HTMLButtonElement).style.color = T.text3; }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="20" x2="6" y2="11"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="14"/></svg>
            Statistics
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
          {ThemeToggle}
          {view === "trades" && <button onClick={() => setShowWizard(true)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#8B5CF6", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>+ Log Trade</button>}
        </div>
      </div>

      {/* Statistics View */}
      {view === "stats" && activeJournal && (
        <JournalStats entries={journalTrades} journal={activeJournal} isDark={darkMode} metaAccountBalance={metaAccountBalance} userName={userName} isPro={isPro} />
      )}

      {/* Trades View */}
      {view === "trades" && <>

      {/* Quickview Stats */}
      {todayTrades.length > 0 && (
        <div className="journal-today-stats">
          {[
            { label: "Trades Today", value: String(todayTrades.length), color: "#F9FAFB" },
            { label: "P&L Today", value: `${todayPnl >= 0 ? "+" : ""}${todayPnl.toFixed(2)}`, color: todayPnl >= 0 ? "#22c55e" : "#ef4444" },
            { label: "Rules Broken", value: String(rulesBroken), color: rulesBroken > 0 ? "#ef4444" : "#22c55e" },
            { label: "Win Rate Today", value: todayWinRate !== null ? `${todayWinRate}%` : "—", color: "#F9FAFB" },
            { label: "Current Streak", value: calcStreak(journalTrades), color: "#A78BFA" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: T.bgCard, border: `1px solid ${T.borderSoft}`, borderRadius: "16px", boxShadow: T.shadow, padding: "14px 16px" }}>
              <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", color: T.text4, marginBottom: "6px" }}>{label}</p>
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
              style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${filter === f ? "rgba(139,92,246,0.5)" : T.border2}`, backgroundColor: filter === f ? "rgba(139,92,246,0.1)" : "transparent", color: filter === f ? "#A78BFA" : T.text3, cursor: "pointer", fontSize: "13px" }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          {reviewCount > 0 && (
            <button onClick={() => setFilter("review")}
              style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${filter === "review" ? "rgba(239,68,68,0.5)" : "rgba(239,68,68,0.25)"}`, backgroundColor: filter === "review" ? "rgba(239,68,68,0.12)" : "transparent", color: filter === "review" ? "#f87171" : "#ef4444", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "5px" }}>
              Needs Review <span style={{ backgroundColor: "#ef4444", color: "#fff", fontSize: "10px", fontWeight: 700, borderRadius: "8px", padding: "0 5px", minWidth: "16px", textAlign: "center" }}>{reviewCount}</span>
            </button>
          )}
        </div>
        <input style={{ backgroundColor: T.bgInput, border: `1px solid ${T.border}`, borderRadius: "8px", padding: "7px 12px", color: T.text1, fontSize: "13px", outline: "none", width: "280px", maxWidth: "100%" }}
          placeholder="Search symbol, setup, notes, emotions..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Trade Table */}
      {filteredTrades.length === 0 ? (
        <div style={{ background: T.bgCard, border: `1px solid ${T.borderSoft}`, borderRadius: "16px", boxShadow: T.shadow, padding: "60px 40px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "52px", height: "52px", borderRadius: "14px", background: T.bgInput, border: `1px solid ${T.border}`, marginBottom: "16px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={T.text4} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <p style={{ color: T.text4, fontSize: "14px", marginBottom: "20px" }}>{journalTrades.length === 0 ? "No trades yet." : "No trades match the current filter."}</p>
          {journalTrades.length === 0 && (
            <button onClick={() => setShowWizard(true)} style={{ padding: "10px 24px", borderRadius: "10px", border: "none", backgroundColor: "#8B5CF6", color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}>Log your first trade</button>
          )}
        </div>
      ) : (
        <div style={{ overflowX: "auto", borderRadius: "12px", border: `1px solid ${T.border}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
            <thead>
              <tr style={{ backgroundColor: T.bgHeader }}>
                {[
                  { key: "date", label: "Date" }, { key: "symbol", label: "Symbol" },
                  { key: "direction", label: "Direction" }, { key: "setup", label: "Setup" },
                  { key: "pnl", label: "P&L" }, { key: "r", label: "R" }, { key: "emotions", label: "Emotions" },
                  { key: "", label: "" },
                ].map(({ key, label }) => (
                  <th key={label} onClick={key ? () => toggleSort(key) : undefined}
                    style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 600, color: T.text4, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${T.border}`, cursor: key ? "pointer" : "default", userSelect: "none", whiteSpace: "nowrap" }}>
                    {label}{key ? sortArrow(key) : ""}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade, idx) => {
                const sym = getField(trade, "Symbol");
                const dir = getField(trade, "Direction");
                const setup = getField(trade, "Setup");
                const p = pnlNum(trade);
                const emos = getEmotions(trade);
                const d = new Date(trade.trade_date);
                // Use UTC methods – we store local time as UTC to avoid timezone shifts
                const dateStr = `${String(d.getUTCDate()).padStart(2,"0")}/${String(d.getUTCMonth()+1).padStart(2,"0")}/${String(d.getUTCFullYear()).slice(2)}`;
                const timeStr = `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`;
                const tradeHHMM = timeStr;
                const outsideSession = !!(activeJournal?.time_from && activeJournal?.time_to && (tradeHHMM < activeJournal.time_from || tradeHHMM > activeJournal.time_to));
                return (
                  <tr key={trade.id} onClick={() => setDetailTrade(trade)}
                    style={{ borderBottom: `1px solid ${T.border}`, cursor: "pointer", transition: "background 0.15s", animation: `tjRowIn 0.4s ease ${Math.min(idx, 18) * 28}ms both` }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = T.rowHover}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.backgroundColor = ""}>
                    <td style={{ padding: "12px 16px", boxShadow: `inset 3px 0 0 ${p !== null ? (p >= 0 ? "rgba(34,197,94,0.6)" : "rgba(239,68,68,0.6)") : "transparent"}` }}>
                      <div style={{ color: T.text3, fontSize: "13px" }}>{dateStr}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <span style={{ color: outsideSession ? "#ef4444" : T.text5, fontSize: "11px" }}>{timeStr}</span>
                        {outsideSession && <span title="Outside trading hours" style={{ fontSize: "11px" }}>⏰</span>}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: p !== null ? (p >= 0 ? "#22c55e" : "#ef4444") : T.text6, flexShrink: 0 }} />
                        <span style={{ color: T.text1, fontWeight: 700 }}>{sym ?? "—"}</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {dir && <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "5px", backgroundColor: dir === "Long" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: dir === "Long" ? "#22c55e" : "#ef4444" }}>{dir === "Long" ? "▲ LONG" : "▼ SHORT"}</span>}
                    </td>
                    <td style={{ padding: "12px 16px", color: T.text3, fontSize: "13px" }}>{setup ?? <span style={{ color: T.text6 }}>—</span>}</td>
                    <td style={{ padding: "12px 16px" }}>
                      {p !== null ? <span style={{ color: p >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700, fontSize: "15px", fontVariantNumeric: "tabular-nums" }}>{p >= 0 ? "+" : ""}{p.toFixed(2)}</span> : <span style={{ color: T.text6 }}>—</span>}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {(() => { const r = rMultiple(trade); return r !== null
                        ? <span style={{ color: r >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700, fontSize: "13px", fontVariantNumeric: "tabular-nums" }}>{r >= 0 ? "+" : ""}{r.toFixed(1)}R</span>
                        : <span style={{ color: T.text6 }}>—</span>; })()}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {emos.slice(0, 2).map(e => <span key={e} style={{ padding: "2px 7px", borderRadius: "10px", fontSize: "11px", backgroundColor: `${EMOTION_COLORS[e] ?? "#6B7280"}22`, color: EMOTION_COLORS[e] ?? "#6B7280", fontWeight: 500 }}>{e}</span>)}
                        {emos.length > 2 && <span style={{ color: T.text4, fontSize: "11px" }}>+{emos.length - 2}</span>}
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
          <div style={{ background: T.bgCard, border: `1px solid ${T.borderSoft}`, borderRadius: "16px", boxShadow: T.shadow, width: "100%", maxWidth: "620px", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ color: T.text1, fontWeight: 700, fontSize: "17px" }}>{getField(detailTrade, "Symbol") ?? "Trade"} — {getField(detailTrade, "Direction")}</h3>
                <p style={{ color: T.text4, fontSize: "12px", marginTop: "2px" }}>{(() => { const d = new Date(detailTrade.trade_date); return `${String(d.getUTCDate()).padStart(2,"0")}/${String(d.getUTCMonth()+1).padStart(2,"0")}/${d.getUTCFullYear()} ${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`; })()}</p>
              </div>
              <button onClick={() => setDetailTrade(null)} style={{ background: "none", border: "none", color: T.text4, cursor: "pointer", fontSize: "22px" }}>×</button>
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
                  return <div key={lbl} style={{ backgroundColor: T.bgHeader, borderRadius: "8px", padding: "10px 12px" }}><p style={{ color: T.text4, fontSize: "10px", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "3px" }}>{short}</p><p style={{ color: T.text2, fontSize: "14px", fontWeight: 600 }}>{v}</p></div>;
                })}
              </div>
              {/* Setup */}
              {getField(detailTrade, "Setup") && <div><p style={{ color: T.text4, fontSize: "11px", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "4px" }}>Setup</p><p style={{ color: T.text2, fontSize: "14px" }}>{getField(detailTrade, "Setup")}</p></div>}
              {/* Emotions */}
              {getEmotions(detailTrade).length > 0 && <div><p style={{ color: T.text4, fontSize: "11px", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "6px" }}>Emotions</p><div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>{getEmotions(detailTrade).map(e => <span key={e} style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "12px", backgroundColor: `${EMOTION_COLORS[e] ?? T.text4}22`, color: EMOTION_COLORS[e] ?? T.text4, fontWeight: 500 }}>{e}</span>)}</div></div>}
              {/* Rules */}
              {(() => {
                const raw = getField(detailTrade, "Rules Followed"); if (!raw) return null;
                try {
                  const arr: { id: string; text: string; compliant: boolean }[] = JSON.parse(raw);
                  return (
                    <div><p style={{ color: T.text4, fontSize: "11px", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "8px" }}>Rules</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {arr.map(r => <div key={r.id} style={{ padding: "6px 10px", borderRadius: "8px", fontSize: "13px", backgroundColor: r.compliant ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", color: r.compliant ? "#22c55e" : "#ef4444" }}>{r.compliant ? "✓" : "✗"} {r.text}</div>)}
                      </div>
                    </div>
                  );
                } catch { return null; }
              })()}
              {/* Session Rule Break */}
              {activeJournal.time_from && activeJournal.time_to && (() => {
                const d = new Date(detailTrade.trade_date);
                const tradeTime = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
                const outside = tradeTime < activeJournal.time_from || tradeTime > activeJournal.time_to;
                if (!outside) return null;
                return (
                  <div style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "18px" }}>⏰</span>
                    <div>
                      <p style={{ color: "#ef4444", fontSize: "13px", fontWeight: 600, margin: 0 }}>Outside Trading Hours — Rule Break</p>
                      <p style={{ color: T.text3, fontSize: "12px", margin: "2px 0 0" }}>
                        Trade at <strong style={{ color: T.text1 }}>{tradeTime}</strong> — allowed session: <strong style={{ color: T.text1 }}>{activeJournal.time_from}–{activeJournal.time_to}</strong>
                      </p>
                    </div>
                  </div>
                );
              })()}
              {/* Notes */}
              {getField(detailTrade, "Notes") && <div><p style={{ color: T.text4, fontSize: "11px", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "4px" }}>Notes</p><p style={{ color: T.text2, fontSize: "14px", lineHeight: 1.6 }}>{getField(detailTrade, "Notes")}</p></div>}
              {/* Screenshots */}
              {detailScreenshots.length > 0 && (
                <div>
                  <p style={{ color: T.text4, fontSize: "11px", textTransform: "uppercase", letterSpacing: ".04em", marginBottom: "8px" }}>Screenshots</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                    {detailScreenshots.map(s => (
                      <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" style={{ display: "block", borderRadius: "8px", overflow: "hidden", aspectRatio: "16/9", backgroundColor: T.bgHeader }}>
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

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes tjRowIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tjEqDraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @keyframes tjHalo { 0%,100% { opacity: .45; } 50% { opacity: .08; } }
        @keyframes tjHeroFade { from { opacity: 0; } to { opacity: 1; } }
        @media (max-width: 760px) { .tj-hero-div { display: none !important; } }
      `}</style>
    </div>
  );
}
