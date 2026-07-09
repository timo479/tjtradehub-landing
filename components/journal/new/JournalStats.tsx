"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { getMarketHoliday } from "@/lib/market-holidays";
import { computeInsights } from "@/lib/insights";
import InsightsPanel from "@/components/insights/InsightsPanel";
import LockedWidget from "@/components/common/LockedWidget";

// Pro-gated widgets — blurred for Basic; everything else is visible to all.
// (+ Discipline Score & Performance Insights are gated at their own call sites.)
// Mirror of DASH_LOCKED in WidgetGrid.tsx — keep both in sync.
const STATS_LOCKED = new Set(["risk-discipline", "rule-compliance", "emotions-breaks", "profit-factor"]);

// ─── Types ────────────────────────────────────────────────────────────────────
interface Rule { id: string; text: string; }
interface TradeFieldValue {
  field_id: string;
  value: string;
  template_fields: { id: string; label: string; field_type: string };
}
interface Trade {
  id: string; trade_date: string; template_id: string;
  source: string; is_reviewed: boolean; meta_deal_id: string | null;
  trade_field_values: TradeFieldValue[];
  journal_templates: { id: string; name: string };
}
interface Journal { id: string; name: string; rules: Rule[]; risk_per_trade: number | null; starting_balance: number | null; time_from: string; time_to: string; }

interface Props { entries: Trade[]; journal: Journal; isDark?: boolean; metaAccountBalance?: number | null; userName?: string | null; isPro?: boolean; }

type Period = "today" | "week" | "month" | "year" | "all" | "custom";

// ─── Theme ────────────────────────────────────────────────────────────────────
const ThemeCtx = React.createContext(true);
function useT() {
  const d = React.useContext(ThemeCtx);
  return {
    bgCard:     d ? "linear-gradient(145deg, #110c1e, #080808)" : "linear-gradient(145deg, #ffffff, #f9fafb)",
    bgCard2:    d ? "linear-gradient(145deg, #0f0f18, #090909)" : "linear-gradient(145deg, #f9fafb, #f3f4f6)",
    bgTable:    d ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.04)",
    bgExpand:   d ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.03)",
    bgInput:    d ? "#1a2332" : "#f9fafb",
    border:     d ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    border2:    d ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
    border3:    d ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
    border4:    d ? "rgba(255,255,255,0.1)"  : "rgba(0,0,0,0.1)",
    border5:    d ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.09)",
    svgLine:    d ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    svgLineZ:   d ? "#374151" : "rgba(0,0,0,0.2)",
    svgText:    d ? "#374151" : "#9CA3AF",
    svgDonut:   d ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
    text1:      d ? "#F9FAFB" : "#111827",
    text2:      d ? "#94a3b8" : "#4B5563",
    text3:      d ? "#64748b" : "#64748b",
    text4:      d ? "#9CA3AF" : "#4B5563",
    empty:      d ? "#374151" : "#D1D5DB",
    shadow:     d ? "0 4px 40px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.05)" : "0 1px 8px rgba(0,0,0,0.07)",
    shadowHov:  d ? "0 0 0 1px rgba(139,92,246,0.2), 0 0 40px rgba(139,92,246,0.12), 0 8px 40px rgba(0,0,0,0.7)" : "0 0 0 1px rgba(139,92,246,0.2), 0 4px 20px rgba(0,0,0,0.1)",
    prgTrack:   d ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.07)",
    rowHover:   d ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
    calNoTrade: d ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
    dragHandle: d ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.2)",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getField(t: Trade, label: string): string | null {
  return t.trade_field_values?.find(
    f => f.template_fields?.label?.toLowerCase() === label.toLowerCase()
  )?.value ?? null;
}
function getEmotions(t: Trade): string[] {
  const raw = getField(t, "Emotions"); if (!raw) return [];
  try { return JSON.parse(raw); } catch { return [raw]; }
}
function pnlNum(t: Trade): number | null {
  const v = getField(t, "P&L"); return v ? parseFloat(v) : null;
}
function getRulesArr(t: Trade): { id: string; text: string; compliant: boolean }[] {
  const raw = getField(t, "Rules Followed"); if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

const fmt = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const EMOTION_COLORS: Record<string, string> = {
  Calm: "#22c55e", Confident: "#3b82f6", Nervous: "#f59e0b",
  FOMO: "#ef4444", Greedy: "#f97316", Fearful: "#ef4444",
  Frustrated: "#ec4899", Euphoric: "#a78bfa",
};

// ─── Icon set (monochrome line icons, no emoji) ───────────────────────────────
const ICON_PATHS: Record<string, React.ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></>,
  trendingUp: <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>,
  pie: <><path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" /></>,
  bars: <><line x1="6" y1="20" x2="6" y2="11" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="18" y1="20" x2="18" y2="14" /></>,
  activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  layers: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  check: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  list: <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3.5" y1="6" x2="3.51" y2="6" /><line x1="3.5" y1="12" x2="3.51" y2="12" /><line x1="3.5" y1="18" x2="3.51" y2="18" /></>,
  wallet: <><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h3v-4z" /></>,
};

function Icon({ name, size = 14, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
      {ICON_PATHS[name] ?? ICON_PATHS.grid}
    </svg>
  );
}

function GripIcon({ color }: { color: string }) {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill={color} style={{ flexShrink: 0, display: "block" }}>
      {[4, 8, 12].map(y => [6, 10].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" />))}
    </svg>
  );
}

function SectionTitle({ icon, children, className }: { icon?: string; children: React.ReactNode; color?: string; className?: string }) {
  const T = useT();
  return (
    <div className={className} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", userSelect: "none" }}>
      {icon && <Icon name={icon} color={T.text2} />}
      <p style={{ color: T.text3, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{children}</p>
      <span style={{ marginLeft: "auto", cursor: "grab", display: "flex" }}><GripIcon color={T.dragHandle} /></span>
    </div>
  );
}

function WidgetCard({ children }: { children: React.ReactNode }) {
  const T = useT();
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.bgCard,
        border: `1px solid ${hovered ? "rgba(139,92,246,0.45)" : T.border}`,
        borderRadius: "16px",
        padding: "20px 22px",
        boxShadow: hovered ? T.shadowHov : T.shadow,
        transition: "border-color 0.25s, box-shadow 0.25s, transform 0.25s",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        animation: "tjCardIn 0.5s cubic-bezier(.22,1,.36,1) both",
        position: "relative" as const,
        overflow: "hidden" as const,
        height: "100%",
        boxSizing: "border-box" as const,
        display: "flex",
        flexDirection: "column" as const,
      }}
    >
      {children}
    </div>
  );
}

function SmallDonut({ pct, color, label, value }: { pct: number; color: string; label: string; value: string }) {
  const T = useT();
  const size = 82, R = 28, CX = 41, CY = 41, sw = 11;
  const circ = 2 * Math.PI * R;
  const filled = Math.max(0, Math.min(pct, 100)) / 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "7px" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={T.svgDonut} strokeWidth={sw} />
          <circle cx={CX} cy={CY} r={R} fill="none" stroke={color} strokeWidth={sw}
            strokeDasharray={`${(circ * filled).toFixed(2)} ${(circ * (1 - filled)).toFixed(2)}`}
            transform={`rotate(-90 ${CX} ${CY})`} strokeLinecap="round"
            style={{ ["--tj-len" as string]: (circ * filled).toFixed(2), animation: "tjDonut 0.9s cubic-bezier(.4,0,.2,1) both" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "13px", fontWeight: 800, color: T.text1, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{value}</span>
        </div>
      </div>
      <div style={{ fontSize: "10px", fontWeight: 600, color: T.text3, textAlign: "center", lineHeight: 1.3, width: "96px", overflowWrap: "break-word" }}>
        {label.split("\n").map((ln, i) => <React.Fragment key={i}>{i > 0 && <br />}{ln}</React.Fragment>)}
      </div>
    </div>
  );
}

function NoData({ text = "Not enough data yet" }: { text?: string }) {
  const T = useT();
  return <div style={{ color: T.empty, fontSize: "13px", textAlign: "center", padding: "32px 0" }}>{text}</div>;
}

// ─── Shared Primitive: Stat Tile ──────────────────────────────────────────────
function StatTile({ label, value, color = "#F9FAFB", sub, accent, delay = 0 }: { label: string; value: string; color?: string; sub?: string; accent?: string; delay?: number }) {
  const T = useT();
  return (
    <div style={{ position: "relative", background: T.bgCard2, border: `1px solid ${T.border2}`, borderRadius: "12px", padding: "11px 13px", overflow: "hidden", animation: `tjFade 0.45s ease ${delay}ms both` }}>
      {accent && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: accent, borderRadius: "3px 0 0 3px" }} />}
      <p style={{ color: T.text3, fontSize: "9.5px", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: "5px", whiteSpace: "nowrap" }}>{label}</p>
      <p style={{ color, fontWeight: 800, fontSize: "19px", lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{value}</p>
      {sub && <p style={{ color: T.text2, fontSize: "10px", marginTop: "4px", fontWeight: 500 }}>{sub}</p>}
    </div>
  );
}

// ─── Shared Primitive: Gauge Bar (horizontal, with optional target marker) ─────
function GaugeBar({ label, valueLabel, pct, color, target, status, delay = 0 }: { label: string; valueLabel: string; pct: number; color: string; target?: number; status?: string; delay?: number }) {
  const T = useT();
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", animation: `tjFade 0.45s ease ${delay}ms both` }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "8px" }}>
        <span style={{ color: T.text2, fontSize: "12px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
        <span style={{ display: "flex", alignItems: "baseline", gap: "6px", flexShrink: 0 }}>
          {status && <span style={{ color, fontSize: "10px", fontWeight: 600 }}>{status}</span>}
          <span style={{ color: T.text1, fontSize: "13px", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{valueLabel}</span>
        </span>
      </div>
      <div style={{ position: "relative", height: "9px", background: T.prgTrack, borderRadius: "5px", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, width: `${clamped}%`, background: `linear-gradient(90deg, ${color}cc, ${color})`, borderRadius: "5px", transformOrigin: "left", animation: `tjGrowX 0.9s cubic-bezier(.22,1,.36,1) ${delay}ms both`, boxShadow: `0 0 12px ${color}55` }} />
        {target !== undefined && target > 0 && target < 100 && (
          <div title="Target" style={{ position: "absolute", top: "-2px", bottom: "-2px", left: `${Math.min(99, target)}%`, width: "2px", background: T.text1, opacity: 0.5, borderRadius: "1px" }} />
        )}
      </div>
    </div>
  );
}

// ─── Period Filtering ──────────────────────────────────────────────────────────
function applyPeriod(entries: Trade[], period: Period, from: string, to: string): Trade[] {
  const now = new Date();
  if (period === "today") {
    const d = now.toISOString().slice(0, 10);
    return entries.filter(e => e.trade_date.slice(0, 10) === d);
  }
  if (period === "week") {
    const cut = new Date(now); cut.setDate(now.getDate() - 7);
    return entries.filter(e => new Date(e.trade_date) >= cut);
  }
  if (period === "month") {
    const cut = new Date(now); cut.setDate(now.getDate() - 30);
    return entries.filter(e => new Date(e.trade_date) >= cut);
  }
  if (period === "year") {
    const cut = new Date(now); cut.setFullYear(now.getFullYear() - 1);
    return entries.filter(e => new Date(e.trade_date) >= cut);
  }
  if (period === "custom" && from && to) {
    return entries.filter(e => { const d = e.trade_date.slice(0, 10); return d >= from && d <= to; });
  }
  return entries;
}

// ─── Widget: KPI Overview ─────────────────────────────────────────────────────
function WKpi({ entries }: { entries: Trade[] }) {
  const T = useT();
  const s = useMemo(() => {
    const pnls = entries.map(e => pnlNum(e)).filter(v => v !== null) as number[];
    const total = pnls.reduce((a, b) => a + b, 0);
    const wins = pnls.filter(v => v > 0).length;
    const losses = pnls.filter(v => v < 0).length;
    const avg = pnls.length ? total / pnls.length : 0;
    let peak = 0, cum = 0, dd = 0;
    for (const p of [...entries]
      .filter(e => pnlNum(e) !== null)
      .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime())
      .map(e => pnlNum(e)!)) {
      cum += p; if (cum > peak) peak = cum; if (peak - cum > dd) dd = peak - cum;
    }
    let streak = 0; let sType: "win" | "loss" | null = null;
    for (const p of [...pnls].reverse()) {
      const t = p > 0 ? "win" : "loss";
      if (!sType) sType = t;
      if (t === sType) streak++; else break;
    }
    return { total, wins, losses, avg, best: pnls.length ? Math.max(...pnls) : 0, worst: pnls.length ? Math.min(...pnls) : 0, dd, streak, sType, n: pnls.length };
  }, [entries]);

  const wr = s.n > 0 ? Math.round((s.wins / s.n) * 100) : 0;
  const pos = s.total >= 0;

  if (s.n === 0) return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%", minHeight: "120px" }}>
      <p style={{ color: T.text3, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: "6px" }}>Total Trades</p>
      <p style={{ color: T.text1, fontWeight: 800, fontSize: "32px", lineHeight: 1 }}>{entries.length}</p>
      <p style={{ color: T.text3, fontSize: "12px", marginTop: "8px" }}>Log trades with P&amp;L to unlock your stats.</p>
    </div>
  );

  const tiles = [
    { l: "Avg P&L", v: fmt(s.avg), c: s.avg >= 0 ? "#22c55e" : "#ef4444", a: s.avg >= 0 ? "#22c55e" : "#ef4444" },
    { l: "Best Trade", v: fmt(s.best), c: "#22c55e", a: "#22c55e" },
    { l: "Worst Trade", v: fmt(s.worst), c: "#ef4444", a: "#ef4444" },
    { l: "Max Drawdown", v: `-${s.dd.toFixed(2)}`, c: "#F59E0B", a: "#F59E0B" },
    { l: "Streak", v: `${s.streak}× ${s.sType === "win" ? "W" : "L"}`, c: s.sType === "win" ? "#22c55e" : "#ef4444", a: "#A78BFA" },
    { l: "Total Trades", v: String(entries.length), c: T.text1, a: "#8B5CF6" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", height: "100%" }}>
      {/* Hero: Total P&L + win record */}
      <div style={{ position: "relative", flexShrink: 0, background: `linear-gradient(135deg, ${pos ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"}, transparent 70%)`, border: `1px solid ${pos ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: "14px", padding: "16px 18px", overflow: "hidden" }}>
        <p style={{ color: T.text3, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: "7px" }}>Total P&amp;L</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, fontSize: "30px", lineHeight: 1, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", color: pos ? "#22c55e" : "#ef4444" }}>{fmt(s.total)}</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: pos ? "#22c55e" : "#ef4444" }}>{pos ? "▲" : "▼"}</span>
        </div>
        {/* Win rate bar */}
        <div style={{ marginTop: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
            <span style={{ color: T.text2, fontSize: "11px", fontWeight: 600 }}>Win Rate</span>
            <span style={{ color: T.text1, fontSize: "12px", fontWeight: 800 }}>{wr}% <span style={{ color: T.text3, fontWeight: 500 }}>· {s.wins}W {s.losses}L</span></span>
          </div>
          <div style={{ height: "7px", borderRadius: "4px", overflow: "hidden", display: "flex", background: "rgba(239,68,68,0.3)" }}>
            <div style={{ width: `${wr}%`, background: "linear-gradient(90deg, #16a34a, #22c55e)", transformOrigin: "left", animation: "tjGrowX 0.9s cubic-bezier(.22,1,.36,1) both", boxShadow: "0 0 10px rgba(34,197,94,0.5)" }} />
          </div>
        </div>
      </div>
      {/* Secondary stat tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))", gap: "9px" }}>
        {tiles.map((t, i) => <StatTile key={t.l} label={t.l} value={t.v} color={t.c} accent={t.a} delay={i * 50} />)}
      </div>
    </div>
  );
}

// ─── Widget: Equity Curve ─────────────────────────────────────────────────────
function WEquity({ entries }: { entries: Trade[] }) {
  const T = useT();
  const [hover, setHover] = useState<number | null>(null);
  const data = useMemo(() => {
    const sorted = [...entries].filter(e => pnlNum(e) !== null)
      .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
    let cum = 0;
    return sorted.map(e => { const p = pnlNum(e)!; cum += p; return { cum, pnl: p, date: e.trade_date }; });
  }, [entries]);

  if (data.length < 2) return <NoData text="Need at least 2 trades with P&L" />;

  const W = 900, H = 215, PL = 60, PR = 14, PT = 16, PB = 28;
  const cW = W - PL - PR, cH = H - PT - PB;
  const vals = data.map(d => d.cum);
  const min = Math.min(0, ...vals), max = Math.max(0, ...vals), range = max - min || 1;
  const sx = (i: number) => PL + (i / (data.length - 1)) * cW;
  const sy = (v: number) => PT + cH - ((v - min) / range) * cH;
  const z = sy(0);
  const line = vals.map((v, i) => `${i === 0 ? "M" : "L"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  const fill = `${line} L${sx(data.length - 1).toFixed(1)},${z.toFixed(1)} L${PL},${z.toFixed(1)} Z`;
  const last = data[data.length - 1].cum;
  const color = "#8B5CF6";
  const fmtDate = (s: string) => { const d = new Date(s); return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
  // X-axis ticks: first, middle, last
  const ticks = [0, Math.floor((data.length - 1) / 2), data.length - 1].filter((v, i, a) => a.indexOf(v) === i);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;       // 0..1 across rendered width
    const frac = Math.max(0, Math.min(1, (fx * W - PL) / cW));
    setHover(Math.round(frac * (data.length - 1)));
  };

  const hv = hover !== null ? data[hover] : null;
  const hvX = hover !== null ? (sx(hover) / W) * 100 : 0;   // percent across wrapper

  return (
    <div style={{ position: "relative", height: "100%", minHeight: "180px" }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height="100%" style={{ display: "block" }}>
        <defs>
          <linearGradient id={`eq-${data.length}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[min, (min + max) / 2, max].map((v, i) => (
          <g key={i}>
            <line x1={PL} y1={sy(v)} x2={W - PR} y2={sy(v)} stroke={T.svgLine} strokeWidth="1" strokeDasharray="4,4" />
            <text x={PL - 6} y={sy(v) + 4} textAnchor="end" fill="#4B5563" fontSize="10">{v.toFixed(0)}</text>
          </g>
        ))}
        <line x1={PL} y1={z} x2={W - PR} y2={z} stroke={T.svgLineZ} strokeWidth="1" />
        <path d={fill} fill={`url(#eq-${data.length})`} style={{ animation: "tjFade 0.9s ease 0.3s both" }} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          pathLength={1} strokeDasharray={1} style={{ animation: "tjEqLine 1.1s cubic-bezier(.6,0,.2,1) both" }} />
        {/* X-axis date ticks (drawn in non-scaling text via separate full-width pass) */}
        {hv && hover !== null && (
          <line x1={sx(hover)} y1={PT} x2={sx(hover)} y2={PT + cH} stroke={T.svgLineZ} strokeWidth="1" strokeDasharray="3,3" />
        )}
        <circle cx={sx(data.length - 1)} cy={sy(last)} r="4" fill={color} style={{ animation: "tjFade 0.3s ease 1.2s both" }} />
        {hv && hover !== null && (
          <circle cx={sx(hover)} cy={sy(hv.cum)} r="4.5" fill={color} stroke="#fff" strokeWidth="1.5" />
        )}
      </svg>
      {/* X-axis date labels */}
      <div style={{ position: "absolute", left: `${(PL / W) * 100}%`, right: `${(PR / W) * 100}%`, bottom: "2px", display: "flex", justifyContent: "space-between", pointerEvents: "none" }}>
        {ticks.map(t => <span key={t} style={{ color: T.svgText, fontSize: "10px" }}>{fmtDate(data[t].date)}</span>)}
      </div>
      {/* Hover tooltip */}
      {hv && (
        <div style={{ position: "absolute", top: "4px", left: `${hvX}%`, transform: hvX > 60 ? "translateX(-105%)" : "translateX(5%)", background: T.bgInput, border: `1px solid ${T.border4}`, borderRadius: "8px", padding: "7px 10px", pointerEvents: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.4)", whiteSpace: "nowrap", zIndex: 5 }}>
          <div style={{ color: T.text3, fontSize: "10px", marginBottom: "3px" }}>{fmtDate(hv.date)}</div>
          <div style={{ color: T.text1, fontSize: "13px", fontWeight: 700 }}>Equity {fmt(hv.cum)}</div>
          <div style={{ color: hv.pnl >= 0 ? "#22c55e" : "#ef4444", fontSize: "11px", fontWeight: 600 }}>Trade {fmt(hv.pnl)}</div>
        </div>
      )}
    </div>
  );
}

// ─── Widget: Win/Loss Donut ───────────────────────────────────────────────────
function WWinLoss({ entries }: { entries: Trade[] }) {
  const T = useT();
  const m = useMemo(() => {
    const pnls = entries.map(e => pnlNum(e)).filter(v => v !== null) as number[];
    const winArr = pnls.filter(v => v > 0), lossArr = pnls.filter(v => v < 0);
    return {
      wins: winArr.length, losses: lossArr.length, total: pnls.length,
      avgWin: winArr.length ? winArr.reduce((a, b) => a + b, 0) / winArr.length : 0,
      avgLoss: lossArr.length ? lossArr.reduce((a, b) => a + b, 0) / lossArr.length : 0,
      bestWin: winArr.length ? Math.max(...winArr) : 0,
      worstLoss: lossArr.length ? Math.min(...lossArr) : 0,
    };
  }, [entries]);

  const { wins, losses, total, avgWin, avgLoss, bestWin, worstLoss } = m;
  if (!total) return <NoData />;
  const pct = wins / total;
  const be = total - wins - losses;
  const R = 50, CX = 60, CY = 60, sw = 13, circ = 2 * Math.PI * R;
  // avg win vs avg loss visual ratio (for the facing bar)
  const mag = Math.max(avgWin, Math.abs(avgLoss)) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
        {/* Donut */}
        <div style={{ position: "relative", width: "120px", height: "120px", flexShrink: 0 }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="wl-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" /><stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
            </defs>
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#ef4444" strokeWidth={sw} opacity="0.22" strokeLinecap="round" />
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="url(#wl-grad)" strokeWidth={sw}
              strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`} transform={`rotate(-90 ${CX} ${CY})`} strokeLinecap="round"
              style={{ ["--tj-len" as string]: (circ * pct).toFixed(2), animation: "tjDonut 1s cubic-bezier(.4,0,.2,1) both", filter: "drop-shadow(0 0 5px rgba(34,197,94,0.5))" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: T.text1, fontWeight: 800, fontSize: "27px", lineHeight: 1, letterSpacing: "-0.02em" }}>{Math.round(pct * 100)}%</span>
            <span style={{ color: T.text3, fontSize: "9.5px", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Win Rate</span>
          </div>
        </div>
        {/* Counts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "9px", flex: 1, minWidth: "100px" }}>
          {[{ c: "#22c55e", l: "Wins", n: wins }, { c: "#ef4444", l: "Losses", n: losses }, { c: T.empty, l: "Break-even", n: be }].map(x => (
            <div key={x.l} style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: x.c }} />
                <span style={{ color: T.text2, fontSize: "13px" }}>{x.l}</span>
              </div>
              <strong style={{ color: T.text1, fontSize: "14px", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{x.n}</strong>
            </div>
          ))}
        </div>
      </div>
      {/* Avg win vs avg loss — facing bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ color: "#22c55e", fontSize: "13px", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmt(avgWin)}</span>
          <span style={{ color: T.text3, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Avg Win / Loss</span>
          <span style={{ color: "#ef4444", fontSize: "13px", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmt(avgLoss)}</span>
        </div>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <div style={{ flex: 1, height: "8px", background: T.prgTrack, borderRadius: "5px", overflow: "hidden", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: `${(avgWin / mag) * 100}%`, background: "linear-gradient(90deg, #16a34a, #22c55e)", borderRadius: "5px", transformOrigin: "right", animation: "tjGrowX 0.9s cubic-bezier(.22,1,.36,1) both" }} />
          </div>
          <div style={{ flex: 1, height: "8px", background: T.prgTrack, borderRadius: "5px", overflow: "hidden" }}>
            <div style={{ width: `${(Math.abs(avgLoss) / mag) * 100}%`, background: "linear-gradient(90deg, #ef4444, #b91c1c)", borderRadius: "5px", transformOrigin: "left", animation: "tjGrowX 0.9s cubic-bezier(.22,1,.36,1) both" }} />
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: T.text3, fontSize: "10px" }}>Best {fmt(bestWin)}</span>
          <span style={{ color: T.text3, fontSize: "10px" }}>Worst {fmt(worstLoss)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Widget: Weekday Performance ──────────────────────────────────────────────
function WWeekday({ entries }: { entries: Trade[] }) {
  const T = useT();
  const bars = useMemo(() => {
    const map: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] };
    entries.forEach(e => { const p = pnlNum(e); if (p !== null) map[new Date(e.trade_date).getDay()].push(p); });
    return [1, 2, 3, 4, 5, 6, 0].map((d, i) => {
      const v = map[d]; const avg = v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
      return { label: DAYS[i], avg, count: v.length };
    });
  }, [entries]);

  const maxAbs = Math.max(1, ...bars.map(b => Math.abs(b.avg)));
  const W = 451, H = 170;
  const PT = 14, BAR = 116, PB = 40;
  const bSlot = (W - 16) / bars.length;
  const bW = Math.round(bSlot * 0.6);
  const mid = PT + BAR * 0.72, maxPos = BAR * 0.72 - 2, maxNeg = BAR * 0.28 - 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
      <defs>
        <linearGradient id="wkGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ade80" /><stop offset="100%" stopColor="#16a34a" /></linearGradient>
        <linearGradient id="wkRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f87171" /><stop offset="100%" stopColor="#b91c1c" /></linearGradient>
      </defs>
      {bars.map((b, i) => {
        const x = 8 + i * bSlot + (bSlot - bW) / 2;
        const h = b.avg >= 0 ? (Math.abs(b.avg) / maxAbs) * maxPos : (Math.abs(b.avg) / maxAbs) * maxNeg;
        const color = b.avg >= 0 ? "#22c55e" : "#ef4444";
        return (
          <g key={b.label}>
            {i === 0 && <line x1={0} y1={mid} x2={W} y2={mid} stroke={T.svgLine} strokeWidth="1" />}
            {b.count > 0 && <rect x={x} y={b.avg >= 0 ? mid - h : mid} width={bW} height={Math.max(h, 2)} rx="3" fill={b.avg >= 0 ? "url(#wkGreen)" : "url(#wkRed)"}
              style={{ transformBox: "fill-box", transformOrigin: b.avg >= 0 ? "bottom" : "top", animation: `tjBar 0.55s cubic-bezier(.22,1,.36,1) ${i * 50}ms both`, filter: `drop-shadow(0 2px 5px ${color}55)` }} />}
            {b.count > 0 && <text x={x + bW / 2} y={b.avg >= 0 ? mid - h - 3 : mid + h + 11} textAnchor="middle" fill={color} fontSize="11" fontWeight="600" style={{ animation: `tjFade 0.4s ease ${i * 50 + 250}ms both` }}>{b.avg.toFixed(1)}</text>}
            <text x={x + bW / 2} y={PT + BAR + 16} textAnchor="middle" fill={T.svgText} fontSize="11">{b.label}</text>
            {b.count > 0 && <text x={x + bW / 2} y={PT + BAR + 30} textAnchor="middle" fill={T.svgText} fontSize="9">{b.count}x</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Widget: Monthly P&L ──────────────────────────────────────────────────────
function WMonthly({ entries }: { entries: Trade[] }) {
  const T = useT();
  const bars = useMemo(() => {
    const today = new Date();
    const result: { label: string; key: string; total: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      result.push({ label: MONTHS[d.getMonth()], key: `${d.getFullYear()}-${d.getMonth()}`, total: 0, count: 0 });
    }
    entries.forEach(e => {
      const p = pnlNum(e); if (p === null) return;
      const d = new Date(e.trade_date);
      const bar = result.find(r => r.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (bar) { bar.total += p; bar.count++; }
    });
    return result;
  }, [entries]);

  const maxAbs = Math.max(1, ...bars.map(b => Math.abs(b.total)));
  const W = 451, H = 170;
  const PT = 14, BAR = 116, PB = 40;
  const bSlot = (W - 28) / bars.length;
  const bW = Math.round(bSlot * 0.65);
  const mid = PT + BAR * 0.72, maxPos = BAR * 0.72 - 2, maxNeg = BAR * 0.28 - 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block" }}>
      <defs>
        <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ade80" /><stop offset="100%" stopColor="#16a34a" /></linearGradient>
        <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f87171" /><stop offset="100%" stopColor="#b91c1c" /></linearGradient>
      </defs>
      {bars.map((b, i) => {
        const x = 14 + i * bSlot;
        const h = b.total >= 0 ? (Math.abs(b.total) / maxAbs) * maxPos : (Math.abs(b.total) / maxAbs) * maxNeg;
        const color = b.total >= 0 ? "#22c55e" : "#ef4444";
        return (
          <g key={b.key}>
            {i === 0 && <line x1={0} y1={mid} x2={W} y2={mid} stroke={T.svgLine} strokeWidth="1" />}
            {b.count > 0 && <rect x={x} y={b.total >= 0 ? mid - h : mid} width={bW} height={Math.max(h, 2)} rx="4" fill={b.total >= 0 ? "url(#barGreen)" : "url(#barRed)"}
              style={{ transformBox: "fill-box", transformOrigin: b.total >= 0 ? "bottom" : "top", animation: `tjBar 0.55s cubic-bezier(.22,1,.36,1) ${i * 60}ms both`, filter: `drop-shadow(0 2px 6px ${color}55)` }} />}
            {b.count > 0 && <text x={x + bW / 2} y={b.total >= 0 ? mid - h - 3 : mid + h + 11} textAnchor="middle" fill={color} fontSize="10" fontWeight="700" style={{ animation: `tjFade 0.4s ease ${i * 60 + 250}ms both` }}>{b.total >= 0 ? "+" : ""}{b.total.toFixed(0)}</text>}
            <text x={x + bW / 2} y={PT + BAR + 16} textAnchor="middle" fill={T.svgText} fontSize="11">{b.label}</text>
            {b.count > 0 && <text x={x + bW / 2} y={PT + BAR + 30} textAnchor="middle" fill={T.svgText} fontSize="9">{b.count}tr</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Widget: Trade Calendar ───────────────────────────────────────────────────
function WCalendar({ entries }: { entries: Trade[] }) {
  const T = useT();
  const today = new Date();
  const months = [-2, -1, 0].map(i => {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const pnlByDate = useMemo(() => {
    const map: Record<string, { pnl: number; count: number }> = {};
    entries.forEach(e => {
      const key = e.trade_date.slice(0, 10); const p = pnlNum(e) ?? 0;
      if (!map[key]) map[key] = { pnl: 0, count: 0 };
      map[key].pnl += p; map[key].count++;
    });
    return map;
  }, [entries]);

  // Intensity scales relative to the user's own biggest trading day (min floor so small accounts still show contrast)
  const maxAbs = useMemo(() => Math.max(50, ...Object.values(pnlByDate).map(d => Math.abs(d.pnl))), [pnlByDate]);
  const monthTotal = (y: number, m: number) =>
    Object.entries(pnlByDate).reduce((s, [k, v]) => {
      const [ky, km] = k.split("-").map(Number);
      return ky === y && km === m + 1 ? s + v.pnl : s;
    }, 0);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(168px, 1fr))", gap: "18px", justifyContent: "start" }}>
        {months.map(({ y, m }) => {
          const first = new Date(y, m, 1);
          const days = new Date(y, m + 1, 0).getDate();
          let off = first.getDay() - 1; if (off < 0) off = 6;
          const cells = [...Array(off).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
          while (cells.length % 7 !== 0) cells.push(null);
          const mt = monthTotal(y, m);
          return (
            <div key={`${y}-${m}`} style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "8px" }}>
                <p style={{ color: T.text2, fontSize: "12px", fontWeight: 700, margin: 0 }}>{MONTHS[m]} <span style={{ color: T.text3, fontWeight: 500 }}>{y}</span></p>
                {mt !== 0 && <span style={{ color: mt >= 0 ? "#22c55e" : "#ef4444", fontSize: "11px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(mt)}</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "3px", marginBottom: "3px" }}>
                {DAYS.map(d => <div key={d} style={{ textAlign: "center", color: T.text3, fontSize: "9px", fontWeight: 600 }}>{d[0]}</div>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "3px" }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={i} style={{ aspectRatio: "1 / 1", minWidth: 0 }} />;
                  const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isWeekend = i % 7 === 5 || i % 7 === 6;
                  const isToday = today.getDate() === day && today.getMonth() === m && today.getFullYear() === y;
                  const trade = pnlByDate[key];
                  const holiday = getMarketHoliday(key);
                  let bg = isWeekend ? "transparent" : T.calNoTrade, border = "transparent", color = T.text3, lbl = "", strong = false;
                  if (trade) {
                    const intensity = Math.min(0.9, 0.28 + (Math.abs(trade.pnl) / maxAbs) * 0.62);
                    if (trade.pnl > 0) { bg = `rgba(34,197,94,${intensity})`; color = "#fff"; strong = true; }
                    else if (trade.pnl < 0) { bg = `rgba(239,68,68,${intensity})`; color = "#fff"; strong = true; }
                    else { bg = "rgba(148,163,184,0.3)"; color = T.text1; }
                  } else if (holiday) { bg = "rgba(251,146,60,0.1)"; border = "rgba(251,146,60,0.35)"; color = "#fb923c"; lbl = "•"; }
                  return (
                    <div key={i} title={trade ? `${trade.count} trade${trade.count > 1 ? "s" : ""} · ${fmt(trade.pnl)}` : holiday ? `${holiday} — closed` : String(day)}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1.14)"; (e.currentTarget as HTMLDivElement).style.zIndex = "2"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = "scale(1)"; (e.currentTarget as HTMLDivElement).style.zIndex = "1"; }}
                      style={{ aspectRatio: "1 / 1", minWidth: 0, borderRadius: "5px", backgroundColor: bg, border: isToday ? "1.5px solid #8B5CF6" : `1px solid ${border}`, boxShadow: trade && strong ? `0 0 8px ${trade.pnl > 0 ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}` : "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: strong ? 700 : 500, color, cursor: "default", transition: "transform 0.12s ease, box-shadow 0.12s ease", fontVariantNumeric: "tabular-nums", position: "relative" }}>
                      {lbl || day}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "16px", marginTop: "16px", flexWrap: "wrap", paddingTop: "12px", borderTop: `1px solid ${T.border3}` }}>
        {[{ c: "rgba(34,197,94,0.75)", l: "Profit" }, { c: "rgba(239,68,68,0.75)", l: "Loss" }, { c: "rgba(148,163,184,0.3)", l: "Break-even" }, { c: T.calNoTrade, l: "No trade" }].map(x => (
          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: x.c, border: `1px solid ${T.border2}` }} />
            <span style={{ color: T.text3, fontSize: "11px" }}>{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Widget: P&L Distribution ─────────────────────────────────────────────────
function WHistogram({ entries }: { entries: Trade[] }) {
  const T = useT();
  const bars = useMemo(() => {
    const pnls = entries.map(e => pnlNum(e)).filter(v => v !== null) as number[];
    if (!pnls.length) return [];
    const buckets = [
      { label: "<-200", min: -Infinity, max: -200 }, { label: "-200\n-100", min: -200, max: -100 },
      { label: "-100\n-50", min: -100, max: -50 }, { label: "-50\n0", min: -50, max: 0 },
      { label: "0\n50", min: 0, max: 50 }, { label: "50\n100", min: 50, max: 100 },
      { label: "100\n200", min: 100, max: 200 }, { label: ">200", min: 200, max: Infinity },
    ];
    return buckets.map(b => ({ ...b, count: pnls.filter(p => p >= b.min && p < b.max).length }));
  }, [entries]);

  if (!bars.length || bars.every(b => b.count === 0)) return <NoData />;
  const maxCount = Math.max(1, ...bars.map(b => b.count));
  const H = 100, bW = 52, gap = 14, tW = bars.length * (bW + gap) - gap + 24;

  return (
    <svg viewBox={`0 0 ${tW} ${H + 36}`} width="100%" style={{ display: "block" }}>
      {bars.map((b, i) => {
        const x = i * (bW + gap) + 10;
        const h = (b.count / maxCount) * (H - 16);
        const barColor = b.min >= 0 ? "#22c55e" : b.max <= 0 ? "#ef4444" : "#6B7280";
        return (
          <g key={b.label}>
            {b.count > 0 && <><rect x={x} y={H - h} width={bW} height={h} rx="4" fill={barColor} opacity="0.75"
              style={{ transformBox: "fill-box", transformOrigin: "bottom", animation: `tjBar 0.55s cubic-bezier(.22,1,.36,1) ${i * 50}ms both` }} /><text x={x + bW / 2} y={H - h - 4} textAnchor="middle" fill={barColor} fontSize="10" fontWeight="600" style={{ animation: `tjFade 0.4s ease ${i * 50 + 250}ms both` }}>{b.count}</text></>}
            {b.label.split("\n").map((ln, li) => <text key={li} x={x + bW / 2} y={H + 13 + li * 11} textAnchor="middle" fill={T.svgText} fontSize="8">{ln}</text>)}
          </g>
        );
      })}
      <line x1={0} y1={H} x2={tW} y2={H} stroke={T.svgLine} strokeWidth="1" />
    </svg>
  );
}

// ─── Widget: Profit Factor ────────────────────────────────────────────────────
function WProfitFactor({ entries }: { entries: Trade[] }) {
  const T = useT();
  const m = useMemo(() => {
    const pnls = entries.map(e => pnlNum(e)).filter(v => v !== null) as number[];
    const gw = pnls.filter(v => v > 0).reduce((s, v) => s + v, 0);
    const gl = Math.abs(pnls.filter(v => v < 0).reduce((s, v) => s + v, 0));
    const pf = gl ? gw / gl : null;
    const wr = pnls.length ? pnls.filter(v => v > 0).length / pnls.length : 0;
    const aw = pnls.filter(v => v > 0).length ? gw / pnls.filter(v => v > 0).length : 0;
    const al = pnls.filter(v => v < 0).length ? gl / pnls.filter(v => v < 0).length : 0;
    return { pf, gw, gl, exp: aw * wr - al * (1 - wr) };
  }, [entries]);

  if (m.pf === null) return <NoData />;
  const pfColor = m.pf >= 1.5 ? "#22c55e" : m.pf >= 1 ? "#F59E0B" : "#ef4444";
  const pfLabel = m.pf >= 2 ? "Excellent" : m.pf >= 1.5 ? "Strong" : m.pf >= 1 ? "Profitable" : "Losing";
  const markerPct = Math.min(100, (m.pf / 3) * 100);
  const totalMag = m.gw + m.gl || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", height: "100%" }}>
      {/* Hero PF + scale */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "10px" }}>
          <span style={{ fontWeight: 800, fontSize: "38px", lineHeight: 1, letterSpacing: "-0.03em", color: pfColor, fontVariantNumeric: "tabular-nums" }}>{m.pf.toFixed(2)}</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: T.text3, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Profit Factor</span>
            <span style={{ color: pfColor, fontSize: "12px", fontWeight: 700 }}>{pfLabel}</span>
          </div>
        </div>
        {/* Scale 0—1—2—3+ */}
        <div style={{ position: "relative", height: "8px", borderRadius: "5px", background: "linear-gradient(90deg, #ef4444, #f59e0b 40%, #22c55e 75%)", opacity: 0.85 }}>
          <div style={{ position: "absolute", top: "-3px", left: `calc(${markerPct}% - 7px)`, width: "14px", height: "14px", borderRadius: "50%", background: "#fff", border: `3px solid ${pfColor}`, boxShadow: "0 2px 8px rgba(0,0,0,0.5)", transition: "left 0.6s cubic-bezier(.22,1,.36,1)" }} />
          {/* tick at PF=1 (break-even) */}
          <div style={{ position: "absolute", top: "-2px", bottom: "-2px", left: "33.3%", width: "2px", background: "rgba(0,0,0,0.4)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          <span style={{ color: T.text3, fontSize: "9px" }}>0</span>
          <span style={{ color: T.text3, fontSize: "9px" }}>1.0 BE</span>
          <span style={{ color: T.text3, fontSize: "9px" }}>3+</span>
        </div>
      </div>
      {/* Gross profit vs gross loss facing bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        <div style={{ display: "flex", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
          <div style={{ width: `${(m.gw / totalMag) * 100}%`, background: "linear-gradient(90deg, #16a34a, #22c55e)", transformOrigin: "left", animation: "tjGrowX 0.9s cubic-bezier(.22,1,.36,1) both" }} />
          <div style={{ width: `${(m.gl / totalMag) * 100}%`, background: "linear-gradient(90deg, #b91c1c, #ef4444)", transformOrigin: "right", animation: "tjGrowX 0.9s cubic-bezier(.22,1,.36,1) both" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#22c55e", fontSize: "12px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>+{m.gw.toFixed(0)}<span style={{ color: T.text3, fontWeight: 500, marginLeft: "4px" }}>gross profit</span></span>
          <span style={{ color: "#ef4444", fontSize: "12px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}><span style={{ color: T.text3, fontWeight: 500, marginRight: "4px" }}>gross loss</span>-{m.gl.toFixed(0)}</span>
        </div>
      </div>
      {/* Expectancy */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.bgCard2, border: `1px solid ${T.border2}`, borderRadius: "10px", padding: "10px 14px" }}>
        <span style={{ color: T.text2, fontSize: "12px", fontWeight: 600 }}>Expectancy <span style={{ color: T.text3, fontWeight: 400 }}>/ trade</span></span>
        <span style={{ color: m.exp >= 0 ? "#22c55e" : "#ef4444", fontSize: "16px", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmt(m.exp)}</span>
      </div>
    </div>
  );
}

// ─── Widget: Trade Frequency ──────────────────────────────────────────────────
function WFrequency({ entries }: { entries: Trade[] }) {
  const T = useT();
  const bars = useMemo(() => {
    const today = new Date();
    const result: { label: string; key: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      result.push({ label: `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, key: `${d.getFullYear()}-${d.getMonth()}`, count: 0 });
    }
    entries.forEach(e => {
      const d = new Date(e.trade_date);
      const bar = result.find(r => r.key === `${d.getFullYear()}-${d.getMonth()}`);
      if (bar) bar.count++;
    });
    return result;
  }, [entries]);

  const totalTrades = bars.reduce((s, b) => s + b.count, 0);
  const maxCount = Math.max(1, ...bars.map(b => b.count));
  const W = 451, H = 100, PB = 30;
  const bSlot = (W - 20) / bars.length;
  const bW = Math.round(bSlot * 0.65);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ textAlign: "right", marginBottom: "8px", flexShrink: 0 }}>
        <span style={{ fontSize: "36px", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", background: "linear-gradient(135deg, #c4b5fd, #8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{totalTrades}</span>
        <span style={{ fontSize: "11px", color: T.text3, marginLeft: "4px" }}>total</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + PB}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: "block", flex: 1, minHeight: 0 }}>
        <defs>
          <linearGradient id="freqPurple" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#7c3aed" /></linearGradient>
        </defs>
        {bars.map((b, i) => {
          const x = 10 + i * bSlot; const h = (b.count / maxCount) * (H - 12);
          return (
            <g key={b.key}>
              {b.count > 0 && <><rect x={x} y={H - h} width={bW} height={h} rx="4" fill="url(#freqPurple)"
                style={{ transformBox: "fill-box", transformOrigin: "bottom", animation: `tjBar 0.55s cubic-bezier(.22,1,.36,1) ${i * 45}ms both`, filter: "drop-shadow(0 2px 6px rgba(139,92,246,0.4))" }} /><text x={x + bW / 2} y={H - h - 4} textAnchor="middle" fill="#a78bfa" fontSize="11" fontWeight="700" style={{ animation: `tjFade 0.4s ease ${i * 45 + 250}ms both` }}>{b.count}</text></>}
              <text x={x + bW / 2} y={H + 16} textAnchor="middle" fill={T.svgText} fontSize="9">{b.label}</text>
            </g>
          );
        })}
        <line x1={0} y1={H} x2={W} y2={H} stroke={T.svgLine} strokeWidth="1" />
      </svg>
    </div>
  );
}

// ─── NEW Widget: Setup Performance ───────────────────────────────────────────
function WSetupPerf({ entries }: { entries: Trade[] }) {
  const T = useT();
  const rows = useMemo(() => {
    const map: Record<string, { pnls: number[]; count: number }> = {};
    entries.forEach(e => {
      const setup = getField(e, "Setup") || "No Setup";
      const p = pnlNum(e);
      if (!map[setup]) map[setup] = { pnls: [], count: 0 };
      map[setup].count++;
      if (p !== null) map[setup].pnls.push(p);
    });
    return Object.entries(map).map(([setup, data]) => {
      const wins = data.pnls.filter(p => p > 0).length;
      const total = data.pnls.reduce((s, p) => s + p, 0);
      return {
        setup, trades: data.count,
        winRate: data.pnls.length ? Math.round((wins / data.pnls.length) * 100) : null,
        avgPnl: data.pnls.length ? total / data.pnls.length : null,
        totalPnl: total,
      };
    }).sort((a, b) => (b.totalPnl ?? 0) - (a.totalPnl ?? 0));
  }, [entries]);

  if (!rows.length) return <NoData text="No trades with a setup found" />;

  const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: 600, color: T.text4, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${T.border2}` };
  const td: React.CSSProperties = { padding: "10px 14px", fontSize: "13px", borderBottom: `1px solid ${T.border3}` };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: T.bgTable }}>
            <th style={th}>Setup</th>
            <th style={{ ...th, textAlign: "right" }}>Trades</th>
            <th style={{ ...th, textAlign: "right" }}>Win Rate</th>
            <th style={{ ...th, textAlign: "right" }}>Avg P&L</th>
            <th style={{ ...th, textAlign: "right" }}>Total P&L</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.setup}>
              <td style={{ ...td, color: T.text1, fontWeight: 600 }}>{r.setup}</td>
              <td style={{ ...td, color: T.text4, textAlign: "right" }}>{r.trades}</td>
              <td style={{ ...td, textAlign: "right" }}>
                {r.winRate !== null
                  ? <span style={{ color: r.winRate >= 50 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{r.winRate}%</span>
                  : <span style={{ color: T.empty }}>—</span>}
              </td>
              <td style={{ ...td, textAlign: "right" }}>
                {r.avgPnl !== null
                  ? <span style={{ color: r.avgPnl >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{fmt(r.avgPnl)}</span>
                  : <span style={{ color: T.empty }}>—</span>}
              </td>
              <td style={{ ...td, textAlign: "right" }}>
                <span style={{ color: r.totalPnl >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{fmt(r.totalPnl)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── NEW Widget: Risk Discipline ──────────────────────────────────────────────
function WRiskDiscipline({ entries, journal }: { entries: Trade[]; journal: Journal }) {
  const metrics = useMemo(() => {
    const pnls = entries.map(e => pnlNum(e)).filter(v => v !== null) as number[];
    const gw = pnls.filter(v => v > 0).reduce((s, v) => s + v, 0);
    const gl = Math.abs(pnls.filter(v => v < 0).reduce((s, v) => s + v, 0));
    const pf = gl > 0 ? gw / gl : null;

    let peak = 0, cum = 0, maxDD = 0;
    for (const p of [...entries]
      .filter(e => pnlNum(e) !== null)
      .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime())
      .map(e => pnlNum(e)!)) {
      cum += p; if (cum > peak) peak = cum; if (peak - cum > maxDD) maxDD = peak - cum;
    }
    const maxDDPct = journal.starting_balance ? (maxDD / journal.starting_balance) * 100 : null;

    let sumRisk = 0, riskCount = 0, consistent = 0, sumRR = 0, rrCount = 0;
    let balance = journal.starting_balance ?? 0;
    for (const e of [...entries].sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime())) {
      const riskAmt = getField(e, "Risk Amount");
      const p = pnlNum(e);
      if (riskAmt && balance > 0) {
        const riskNum = parseFloat(riskAmt);
        if (!isNaN(riskNum) && riskNum > 0) {
          const riskPct = (riskNum / balance) * 100;
          sumRisk += riskPct; riskCount++;
          if (journal.risk_per_trade && Math.abs(riskPct - journal.risk_per_trade) <= 0.5) consistent++;
          if (p !== null) { sumRR += Math.abs(p) / riskNum; rrCount++; }
        }
      }
      if (p !== null) balance += p;
    }

    const avgRisk = riskCount > 0 ? sumRisk / riskCount : null;
    const consistencyPct = riskCount > 0 ? Math.round((consistent / riskCount) * 100) : null;
    const avgRR = rrCount > 0 ? sumRR / rrCount : null;
    return { pf, maxDDPct, avgRisk, consistencyPct, avgRR };
  }, [entries, journal]);

  const { pf, maxDDPct, avgRisk, consistencyPct, avgRR } = metrics;
  const target = journal.risk_per_trade ?? null;

  // Avg risk: full bar scale = 2× target (or 4% fallback); target marker at target.
  const riskScaleMax = target ? target * 2 : 4;
  const riskPct = avgRisk !== null ? Math.min((avgRisk / riskScaleMax) * 100, 100) : 0;
  const riskOk = avgRisk !== null && target ? avgRisk <= target + 0.5 : null;
  const riskColor = riskOk === null ? "#8B5CF6" : riskOk ? "#22c55e" : "#ef4444";

  const rows = [
    avgRisk !== null && {
      label: "Avg Risk / Trade", valueLabel: `${avgRisk.toFixed(1)}%`, pct: riskPct, color: riskColor,
      target: target ? (target / riskScaleMax) * 100 : undefined,
      status: riskOk === null ? undefined : riskOk ? "on target" : "over",
    },
    avgRR !== null && {
      label: "Risk / Reward", valueLabel: `1:${avgRR.toFixed(1)}`, pct: Math.min((avgRR / 3) * 100, 100),
      color: avgRR >= 2 ? "#22c55e" : avgRR >= 1 ? "#F59E0B" : "#ef4444", target: 66.6,
      status: avgRR >= 2 ? "great" : undefined,
    },
    pf !== null && {
      label: "Profit Factor", valueLabel: `${pf.toFixed(2)}×`, pct: Math.min((pf / 3) * 100, 100),
      color: pf >= 1.5 ? "#22c55e" : pf >= 1 ? "#F59E0B" : "#ef4444", target: 33.3,
    },
    consistencyPct !== null && {
      label: "Risk Consistency", valueLabel: `${consistencyPct}%`, pct: consistencyPct,
      color: consistencyPct >= 70 ? "#22c55e" : consistencyPct >= 40 ? "#F59E0B" : "#ef4444",
    },
    maxDDPct !== null && {
      label: "Max Drawdown", valueLabel: `${maxDDPct.toFixed(1)}%`, pct: Math.min(maxDDPct * 5, 100),
      color: maxDDPct <= 5 ? "#22c55e" : maxDDPct <= 15 ? "#F59E0B" : "#ef4444",
    },
  ].filter(Boolean) as { label: string; valueLabel: string; pct: number; color: string; target?: number; status?: string }[];

  if (!rows.length) return <NoData text="Add Risk Amount + risk % rule to track discipline" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", justifyContent: "center", height: "100%" }}>
      {rows.map((r, i) => <GaugeBar key={r.label} {...r} delay={i * 70} />)}
    </div>
  );
}

// ─── NEW Widget: Rule Compliance ──────────────────────────────────────────────
function WRuleCompliance({ entries, journal }: { entries: Trade[]; journal: Journal }) {
  const T = useT();
  const bars = useMemo(() => {
    return journal.rules.map(rule => {
      let followed = 0, total = 0;
      entries.forEach(e => {
        const arr = getRulesArr(e);
        const r = arr.find(x => x.id === rule.id || x.text === rule.text);
        if (r) { total++; if (r.compliant) followed++; }
      });
      return { text: rule.text, followed, total, pct: total ? Math.round((followed / total) * 100) : null };
    }).filter(b => b.total > 0);
  }, [entries, journal]);

  // Time rule: always shown if journal has session hours configured
  const timeBar = useMemo(() => {
    if (!journal.time_from || !journal.time_to) return null;
    let followed = 0, total = 0;
    entries.forEach(e => {
      const d = new Date(e.trade_date);
      const hhmm = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
      total++;
      if (hhmm >= journal.time_from && hhmm <= journal.time_to) followed++;
    });
    return { text: `Trading\nHours`, followed, total, pct: total ? Math.round((followed / total) * 100) : null };
  }, [entries, journal]);

  if (!bars.length && !timeBar) return <NoData text="No rule compliance data yet. Log trades with rules to see this." />;

  const color = (pct: number | null) =>
    pct !== null && pct >= 70 ? "#22c55e" : pct !== null && pct >= 40 ? "#F59E0B" : "#ef4444";

  const allBars = [...(timeBar ? [{ ...timeBar, text: "Trading Hours" }] : []), ...bars];
  // Overall compliance
  const totFollowed = allBars.reduce((s, b) => s + b.followed, 0);
  const totAll = allBars.reduce((s, b) => s + b.total, 0);
  const overall = totAll ? Math.round((totFollowed / totAll) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "13px", height: "100%" }}>
      {/* Overall header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "11px", borderBottom: `1px solid ${T.border2}` }}>
        <span style={{ color: T.text3, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Overall Compliance</span>
        <span style={{ color: color(overall), fontSize: "20px", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{overall}%</span>
      </div>
      {/* Per-rule bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "13px", overflowY: "auto", flex: 1 }}>
        {allBars.map((b, i) => (
          <GaugeBar key={b.text} label={b.text} valueLabel={b.pct !== null ? `${b.pct}%` : "—"}
            pct={b.pct ?? 0} color={color(b.pct)} status={`${b.followed}/${b.total}`} delay={i * 60} />
        ))}
      </div>
    </div>
  );
}

// ─── NEW Widget: Emotions at Rule Breaks ──────────────────────────────────────
function WEmotionsBreaks({ entries }: { entries: Trade[] }) {
  const T = useT();
  const bars = useMemo(() => {
    const count: Record<string, number> = {};
    entries.forEach(e => {
      const rules = getRulesArr(e);
      if (!rules.some(r => !r.compliant)) return;
      getEmotions(e).forEach(em => { count[em] = (count[em] ?? 0) + 1; });
    });
    return Object.entries(count).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [entries]);

  if (!bars.length) return <NoData text="No rule breaks with emotions found. Log trades with emotions + rules." />;
  const maxCount = bars[0][1];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      <p style={{ color: T.text3, fontSize: "12px", marginBottom: "4px" }}>Which emotions appear most when you break rules?</p>
      {bars.map(([emotion, count]) => {
        const pct = Math.round((count / maxCount) * 100);
        const color = EMOTION_COLORS[emotion] ?? "#6B7280";
        return (
          <div key={emotion}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span style={{ color, fontSize: "13px", fontWeight: 500 }}>{emotion}</span>
              <span style={{ color: T.text3, fontSize: "11px" }}>{count}x</span>
            </div>
            <div style={{ height: "6px", backgroundColor: T.prgTrack, borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, backgroundColor: `${color}99`, borderRadius: "3px", transition: "width 0.4s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── NEW Widget: Trade Analysis Table ─────────────────────────────────────────
function WTradeAnalysis({ entries, journal }: { entries: Trade[]; journal: Journal }) {
  const T = useT();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() =>
    [...entries].sort((a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime()).slice(0, 50),
    [entries]
  );

  if (!sorted.length) return <NoData text="No trades in this period" />;

  const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: 600, color: T.text4, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${T.border2}`, whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "10px 14px", fontSize: "13px", borderBottom: `1px solid ${T.border3}` };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: T.bgTable }}>
            <th style={th}>Date</th>
            <th style={th}>Symbol</th>
            <th style={th}>Dir</th>
            <th style={th}>Setup</th>
            <th style={{ ...th, textAlign: "right" }}>P&L</th>
            <th style={th}>Emotions</th>
            <th style={th}>Rules</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(t => {
            const p = pnlNum(t);
            const rules = getRulesArr(t);
            const brokenRules = rules.filter(r => !r.compliant);
            const emos = getEmotions(t);
            const dir = getField(t, "Direction");
            const d = new Date(t.trade_date);
            const tradeHHMM = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
            const outsideSession = !!(journal.time_from && journal.time_to && (tradeHHMM < journal.time_from || tradeHHMM > journal.time_to));
            const totalBreaks = brokenRules.length + (outsideSession ? 1 : 0);
            const hasData = rules.length > 0 || outsideSession;
            const isExpanded = expandedId === t.id;

            return (
              <React.Fragment key={t.id}>
                <tr onClick={() => setExpandedId(isExpanded ? null : t.id)}
                  style={{ borderBottom: isExpanded ? "none" : `1px solid ${T.bgCard2}`, cursor: "pointer", transition: "background 0.15s", backgroundColor: isExpanded ? T.rowHover : undefined }}
                  onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = T.rowHover; }}
                  onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = ""; }}>
                  <td style={{ ...td, color: T.text3 }}>{`${String(d.getUTCDate()).padStart(2,"0")}/${String(d.getUTCMonth()+1).padStart(2,"0")}/${String(d.getUTCFullYear()).slice(2)}`}</td>
                  <td style={{ ...td, color: T.text1, fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: p !== null ? (p >= 0 ? "#22c55e" : "#ef4444") : T.empty, flexShrink: 0 }} />
                      {getField(t, "Symbol") ?? "—"}
                    </div>
                  </td>
                  <td style={td}>
                    {dir && <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px", backgroundColor: dir === "Long" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: dir === "Long" ? "#22c55e" : "#ef4444" }}>{dir === "Long" ? "▲L" : "▼S"}</span>}
                  </td>
                  <td style={{ ...td, color: T.text4 }}>{getField(t, "Setup") ?? <span style={{ color: T.empty }}>—</span>}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    {p !== null ? <span style={{ color: p >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{p >= 0 ? "+" : ""}{p.toFixed(2)}</span> : <span style={{ color: T.empty }}>—</span>}
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                      {emos.slice(0, 2).map(e => (
                        <span key={e} style={{ padding: "1px 6px", borderRadius: "8px", fontSize: "10px", backgroundColor: `${EMOTION_COLORS[e] ?? "#6B7280"}22`, color: EMOTION_COLORS[e] ?? "#6B7280" }}>{e}</span>
                      ))}
                      {emos.length > 2 && <span style={{ color: T.text3, fontSize: "10px" }}>+{emos.length - 2}</span>}
                    </div>
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {totalBreaks > 0
                        ? <span style={{ color: "#ef4444", fontSize: "12px", fontWeight: 600 }}>✗ {totalBreaks} break{totalBreaks > 1 ? "s" : ""}</span>
                        : hasData
                          ? <span style={{ color: "#22c55e", fontSize: "12px", fontWeight: 600 }}>✓ All OK</span>
                          : <span style={{ color: T.empty, fontSize: "12px" }}>—</span>}
                      <span style={{ color: "#4B5563", fontSize: "11px" }}>{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={7} style={{ backgroundColor: T.bgExpand, borderBottom: `1px solid ${T.border2}`, padding: "0" }}>
                      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        {totalBreaks === 0 && (
                          <p style={{ color: "#22c55e", fontSize: "12px", fontWeight: 600, margin: 0 }}>✓ All rules followed for this trade</p>
                        )}
                        {outsideSession && (
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "6px 10px" }}>
                            <span style={{ fontSize: "14px" }}>⏰</span>
                            <span style={{ color: "#ef4444", fontSize: "12px" }}>
                              Outside trading hours — trade at <strong>{tradeHHMM}</strong>, allowed: <strong>{journal.time_from}–{journal.time_to}</strong>
                            </span>
                          </div>
                        )}
                        {brokenRules.map(r => (
                          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "6px 10px" }}>
                            <span style={{ color: "#ef4444", fontSize: "13px", fontWeight: 700 }}>✗</span>
                            <span style={{ color: "#ef4444", fontSize: "12px" }}>{r.text}</span>
                          </div>
                        ))}
                        {rules.filter(r => r.compliant).map(r => (
                          <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 10px" }}>
                            <span style={{ color: "#22c55e", fontSize: "13px" }}>✓</span>
                            <span style={{ color: T.text3, fontSize: "12px" }}>{r.text}</span>
                          </div>
                        ))}
                        {!hasData && (
                          <p style={{ color: "#4B5563", fontSize: "12px", margin: 0 }}>No rule data logged for this trade.</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      {entries.length > 50 && <p style={{ color: "#4B5563", fontSize: "11px", textAlign: "center", marginTop: "12px" }}>Showing latest 50 of {entries.length} trades</p>}
    </div>
  );
}

// ─── Widget Registry ──────────────────────────────────────────────────────────
interface WidgetDef {
  id: string; name: string; desc: string; icon: string;
  dotColor: string; size: "full" | "half"; defaultOn: boolean;
  component: (props: { entries: Trade[]; journal: Journal }) => React.ReactElement | null;
}

const WIDGETS: WidgetDef[] = [
  { id: "kpi",             name: "KPI Overview",           desc: "Trades, P&L, Win Rate, Drawdown, Streak",             icon: "grid",       dotColor: "#8B5CF6", size: "full", defaultOn: true,  component: ({ entries }) => <WKpi entries={entries} /> },
  { id: "equity",          name: "Equity Curve",           desc: "Cumulative P&L across all trades",                    icon: "trendingUp", dotColor: "#8B5CF6", size: "full", defaultOn: true,  component: ({ entries }) => <WEquity entries={entries} /> },
  { id: "winloss",         name: "Win / Loss",             desc: "Wins, Losses and Break-even donut chart",             icon: "pie",        dotColor: "#8B5CF6", size: "half", defaultOn: true,  component: ({ entries }) => <WWinLoss entries={entries} /> },
  { id: "weekday",         name: "Weekday Performance",    desc: "Average P&L by weekday",                              icon: "bars",       dotColor: "#8B5CF6", size: "half", defaultOn: true,  component: ({ entries }) => <WWeekday entries={entries} /> },
  { id: "monthly",         name: "Monthly P&L",            desc: "P&L bar chart for the last 6 months",                 icon: "bars",       dotColor: "#8B5CF6", size: "half", defaultOn: true,  component: ({ entries }) => <WMonthly entries={entries} /> },
  { id: "frequency",       name: "Trade Frequency",        desc: "Number of trades per month over the last 8 months",   icon: "activity",   dotColor: "#8B5CF6", size: "half", defaultOn: true,  component: ({ entries }) => <WFrequency entries={entries} /> },
  { id: "calendar",        name: "Trade Calendar",         desc: "Daily P&L heatmap for the last 3 months",             icon: "calendar",   dotColor: "#8B5CF6", size: "full", defaultOn: true,  component: ({ entries }) => <WCalendar entries={entries} /> },
  { id: "setup-perf",      name: "Setup Performance",      desc: "Win Rate and P&L broken down by setup type",          icon: "layers",     dotColor: "#8B5CF6", size: "full", defaultOn: true,  component: ({ entries }) => <WSetupPerf entries={entries} /> },
  { id: "risk-discipline", name: "Risk Discipline",        desc: "How consistently you stick to your risk % rule",      icon: "shield",     dotColor: "#8B5CF6", size: "half", defaultOn: true,  component: ({ entries, journal }) => <WRiskDiscipline entries={entries} journal={journal} /> },
  { id: "rule-compliance", name: "Rule Compliance",        desc: "How often each journal rule was followed",            icon: "check",      dotColor: "#8B5CF6", size: "half", defaultOn: true,  component: ({ entries, journal }) => <WRuleCompliance entries={entries} journal={journal} /> },
  { id: "emotions-breaks", name: "Emotions at Rule Breaks",desc: "Emotions that appear most when you break rules",      icon: "activity",   dotColor: "#8B5CF6", size: "half", defaultOn: true,  component: ({ entries }) => <WEmotionsBreaks entries={entries} /> },
  { id: "profit-factor",   name: "Profit Factor",          desc: "Profit Factor, Gross Profit/Loss, Expectancy",        icon: "zap",        dotColor: "#8B5CF6", size: "half", defaultOn: true,  component: ({ entries }) => <WProfitFactor entries={entries} /> },
  { id: "trade-analysis",  name: "Trade Analysis",         desc: "Full trade list with setup, emotions, rule status",   icon: "list",       dotColor: "#8B5CF6", size: "full", defaultOn: true,  component: ({ entries, journal }) => <WTradeAnalysis entries={entries} journal={journal} /> },
];

const STORAGE_KEY = "tj-stats-prefs-v1";

// ─── Fixed layout — exact reproduction of the original default arrangement ─────
// 12-col grid: left mosaic + tall Trade-Analysis rail on the right.
// (Same x/y/w/h as the original react-grid-layout default; just a larger row unit
//  to fit the richer redesigned widgets.)
const ROW_UNIT = 104;
const ORDER = ["kpi", "winloss", "calendar", "risk-discipline", "trade-analysis", "weekday", "equity", "setup-perf", "rule-compliance", "profit-factor", "frequency", "monthly", "emotions-breaks"];
const WIDGET_POS: Record<string, { x: number; y: number; w: number; h: number }> = {
  kpi:               { x: 0, y: 0, w: 2, h: 3 },
  winloss:           { x: 2, y: 0, w: 2, h: 3 },
  calendar:          { x: 4, y: 0, w: 3, h: 3 },
  "risk-discipline": { x: 7, y: 0, w: 2, h: 3 },
  "trade-analysis":  { x: 9, y: 0, w: 3, h: 9 },
  weekday:           { x: 0, y: 3, w: 2, h: 2 },
  equity:            { x: 2, y: 3, w: 4, h: 2 },
  "setup-perf":      { x: 6, y: 3, w: 3, h: 2 },
  "rule-compliance": { x: 0, y: 5, w: 4, h: 2 },
  "profit-factor":   { x: 4, y: 5, w: 2, h: 2 },
  frequency:         { x: 6, y: 5, w: 3, h: 2 },
  monthly:           { x: 0, y: 7, w: 3, h: 2 },
  "emotions-breaks": { x: 3, y: 7, w: 6, h: 2 },
};

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      style={{ width: "44px", height: "26px", borderRadius: "13px", backgroundColor: on ? "#8B5CF6" : "#1F2937", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: "4px", left: on ? "22px" : "4px", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#fff", transition: "left 0.2s" }} />
    </button>
  );
}

// ─── Hero Middle — personalized greeting + name shimmer + rotating mantra ──────
const MANTRAS = [
  "Discipline over emotion.",
  "Plan the trade. Trade the plan.",
  "Risk first. Profit follows.",
  "Process over outcome.",
  "Cut losses. Let winners run.",
  "Consistency beats intensity.",
  "Patience is a position.",
  "Trade what you see, not what you feel.",
];
function HeroMiddle({ name }: { name?: string | null }) {
  const T = useT();
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI(p => (p + 1) % MANTRAS.length), 8000);
    return () => clearInterval(id);
  }, []);
  const greeting = (() => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; })();
  const first = (name?.trim().split(/\s+/)[0]) || "Trader";
  return (
    <div style={{ flex: "1 1 240px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "6px", minWidth: 0, position: "relative", zIndex: 1, padding: "4px 16px" }}>
      <span style={{ color: T.text3, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em" }}>{greeting}</span>
      <span style={{ fontSize: "46px", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.0, background: "linear-gradient(110deg, #7c3aed 20%, #ffffff 45%, #a78bfa 55%, #7c3aed 80%)", backgroundSize: "220% auto", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", animation: "tjShimmer 4.5s linear infinite" }}>{first}</span>
      <div style={{ height: "24px", overflow: "hidden", position: "relative", width: "100%", marginTop: "4px" }}>
        <span key={i} style={{ display: "block", color: T.text2, fontSize: "15px", fontWeight: 500, fontStyle: "italic", animation: "tjMantra 8s ease both", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>“{MANTRAS[i]}”</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function JournalStatsInner({ entries, journal, metaAccountBalance, userName, isPro = false, isDark = true }: Props) {
  const T = useT();
  const insightResult = useMemo(() => computeInsights(entries), [entries]);
  const [period, setPeriod] = useState<Period>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [active, setActive] = useState<string[]>(() => WIDGETS.filter(w => w.defaultOn).map(w => w.id));
  const [loaded, setLoaded] = useState(false);
  const dbSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load widget visibility prefs (DB first, then localStorage)
  useEffect(() => {
    async function loadPrefs() {
      try {
        const res = await fetch("/api/account/layout");
        if (res.ok) {
          const data = await res.json();
          if (data.widget_prefs) {
            setActive(data.widget_prefs);
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data.widget_prefs)); } catch {}
            setLoaded(true);
            return;
          }
        }
      } catch {}
      try { const s = localStorage.getItem(STORAGE_KEY); if (s) setActive(JSON.parse(s)); } catch {}
      setLoaded(true);
    }
    loadPrefs();
  }, []);

  const saveToDb = (prefsToSave: string[]) => {
    if (dbSaveTimer.current) clearTimeout(dbSaveTimer.current);
    dbSaveTimer.current = setTimeout(() => {
      fetch("/api/account/layout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widget_prefs: prefsToSave }),
      }).catch(() => {});
    }, 800);
  };

  const resetWidgets = () => {
    const def = WIDGETS.filter(w => w.defaultOn).map(w => w.id);
    setActive(def);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(def)); } catch {}
    saveToDb(def);
  };

  // Full-width layout while statistics are active — matches HTML .main
  useEffect(() => {
    const main = document.querySelector("main") as HTMLElement | null;
    if (!main) return;
    const prev = { maxWidth: main.style.maxWidth, padding: main.style.padding, margin: main.style.margin };
    main.style.maxWidth = "none";
    main.style.padding = "20px 28px 60px";
    main.style.margin = "0";
    return () => {
      main.style.maxWidth = prev.maxWidth || "1200px";
      main.style.padding = prev.padding || "";
      main.style.margin = prev.margin || "";
    };
  }, []);

  const toggle = (id: string) => {
    setActive(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      saveToDb(next);
      return next;
    });
  };

  const filtered = useMemo(() => applyPeriod(entries, period, customFrom, customTo), [entries, period, customFrom, customTo]);

  const balanceInfo = useMemo(() => {
    const hasPnl = entries.some(e => pnlNum(e) !== null);
    if (!hasPnl) return null;
    const totalPnl = entries.reduce((sum, t) => sum + (pnlNum(t) ?? 0), 0);
    const starting = journal.starting_balance ?? null;
    if (starting !== null) {
      return { starting, totalPnl, current: starting + totalPnl };
    }
    // MT5-Journal: use live broker balance as current, derive starting
    if (metaAccountBalance != null) {
      return { starting: metaAccountBalance - totalPnl, totalPnl, current: metaAccountBalance };
    }
    return { starting: null, totalPnl, current: null };
  }, [entries, journal.starting_balance, metaAccountBalance]);

  const disciplineData = useMemo(() => {
    if (!filtered.length) return null;
    let rulesScore: number | null = null;
    { let tot = 0, fol = 0; filtered.forEach(e => { getRulesArr(e).forEach(r => { tot++; if (r.compliant) fol++; }); }); if (tot > 0) rulesScore = (fol / tot) * 100; }
    let hoursScore: number | null = null;
    if (journal.time_from && journal.time_to) { let tot = 0, ins = 0; filtered.forEach(e => { const d = new Date(e.trade_date); const hh = `${String(d.getUTCHours()).padStart(2,"0")}:${String(d.getUTCMinutes()).padStart(2,"0")}`; tot++; if (hh >= journal.time_from && hh <= journal.time_to) ins++; }); if (tot > 0) hoursScore = (ins / tot) * 100; }
    const NEG = new Set(["FOMO","Greedy","Fearful","Nervous","Frustrated"]);
    let emoScore: number | null = null;
    { let tot = 0, ctrl = 0; filtered.forEach(e => { const em = getEmotions(e); if (em.length > 0) { tot++; if (!em.some(x => NEG.has(x))) ctrl++; } }); if (tot > 0) emoScore = (ctrl / tot) * 100; }
    let riskScore: number | null = null;
    if (journal.risk_per_trade) { let tot = 0, ok = 0, bal = journal.starting_balance ?? 0; for (const e of [...filtered].sort((a,b)=>new Date(a.trade_date).getTime()-new Date(b.trade_date).getTime())) { const ra = getField(e,"Risk Amount"); const p = pnlNum(e); if (ra && bal > 0) { const n = parseFloat(ra); if (!isNaN(n) && n > 0) { tot++; if ((n/bal)*100 <= journal.risk_per_trade+0.5) ok++; } } if (p !== null) bal += p; } if (tot > 0) riskScore = (ok / tot) * 100; }
    const factors = [
      { key: "rules", label: "Rules", s: rulesScore, w: 40 },
      { key: "hours", label: "Hours", s: hoursScore, w: 20 },
      { key: "emotions", label: "Emotions", s: emoScore, w: 20 },
      { key: "risk", label: "Risk", s: riskScore, w: 20 },
    ];
    const avail = factors.filter(f => f.s !== null);
    if (!avail.length) return null;
    const tw = avail.reduce((a, f) => a + f.w, 0);
    const score = Math.round(avail.reduce((a, f) => a + f.s! * f.w, 0) / tw);
    return { score, factors };
  }, [filtered, journal]);

  const disciplineScore = disciplineData ? disciplineData.score : null;

  // Render order: curated ORDER, filtered to active widgets
  const orderedWidgets = useMemo(
    () => ORDER.map(id => WIDGETS.find(w => w.id === id)).filter((w): w is WidgetDef => !!w && active.includes(w.id)),
    [active]
  );

  if (!loaded) return null;

  const inpStyle: React.CSSProperties = { backgroundColor: T.bgInput, border: `1px solid ${T.border2}`, borderRadius: "8px", padding: "6px 10px", color: T.text1, fontSize: "13px", outline: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      <style>{`
        @keyframes tjCardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tjDonut { from { stroke-dashoffset: var(--tj-len); } to { stroke-dashoffset: 0; } }
        @keyframes tjBar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes tjFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tjEqLine { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @keyframes tjGrowX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes tjPulse { 0%,100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 0.15; transform: scale(1.6); } }
        @keyframes tjTickIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tjShimmer { to { background-position: 220% center; } }
        @keyframes tjMantra { 0% { opacity: 0; transform: translateY(7px); } 12% { opacity: 1; transform: translateY(0); } 86% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-7px); } }
        .tj-grid { display: grid; grid-template-columns: repeat(12, 1fr); grid-auto-rows: ${ROW_UNIT}px; gap: 16px; }
        .tj-grid > .tj-w { min-width: 0; min-height: 0; }
        @media (max-width: 1100px) {
          .tj-grid { display: flex; flex-direction: column; }
          .tj-grid > .tj-w { height: auto !important; min-height: 260px; }
        }
        @media (prefers-reduced-motion: reduce) {
          .tj-anim, [style*="tjCardIn"], [style*="tjDonut"], [style*="tjBar"], [style*="tjEqLine"] { animation: none !important; }
        }
      `}</style>

      {/* Account Balance + Discipline Score Card */}
      {(balanceInfo || disciplineScore !== null) && (() => {
        const dsLabel = disciplineScore !== null ? (disciplineScore >= 75 ? "Good" : disciplineScore >= 50 ? "Fair" : "Poor") : null;
        const dsColor = disciplineScore !== null ? (disciplineScore >= 75 ? "#22c55e" : disciplineScore >= 50 ? "#F59E0B" : "#ef4444") : T.text2;
        const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const bal = balanceInfo;
        const heroValue = bal ? (bal.current !== null ? usd(bal.current) : fmt(bal.totalPnl)) : null;
        return (
          <div style={{ position: "relative", background: T.bgCard2, border: "1px solid rgba(139,92,246,0.22)", borderRadius: "16px", boxShadow: `${T.shadow}, inset 0 1px 0 rgba(255,255,255,0.05)`, padding: "20px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "24px", overflow: "hidden" }}>
            {/* ambient glow */}
            <div style={{ position: "absolute", top: "-40%", left: "-10%", width: "320px", height: "200px", background: "radial-gradient(ellipse, rgba(139,92,246,0.10), transparent 70%)", pointerEvents: "none" }} />

            {/* Left: Balance hero */}
            {bal && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Icon name="wallet" size={15} color={T.text3} />
                  <span style={{ color: T.text3, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Account Balance</span>
                </div>
                <div style={{ color: T.text1, fontSize: "32px", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{heroValue}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  {bal.starting !== null && (
                    <span style={{ color: T.text3, fontSize: "12px", fontWeight: 500 }}>Start <span style={{ color: T.text2, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{usd(bal.starting)}</span></span>
                  )}
                  <span style={{ display: "flex", alignItems: "center", gap: "5px", padding: "3px 9px", borderRadius: "20px", background: bal.totalPnl >= 0 ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", border: `1px solid ${bal.totalPnl >= 0 ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}` }}>
                    <span style={{ color: bal.totalPnl >= 0 ? "#22c55e" : "#ef4444", fontSize: "11px", fontWeight: 700 }}>{bal.totalPnl >= 0 ? "▲" : "▼"}</span>
                    <span style={{ color: bal.totalPnl >= 0 ? "#22c55e" : "#ef4444", fontSize: "12px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(bal.totalPnl)}</span>
                  </span>
                </div>
              </div>
            )}

            {/* Middle: personalized greeting + rotating mantra */}
            <HeroMiddle name={userName} />

            {/* Right: Discipline Score — tick speedometer + factor breakdown */}
            {disciplineScore !== null && (() => {
              const score = disciplineScore;
              const zoneColor = (v: number) => v >= 75 ? "#22c55e" : v >= 50 ? "#F59E0B" : "#ef4444";
              // Tick gauge geometry: 270° arc, gap at bottom
              const gs = 116, gc = 58, Ro = 51, Ri = 40, N = 40, START = 135, SWEEP = 270;
              const ticks = Array.from({ length: N }, (_, k) => {
                const frac = k / (N - 1);
                const v = frac * 100;
                const rad = ((START + frac * SWEEP) * Math.PI) / 180;
                const cos = Math.cos(rad), sin = Math.sin(rad);
                return { x1: gc + Ri * cos, y1: gc + Ri * sin, x2: gc + Ro * cos, y2: gc + Ro * sin, lit: v <= score, color: zoneColor(v), k };
              });
              const eFrac = score / 100, eRad = ((START + eFrac * SWEEP) * Math.PI) / 180;
              const eR = (Ri + Ro) / 2, ex = gc + eR * Math.cos(eRad), ey = gc + eR * Math.sin(eRad);
              const factors = disciplineData?.factors ?? [];
              return (
                <LockedWidget locked={!isPro}>
                <div style={{ display: "flex", alignItems: "center", gap: "22px", position: "relative", zIndex: 1, flex: bal ? "0 0 auto" : "1", justifyContent: bal ? "flex-end" : "center", borderLeft: bal ? `1px solid ${T.border2}` : "none", paddingLeft: bal ? "26px" : "0", flexWrap: "wrap" }}>
                  {/* Gauge */}
                  <div style={{ position: "relative", width: gs, height: gs, flexShrink: 0 }}>
                    <svg width={gs} height={gs} viewBox={`0 0 ${gs} ${gs}`} style={{ display: "block", overflow: "visible" }}>
                      {ticks.map(t => (
                        <line key={t.k} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
                          stroke={t.lit ? t.color : T.svgDonut} strokeWidth="2.6" strokeLinecap="round"
                          style={{ filter: t.lit ? `drop-shadow(0 0 3px ${t.color}aa)` : "none", animation: `tjTickIn 0.5s ease ${t.k * 22}ms both` }} />
                      ))}
                      {/* glowing endpoint */}
                      <circle cx={ex} cy={ey} r="7" fill={dsColor} style={{ transformOrigin: `${ex}px ${ey}px`, animation: "tjPulse 2.4s ease-in-out infinite" }} />
                      <circle cx={ex} cy={ey} r="4" fill="#fff" stroke={dsColor} strokeWidth="2" style={{ filter: `drop-shadow(0 0 5px ${dsColor})` }} />
                    </svg>
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                      <span style={{ fontWeight: 800, fontSize: "30px", lineHeight: 1, color: T.text1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>{score}</span>
                      <span style={{ color: T.text3, fontSize: "9px", marginTop: "2px", fontWeight: 600 }}>/ 100</span>
                    </div>
                  </div>
                  {/* Title + factor breakdown */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "150px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                      <span style={{ color: T.text3, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Discipline Score</span>
                      {dsLabel && <span style={{ color: dsColor, fontSize: "10px", fontWeight: 800, padding: "1px 7px", borderRadius: "5px", background: `${dsColor}1f`, textTransform: "uppercase", letterSpacing: "0.04em" }}>{dsLabel}</span>}
                    </div>
                    {factors.map(f => {
                      const has = f.s !== null;
                      const v = has ? Math.round(f.s as number) : 0;
                      const col = has ? zoneColor(v) : T.text3;
                      return (
                        <div key={f.key} style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                          <span style={{ color: T.text3, fontSize: "10px", fontWeight: 500, width: "52px", flexShrink: 0 }}>{f.label}</span>
                          <div style={{ flex: 1, height: "5px", background: T.prgTrack, borderRadius: "3px", overflow: "hidden" }}>
                            {has && <div style={{ width: `${v}%`, height: "100%", background: `linear-gradient(90deg, ${col}bb, ${col})`, borderRadius: "3px", transformOrigin: "left", animation: "tjGrowX 0.9s cubic-bezier(.22,1,.36,1) both", boxShadow: `0 0 8px ${col}66` }} />}
                          </div>
                          <span style={{ color: has ? T.text2 : T.text3, fontSize: "10px", fontWeight: 700, width: "30px", textAlign: "right", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>{has ? `${v}` : "—"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                </LockedWidget>
              );
            })()}

          </div>
        );
      })()}

      {/* Period Filter Bar */}
      <div style={{ background: T.bgCard2, border: `1px solid ${T.border2}`, borderRadius: "12px", boxShadow: T.shadow, padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {(["today", "week", "month", "year", "all", "custom"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: "6px 13px", borderRadius: "8px", border: `1px solid ${period === p ? "rgba(139,92,246,0.5)" : T.border5}`, backgroundColor: period === p ? "rgba(139,92,246,0.1)" : "transparent", color: period === p ? "#A78BFA" : T.text4, cursor: "pointer", fontSize: "13px", fontWeight: period === p ? 600 : 400 }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        {period === "custom" && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={inpStyle} />
            <span style={{ color: T.text3, fontSize: "13px" }}>→</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={inpStyle} />
          </div>
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: T.text3, fontSize: "13px" }}>{filtered.length} trade{filtered.length !== 1 ? "s" : ""}</span>
          <button onClick={() => setEditOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: "7px", padding: "7px 14px", borderRadius: "10px", border: `1px solid ${T.border4}`, backgroundColor: T.border3, color: T.text4, cursor: "pointer", fontSize: "13px" }}>
            ⊞ Edit Widgets
          </button>
        </div>
      </div>

      {/* Performance Insights (Pro-gated payoff) */}
      <InsightsPanel result={insightResult} isPro={isPro} isDark={isDark} />

      {/* Widget Grid — fixed curated layout */}
      <div style={{ width: "100%" }}>

        {/* Empty State */}
        {filtered.length === 0 && (
          <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "16px", boxShadow: T.shadow, textAlign: "center", padding: "60px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "52px", height: "52px", borderRadius: "14px", background: T.bgCard2, border: `1px solid ${T.border2}`, marginBottom: "14px" }}>
              <Icon name="bars" size={24} color={T.text3} />
            </div>
            <p style={{ color: T.text3, fontSize: "14px" }}>No trades in this period — try a wider range or log some trades first.</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="tj-grid">
            {orderedWidgets.map(w => {
              const p = WIDGET_POS[w.id];
              if (!p) return null;
              return (
                <div key={w.id} className="tj-w" style={{ gridColumn: `${p.x + 1} / span ${p.w}`, gridRow: `${p.y + 1} / span ${p.h}` }}>
                  <WidgetCard>
                    <SectionTitle icon={w.icon}>{w.name}</SectionTitle>
                    <div style={{ flex: 1, overflow: "auto", minHeight: 0, display: "flex", flexDirection: "column" }}>
                      <LockedWidget locked={!isPro && STATS_LOCKED.has(w.id)}>
                        <w.component entries={filtered} journal={journal} />
                      </LockedWidget>
                    </div>
                  </WidgetCard>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Edit Widgets Side Panel */}
      {editOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex" }} onClick={() => setEditOpen(false)}>
          <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} />
          <div style={{ width: "360px", maxWidth: "95vw", background: T.bgCard, borderLeft: `1px solid ${T.border2}`, display: "flex", flexDirection: "column", height: "100%" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "24px", borderBottom: `1px solid ${T.border2}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <h3 style={{ color: T.text1, fontWeight: 700, fontSize: "16px", margin: 0 }}>Edit Widgets</h3>
                <p style={{ color: T.text3, fontSize: "12px", marginTop: "4px" }}>{active.length} of {WIDGETS.length} active</p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={resetWidgets} style={{ padding: "8px 14px", borderRadius: "10px", border: `1px solid ${T.border4}`, backgroundColor: "transparent", color: T.text4, cursor: "pointer", fontSize: "12px" }}>Reset</button>
                <button onClick={() => setEditOpen(false)} style={{ padding: "8px 18px", borderRadius: "10px", border: "none", backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>Done</button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "scroll", padding: "16px" }}>
              <p style={{ color: T.text3, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px", paddingLeft: "4px" }}>Active</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
                {WIDGETS.filter(w => active.includes(w.id)).map(w => (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: T.bgCard2, borderRadius: "12px", border: `1px solid ${T.border2}` }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: T.bgCard, border: `1px solid ${T.border2}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={w.icon} size={16} color={T.text2} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: T.text1, fontSize: "13px", fontWeight: 600 }}>{w.name}</p>
                      <p style={{ color: "#4B5563", fontSize: "11px", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.desc}</p>
                    </div>
                    <Toggle on={true} onChange={() => toggle(w.id)} />
                  </div>
                ))}
              </div>
              {WIDGETS.some(w => !active.includes(w.id)) && (
                <>
                  <p style={{ color: T.text3, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px", paddingLeft: "4px" }}>Available</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {WIDGETS.filter(w => !active.includes(w.id)).map(w => (
                      <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: T.bgCard2, borderRadius: "12px", border: `1px solid ${T.border2}`, opacity: 0.7 }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: T.bgCard, border: `1px solid ${T.border2}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={w.icon} size={16} color={T.text2} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: T.text4, fontSize: "13px", fontWeight: 600 }}>{w.name}</p>
                          <p style={{ color: T.empty, fontSize: "11px", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.desc}</p>
                        </div>
                        <Toggle on={false} onChange={() => toggle(w.id)} />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JournalStats({ entries, journal, isDark = true, metaAccountBalance, userName, isPro = false }: Props) {
  return (
    <ThemeCtx.Provider value={isDark}>
      <JournalStatsInner entries={entries} journal={journal} metaAccountBalance={metaAccountBalance} userName={userName} isPro={isPro} isDark={isDark} />
    </ThemeCtx.Provider>
  );
}
