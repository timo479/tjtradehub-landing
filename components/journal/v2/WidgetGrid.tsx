"use client";
import React, { useEffect, useMemo, useState } from "react";
import { getMarketHoliday } from "@/lib/market-holidays";

// ─── Design Tokens ────────────────────────────────────────────────────────────
// Spacing: 8 · 12 · 16 · 24 · 32px  (strict 8px grid)
// colSpan: 4=small · 5–8=medium · 12=large
const PADDING: Record<string, string> = {
  sm: "16px 16px",   // colSpan 4   → compact KPI / donut
  md: "16px 24px",   // colSpan 5–8 → charts
  lg: "24px 24px",   // colSpan 12  → full-width panels
};
const getPadding = (colSpan: number) =>
  colSpan <= 4 ? PADDING.sm : colSpan <= 8 ? PADDING.md : PADDING.lg;

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

function GlowCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#0c0f16",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "14px",
        transition: "box-shadow 0.25s ease",
        boxShadow: hovered
          ? "0 4px 24px rgba(0,0,0,0.45)"
          : "0 2px 10px rgba(0,0,0,0.3)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
      <div style={{ width: "8px", height: "8px", borderRadius: "2px", backgroundColor: "#8B5CF6", flexShrink: 0 }} />
      <p style={{ color: "#D1D5DB", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{children}</p>
    </div>
  );
}

function NoData({ text = "At least 1 trade with P&L needed" }: { text?: string }) {
  return <div style={{ color: "#374151", fontSize: "13px", textAlign: "center", padding: "32px 0" }}>{text}</div>;
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

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: "12px" }}>
      {items.map(item => (
        <div key={item.label} style={{
          background: "#080b10",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: "10px",
          padding: "12px 16px",
        }}>
          <p style={{ color: "#6B7280", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: "8px" }}>{item.label}</p>
          <p style={{ color: item.color, fontWeight: 800, fontSize: "22px", lineHeight: 1, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.01em" }}>{item.value}</p>
          {"sub" in item && item.sub && <p style={{ color: "#4B5563", fontSize: "11px", marginTop: "4px" }}>{item.sub}</p>}
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

  const W = 600, H = 160, PL = 48, PR = 14, PT = 12, PB = 24;
  const cW = W - PL - PR, cH = H - PT - PB;
  const min = Math.min(0, ...data), max = Math.max(0, ...data), range = max - min || 1;
  const sx = (i: number) => PL + (i / (data.length - 1)) * cW;
  const sy = (v: number) => PT + cH - ((v - min) / range) * cH;
  const z = sy(0);
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  const fill = `${line} L${sx(data.length - 1).toFixed(1)},${z.toFixed(1)} L${PL},${z.toFixed(1)} Z`;
  const last = data[data.length - 1];
  const color = last >= 0 ? "#22c55e" : "#ef4444";
  const yLabels = [min, (min + max) / 2, max];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id={`eq-g-${data.length}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {yLabels.map((v, i) => <line key={i} x1={PL} y1={sy(v)} x2={W - PR} y2={sy(v)} stroke="#1F2937" strokeWidth="1" strokeDasharray="4,4" />)}
      <line x1={PL} y1={z} x2={W - PR} y2={z} stroke="#374151" strokeWidth="1" />
      <path d={fill} fill={`url(#eq-g-${data.length})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={sx(data.length - 1)} cy={sy(last)} r="4" fill={color} />
      {yLabels.map((v, i) => <text key={i} x={PL - 6} y={sy(v) + 4} textAnchor="end" fill="#4B5563" fontSize="10">{v.toFixed(0)}</text>)}
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
  const pct = wins / total;
  const R = 40, CX = 56, CY = 56, sw = 13, circ = 2 * Math.PI * R;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
      <svg viewBox="0 0 112 112" style={{ width: "130px", height: "130px" }}>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#ef4444" strokeWidth={sw} opacity="0.2" />
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#22c55e" strokeWidth={sw}
          strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`}
          transform={`rotate(-90 ${CX} ${CY})`} />
        <text x={CX} y={CY - 4} textAnchor="middle" fill="#F9FAFB" fontSize="15" fontWeight="700">{Math.round(pct * 100)}%</text>
        <text x={CX} y={CY + 12} textAnchor="middle" fill="#6B7280" fontSize="9">Win Rate</text>
      </svg>
      <div style={{ display: "flex", gap: "16px" }}>
        {[{ c: "#22c55e", l: `${wins} Wins` }, { c: "#ef4444", l: `${losses} Losses` }, { c: "#374151", l: `${total - wins - losses} Break-even` }].map(x => (
          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "2px", backgroundColor: x.c }} />
            <span style={{ color: "#9CA3AF", fontSize: "12px" }}>{x.l}</span>
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

  const maxAbs = Math.max(1, ...bars.map(b => Math.abs(b.avg)));
  const PT = 14, BAR = 80, PB = 24;
  const bW = 38, gap = 14, tW = bars.length * (bW + gap) - gap + 16;
  const mid = PT + BAR * 0.72;
  const maxPos = BAR * 0.72 - 2;
  const maxNeg = BAR * 0.28 - 2;

  return (
    <svg viewBox={`0 0 ${tW} ${PT + BAR + PB}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {bars.map((b, i) => {
        const x = i * (bW + gap) + 8;
        const h = b.avg >= 0
          ? (Math.abs(b.avg) / maxAbs) * maxPos
          : (Math.abs(b.avg) / maxAbs) * maxNeg;
        const color = b.avg >= 0 ? "#22c55e" : "#ef4444";
        const labelY = b.avg >= 0 ? mid - h - 3 : mid + h + 9;
        return (
          <g key={b.label}>
            {i === 0 && <line x1={0} y1={mid} x2={tW} y2={mid} stroke="#1F2937" strokeWidth="1" />}
            {b.count > 0 && <rect x={x} y={b.avg >= 0 ? mid - h : mid} width={bW} height={Math.max(h, 2)} rx="3" fill={color} opacity="0.8" />}
            {b.count > 0 && <text x={x + bW / 2} y={labelY} textAnchor="middle" fill={color} fontSize="8" fontWeight="600">{b.avg.toFixed(1)}</text>}
            <text x={x + bW / 2} y={PT + BAR + 12} textAnchor="middle" fill="#6B7280" fontSize="9">{b.label}</text>
            {b.count > 0 && <text x={x + bW / 2} y={PT + BAR + 22} textAnchor="middle" fill="#374151" fontSize="7">{b.count}x</text>}
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

  const maxAbs = Math.max(1, ...bars.map(b => Math.abs(b.total)));
  const PT = 14, BAR = 80, PB = 24;
  const bW = 44, gap = 13, tW = bars.length * (bW + gap) - gap + 28;
  const mid = PT + BAR * 0.72;
  const maxPos = BAR * 0.72 - 2;
  const maxNeg = BAR * 0.28 - 2;

  return (
    <svg viewBox={`0 0 ${tW} ${PT + BAR + PB}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {bars.map((b, i) => {
        const x = i * (bW + gap) + 14;
        const h = b.total >= 0
          ? (Math.abs(b.total) / maxAbs) * maxPos
          : (Math.abs(b.total) / maxAbs) * maxNeg;
        const color = b.total >= 0 ? "#22c55e" : "#ef4444";
        const labelY = b.total >= 0 ? mid - h - 3 : mid + h + 9;
        return (
          <g key={b.key}>
            {i === 0 && <line x1={0} y1={mid} x2={tW} y2={mid} stroke="#1F2937" strokeWidth="1" />}
            {b.count > 0 && <rect x={x} y={b.total >= 0 ? mid - h : mid} width={bW} height={Math.max(h, 2)} rx="4" fill={color} opacity="0.75" />}
            {b.count > 0 && (
              <text x={x + bW / 2} y={labelY} textAnchor="middle" fill={color} fontSize="7" fontWeight="600">
                {b.total >= 0 ? "+" : ""}{b.total.toFixed(0)}
              </text>
            )}
            <text x={x + bW / 2} y={PT + BAR + 12} textAnchor="middle" fill="#6B7280" fontSize="8">{b.label}</text>
            {b.count > 0 && <text x={x + bW / 2} y={PT + BAR + 21} textAnchor="middle" fill="#374151" fontSize="7">{b.count}tr</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Widget: Trade Calendar ───────────────────────────────────────────────────

function WCalendar({ entries }: { entries: Entry[] }) {
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
      if (trade.pnl > 0) return { bg: `rgba(34,197,94,${Math.min(0.85, 0.3 + trade.pnl / 200)})`, border: "transparent", color: "#F9FAFB" };
      if (trade.pnl < 0) return { bg: `rgba(239,68,68,${Math.min(0.85, 0.3 + Math.abs(trade.pnl) / 200)})`, border: "transparent", color: "#F9FAFB" };
      return { bg: "rgba(107,114,128,0.3)", border: "transparent", color: "#F9FAFB" };
    }
    if (holiday) return { bg: "rgba(251,146,60,0.12)", border: "rgba(251,146,60,0.4)", color: "#fb923c", label: "CLOSED" };
    if (isWeekend) return { bg: "#0a0a0a", border: "transparent", color: "#1F2937" };
    return { bg: "#0d1117", border: "transparent", color: "#374151" };
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {months.map(({ y, m }) => {
          const first = new Date(y, m, 1);
          const days = new Date(y, m + 1, 0).getDate();
          let off = first.getDay() - 1; if (off < 0) off = 6;
          const cells = [...Array(off).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
          while (cells.length % 7 !== 0) cells.push(null);
          return (
            <div key={`${y}-${m}`} style={{ flex: "1 1 200px", minWidth: "180px" }}>
              <p style={{ color: "#9CA3AF", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>{MONTHS_SHORT[m]} {y}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "2px" }}>
                {DAYS_SHORT.map(d => <div key={d} style={{ textAlign: "center", color: "#374151", fontSize: "9px" }}>{d}</div>)}
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
            <span style={{ color: "#4B5563", fontSize: "11px" }}>{x.l}</span>
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
              <text key={li} x={x + bW / 2} y={H + 13 + li * 11} textAnchor="middle" fill="#6B7280" fontSize="8">{line}</text>
            ))}
          </g>
        );
      })}
      <line x1={0} y1={H} x2={tW} y2={H} stroke="#1F2937" strokeWidth="1" />
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

  const maxVal = bars[0][1];
  const colors = ["#8B5CF6", "#6366f1", "#3B82F6", "#22c55e", "#F59E0B", "#ef4444"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {bars.map(([name, count], i) => (
        <div key={name}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ color: "#9CA3AF", fontSize: "12px" }}>{name}</span>
            <span style={{ color: "#6B7280", fontSize: "12px" }}>{count}x</span>
          </div>
          <div style={{ height: "6px", backgroundColor: "#1F2937", borderRadius: "3px", overflow: "hidden" }}>
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

  const metrics = [
    { label: "Profit Factor", value: m.pf.toFixed(2), color: m.pf >= 1.5 ? "#22c55e" : m.pf >= 1 ? "#F59E0B" : "#ef4444" },
    { label: "Gross Profit", value: fmt(m.grossWin), color: "#22c55e" },
    { label: "Gross Loss", value: `-${m.grossLoss.toFixed(2)}`, color: "#ef4444" },
    { label: "Expectancy", value: fmt(m.expectancy), color: m.expectancy >= 0 ? "#22c55e" : "#ef4444" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
      {metrics.map(x => (
        <div key={x.label} style={{
          background: "#080b10",
          border: "1px solid rgba(255,255,255,0.05)",
          borderRadius: "10px",
          padding: "12px 16px",
        }}>
          <p style={{ color: "#6B7280", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: "8px" }}>{x.label}</p>
          <p style={{ color: x.color, fontWeight: 800, fontSize: "22px", lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>{x.value}</p>
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

  const maxCount = Math.max(1, ...bars.map(b => b.count));
  const H = 100, bW = 32, gap = 10, tW = bars.length * (bW + gap) - gap + 20;

  return (
    <svg viewBox={`0 0 ${tW} ${H + 30}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {bars.map((b, i) => {
        const x = i * (bW + gap) + 10;
        const h = (b.count / maxCount) * (H - 12);
        return (
          <g key={b.key}>
            {b.count > 0 && (
              <>
                <rect x={x} y={H - h} width={bW} height={h} rx="4" fill="#8B5CF6" opacity="0.7" />
                <text x={x + bW / 2} y={H - h - 4} textAnchor="middle" fill="#8B5CF6" fontSize="10" fontWeight="600">{b.count}</text>
              </>
            )}
            <text x={x + bW / 2} y={H + 13} textAnchor="middle" fill="#6B7280" fontSize="8">{b.label}</text>
          </g>
        );
      })}
      <line x1={0} y1={H} x2={tW} y2={H} stroke="#1F2937" strokeWidth="1" />
    </svg>
  );
}

// ─── Content-First Layout Engine ─────────────────────────────────────────────
// No fixed layouts. Each widget computes its size from actual data at render time.
//
// Rules:
//   4fr  = Small  → donut chart, instrument list (≤3), no-PnL KPI row
//   6fr  = Medium → ≤3 month bars, weekday bars (≤3 days), profit factor
//   8fr  = Wide   → 4+ weekday bars, 2–4 months, frequency
//   12fr = Full   → equity curve, 5+ months, calendar, histogram, full KPI row

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
    case "histogram":     return pnls.length >= 3;
    case "frequency":     return true;
    default:              return true;
  }
};

// ─── Widget Registry ──────────────────────────────────────────────────────────

interface WidgetDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  defaultOn: boolean;
  component: React.FC<{ entries: Entry[] }>;
}

// Order matters for row-packing: winloss(4) + weekday(6–8) fills a row naturally.
const WIDGETS: WidgetDef[] = [
  { id: "kpi-cards",     name: "KPI Overview",         desc: "Trades, P&L, Win Rate, Drawdown, Streak and more",   icon: "📊", defaultOn: true,  component: WKpiCards },
  { id: "equity-curve",  name: "Equity Curve",         desc: "Cumulative P&L across all trades",                   icon: "📈", defaultOn: true,  component: WEquityCurve },
  { id: "winloss",       name: "Win / Loss",           desc: "Wins, Losses and Break-even as donut chart",         icon: "🎯", defaultOn: true,  component: WWinLoss },
  { id: "weekday",       name: "Weekday Performance",  desc: "Average P&L by weekday",                             icon: "📅", defaultOn: true,  component: WWeekday },
  { id: "monthly-pnl",   name: "Monthly P&L",          desc: "P&L for the last 6 months",                          icon: "🗓️", defaultOn: true,  component: WMonthly },
  { id: "calendar",      name: "Trade Calendar",       desc: "Heatmap of the last 3 months by daily P&L",          icon: "🗓️", defaultOn: true,  component: WCalendar },
  { id: "instrument",    name: "Instrument Breakdown", desc: "Which markets you trade most frequently",             icon: "🔍", defaultOn: false, component: WInstrument },
  { id: "profit-factor", name: "Profit Factor",        desc: "Profit Factor, Gross Profit/Loss, Expectancy",       icon: "⚡", defaultOn: false, component: WProfitFactor },
  { id: "histogram",     name: "P&L Distribution",     desc: "Frequency distribution of your trade results",       icon: "📉", defaultOn: false, component: WHistogram },
  { id: "frequency",     name: "Trade Frequency",      desc: "Number of trades per month over the last 8 months",  icon: "🔢", defaultOn: false, component: WFrequency },
];

const STORAGE_KEY = "tj-widget-prefs-v3";

// ─── Layout System ────────────────────────────────────────────────────────────
// 4 modes – all use content-first fr-sizing + row-packing with a maxPerRow cap.
// Shared LAYOUT_KEY keeps both WidgetGrid and StatsView in sync.
type Layout = "auto" | "wide" | "compact" | "full";
const LAYOUT_KEY = "tj-layout-v2";
const LAYOUTS: { id: Layout; title: string }[] = [
  { id: "auto",    title: "Smart (auto-size)" },
  { id: "wide",    title: "Wide (max 2 per row)" },
  { id: "compact", title: "Compact (max 3 per row)" },
  { id: "full",    title: "Full width (stacked)" },
];
const getMaxPerRow = (l: Layout): number =>
  l === "full" ? 1 : l === "wide" ? 2 : l === "compact" ? 3 : Infinity;

function LayoutIcon({ id }: { id: Layout }) {
  const f = { fill: "currentColor" } as const;
  if (id === "full") return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ display: "block" }}>
      <rect x="1" y="1" width="12" height="3" rx="1" {...f} opacity=".9"/>
      <rect x="1" y="6" width="12" height="3" rx="1" {...f} opacity=".6"/>
      <rect x="1" y="11" width="12" height="2" rx="1" {...f} opacity=".4"/>
    </svg>
  );
  if (id === "wide") return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ display: "block" }}>
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" {...f}/>
      <rect x="7.5" y="1" width="5.5" height="5.5" rx="1" {...f}/>
      <rect x="1" y="8" width="5.5" height="5" rx="1" {...f} opacity=".6"/>
      <rect x="7.5" y="8" width="5.5" height="5" rx="1" {...f} opacity=".6"/>
    </svg>
  );
  if (id === "compact") return (
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ display: "block" }}>
      <rect x="1" y="1" width="3.5" height="5" rx="1" {...f}/>
      <rect x="5.25" y="1" width="3.5" height="5" rx="1" {...f}/>
      <rect x="9.5" y="1" width="3.5" height="5" rx="1" {...f}/>
      <rect x="1" y="8" width="3.5" height="5" rx="1" {...f} opacity=".6"/>
      <rect x="5.25" y="8" width="3.5" height="5" rx="1" {...f} opacity=".6"/>
      <rect x="9.5" y="8" width="3.5" height="5" rx="1" {...f} opacity=".6"/>
    </svg>
  );
  return ( // auto / smart
    <svg width="14" height="14" viewBox="0 0 14 14" style={{ display: "block" }}>
      <rect x="1" y="1" width="12" height="3" rx="1" {...f} opacity=".9"/>
      <rect x="1" y="6" width="7.5" height="3" rx="1" {...f} opacity=".9"/>
      <rect x="9.5" y="6" width="3.5" height="3" rx="1" {...f} opacity=".6"/>
      <rect x="1" y="11" width="5" height="2" rx="1" {...f} opacity=".5"/>
      <rect x="8" y="11" width="5" height="2" rx="1" {...f} opacity=".5"/>
    </svg>
  );
}

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

export default function WidgetGrid({ entries }: { entries: Entry[] }) {
  const [active, setActive] = useState<string[]>(() => WIDGETS.filter(w => w.defaultOn).map(w => w.id));
  const [editOpen, setEditOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [layout, setLayout] = useState<Layout>("auto");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setActive(JSON.parse(saved));
      const savedLayout = localStorage.getItem(LAYOUT_KEY) as Layout | null;
      if (savedLayout && LAYOUTS.some(l => l.id === savedLayout)) setLayout(savedLayout);
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  const changeLayout = (l: Layout) => {
    setLayout(l);
    try { localStorage.setItem(LAYOUT_KEY, l); } catch { /* ignore */ }
  };

  const toggle = (id: string) => {
    setActive(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const activeWidgets = useMemo(() => WIDGETS.filter(w => active.includes(w.id)), [active]);

  // Content-first: compute each widget's colSpan and visibility from actual data
  const spans = useMemo(() => {
    const r: Record<string, ColSpan> = {};
    for (const w of activeWidgets) r[w.id] = getColSpan(w.id, entries);
    return r;
  }, [activeWidgets, entries]);

  const visible = useMemo(
    () => activeWidgets.filter(w => hasContent(w.id, entries)),
    [activeWidgets, entries]
  );

  if (!loaded) return null;

  const renderWidgets = (): React.ReactNode => {
    // ── Fixed-column layouts: wide=2col / compact=3col / full=1col ──────────
    // Each widget gets the same width (repeat(N, 1fr)) → visually distinct rows.
    if (layout !== "auto") {
      const cols = layout === "full" ? 1 : layout === "wide" ? 2 : 3;
      const rows: WidgetDef[][] = [];
      for (let i = 0; i < visible.length; i += cols) rows.push(visible.slice(i, i + cols));
      return rows.map((row, ri) => (
        <div key={ri} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "16px", alignItems: "stretch" }}>
          {row.map(w => (
            <GlowCard key={w.id} style={{ padding: getPadding(12 / cols) }}>
              <SectionTitle>{w.name}</SectionTitle>
              <w.component entries={entries} />
            </GlowCard>
          ))}
        </div>
      ));
    }

    // ── Auto: content-first row-packing with fr proportions ─────────────────
    // Each widget declares its natural size via getColSpan(); rows sum to 12fr.
    const rows: WidgetDef[][] = [];
    let current: WidgetDef[] = [];
    let used = 0;
    for (const w of visible) {
      const span = spans[w.id];
      if (used + span > 12 && current.length > 0) {
        rows.push(current); current = [w]; used = span;
      } else { current.push(w); used += span; }
    }
    if (current.length > 0) rows.push(current);

    return rows.map((row, ri) => {
      const alone = row.length === 1;
      return (
        <div key={ri} style={{
          display: "grid",
          gridTemplateColumns: alone ? "1fr" : row.map(w => `${spans[w.id]}fr`).join(" "),
          gap: "16px",
          alignItems: "stretch",
        }}>
          {row.map(w => (
            <GlowCard key={w.id} style={{ padding: getPadding(alone ? 12 : spans[w.id]) }}>
              <SectionTitle>{w.name}</SectionTitle>
              <w.component entries={entries} />
            </GlowCard>
          ))}
        </div>
      );
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
        <p style={{ color: "#374151", fontSize: "12px", fontVariantNumeric: "tabular-nums" }}>
          {active.length} / {WIDGETS.length} widgets active
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Layout switcher */}
          <div style={{ display: "flex", backgroundColor: "#0d1117", border: "1px solid #1F2937", borderRadius: "10px", padding: "3px", gap: "2px" }}>
            {LAYOUTS.map(l => (
              <button
                key={l.id}
                title={l.title}
                onClick={() => changeLayout(l.id)}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: "32px", height: "28px", borderRadius: "7px", border: "none", cursor: "pointer",
                  backgroundColor: layout === l.id ? "#1F2937" : "transparent",
                  color: layout === l.id ? "#8B5CF6" : "#4B5563",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                <LayoutIcon id={l.id} />
              </button>
            ))}
          </div>
          <button
            onClick={() => setEditOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "10px", border: "1px solid #1F2937", backgroundColor: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "13px" }}>
            <span>⊞</span> Edit Statistics
          </button>
        </div>
      </div>

      {entries.length === 0 && (
        <GlowCard style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ fontSize: "32px", marginBottom: "12px" }}>📊</p>
          <p style={{ color: "#6B7280", fontSize: "14px", fontWeight: 500 }}>No trades yet</p>
          <p style={{ color: "#374151", fontSize: "13px", marginTop: "4px" }}>Statistics will appear once you add trades.</p>
        </GlowCard>
      )}

      {/* Widget Rows */}
      {entries.length > 0 && renderWidgets()}

      {/* Edit Panel Overlay */}
      {editOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex" }} onClick={() => setEditOpen(false)}>
          {/* Backdrop */}
          <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} />
          {/* Panel */}
          <div
            style={{ width: "360px", maxWidth: "95vw", backgroundColor: "#111827", borderLeft: "1px solid #1F2937", display: "flex", flexDirection: "column", height: "100%" }}
            onClick={e => e.stopPropagation()}>

            {/* Panel Header */}
            <div style={{ padding: "24px", borderBottom: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <h3 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "16px", margin: 0 }}>Edit Statistics</h3>
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
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", backgroundColor: "#0d1117", borderRadius: "12px", border: "1px solid #1F2937" }}>
                    <span style={{ fontSize: "20px", flexShrink: 0 }}>{w.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "#F9FAFB", fontSize: "13px", fontWeight: 600 }}>{w.name}</p>
                      <p style={{ color: "#4B5563", fontSize: "11px", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.desc}</p>
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
                      <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", backgroundColor: "#0d1117", borderRadius: "12px", border: "1px solid #1F2937", opacity: 0.7 }}>
                        <span style={{ fontSize: "20px", flexShrink: 0 }}>{w.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ color: "#9CA3AF", fontSize: "13px", fontWeight: 600 }}>{w.name}</p>
                          <p style={{ color: "#374151", fontSize: "11px", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.desc}</p>
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
