"use client";
import React, { useEffect, useMemo, useState } from "react";
import { getMarketHoliday } from "@/lib/market-holidays";
import { computeInsights } from "@/lib/insights";
import InsightsPanel from "@/components/insights/InsightsPanel";
import LockedWidget from "@/components/common/LockedWidget";

// Pro-gated widgets — blurred for Basic; everything else is visible to all.
// (+ Discipline Score & Performance Insights are gated at their own call sites.)
// Mirror of STATS_LOCKED in JournalStats.tsx — keep both in sync.
const DASH_LOCKED = new Set(["profit-factor", "discipline-score"]);

// ─── Design Token ─────────────────────────────────────────────────────────────
const W_PAD = "20px 22px"; // widget padding — matches HTML reference

// ─── Types ───────────────────────────────────────────────────────────────────

interface FieldValue {
  id: string;
  field_id: string;
  value: string;
  template_fields: { id: string; label: string; field_type: string };
}

export interface Entry {
  id: string;
  trade_date: string;
  template_id: string;
  journal_templates: { id: string; name: string; version: number; time_from?: string | null; time_to?: string | null; risk_per_trade?: number | null; starting_balance?: number | null };
  trade_field_values: FieldValue[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getPnl = (e: Entry): number | null => {
  for (const fv of e.trade_field_values ?? []) {
    const label = (fv.template_fields?.label ?? "").toLowerCase();
    if (fv.template_fields?.field_type === "number" &&
      (label.includes("p&l") || label.includes("pnl") || label === "profit" || label.includes("gewinn") || label.includes("gain"))) {
      const n = parseFloat(fv.value);
      return isNaN(n) ? null : n;
    }
  }
  return null;
};

const getField = (e: Entry, ...keywords: string[]): string | null => {
  for (const fv of e.trade_field_values ?? []) {
    const label = (fv.template_fields?.label ?? "").toLowerCase();
    if (keywords.some(k => label.includes(k))) return fv.value;
  }
  return null;
};

const fmt = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ─── Theme System ─────────────────────────────────────────────────────────────
const ThemeCtx = React.createContext(true); // true = dark
function useT() {
  const d = React.useContext(ThemeCtx);
  return {
    bgCard:     d ? "linear-gradient(145deg, #110c1e, #080808)" : "linear-gradient(145deg, #ffffff, #f9fafb)",
    border:     d ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)",
    shadow:     d ? "0 4px 40px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.05)" : "0 1px 8px rgba(0,0,0,0.07)",
    shadowHov:  d ? "0 0 0 1px rgba(139,92,246,0.2), 0 0 40px rgba(139,92,246,0.12), 0 8px 40px rgba(0,0,0,0.7)" : "0 0 0 1px rgba(139,92,246,0.2), 0 4px 20px rgba(0,0,0,0.1)",
    text1:      d ? "#F9FAFB" : "#111827",
    text2:      d ? "#9CA3AF" : "#4B5563",
    text3:      d ? "#64748b" : "#64748b",
    text4:      d ? "#4B5563" : "#9CA3AF",
    text5:      d ? "#374151" : "#D1D5DB",
    svgLine:    d ? "#1F2937" : "rgba(0,0,0,0.1)",
    svgText:    d ? "#6B7280" : "#9CA3AF",
    barTrack:   d ? "#1F2937" : "#E5E7EB",
    panelBg:    d ? "linear-gradient(180deg, #0a0614, #050505)" : "linear-gradient(180deg, #f8f8fc, #f0f0f8)",
    panelBorder:d ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.2)",
    itemBg:     d ? "linear-gradient(145deg, #0f0f18, #090909)" : "linear-gradient(145deg, #f9fafb, #f3f4f6)",
    noData:     d ? "#374151" : "#9CA3AF",
    btnBorder:  d ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.1)",
    btnText:    d ? "#9CA3AF" : "#6B7280",
  };
}

function GlowCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
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
        boxShadow: hovered ? T.shadowHov : T.shadow,
        transition: "border-color 0.25s, box-shadow 0.25s, transform 0.25s",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        animation: "tjCardIn 0.5s cubic-bezier(.22,1,.36,1) both",
        position: "relative" as const,
        overflow: "hidden" as const,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

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
  search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
};
function Icon({ name, size = 14, color = "currentColor" }: { name: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: "block" }}>
      {ICON_PATHS[name] ?? ICON_PATHS.grid}
    </svg>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; color?: string; icon?: string }) {
  const T = useT();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
      {icon && <Icon name={icon} color={T.text2} />}
      <p style={{ color: T.text3, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{children}</p>
    </div>
  );
}

function NoData({ text = "At least 1 trade with P&L needed" }: { text?: string }) {
  const T = useT();
  return <div style={{ color: T.noData, fontSize: "13px", textAlign: "center", padding: "32px 0" }}>{text}</div>;
}

// ─── Shared Primitive: Stat Tile ──────────────────────────────────────────────
function StatTile({ label, value, color = "#F9FAFB", sub, accent, delay = 0 }: { label: string; value: string; color?: string; sub?: string; accent?: string; delay?: number }) {
  const T = useT();
  return (
    <div style={{ position: "relative", background: T.itemBg, border: `1px solid ${T.border}`, borderRadius: "12px", padding: "11px 13px", overflow: "hidden", animation: `tjFade 0.45s ease ${delay}ms both` }}>
      {accent && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: accent, borderRadius: "3px 0 0 3px" }} />}
      <p style={{ color: T.text3, fontSize: "9.5px", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: "5px", whiteSpace: "nowrap" }}>{label}</p>
      <p style={{ color, fontWeight: 800, fontSize: "19px", lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{value}</p>
      {sub && <p style={{ color: T.text2, fontSize: "10px", marginTop: "4px", fontWeight: 500 }}>{sub}</p>}
    </div>
  );
}

// ─── Shared Primitive: Gauge Bar ──────────────────────────────────────────────
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
      <div style={{ position: "relative", height: "9px", background: T.barTrack, borderRadius: "5px", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, width: `${clamped}%`, background: `linear-gradient(90deg, ${color}cc, ${color})`, borderRadius: "5px", transformOrigin: "left", animation: `tjGrowX 0.9s cubic-bezier(.22,1,.36,1) ${delay}ms both`, boxShadow: `0 0 12px ${color}55` }} />
        {target !== undefined && target > 0 && target < 100 && (
          <div title="Target" style={{ position: "absolute", top: "-2px", bottom: "-2px", left: `${Math.min(99, target)}%`, width: "2px", background: T.text1, opacity: 0.5, borderRadius: "1px" }} />
        )}
      </div>
    </div>
  );
}

// ─── Widget: KPI Cards ────────────────────────────────────────────────────────

function WKpiCards({ entries }: { entries: Entry[] }) {
  const s = useMemo(() => {
    const pnls = entries.map(e => getPnl(e)).filter(v => v !== null) as number[];
    const total = pnls.reduce((a, b) => a + b, 0);
    const wins = pnls.filter(v => v > 0).length;
    const losses = pnls.filter(v => v < 0).length;
    const avg = pnls.length ? total / pnls.length : 0;
    const best = pnls.length ? Math.max(...pnls) : 0;
    const worst = pnls.length ? Math.min(...pnls) : 0;
    // Drawdown: only trades with actual P&L, sorted by date ASC
    let peak = 0, cum = 0, dd = 0;
    for (const p of [...entries]
      .filter(e => getPnl(e) !== null)
      .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime())
      .map(e => getPnl(e)!)) {
      cum += p; if (cum > peak) peak = cum; if (peak - cum > dd) dd = peak - cum;
    }
    // Streak: API returns DESC (newest first) → iterate as-is for current streak
    const sortedDesc = [...entries]
      .filter(e => getPnl(e) !== null)
      .sort((a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime());
    let streak = 0; let sType: "win" | "loss" | null = null;
    for (const e of sortedDesc) {
      const t = getPnl(e)! > 0 ? "win" : "loss";
      if (!sType) sType = t;
      if (t === sType) streak++; else break;
    }
    return { total, wins, losses, avg, best, worst, dd, streak, sType, hasPnl: pnls.length > 0, pnlCount: pnls.length };
  }, [entries]);

  const T = useT();
  const wr = s.pnlCount > 0 ? Math.round((s.wins / s.pnlCount) * 100) : 0;
  const pos = s.total >= 0;

  if (!s.hasPnl) return (
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "120px" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ position: "relative", background: `linear-gradient(135deg, ${pos ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"}, transparent 70%)`, border: `1px solid ${pos ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`, borderRadius: "14px", padding: "16px 18px", overflow: "hidden" }}>
        <p style={{ color: T.text3, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: "7px" }}>Total P&amp;L</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 800, fontSize: "30px", lineHeight: 1, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums", color: pos ? "#22c55e" : "#ef4444" }}>{fmt(s.total)}</span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: pos ? "#22c55e" : "#ef4444" }}>{pos ? "▲" : "▼"}</span>
        </div>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(92px, 1fr))", gap: "9px" }}>
        {tiles.map((t, i) => <StatTile key={t.l} label={t.l} value={t.v} color={t.c} accent={t.a} delay={i * 50} />)}
      </div>
    </div>
  );
}

// ─── Widget: Equity Curve ─────────────────────────────────────────────────────

function WEquityCurve({ entries }: { entries: Entry[] }) {
  const T = useT();
  const [hover, setHover] = useState<number | null>(null);
  const data = useMemo(() => {
    const sorted = [...entries].filter(e => getPnl(e) !== null)
      .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
    let cum = 0;
    return sorted.map(e => { const p = getPnl(e)!; cum += p; return { cum, pnl: p, date: e.trade_date }; });
  }, [entries]);

  if (data.length < 2) return <NoData />;

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
  const fmtDate = (s: string) => { const d = new Date(s); return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`; };
  const ticks = [0, Math.floor((data.length - 1) / 2), data.length - 1].filter((v, i, a) => a.indexOf(v) === i);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const fx = (e.clientX - rect.left) / rect.width;
    const frac = Math.max(0, Math.min(1, (fx * W - PL) / cW));
    setHover(Math.round(frac * (data.length - 1)));
  };
  const hv = hover !== null ? data[hover] : null;
  const hvX = hover !== null ? (sx(hover) / W) * 100 : 0;

  return (
    <div style={{ position: "relative" }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height="215" style={{ display: "block" }}>
        <defs>
          <linearGradient id={`eq-g-${data.length}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[min, (min + max) / 2, max].map((v, i) => (
          <g key={i}>
            <line x1={PL} y1={sy(v)} x2={W - PR} y2={sy(v)} stroke={T.svgLine} strokeWidth="1" strokeDasharray="4,4" />
            <text x={PL - 6} y={sy(v) + 4} textAnchor="end" fill={T.text4} fontSize="10">{v.toFixed(0)}</text>
          </g>
        ))}
        <line x1={PL} y1={z} x2={W - PR} y2={z} stroke={T.text5} strokeWidth="1" />
        <path d={fill} fill={`url(#eq-g-${data.length})`} style={{ animation: "tjFade 0.9s ease 0.3s both" }} />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          pathLength={1} strokeDasharray={1} style={{ animation: "tjEqLine 1.1s cubic-bezier(.6,0,.2,1) both" }} />
        {hv && hover !== null && <line x1={sx(hover)} y1={PT} x2={sx(hover)} y2={PT + cH} stroke={T.text5} strokeWidth="1" strokeDasharray="3,3" />}
        <circle cx={sx(data.length - 1)} cy={sy(last)} r="4" fill={color} style={{ animation: "tjFade 0.3s ease 1.2s both" }} />
        {hv && hover !== null && <circle cx={sx(hover)} cy={sy(hv.cum)} r="4.5" fill={color} stroke="#fff" strokeWidth="1.5" />}
      </svg>
      <div style={{ position: "absolute", left: `${(PL / W) * 100}%`, right: `${(PR / W) * 100}%`, bottom: "2px", display: "flex", justifyContent: "space-between", pointerEvents: "none" }}>
        {ticks.map(t => <span key={t} style={{ color: T.svgText, fontSize: "10px" }}>{fmtDate(data[t].date)}</span>)}
      </div>
      {hv && (
        <div style={{ position: "absolute", top: "4px", left: `${hvX}%`, transform: hvX > 60 ? "translateX(-105%)" : "translateX(5%)", background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: "8px", padding: "7px 10px", pointerEvents: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.4)", whiteSpace: "nowrap", zIndex: 5 }}>
          <div style={{ color: T.text3, fontSize: "10px", marginBottom: "3px" }}>{fmtDate(hv.date)}</div>
          <div style={{ color: T.text1, fontSize: "13px", fontWeight: 700 }}>Equity {fmt(hv.cum)}</div>
          <div style={{ color: hv.pnl >= 0 ? "#22c55e" : "#ef4444", fontSize: "11px", fontWeight: 600 }}>Trade {fmt(hv.pnl)}</div>
        </div>
      )}
    </div>
  );
}

// ─── Widget: Win/Loss Donut ───────────────────────────────────────────────────

function WWinLoss({ entries }: { entries: Entry[] }) {
  const T = useT();
  const m = useMemo(() => {
    const pnls = entries.map(e => getPnl(e)).filter(v => v !== null) as number[];
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
  const mag = Math.max(avgWin, Math.abs(avgLoss)) || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "18px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", width: "120px", height: "120px", flexShrink: 0 }}>
          <svg width="120" height="120" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="wl-grad-d" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" /><stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
            </defs>
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="#ef4444" strokeWidth={sw} opacity="0.22" strokeLinecap="round" />
            <circle cx={CX} cy={CY} r={R} fill="none" stroke="url(#wl-grad-d)" strokeWidth={sw}
              strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`} transform={`rotate(-90 ${CX} ${CY})`} strokeLinecap="round"
              style={{ ["--tj-len" as string]: (circ * pct).toFixed(2), animation: "tjDonut 1s cubic-bezier(.4,0,.2,1) both", filter: "drop-shadow(0 0 5px rgba(34,197,94,0.5))" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: T.text1, fontWeight: 800, fontSize: "27px", lineHeight: 1, letterSpacing: "-0.02em" }}>{Math.round(pct * 100)}%</span>
            <span style={{ color: T.text3, fontSize: "9.5px", marginTop: "3px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Win Rate</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "9px", flex: 1, minWidth: "100px" }}>
          {[{ c: "#22c55e", l: "Wins", n: wins }, { c: "#ef4444", l: "Losses", n: losses }, { c: T.text5, l: "Break-even", n: be }].map(x => (
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
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={{ color: "#22c55e", fontSize: "13px", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmt(avgWin)}</span>
          <span style={{ color: T.text3, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Avg Win / Loss</span>
          <span style={{ color: "#ef4444", fontSize: "13px", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmt(avgLoss)}</span>
        </div>
        <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
          <div style={{ flex: 1, height: "8px", background: T.barTrack, borderRadius: "5px", overflow: "hidden", display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: `${(avgWin / mag) * 100}%`, background: "linear-gradient(90deg, #16a34a, #22c55e)", borderRadius: "5px", transformOrigin: "right", animation: "tjGrowX 0.9s cubic-bezier(.22,1,.36,1) both" }} />
          </div>
          <div style={{ flex: 1, height: "8px", background: T.barTrack, borderRadius: "5px", overflow: "hidden" }}>
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

// ─── Widget: Weekday Bars ─────────────────────────────────────────────────────

function WWeekday({ entries }: { entries: Entry[] }) {
  const bars = useMemo(() => {
    const map: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] };
    entries.forEach(e => { const p = getPnl(e); if (p !== null) map[new Date(e.trade_date).getDay()].push(p); });
    return [1, 2, 3, 4, 5, 6, 0].map((d, i) => {
      const v = map[d]; const avg = v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
      return { label: DAYS_SHORT[i], avg, count: v.length };
    });
  }, [entries]);

  const T = useT();
  const maxAbs = Math.max(1, ...bars.map(b => Math.abs(b.avg)));
  const W = 451, H = 170;
  const PT = 14, BAR = 116, PB = 40;
  const bSlot = (W - 16) / bars.length;
  const bW = Math.round(bSlot * 0.6);
  const mid = PT + BAR * 0.72, maxPos = BAR * 0.72 - 2, maxNeg = BAR * 0.28 - 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height="170" style={{ display: "block" }}>
      <defs>
        <linearGradient id="wgWkGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ade80" /><stop offset="100%" stopColor="#16a34a" /></linearGradient>
        <linearGradient id="wgWkRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f87171" /><stop offset="100%" stopColor="#b91c1c" /></linearGradient>
      </defs>
      {bars.map((b, i) => {
        const x = 8 + i * bSlot + (bSlot - bW) / 2;
        const h = b.avg >= 0 ? (Math.abs(b.avg) / maxAbs) * maxPos : (Math.abs(b.avg) / maxAbs) * maxNeg;
        const color = b.avg >= 0 ? "#22c55e" : "#ef4444";
        return (
          <g key={b.label}>
            {i === 0 && <line x1={0} y1={mid} x2={W} y2={mid} stroke={T.svgLine} strokeWidth="1" />}
            {b.count > 0 && <rect x={x} y={b.avg >= 0 ? mid - h : mid} width={bW} height={Math.max(h, 2)} rx="3" fill={b.avg >= 0 ? "url(#wgWkGreen)" : "url(#wgWkRed)"}
              style={{ transformBox: "fill-box", transformOrigin: b.avg >= 0 ? "bottom" : "top", animation: `tjBar 0.55s cubic-bezier(.22,1,.36,1) ${i * 50}ms both`, filter: `drop-shadow(0 2px 5px ${color}55)` }} />}
            {b.count > 0 && <text x={x + bW / 2} y={b.avg >= 0 ? mid - h - 3 : mid + h + 13} textAnchor="middle" fill={color} fontSize="17" fontWeight="700" style={{ animation: `tjFade 0.4s ease ${i * 50 + 250}ms both` }}>{b.avg.toFixed(1)}</text>}
            <text x={x + bW / 2} y={PT + BAR + 16} textAnchor="middle" fill={T.svgText} fontSize="17">{b.label}</text>
            {b.count > 0 && <text x={x + bW / 2} y={PT + BAR + 32} textAnchor="middle" fill={T.svgText} fontSize="14">{b.count}x</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Widget: Monthly P&L ──────────────────────────────────────────────────────

function WMonthly({ entries }: { entries: Entry[] }) {
  const bars = useMemo(() => {
    const today = new Date();
    const result: { label: string; key: string; total: number; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      result.push({ label: MONTHS_SHORT[d.getMonth()], key, total: 0, count: 0 });
    }
    entries.forEach(e => {
      const p = getPnl(e); if (p === null) return;
      const d = new Date(e.trade_date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bar = result.find(r => r.key === key);
      if (bar) { bar.total += p; bar.count++; }
    });
    return result;
  }, [entries]);

  const T = useT();
  const maxAbs = Math.max(1, ...bars.map(b => Math.abs(b.total)));
  const W = 451, H = 170;
  const PT = 14, BAR = 116, PB = 40;
  const bSlot = (W - 28) / bars.length;
  const bW = Math.round(bSlot * 0.65);
  const mid = PT + BAR * 0.72, maxPos = BAR * 0.72 - 2, maxNeg = BAR * 0.28 - 2;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height="170" style={{ display: "block" }}>
      <defs>
        <linearGradient id="wgMonGreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4ade80" /><stop offset="100%" stopColor="#16a34a" /></linearGradient>
        <linearGradient id="wgMonRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f87171" /><stop offset="100%" stopColor="#b91c1c" /></linearGradient>
      </defs>
      {bars.map((b, i) => {
        const x = 14 + i * bSlot;
        const h = b.total >= 0 ? (Math.abs(b.total) / maxAbs) * maxPos : (Math.abs(b.total) / maxAbs) * maxNeg;
        const color = b.total >= 0 ? "#22c55e" : "#ef4444";
        return (
          <g key={b.key}>
            {i === 0 && <line x1={0} y1={mid} x2={W} y2={mid} stroke={T.svgLine} strokeWidth="1" />}
            {b.count > 0 && <rect x={x} y={b.total >= 0 ? mid - h : mid} width={bW} height={Math.max(h, 2)} rx="4" fill={b.total >= 0 ? "url(#wgMonGreen)" : "url(#wgMonRed)"}
              style={{ transformBox: "fill-box", transformOrigin: b.total >= 0 ? "bottom" : "top", animation: `tjBar 0.55s cubic-bezier(.22,1,.36,1) ${i * 60}ms both`, filter: `drop-shadow(0 2px 6px ${color}55)` }} />}
            {b.count > 0 && <text x={x + bW / 2} y={b.total >= 0 ? mid - h - 3 : mid + h + 13} textAnchor="middle" fill={color} fontSize="16" fontWeight="700" style={{ animation: `tjFade 0.4s ease ${i * 60 + 250}ms both` }}>{b.total >= 0 ? "+" : ""}{b.total.toFixed(0)}</text>}
            <text x={x + bW / 2} y={PT + BAR + 16} textAnchor="middle" fill={T.svgText} fontSize="17">{b.label}</text>
            {b.count > 0 && <text x={x + bW / 2} y={PT + BAR + 32} textAnchor="middle" fill={T.svgText} fontSize="14">{b.count}tr</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Widget: Trade Calendar ───────────────────────────────────────────────────

function WCalendar({ entries }: { entries: Entry[] }) {
  const T = useT();
  const today = new Date();
  // Last 2 months + current month
  const months = [-2, -1, 0].map(i => {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  const pnlByDate = useMemo(() => {
    const map: Record<string, { pnl: number; count: number }> = {};
    entries.forEach(e => {
      const key = e.trade_date.slice(0, 10);
      const p = getPnl(e) ?? 0;
      if (!map[key]) map[key] = { pnl: 0, count: 0 };
      map[key].pnl += p; map[key].count++;
    });
    return map;
  }, [entries]);

  const maxAbs = useMemo(() => Math.max(50, ...Object.values(pnlByDate).map(d => Math.abs(d.pnl))), [pnlByDate]);
  const noTradeBg = "rgba(148,163,184,0.06)";
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
                <p style={{ color: T.text2, fontSize: "12px", fontWeight: 700, margin: 0 }}>{MONTHS_SHORT[m]} <span style={{ color: T.text3, fontWeight: 500 }}>{y}</span></p>
                {mt !== 0 && <span style={{ color: mt >= 0 ? "#22c55e" : "#ef4444", fontSize: "11px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(mt)}</span>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "3px", marginBottom: "3px" }}>
                {DAYS_SHORT.map(d => <div key={d} style={{ textAlign: "center", color: T.text3, fontSize: "9px", fontWeight: 600 }}>{d[0]}</div>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "3px" }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={i} style={{ aspectRatio: "1 / 1", minWidth: 0 }} />;
                  const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isWeekend = i % 7 === 5 || i % 7 === 6;
                  const isToday = today.getDate() === day && today.getMonth() === m && today.getFullYear() === y;
                  const trade = pnlByDate[key];
                  const holiday = getMarketHoliday(key);
                  let bg = isWeekend ? "transparent" : noTradeBg, border = "transparent", color = T.text3, lbl = "", strong = false;
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
      <div style={{ display: "flex", gap: "16px", marginTop: "16px", flexWrap: "wrap", paddingTop: "12px", borderTop: `1px solid ${T.border}` }}>
        {[{ c: "rgba(34,197,94,0.75)", l: "Profit" }, { c: "rgba(239,68,68,0.75)", l: "Loss" }, { c: "rgba(148,163,184,0.3)", l: "Break-even" }, { c: noTradeBg, l: "No trade" }].map(x => (
          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "3px", backgroundColor: x.c, border: `1px solid ${T.border}` }} />
            <span style={{ color: T.text3, fontSize: "11px" }}>{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Widget: P&L Histogram ────────────────────────────────────────────────────

function WHistogram({ entries }: { entries: Entry[] }) {
  const bars = useMemo(() => {
    const pnls = entries.map(e => getPnl(e)).filter(v => v !== null) as number[];
    if (!pnls.length) return [];
    const buckets = [
      { label: "<-200", min: -Infinity, max: -200 },
      { label: "-200\n-100", min: -200, max: -100 },
      { label: "-100\n-50", min: -100, max: -50 },
      { label: "-50\n0", min: -50, max: 0 },
      { label: "0\n50", min: 0, max: 50 },
      { label: "50\n100", min: 50, max: 100 },
      { label: "100\n200", min: 100, max: 200 },
      { label: ">200", min: 200, max: Infinity },
    ];
    return buckets.map(b => ({ ...b, count: pnls.filter(p => p >= b.min && p < b.max).length }));
  }, [entries]);

  if (!bars.length || bars.every(b => b.count === 0)) return <NoData text="At least 1 trade with P&L needed" />;

  const T = useT();
  const maxCount = Math.max(1, ...bars.map(b => b.count));
  const H = 100, bW = 36, gap = 8, tW = bars.length * (bW + gap) - gap + 20;

  return (
    <svg viewBox={`0 0 ${tW} ${H + 36}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {bars.map((b, i) => {
        const x = i * (bW + gap) + 10;
        const h = (b.count / maxCount) * (H - 16);
        const barColor = b.min >= 0 ? "#22c55e" : b.max <= 0 ? "#ef4444" : "#6B7280";
        return (
          <g key={b.label}>
            {b.count > 0 && (
              <>
                <rect x={x} y={H - h} width={bW} height={h} rx="4" fill={barColor} opacity="0.8"
                  style={{ transformBox: "fill-box", transformOrigin: "bottom", animation: `tjBar 0.55s cubic-bezier(.22,1,.36,1) ${i * 50}ms both` }} />
                <text x={x + bW / 2} y={H - h - 4} textAnchor="middle" fill={barColor} fontSize="10" fontWeight="600" style={{ animation: `tjFade 0.4s ease ${i * 50 + 250}ms both` }}>{b.count}</text>
              </>
            )}
            {b.label.split("\n").map((line, li) => (
              <text key={li} x={x + bW / 2} y={H + 13 + li * 11} textAnchor="middle" fill={T.svgText} fontSize="8">{line}</text>
            ))}
          </g>
        );
      })}
      <line x1={0} y1={H} x2={tW} y2={H} stroke={T.svgLine} strokeWidth="1" />
    </svg>
  );
}

// ─── Widget: Instrument Breakdown ─────────────────────────────────────────────

function WInstrument({ entries }: { entries: Entry[] }) {
  const bars = useMemo(() => {
    const map: Record<string, number> = {};
    entries.forEach(e => {
      const v = getField(e, "instrument", "markt", "market", "asset class");
      if (v) map[v] = (map[v] ?? 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [entries]);

  if (!bars.length) return <NoData text="No 'Instrument' field found" />;

  const T = useT();
  const maxVal = bars[0][1];
  const colors = ["#8B5CF6", "#6366f1", "#3B82F6", "#22c55e", "#F59E0B", "#ef4444"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {bars.map(([name, count], i) => (
        <div key={name}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ color: T.text2, fontSize: "12px" }}>{name}</span>
            <span style={{ color: T.text3, fontSize: "12px" }}>{count}x</span>
          </div>
          <div style={{ height: "7px", backgroundColor: T.barTrack, borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(count / maxVal) * 100}%`, background: `linear-gradient(90deg, ${colors[i % colors.length]}bb, ${colors[i % colors.length]})`, borderRadius: "4px", transformOrigin: "left", animation: `tjGrowX 0.9s cubic-bezier(.22,1,.36,1) ${i * 60}ms both`, boxShadow: `0 0 10px ${colors[i % colors.length]}44` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Widget: Profit Factor ────────────────────────────────────────────────────

function WProfitFactor({ entries }: { entries: Entry[] }) {
  const T = useT();
  const m = useMemo(() => {
    const pnls = entries.map(e => getPnl(e)).filter(v => v !== null) as number[];
    const grossWin = pnls.filter(v => v > 0).reduce((s, v) => s + v, 0);
    const grossLoss = Math.abs(pnls.filter(v => v < 0).reduce((s, v) => s + v, 0));
    const pf = grossLoss ? grossWin / grossLoss : null;
    const winRate = pnls.length ? pnls.filter(v => v > 0).length / pnls.length : 0;
    const avgWin = pnls.filter(v => v > 0).length ? grossWin / pnls.filter(v => v > 0).length : 0;
    const avgLoss = pnls.filter(v => v < 0).length ? grossLoss / pnls.filter(v => v < 0).length : 0;
    const expectancy = avgWin * winRate - avgLoss * (1 - winRate);
    return { pf, grossWin, grossLoss, expectancy };
  }, [entries]);

  if (m.pf === null) return <NoData />;
  const pfColor = m.pf >= 1.5 ? "#22c55e" : m.pf >= 1 ? "#F59E0B" : "#ef4444";
  const pfLabel = m.pf >= 2 ? "Excellent" : m.pf >= 1.5 ? "Strong" : m.pf >= 1 ? "Profitable" : "Losing";
  const markerPct = Math.min(100, (m.pf / 3) * 100);
  const totalMag = m.grossWin + m.grossLoss || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "10px" }}>
          <span style={{ fontWeight: 800, fontSize: "38px", lineHeight: 1, letterSpacing: "-0.03em", color: pfColor, fontVariantNumeric: "tabular-nums" }}>{m.pf.toFixed(2)}</span>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ color: T.text3, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700 }}>Profit Factor</span>
            <span style={{ color: pfColor, fontSize: "12px", fontWeight: 700 }}>{pfLabel}</span>
          </div>
        </div>
        <div style={{ position: "relative", height: "8px", borderRadius: "5px", background: "linear-gradient(90deg, #ef4444, #f59e0b 40%, #22c55e 75%)", opacity: 0.85 }}>
          <div style={{ position: "absolute", top: "-3px", left: `calc(${markerPct}% - 7px)`, width: "14px", height: "14px", borderRadius: "50%", background: "#fff", border: `3px solid ${pfColor}`, boxShadow: "0 2px 8px rgba(0,0,0,0.5)", transition: "left 0.6s cubic-bezier(.22,1,.36,1)" }} />
          <div style={{ position: "absolute", top: "-2px", bottom: "-2px", left: "33.3%", width: "2px", background: "rgba(0,0,0,0.4)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
          <span style={{ color: T.text3, fontSize: "9px" }}>0</span>
          <span style={{ color: T.text3, fontSize: "9px" }}>1.0 BE</span>
          <span style={{ color: T.text3, fontSize: "9px" }}>3+</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
        <div style={{ display: "flex", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
          <div style={{ width: `${(m.grossWin / totalMag) * 100}%`, background: "linear-gradient(90deg, #16a34a, #22c55e)", transformOrigin: "left", animation: "tjGrowX 0.9s cubic-bezier(.22,1,.36,1) both" }} />
          <div style={{ width: `${(m.grossLoss / totalMag) * 100}%`, background: "linear-gradient(90deg, #b91c1c, #ef4444)", transformOrigin: "right", animation: "tjGrowX 0.9s cubic-bezier(.22,1,.36,1) both" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#22c55e", fontSize: "12px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>+{m.grossWin.toFixed(0)}<span style={{ color: T.text3, fontWeight: 500, marginLeft: "4px" }}>gross profit</span></span>
          <span style={{ color: "#ef4444", fontSize: "12px", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}><span style={{ color: T.text3, fontWeight: 500, marginRight: "4px" }}>gross loss</span>-{m.grossLoss.toFixed(0)}</span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: T.itemBg, border: `1px solid ${T.border}`, borderRadius: "10px", padding: "10px 14px" }}>
        <span style={{ color: T.text2, fontSize: "12px", fontWeight: 600 }}>Expectancy <span style={{ color: T.text3, fontWeight: 400 }}>/ trade</span></span>
        <span style={{ color: m.expectancy >= 0 ? "#22c55e" : "#ef4444", fontSize: "16px", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{fmt(m.expectancy)}</span>
      </div>
    </div>
  );
}

// ─── Widget: Trade Frequency ──────────────────────────────────────────────────

function WFrequency({ entries }: { entries: Entry[] }) {
  const bars = useMemo(() => {
    const today = new Date();
    const result: { label: string; key: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      result.push({ label: `${MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, key, count: 0 });
    }
    entries.forEach(e => {
      const d = new Date(e.trade_date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bar = result.find(r => r.key === key);
      if (bar) bar.count++;
    });
    return result;
  }, [entries]);

  const totalTrades = bars.reduce((s, b) => s + b.count, 0);
  const T = useT();
  const maxCount = Math.max(1, ...bars.map(b => b.count));
  const W = 451, H = 100, PB = 30;
  const bSlot = (W - 20) / bars.length;
  const bW = Math.round(bSlot * 0.65);

  return (
    <>
      <div style={{ textAlign: "right", marginBottom: "8px" }}>
        <span style={{ fontSize: "28px", fontWeight: 800, background: "linear-gradient(135deg,#c4b5fd,#8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontVariantNumeric: "tabular-nums" }}>{totalTrades}</span>
        <span style={{ fontSize: "12px", color: T.text3, marginLeft: "4px" }}>total</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H + PB}`} preserveAspectRatio="none" width="100%" height="128" style={{ display: "block" }}>
        <defs>
          <linearGradient id="wgFreqPurple" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#7c3aed" /></linearGradient>
        </defs>
        {bars.map((b, i) => {
          const x = 10 + i * bSlot;
          const h = (b.count / maxCount) * (H - 12);
          return (
            <g key={b.key}>
              {b.count > 0 && (
                <>
                  <rect x={x} y={H - h} width={bW} height={h} rx="4" fill="url(#wgFreqPurple)"
                    style={{ transformBox: "fill-box", transformOrigin: "bottom", animation: `tjBar 0.55s cubic-bezier(.22,1,.36,1) ${i * 45}ms both`, filter: "drop-shadow(0 2px 6px rgba(139,92,246,0.4))" }} />
                  <text x={x + bW / 2} y={H - h - 4} textAnchor="middle" fill="#a78bfa" fontSize="16" fontWeight="700" style={{ animation: `tjFade 0.4s ease ${i * 45 + 250}ms both` }}>{b.count}</text>
                </>
              )}
              <text x={x + bW / 2} y={H + 18} textAnchor="middle" fill={T.svgText} fontSize="14">{b.label}</text>
            </g>
          );
        })}
        <line x1={0} y1={H} x2={W} y2={H} stroke={T.svgLine} strokeWidth="1" />
      </svg>
    </>
  );
}

// ─── Widget: Discipline Score ─────────────────────────────────────────────────

function WDisciplineScore({ entries }: { entries: Entry[] }) {
  const T = useT();

  const score = useMemo(() => {
    if (!entries.length) return null;

    // Rules compliance (40%)
    let rulesScore: number | null = null;
    { let tot = 0, fol = 0;
      entries.forEach(e => {
        const raw = getField(e, "rules followed", "rules");
        if (!raw) return;
        try {
          const arr: { compliant: boolean }[] = JSON.parse(raw);
          arr.forEach(r => { tot++; if (r.compliant) fol++; });
        } catch { /* skip */ }
      });
      if (tot > 0) rulesScore = (fol / tot) * 100;
    }

    // Trading hours (20%) — each trade checked against its OWN journal's window
    let hoursScore: number | null = null;
    { let tot = 0, ins = 0;
      entries.forEach(e => {
        const j = e.journal_templates;
        if (!j?.time_from || !j?.time_to) return;
        const d = new Date(e.trade_date);
        const hh = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
        tot++;
        if (hh >= j.time_from && hh <= j.time_to) ins++;
      });
      if (tot > 0) hoursScore = (ins / tot) * 100;
    }

    // Emotion control (20%)
    const NEG = new Set(["FOMO", "Greedy", "Fearful", "Nervous", "Frustrated"]);
    let emoScore: number | null = null;
    { let tot = 0, ctrl = 0;
      entries.forEach(e => {
        const raw = getField(e, "emotions");
        if (!raw) return;
        try {
          const arr: string[] = JSON.parse(raw);
          if (arr.length > 0) { tot++; if (!arr.some(x => NEG.has(x))) ctrl++; }
        } catch { /* skip */ }
      });
      if (tot > 0) emoScore = (ctrl / tot) * 100;
    }

    // Risk per trade (20%) — running balance per journal, from each journal's starting_balance
    let riskScore: number | null = null;
    { const byJournal = new Map<string, Entry[]>();
      entries.forEach(e => {
        const arr = byJournal.get(e.template_id) ?? [];
        arr.push(e); byJournal.set(e.template_id, arr);
      });
      let tot = 0, ok = 0;
      byJournal.forEach(list => {
        const j = list[0]?.journal_templates;
        if (!j?.risk_per_trade) return;
        let bal = j.starting_balance ?? 0;
        for (const e of [...list].sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime())) {
          const ra = getField(e, "risk amount");
          const p = getPnl(e);
          if (ra && bal > 0) {
            const n = parseFloat(ra);
            if (!isNaN(n) && n > 0) { tot++; if ((n / bal) * 100 <= j.risk_per_trade + 0.5) ok++; }
          }
          if (p !== null) bal += p;
        }
      });
      if (tot > 0) riskScore = (ok / tot) * 100;
    }

    const factors = [{ s: rulesScore, w: 40 }, { s: hoursScore, w: 20 }, { s: emoScore, w: 20 }, { s: riskScore, w: 20 }];
    const avail = factors.filter(f => f.s !== null);
    if (!avail.length) return null;
    const tw = avail.reduce((a, f) => a + f.w, 0);
    return Math.round(avail.reduce((a, f) => a + f.s! * f.w, 0) / tw);
  }, [entries]);

  if (score === null) return <NoData text="Log trades with Rules or Emotions to see Discipline Score" />;

  const zoneColor = (v: number) => v >= 75 ? "#22c55e" : v >= 50 ? "#F59E0B" : "#ef4444";
  const dsColor = zoneColor(score);
  const dsLabel = score >= 75 ? "Good" : score >= 50 ? "Fair" : "Poor";

  // Tick speedometer geometry (270° arc, gap at bottom)
  const gs = 116, gc = 58, Ro = 51, Ri = 40, N = 40, START = 135, SWEEP = 270;
  const ticks = Array.from({ length: N }, (_, k) => {
    const frac = k / (N - 1); const v = frac * 100;
    const rad = ((START + frac * SWEEP) * Math.PI) / 180;
    const cos = Math.cos(rad), sin = Math.sin(rad);
    return { x1: gc + Ri * cos, y1: gc + Ri * sin, x2: gc + Ro * cos, y2: gc + Ro * sin, lit: v <= score, color: zoneColor(v), k };
  });
  const eFrac = score / 100, eRad = ((START + eFrac * SWEEP) * Math.PI) / 180;
  const eR = (Ri + Ro) / 2, ex = gc + eR * Math.cos(eRad), ey = gc + eR * Math.sin(eRad);

  // Factor breakdown (same formulas as the score)
  const raw_rules = entries.reduce((acc, e) => {
    const raw = getField(e, "rules followed", "rules"); if (!raw) return acc;
    try { const arr: { compliant: boolean }[] = JSON.parse(raw); arr.forEach(r => { acc.tot++; if (r.compliant) acc.fol++; }); } catch { /* skip */ }
    return acc;
  }, { tot: 0, fol: 0 });
  const raw_emo = entries.reduce((acc, e) => {
    const raw = getField(e, "emotions"); if (!raw) return acc;
    try { const arr: string[] = JSON.parse(raw); if (arr.length > 0) { acc.tot++; if (!arr.some(x => ["FOMO","Greedy","Fearful","Nervous","Frustrated"].includes(x))) acc.ctrl++; } } catch { /* skip */ }
    return acc;
  }, { tot: 0, ctrl: 0 });
  const raw_hours = entries.reduce((acc, e) => {
    const j = e.journal_templates; if (!j?.time_from || !j?.time_to) return acc;
    const d = new Date(e.trade_date);
    const hh = `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
    acc.tot++; if (hh >= j.time_from && hh <= j.time_to) acc.ins++;
    return acc;
  }, { tot: 0, ins: 0 });
  const raw_risk = (() => {
    const byJournal = new Map<string, Entry[]>();
    entries.forEach(e => { const arr = byJournal.get(e.template_id) ?? []; arr.push(e); byJournal.set(e.template_id, arr); });
    let tot = 0, ok = 0;
    byJournal.forEach(list => {
      const j = list[0]?.journal_templates;
      if (!j?.risk_per_trade) return;
      let bal = j.starting_balance ?? 0;
      for (const e of [...list].sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime())) {
        const ra = getField(e, "risk amount"); const p = getPnl(e);
        if (ra && bal > 0) { const n = parseFloat(ra); if (!isNaN(n) && n > 0) { tot++; if ((n / bal) * 100 <= j.risk_per_trade + 0.5) ok++; } }
        if (p !== null) bal += p;
      }
    });
    return { tot, ok };
  })();
  const factorBars = [
    { label: "Rules", pct: raw_rules.tot > 0 ? Math.round((raw_rules.fol / raw_rules.tot) * 100) : null },
    { label: "Hours", pct: raw_hours.tot > 0 ? Math.round((raw_hours.ins / raw_hours.tot) * 100) : null },
    { label: "Emotions", pct: raw_emo.tot > 0 ? Math.round((raw_emo.ctrl / raw_emo.tot) * 100) : null },
    { label: "Risk", pct: raw_risk.tot > 0 ? Math.round((raw_risk.ok / raw_risk.tot) * 100) : null },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "30px", flexWrap: "wrap" }}>
      {/* Gauge */}
      <div style={{ position: "relative", width: gs, height: gs, flexShrink: 0 }}>
        <svg width={gs} height={gs} viewBox={`0 0 ${gs} ${gs}`} style={{ display: "block", overflow: "visible" }}>
          {ticks.map(t => (
            <line key={t.k} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={t.lit ? t.color : T.border} strokeWidth="2.6" strokeLinecap="round"
              style={{ filter: t.lit ? `drop-shadow(0 0 3px ${t.color}aa)` : "none", animation: `tjTickIn 0.5s ease ${t.k * 22}ms both` }} />
          ))}
          <circle cx={ex} cy={ey} r="7" fill={dsColor} style={{ animation: "tjPulse 2.4s ease-in-out infinite" }} />
          <circle cx={ex} cy={ey} r="4" fill="#fff" stroke={dsColor} strokeWidth="2" style={{ filter: `drop-shadow(0 0 5px ${dsColor})` }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <span style={{ fontWeight: 800, fontSize: "30px", lineHeight: 1, color: T.text1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.03em" }}>{score}</span>
          <span style={{ color: T.text3, fontSize: "9px", marginTop: "2px", fontWeight: 600 }}>/ 100</span>
        </div>
      </div>
      {/* Title + factor breakdown */}
      <div style={{ flex: 1, minWidth: "240px", display: "flex", flexDirection: "column", gap: "11px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: T.text3, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Discipline Score</span>
          <span style={{ color: dsColor, fontSize: "10px", fontWeight: 800, padding: "1px 7px", borderRadius: "5px", background: `${dsColor}1f`, textTransform: "uppercase", letterSpacing: "0.04em" }}>{dsLabel}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "11px 24px" }}>
          {factorBars.map((f, i) => {
            const has = f.pct !== null; const v = has ? f.pct! : 0; const col = has ? zoneColor(v) : T.text3;
            return <GaugeBar key={f.label} label={f.label} valueLabel={has ? `${v}%` : "—"} pct={v} color={col} delay={i * 70} />;
          })}
        </div>
      </div>
    </div>
  );
}

// kept for reference but no longer used in fixed-row layout
/* eslint-disable @typescript-eslint/no-unused-vars */
type ColSpan = 4 | 6 | 8 | 12;

const getColSpan = (id: string, entries: Entry[]): ColSpan => {
  const pnls = entries.map(getPnl).filter((v): v is number => v !== null);

  switch (id) {
    case "kpi-cards":
      // Only 1 metric (Total Trades) when no P&L → half-row; full row otherwise
      return pnls.length === 0 ? 6 : 12;

    case "equity-curve":
      // ≥15 trades with P&L → full width for detail; fewer → wide
      return pnls.length >= 15 ? 12 : 8;

    case "winloss":
      // Donut is always compact – fixed visual size
      return 4;

    case "weekday": {
      const activeDays = new Set(
        entries.filter(e => getPnl(e) !== null)
          .map(e => new Date(e.trade_date).getDay())
      ).size;
      return activeDays >= 4 ? 8 : 6;
    }

    case "monthly-pnl": {
      const today = new Date();
      const activeMonths = new Set(
        entries.filter(e => getPnl(e) !== null).map(e => {
          const d = new Date(e.trade_date);
          const diff = (today.getFullYear() - d.getFullYear()) * 12 + today.getMonth() - d.getMonth();
          return diff >= 0 && diff <= 5 ? e.trade_date.slice(0, 7) : null;
        }).filter(Boolean)
      ).size;
      if (activeMonths >= 4) return 12;
      if (activeMonths >= 2) return 8;
      return 6;
    }

    case "calendar":
      return 12; // 3-month heatmap always needs full width

    case "instrument": {
      const instruments = new Set(
        entries.map(e => getField(e, "instrument", "markt", "market", "asset class")).filter(Boolean)
      ).size;
      return instruments >= 4 ? 6 : 4;
    }

    case "profit-factor":
      return 6; // 2×2 metrics grid – always medium

    case "histogram":
      return 12; // 8 buckets need full width

    case "frequency": {
      const today = new Date();
      const activeMonths = new Set(
        entries.map(e => {
          const d = new Date(e.trade_date);
          const diff = (today.getFullYear() - d.getFullYear()) * 12 + today.getMonth() - d.getMonth();
          return diff >= 0 && diff <= 7 ? e.trade_date.slice(0, 7) : null;
        }).filter(Boolean)
      ).size;
      return activeMonths >= 5 ? 12 : 8;
    }

    default: return 12;
  }
};

// Widget is hidden when it has no meaningful content to show.
// This prevents empty "No data" cards cluttering the layout.
const hasContent = (id: string, entries: Entry[]): boolean => {
  const pnls = entries.map(getPnl).filter((v): v is number => v !== null);
  switch (id) {
    case "kpi-cards":     return true;
    case "equity-curve":  return pnls.length >= 2;
    case "winloss":       return pnls.length >= 1;
    case "weekday":       return pnls.length >= 1;
    case "monthly-pnl":   return pnls.length >= 1;
    case "calendar":      return true;
    case "instrument":    return entries.some(e => getField(e, "instrument", "markt", "market", "asset class") !== null);
    case "profit-factor": return pnls.some(v => v > 0) && pnls.some(v => v < 0);
    case "histogram":         return pnls.length >= 3;
    case "frequency":         return true;
    case "discipline-score":  return entries.length >= 1;
    default:                  return true;
  }
};

// ─── Widget Registry ──────────────────────────────────────────────────────────

interface WidgetDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  dotColor: string;
  defaultOn: boolean;
  component: React.FC<{ entries: Entry[] }>;
}

const WIDGETS: WidgetDef[] = [
  { id: "kpi-cards",     name: "KPI Overview",         desc: "Trades, P&L, Win Rate, Drawdown, Streak and more",   icon: "grid",       dotColor: "#8B5CF6",  defaultOn: true,  component: WKpiCards },
  { id: "equity-curve",  name: "Equity Curve",         desc: "Cumulative P&L across all trades",                   icon: "trendingUp", dotColor: "#8B5CF6",  defaultOn: true,  component: WEquityCurve },
  { id: "winloss",       name: "Win / Loss",           desc: "Wins, Losses and Break-even as donut chart",         icon: "pie",        dotColor: "#8B5CF6",  defaultOn: true,  component: WWinLoss },
  { id: "weekday",       name: "Weekday Performance",  desc: "Average P&L by weekday",                             icon: "bars",       dotColor: "#8B5CF6",  defaultOn: true,  component: WWeekday },
  { id: "monthly-pnl",   name: "Monthly P&L",          desc: "P&L for the last 6 months",                          icon: "bars",       dotColor: "#8B5CF6",  defaultOn: true,  component: WMonthly },
  { id: "frequency",     name: "Trade Frequency",      desc: "Number of trades per month over the last 8 months",  icon: "activity",   dotColor: "#8B5CF6",  defaultOn: true,  component: WFrequency },
  { id: "calendar",      name: "Trade Calendar",       desc: "Heatmap of the last 3 months by daily P&L",          icon: "calendar",   dotColor: "#8B5CF6",  defaultOn: true,  component: WCalendar },
  { id: "instrument",    name: "Instrument Breakdown", desc: "Which markets you trade most frequently",             icon: "search",     dotColor: "#8B5CF6",  defaultOn: true,  component: WInstrument },
  { id: "profit-factor", name: "Profit Factor",        desc: "Profit Factor, Gross Profit/Loss, Expectancy",       icon: "zap",        dotColor: "#8B5CF6",  defaultOn: true,  component: WProfitFactor },
  { id: "discipline-score", name: "Discipline Score",   desc: "Rules, trading hours, emotion control & risk score",   icon: "shield",     dotColor: "#8B5CF6",  defaultOn: true,  component: WDisciplineScore },
  { id: "histogram",     name: "P&L Distribution",     desc: "Frequency distribution of your trade results",       icon: "bars",       dotColor: "#8B5CF6",  defaultOn: false, component: WHistogram },
];

const STORAGE_KEY = "tj-widget-prefs-v3";

// ─── Layout System ────────────────────────────────────────────────────────────
type Layout = "auto" | "wide" | "compact" | "full";
// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      style={{ width: "44px", height: "26px", borderRadius: "13px", backgroundColor: on ? "#8B5CF6" : "#1F2937", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: "4px", left: on ? "22px" : "4px", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#fff", transition: "left 0.2s" }} />
    </button>
  );
}

// ─── Main WidgetGrid ──────────────────────────────────────────────────────────

const THEME_KEY = "tj-dashboard-theme";

export default function WidgetGrid({ entries, isPro = false }: { entries: Entry[]; isPro?: boolean }) {
  const insightResult = useMemo(() => computeInsights(entries), [entries]);
  const [active, setActive] = useState<string[]>(() => WIDGETS.filter(w => w.defaultOn).map(w => w.id));
  const [editOpen, setEditOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setActive(JSON.parse(saved));
      const theme = localStorage.getItem(THEME_KEY);
      if (theme === "light") {
        setDarkMode(false);
        document.documentElement.classList.add("dashboard-light");
      }
    } catch { /* ignore */ }
    setLoaded(true);
    return () => { document.documentElement.classList.remove("dashboard-light"); };
  }, []);

  const toggleTheme = () => {
    setDarkMode(d => {
      const next = !d;
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      if (next) {
        document.documentElement.classList.remove("dashboard-light");
      } else {
        document.documentElement.classList.add("dashboard-light");
      }
      return next;
    });
  };

  const toggle = (id: string) => {
    setActive(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const activeWidgets = useMemo(() => WIDGETS.filter(w => active.includes(w.id)), [active]);

  if (!loaded) return null;

  // Helper: render one widget cell (or empty placeholder if toggled off)
  const cell = (id: string): React.ReactNode => {
    const w = WIDGETS.find(x => x.id === id);
    if (!w || !active.includes(id)) return <div key={id} />;
    return (
      <GlowCard key={id} style={{ padding: W_PAD }}>
        <SectionTitle icon={w.icon}>{w.name}</SectionTitle>
        <LockedWidget locked={!isPro && DASH_LOCKED.has(id)}>
          <w.component entries={entries} />
        </LockedWidget>
      </GlowCard>
    );
  };

  return (
    <ThemeCtx.Provider value={darkMode}>
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      <style>{`
        @keyframes tjCardIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes tjDonut { from { stroke-dashoffset: var(--tj-len); } to { stroke-dashoffset: 0; } }
        @keyframes tjBar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes tjFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tjEqLine { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @keyframes tjGrowX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes tjPulse { 0%,100% { opacity: 0.7; } 50% { opacity: 0.15; } }
        @keyframes tjTickIn { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { [style*="animation"] { animation: none !important; } }
      `}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
        <button
          onClick={toggleTheme}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          style={{ display: "flex", alignItems: "center", gap: "7px", padding: "7px 14px", borderRadius: "10px", border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.1)"}`, backgroundColor: "transparent", color: darkMode ? "#9CA3AF" : "#6B7280", cursor: "pointer", fontSize: "13px" }}>
          {darkMode
            ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>}
          {darkMode ? "Light" : "Dark"}
        </button>
        <button
          onClick={() => setEditOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "7px", padding: "7px 14px", borderRadius: "10px", border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.1)"}`, backgroundColor: "transparent", color: darkMode ? "#9CA3AF" : "#6B7280", cursor: "pointer", fontSize: "13px" }}>
          <Icon name="grid" size={14} color={darkMode ? "#9CA3AF" : "#6B7280"} /> Edit Widgets
        </button>
      </div>

      {entries.length === 0 && (
        <GlowCard style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "52px", height: "52px", borderRadius: "14px", background: darkMode ? "linear-gradient(145deg, #0f0f18, #090909)" : "#fff", border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`, marginBottom: "14px" }}>
            <Icon name="bars" size={24} color="#6B7280" />
          </div>
          <p style={{ color: "#6B7280", fontSize: "14px", fontWeight: 500 }}>No trades yet</p>
          <p style={{ color: darkMode ? "#374151" : "#D1D5DB", fontSize: "13px", marginTop: "4px" }}>Statistics will appear once you add trades.</p>
        </GlowCard>
      )}

      {/* Performance Insights (Pro-gated payoff) */}
      {entries.length > 0 && (
        <InsightsPanel result={insightResult} isPro={isPro} isDark={darkMode} />
      )}

      {/* Row 1: Discipline Score (full width) */}
      {entries.length > 0 && active.includes("discipline-score") && (
        <GlowCard style={{ padding: W_PAD }}>
          {(() => { const w = WIDGETS.find(x => x.id === "discipline-score")!; return <><SectionTitle icon={w.icon}>{w.name}</SectionTitle><LockedWidget locked={!isPro}><WDisciplineScore entries={entries} /></LockedWidget></>; })()}
        </GlowCard>
      )}

      {/* Row 2: KPI (1fr) | Equity Curve (2fr) | Win/Loss (1fr) */}
      {entries.length > 0 && (
        <div className="wg-row-3col">
          {cell("kpi-cards")}{cell("equity-curve")}{cell("winloss")}
        </div>
      )}

      {/* Row 3: Weekday | Monthly P&L | Frequency */}
      {entries.length > 0 && (
        <div className="wg-row-equal">
          {cell("weekday")}{cell("monthly-pnl")}{cell("frequency")}
        </div>
      )}

      {/* Row 4: Instrument (1fr) | Calendar + Profit Factor stacked (3fr) */}
      {entries.length > 0 && (() => {
        const showInstrument = active.includes("instrument");
        return (
          <div className="wg-row-sidebar" style={{ gridTemplateColumns: showInstrument ? "1fr 3fr" : "1fr" }}>
            {showInstrument && cell("instrument")}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {cell("calendar")}
              {cell("profit-factor")}
            </div>
          </div>
        );
      })()}

      {/* Row 5: Histogram (full width, only if active) */}
      {entries.length > 0 && active.includes("histogram") && (
        <GlowCard style={{ padding: W_PAD }}>
          {(() => { const w = WIDGETS.find(x => x.id === "histogram")!; return <><SectionTitle icon={w.icon}>{w.name}</SectionTitle><LockedWidget locked={false}><WHistogram entries={entries} /></LockedWidget></>; })()}
        </GlowCard>
      )}

      {/* Edit Panel Overlay */}
      {editOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex" }} onClick={() => setEditOpen(false)}>
          {/* Backdrop */}
          <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} />
          {/* Panel */}
          <div
            style={{ width: "360px", maxWidth: "95vw", background: darkMode ? "linear-gradient(180deg, #0a0614, #050505)" : "linear-gradient(180deg, #f8f8fc, #f0f0f8)", borderLeft: `1px solid ${darkMode ? "rgba(139,92,246,0.15)" : "rgba(139,92,246,0.2)"}`, display: "flex", flexDirection: "column", height: "100%" }}
            onClick={e => e.stopPropagation()}>

            {/* Panel Header */}
            <div style={{ padding: "24px", borderBottom: `1px solid ${darkMode ? "#1F2937" : "#E5E7EB"}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <h3 style={{ color: darkMode ? "#F9FAFB" : "#111827", fontWeight: 700, fontSize: "16px", margin: 0 }}>Edit Statistics</h3>
                <p style={{ color: "#6B7280", fontSize: "12px", marginTop: "4px" }}>{active.length} active</p>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                style={{ padding: "8px 18px", borderRadius: "10px", border: "none", backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>
                Done
              </button>
            </div>

            {/* Widget List */}
            <div style={{ flex: 1, overflowY: "scroll", padding: "16px" }}>

              {/* Active */}
              <p style={{ color: "#6B7280", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px", paddingLeft: "4px" }}>
                Active
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
                {WIDGETS.filter(w => active.includes(w.id)).map(w => (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: darkMode ? "linear-gradient(145deg, #0f0f18, #090909)" : "linear-gradient(145deg, #f9fafb, #f3f4f6)", borderRadius: "12px", border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}` }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: darkMode ? "linear-gradient(145deg, #110c1e, #080808)" : "#fff", border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={w.icon} size={16} color={darkMode ? "#9CA3AF" : "#4B5563"} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: darkMode ? "#F9FAFB" : "#111827", fontSize: "13px", fontWeight: 600 }}>{w.name}</p>
                      <p style={{ color: darkMode ? "#4B5563" : "#9CA3AF", fontSize: "11px", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.desc}</p>
                    </div>
                    <Toggle on={true} onChange={() => toggle(w.id)} />
                  </div>
                ))}
              </div>

              {/* Available */}
              {WIDGETS.some(w => !active.includes(w.id)) && (
                <>
                  <p style={{ color: "#6B7280", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px", paddingLeft: "4px" }}>
                    Available
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {WIDGETS.filter(w => !active.includes(w.id)).map(w => (
                      <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: darkMode ? "linear-gradient(145deg, #0f0f18, #090909)" : "linear-gradient(145deg, #f9fafb, #f3f4f6)", borderRadius: "12px", border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`, opacity: 0.7 }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: darkMode ? "linear-gradient(145deg, #110c1e, #080808)" : "#fff", border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={w.icon} size={16} color={darkMode ? "#9CA3AF" : "#4B5563"} /></div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: darkMode ? "#9CA3AF" : "#4B5563", fontSize: "13px", fontWeight: 600 }}>{w.name}</p>
                          <p style={{ color: darkMode ? "#374151" : "#D1D5DB", fontSize: "11px", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.desc}</p>
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
    </ThemeCtx.Provider>
  );
}
