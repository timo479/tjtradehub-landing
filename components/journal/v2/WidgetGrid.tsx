"use client";
import React, { useEffect, useMemo, useState } from "react";
import { getMarketHoliday } from "@/lib/market-holidays";

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
  journal_templates: { id: string; name: string; version: number };
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
        transition: "border-color 0.25s, box-shadow 0.25s",
        position: "relative" as const,
        overflow: "hidden" as const,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children, color = "#8B5CF6" }: { children: React.ReactNode; color?: string }) {
  const T = useT();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "16px" }}>
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
      <p style={{ color: T.text3, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{children}</p>
    </div>
  );
}

function NoData({ text = "At least 1 trade with P&L needed" }: { text?: string }) {
  const T = useT();
  return <div style={{ color: T.noData, fontSize: "13px", textAlign: "center", padding: "32px 0" }}>{text}</div>;
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

  const items = [
    { label: "Total Trades", value: String(entries.length), color: "#F9FAFB" },
    ...(s.hasPnl ? [
      { label: "Total P&L", value: fmt(s.total), color: s.total >= 0 ? "#22c55e" : "#ef4444" },
      { label: "Win Rate", value: `${s.pnlCount ? Math.round((s.wins / s.pnlCount) * 100) : 0}%`, color: s.wins / (s.pnlCount || 1) >= 0.5 ? "#22c55e" : "#ef4444", sub: `${s.wins}W · ${s.losses}L` },
      { label: "Avg P&L / Trade", value: fmt(s.avg), color: s.avg >= 0 ? "#22c55e" : "#ef4444" },
      { label: "Best Trade", value: fmt(s.best), color: "#22c55e" },
      { label: "Worst Trade", value: fmt(s.worst), color: "#ef4444" },
      { label: "Max. Drawdown", value: `-${s.dd.toFixed(2)}`, color: "#F59E0B" },
      { label: "Current Streak", value: `${s.streak}x ${s.sType === "win" ? "Win" : "Loss"}`, color: s.sType === "win" ? "#22c55e" : "#ef4444" },
    ] : []),
  ];

  const T = useT();
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
      {items.map(item => (
        <div key={item.label}>
          <p style={{ color: T.text3, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: "4px" }}>{item.label}</p>
          <p style={{ color: item.color, fontWeight: 800, fontSize: "18px", lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{item.value}</p>
          {"sub" in item && item.sub && <p style={{ color: T.text3, fontSize: "11px", marginTop: "3px" }}>{item.sub}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── Widget: Equity Curve ─────────────────────────────────────────────────────

function WEquityCurve({ entries }: { entries: Entry[] }) {
  const data = useMemo(() => {
    const sorted = [...entries].filter(e => getPnl(e) !== null)
      .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
    let cum = 0;
    return sorted.map(e => { cum += getPnl(e)!; return cum; });
  }, [entries]);

  if (data.length < 2) return <NoData />;

  const T = useT();
  const W = 900, H = 215, PL = 60, PR = 14, PT = 16, PB = 28;
  const cW = W - PL - PR, cH = H - PT - PB;
  const min = Math.min(0, ...data), max = Math.max(0, ...data), range = max - min || 1;
  const sx = (i: number) => PL + (i / (data.length - 1)) * cW;
  const sy = (v: number) => PT + cH - ((v - min) / range) * cH;
  const z = sy(0);
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  const fill = `${line} L${sx(data.length - 1).toFixed(1)},${z.toFixed(1)} L${PL},${z.toFixed(1)} Z`;
  const last = data[data.length - 1];
  const color = "#8B5CF6";
  const yLabels = [min, (min + max) / 2, max];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height="215" style={{ display: "block" }}>
      <defs>
        <linearGradient id={`eq-g-${data.length}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {yLabels.map((v, i) => <line key={i} x1={PL} y1={sy(v)} x2={W - PR} y2={sy(v)} stroke={T.svgLine} strokeWidth="1" strokeDasharray="4,4" />)}
      <line x1={PL} y1={z} x2={W - PR} y2={z} stroke={T.text5} strokeWidth="1" />
      <path d={fill} fill={`url(#eq-g-${data.length})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={sx(data.length - 1)} cy={sy(last)} r="4" fill={color} />
      {yLabels.map((v, i) => <text key={i} x={PL - 6} y={sy(v) + 4} textAnchor="end" fill={T.text4} fontSize="10">{v.toFixed(0)}</text>)}
    </svg>
  );
}

// ─── Widget: Win/Loss Donut ───────────────────────────────────────────────────

function WWinLoss({ entries }: { entries: Entry[] }) {
  const { wins, losses, total } = useMemo(() => {
    const pnls = entries.map(e => getPnl(e)).filter(v => v !== null) as number[];
    return { wins: pnls.filter(v => v > 0).length, losses: pnls.filter(v => v < 0).length, total: pnls.length };
  }, [entries]);

  if (!total) return <NoData />;
  const T = useT();
  const pct = wins / total;
  const R = 48, CX = 65, CY = 65, sw = 14, circ = 2 * Math.PI * R;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
      <div style={{ position: "relative", width: "130px", height: "130px", flexShrink: 0 }}>
        <svg width="130" height="130" viewBox="0 0 130 130" style={{ display: "block" }}>
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(239,68,68,0.2)" strokeWidth={sw} />
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#22c55e" strokeWidth={sw}
            strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
            transform={`rotate(-90 ${CX} ${CY})`} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <span style={{ fontSize: "24px", fontWeight: 800, color: T.text1, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{Math.round(pct * 100)}%</span>
          <span style={{ fontSize: "10px", color: T.text3, marginTop: "2px" }}>Win Rate</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {[
          { dot: "#22c55e", label: "Wins", count: wins },
          { dot: "#ef4444", label: "Losses", count: losses },
          { dot: "#64748b", label: "Break-even", count: total - wins - losses },
        ].map(x => (
          <div key={x.label} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: x.dot, flexShrink: 0 }} />
            <span style={{ fontSize: "13px", color: T.text2, flex: 1 }}>{x.label}</span>
            <strong style={{ color: T.text1, fontWeight: 700, paddingLeft: "12px" }}>{x.count}</strong>
          </div>
        ))}
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
      {bars.map((b, i) => {
        const x = 8 + i * bSlot + (bSlot - bW) / 2;
        const h = b.avg >= 0 ? (Math.abs(b.avg) / maxAbs) * maxPos : (Math.abs(b.avg) / maxAbs) * maxNeg;
        const color = b.avg >= 0 ? "#22c55e" : "#ef4444";
        return (
          <g key={b.label}>
            {i === 0 && <line x1={0} y1={mid} x2={W} y2={mid} stroke={T.svgLine} strokeWidth="1" />}
            {b.count > 0 && <rect x={x} y={b.avg >= 0 ? mid - h : mid} width={bW} height={Math.max(h, 2)} rx="3" fill={color} opacity="0.8" />}
            {b.count > 0 && <text x={x + bW / 2} y={b.avg >= 0 ? mid - h - 3 : mid + h + 13} textAnchor="middle" fill={color} fontSize="17" fontWeight="700">{b.avg.toFixed(1)}</text>}
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
      {bars.map((b, i) => {
        const x = 14 + i * bSlot;
        const h = b.total >= 0 ? (Math.abs(b.total) / maxAbs) * maxPos : (Math.abs(b.total) / maxAbs) * maxNeg;
        const color = b.total >= 0 ? "#22c55e" : "#ef4444";
        return (
          <g key={b.key}>
            {i === 0 && <line x1={0} y1={mid} x2={W} y2={mid} stroke={T.svgLine} strokeWidth="1" />}
            {b.count > 0 && <rect x={x} y={b.total >= 0 ? mid - h : mid} width={bW} height={Math.max(h, 2)} rx="4" fill={color} opacity="0.75" />}
            {b.count > 0 && <text x={x + bW / 2} y={b.total >= 0 ? mid - h - 3 : mid + h + 13} textAnchor="middle" fill={color} fontSize="16" fontWeight="700">{b.total >= 0 ? "+" : ""}{b.total.toFixed(0)}</text>}
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

  const getCellStyle = (key: string, dayOfWeek: number): { bg: string; border: string; color: string; label?: string } => {
    const trade = pnlByDate[key];
    const holiday = getMarketHoliday(key);
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Sat=5, Sun=6 (0=Mon offset)

    if (trade) {
      if (trade.pnl > 0) return { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.2)", color: "#22c55e" };
      if (trade.pnl < 0) return { bg: "rgba(239,68,68,0.12)", border: "rgba(239,68,68,0.2)", color: "#ef4444" };
      return { bg: "rgba(255,255,255,0.04)", border: "transparent", color: "#64748b" };
    }
    if (holiday) return { bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.4)", color: "#fb923c", label: "CLOSED" };
    if (isWeekend) return { bg: "rgba(255,255,255,0.02)", border: "transparent", color: "#1F2937" };
    return { bg: "rgba(255,255,255,0.04)", border: "transparent", color: "#64748b" };
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "20px", flexWrap: "nowrap" }}>
        {months.map(({ y, m }) => {
          const first = new Date(y, m, 1);
          const days = new Date(y, m + 1, 0).getDate();
          let off = first.getDay() - 1; if (off < 0) off = 6;
          const cells = [...Array(off).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
          while (cells.length % 7 !== 0) cells.push(null);
          return (
            <div key={`${y}-${m}`} style={{ flex: "1 1 0", minWidth: 0 }}>
              <p style={{ color: T.text2, fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>{MONTHS_SHORT[m]} {y}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "2px" }}>
                {DAYS_SHORT.map(d => <div key={d} style={{ textAlign: "center", color: T.text5, fontSize: "9px" }}>{d}</div>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayOfWeek = i % 7;
                  const trade = pnlByDate[key];
                  const holiday = getMarketHoliday(key);
                  const isToday = today.getDate() === day && today.getMonth() === m && today.getFullYear() === y;
                  const { bg, border, color, label } = getCellStyle(key, dayOfWeek);
                  const titleText = trade
                    ? `${trade.count} Trade${trade.count > 1 ? "s" : ""} · ${fmt(trade.pnl)}`
                    : holiday ?? String(day);
                  return (
                    <div key={i} title={titleText} style={{
                      aspectRatio: "1", borderRadius: "3px", backgroundColor: bg,
                      border: isToday ? "1px solid #8B5CF6" : `1px solid ${border}`,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      fontSize: "8px", color,
                    }}>
                      <span>{day}</span>
                      {label && <span style={{ fontSize: "6px", fontWeight: 700, lineHeight: 1 }}>{label}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "14px", marginTop: "12px", flexWrap: "wrap" }}>
        {[
          { c: "rgba(34,197,94,0.6)", l: "Positive" },
          { c: "rgba(239,68,68,0.6)", l: "Negative" },
          { c: "rgba(107,114,128,0.3)", l: "Break-even" },
          { c: "#0d1117", l: "No Trade" },
          { c: "rgba(251,146,60,0.12)", l: "Market Closed", border: "rgba(251,146,60,0.4)" },
        ].map(x => (
          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: x.c, border: `1px solid ${"border" in x ? x.border : "#1F2937"}` }} />
            <span style={{ color: T.text4, fontSize: "11px" }}>{x.l}</span>
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
                <rect x={x} y={H - h} width={bW} height={h} rx="4" fill={barColor} opacity="0.75" />
                <text x={x + bW / 2} y={H - h - 4} textAnchor="middle" fill={barColor} fontSize="10" fontWeight="600">{b.count}</text>
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
          <div style={{ height: "6px", backgroundColor: T.barTrack, borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${(count / maxVal) * 100}%`, backgroundColor: colors[i % colors.length], borderRadius: "3px", transition: "width 0.3s" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Widget: Profit Factor ────────────────────────────────────────────────────

function WProfitFactor({ entries }: { entries: Entry[] }) {
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

  const T = useT();
  const metrics = [
    { label: "Profit Factor", value: m.pf.toFixed(2), color: m.pf >= 1.5 ? "#22c55e" : m.pf >= 1 ? "#F59E0B" : "#ef4444" },
    { label: "Gross Profit", value: fmt(m.grossWin), color: "#22c55e" },
    { label: "Gross Loss", value: `-${m.grossLoss.toFixed(2)}`, color: "#ef4444" },
    { label: "Expectancy", value: fmt(m.expectancy), color: m.expectancy >= 0 ? "#22c55e" : "#ef4444" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "12px" }}>
      {metrics.map(x => (
        <div key={x.label}>
          <p style={{ color: T.text3, fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: "4px" }}>{x.label}</p>
          <p style={{ color: x.color, fontWeight: 800, fontSize: "18px", lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{x.value}</p>
        </div>
      ))}
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
        {bars.map((b, i) => {
          const x = 10 + i * bSlot;
          const h = (b.count / maxCount) * (H - 12);
          return (
            <g key={b.key}>
              {b.count > 0 && (
                <>
                  <rect x={x} y={H - h} width={bW} height={h} rx="4" fill="#8B5CF6" opacity="0.7" />
                  <text x={x + bW / 2} y={H - h - 4} textAnchor="middle" fill="#8B5CF6" fontSize="16" fontWeight="700">{b.count}</text>
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

    // Rules compliance
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

    // Emotion control
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

    const factors = [{ s: rulesScore, w: 60 }, { s: emoScore, w: 40 }];
    const avail = factors.filter(f => f.s !== null);
    if (!avail.length) return null;
    const tw = avail.reduce((a, f) => a + f.w, 0);
    return Math.round(avail.reduce((a, f) => a + f.s! * f.w, 0) / tw);
  }, [entries]);

  if (score === null) return <NoData text="Log trades with Rules or Emotions to see Discipline Score" />;

  const sz = 120, R = 42, cx = 60, cy = 60, sw = 10;
  const circ = 2 * Math.PI * R;
  const track = circ * 0.75;
  const filled = track * (score / 100);
  const label = score >= 75 ? "Good" : score >= 50 ? "Fair" : "Poor";
  const labelColor = score >= 75 ? "#22c55e" : score >= 50 ? "#F59E0B" : "#ef4444";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
        <div style={{ position: "relative", width: sz, height: sz }}>
          <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}>
            <defs>
              <linearGradient id="ds-grad-db" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
            <circle cx={cx} cy={cy} r={R} fill="none" stroke={T.border} strokeWidth={sw}
              strokeDasharray={`${track.toFixed(2)} ${(circ - track).toFixed(2)}`}
              transform={`rotate(135 ${cx} ${cy})`} strokeLinecap="round" />
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="url(#ds-grad-db)" strokeWidth={sw}
              strokeDasharray={`${filled.toFixed(2)} ${(circ - filled).toFixed(2)}`}
              transform={`rotate(135 ${cx} ${cy})`} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontWeight: 800, fontSize: "28px", lineHeight: 1, background: "linear-gradient(135deg, #c4b5fd, #06b6d4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{score}</span>
            <span style={{ color: T.text4, fontSize: "10px", marginTop: "1px" }}>/100</span>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ color: T.text3, fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Discipline Score</div>
          <div style={{ color: labelColor, fontSize: "12px", fontWeight: 600, marginTop: "2px" }}>{label}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", flex: 1 }}>
        {(() => {
          const raw_rules = entries.reduce((acc, e) => {
            const raw = getField(e, "rules followed", "rules");
            if (!raw) return acc;
            try { const arr: { compliant: boolean }[] = JSON.parse(raw); arr.forEach(r => { acc.tot++; if (r.compliant) acc.fol++; }); } catch { /* skip */ }
            return acc;
          }, { tot: 0, fol: 0 });
          const raw_emo = entries.reduce((acc, e) => {
            const raw = getField(e, "emotions");
            if (!raw) return acc;
            try { const arr: string[] = JSON.parse(raw); if (arr.length > 0) { acc.tot++; if (!arr.some(x => ["FOMO","Greedy","Fearful","Nervous","Frustrated"].includes(x))) acc.ctrl++; } } catch { /* skip */ }
            return acc;
          }, { tot: 0, ctrl: 0 });

          const bars = [
            { label: "Rules Followed", pct: raw_rules.tot > 0 ? Math.round((raw_rules.fol / raw_rules.tot) * 100) : null, color: "#22c55e" },
            { label: "Emotion Control", pct: raw_emo.tot > 0 ? Math.round((raw_emo.ctrl / raw_emo.tot) * 100) : null, color: "#8B5CF6" },
          ];

          return bars.map(b => (
            <div key={b.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                <span style={{ color: T.text2, fontSize: "12px" }}>{b.label}</span>
                <span style={{ color: b.pct !== null ? b.color : T.text4, fontSize: "12px", fontWeight: 600 }}>{b.pct !== null ? `${b.pct}%` : "—"}</span>
              </div>
              <div style={{ height: "6px", backgroundColor: T.barTrack, borderRadius: "3px", overflow: "hidden" }}>
                {b.pct !== null && <div style={{ height: "100%", width: `${b.pct}%`, backgroundColor: b.color, borderRadius: "3px", opacity: 0.8 }} />}
              </div>
            </div>
          ));
        })()}
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
  { id: "kpi-cards",     name: "KPI Overview",         desc: "Trades, P&L, Win Rate, Drawdown, Streak and more",   icon: "📊", dotColor: "#22c55e",  defaultOn: true,  component: WKpiCards },
  { id: "equity-curve",  name: "Equity Curve",         desc: "Cumulative P&L across all trades",                   icon: "📈", dotColor: "#8B5CF6",  defaultOn: true,  component: WEquityCurve },
  { id: "winloss",       name: "Win / Loss",           desc: "Wins, Losses and Break-even as donut chart",         icon: "🎯", dotColor: "#60a5fa",  defaultOn: true,  component: WWinLoss },
  { id: "weekday",       name: "Weekday Performance",  desc: "Average P&L by weekday",                             icon: "📅", dotColor: "#8B5CF6",  defaultOn: true,  component: WWeekday },
  { id: "monthly-pnl",   name: "Monthly P&L",          desc: "P&L for the last 6 months",                          icon: "🗓️", dotColor: "#22c55e",  defaultOn: true,  component: WMonthly },
  { id: "frequency",     name: "Trade Frequency",      desc: "Number of trades per month over the last 8 months",  icon: "🔢", dotColor: "#60a5fa",  defaultOn: true,  component: WFrequency },
  { id: "calendar",      name: "Trade Calendar",       desc: "Heatmap of the last 3 months by daily P&L",          icon: "🗓️", dotColor: "#f59e0b",  defaultOn: true,  component: WCalendar },
  { id: "instrument",    name: "Instrument Breakdown", desc: "Which markets you trade most frequently",             icon: "🔍", dotColor: "#60a5fa",  defaultOn: true,  component: WInstrument },
  { id: "profit-factor", name: "Profit Factor",        desc: "Profit Factor, Gross Profit/Loss, Expectancy",       icon: "⚡", dotColor: "#8B5CF6",  defaultOn: true,  component: WProfitFactor },
  { id: "discipline-score", name: "Discipline Score",   desc: "Rules compliance and emotion control score",         icon: "🎯", dotColor: "#06b6d4",  defaultOn: true,  component: WDisciplineScore },
  { id: "histogram",     name: "P&L Distribution",     desc: "Frequency distribution of your trade results",       icon: "📉", dotColor: "#ef4444",  defaultOn: false, component: WHistogram },
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

export default function WidgetGrid({ entries }: { entries: Entry[] }) {
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
        <SectionTitle color={w.dotColor}>{w.name}</SectionTitle>
        <w.component entries={entries} />
      </GlowCard>
    );
  };

  return (
    <ThemeCtx.Provider value={darkMode}>
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
        <button
          onClick={toggleTheme}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "10px", border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.1)"}`, backgroundColor: "transparent", color: darkMode ? "#9CA3AF" : "#6B7280", cursor: "pointer", fontSize: "13px" }}>
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
        <button
          onClick={() => setEditOpen(true)}
          style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 14px", borderRadius: "10px", border: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.1)"}`, backgroundColor: "transparent", color: darkMode ? "#9CA3AF" : "#6B7280", cursor: "pointer", fontSize: "13px" }}>
          ⊞ Edit Widgets
        </button>
      </div>

      {entries.length === 0 && (
        <GlowCard style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ fontSize: "32px", marginBottom: "12px" }}>📊</p>
          <p style={{ color: "#6B7280", fontSize: "14px", fontWeight: 500 }}>No trades yet</p>
          <p style={{ color: darkMode ? "#374151" : "#D1D5DB", fontSize: "13px", marginTop: "4px" }}>Statistics will appear once you add trades.</p>
        </GlowCard>
      )}

      {/* Row 1: Discipline Score (full width) */}
      {entries.length > 0 && active.includes("discipline-score") && (
        <GlowCard style={{ padding: W_PAD }}>
          {(() => { const w = WIDGETS.find(x => x.id === "discipline-score")!; return <><SectionTitle color={w.dotColor}>{w.name}</SectionTitle><WDisciplineScore entries={entries} /></>; })()}
        </GlowCard>
      )}

      {/* Row 2: KPI (1fr) | Equity Curve (2fr) | Win/Loss (1fr) */}
      {entries.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: "16px", alignItems: "stretch" }}>
          {cell("kpi-cards")}{cell("equity-curve")}{cell("winloss")}
        </div>
      )}

      {/* Row 3: Weekday | Monthly P&L | Frequency */}
      {entries.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", alignItems: "stretch" }}>
          {cell("weekday")}{cell("monthly-pnl")}{cell("frequency")}
        </div>
      )}

      {/* Row 3: Instrument (1fr) | Calendar + Profit Factor stacked (3fr) */}
      {entries.length > 0 && (() => {
        const showInstrument = active.includes("instrument");
        return (
          <div style={{ display: "grid", gridTemplateColumns: showInstrument ? "1fr 3fr" : "1fr", gap: "16px", alignItems: "start" }}>
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
          {(() => { const w = WIDGETS.find(x => x.id === "histogram")!; return <><SectionTitle color={w.dotColor}>{w.name}</SectionTitle><WHistogram entries={entries} /></>; })()}
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
                    <span style={{ fontSize: "20px", flexShrink: 0 }}>{w.icon}</span>
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
                        <span style={{ fontSize: "20px", flexShrink: 0 }}>{w.icon}</span>
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
