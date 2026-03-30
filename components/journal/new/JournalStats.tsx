"use client";
import React, { useEffect, useMemo, useState } from "react";
import { getMarketHoliday } from "@/lib/market-holidays";

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

interface Props { entries: Trade[]; journal: Journal; }

type Period = "today" | "week" | "month" | "year" | "all" | "custom";

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

const card: React.CSSProperties = {
  background: "linear-gradient(145deg, #0f0f18, #090909)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "16px", padding: "16px 20px",
  boxShadow: "0 4px 32px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04)",
};

function SectionTitle({ children, color = "#8B5CF6" }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "16px" }}>
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
      <p style={{ color: "#64748b", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>{children}</p>
    </div>
  );
}

function NoData({ text = "Not enough data yet" }: { text?: string }) {
  return <div style={{ color: "#374151", fontSize: "13px", textAlign: "center", padding: "32px 0" }}>{text}</div>;
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
  const s = useMemo(() => {
    const pnls = entries.map(e => pnlNum(e)).filter(v => v !== null) as number[];
    const total = pnls.reduce((a, b) => a + b, 0);
    const wins = pnls.filter(v => v > 0).length;
    const losses = pnls.filter(v => v < 0).length;
    const avg = pnls.length ? total / pnls.length : 0;
    let peak = 0, cum = 0, dd = 0;
    for (const p of [...entries]
      .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime())
      .map(e => pnlNum(e) ?? 0)) {
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

  const items = [
    { l: "Total Trades", v: String(entries.length), c: "#F9FAFB" },
    ...(s.n > 0 ? [
      { l: "Total P&L", v: fmt(s.total), c: s.total >= 0 ? "#22c55e" : "#ef4444" },
      { l: "Win Rate", v: `${Math.round((s.wins / s.n) * 100)}%`, c: s.wins / s.n >= 0.5 ? "#22c55e" : "#ef4444", sub: `${s.wins}W · ${s.losses}L` },
      { l: "Avg P&L", v: fmt(s.avg), c: s.avg >= 0 ? "#22c55e" : "#ef4444" },
      { l: "Best Trade", v: fmt(s.best), c: "#22c55e" },
      { l: "Worst Trade", v: fmt(s.worst), c: "#ef4444" },
      { l: "Max Drawdown", v: `-${s.dd.toFixed(2)}`, c: "#F59E0B" },
      { l: "Streak", v: `${s.streak}x ${s.sType === "win" ? "Win" : "Loss"}`, c: s.sType === "win" ? "#22c55e" : "#ef4444" },
    ] : []),
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(110px,1fr))", gap: "8px" }}>
      {items.map(i => (
        <div key={i.l} style={{ padding: "4px 0" }}>
          <p style={{ color: "#64748b", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: "4px" }}>{i.l}</p>
          <p style={{ color: i.c, fontWeight: 800, fontSize: "18px", lineHeight: 1, letterSpacing: "-0.02em" }}>{i.v}</p>
          {"sub" in i && i.sub && <p style={{ color: "#4B5563", fontSize: "10px", marginTop: "3px" }}>{i.sub}</p>}
        </div>
      ))}
    </div>
  );
}

// ─── Widget: Equity Curve ─────────────────────────────────────────────────────
function WEquity({ entries }: { entries: Trade[] }) {
  const data = useMemo(() => {
    const sorted = [...entries].filter(e => pnlNum(e) !== null)
      .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
    let cum = 0;
    return sorted.map(e => { cum += pnlNum(e)!; return cum; });
  }, [entries]);

  if (data.length < 2) return <NoData text="Need at least 2 trades with P&L" />;

  const W = 600, H = 215, PL = 48, PR = 14, PT = 16, PB = 28;
  const cW = W - PL - PR, cH = H - PT - PB;
  const min = Math.min(0, ...data), max = Math.max(0, ...data), range = max - min || 1;
  const sx = (i: number) => PL + (i / (data.length - 1)) * cW;
  const sy = (v: number) => PT + cH - ((v - min) / range) * cH;
  const z = sy(0);
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
  const fill = `${line} L${sx(data.length - 1).toFixed(1)},${z.toFixed(1)} L${PL},${z.toFixed(1)} Z`;
  const last = data[data.length - 1];
  const color = "#8B5CF6";

  return (
    <div style={{ height: "215px" }}>
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block" }}>
      <defs>
        <linearGradient id={`sg2-${data.length}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {[min, (min + max) / 2, max].map((v, i) => (
        <g key={i}>
          <line x1={PL} y1={sy(v)} x2={W - PR} y2={sy(v)} stroke="#1F2937" strokeWidth="1" strokeDasharray="4,4" />
          <text x={PL - 6} y={sy(v) + 4} textAnchor="end" fill="#4B5563" fontSize="10">{v.toFixed(0)}</text>
        </g>
      ))}
      <line x1={PL} y1={z} x2={W - PR} y2={z} stroke="#374151" strokeWidth="1" />
      <path d={fill} fill={`url(#sg2-${data.length})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={sx(data.length - 1)} cy={sy(last)} r="4" fill={color} />
    </svg>
    </div>
  );
}

// ─── Widget: Win/Loss Donut ───────────────────────────────────────────────────
function WWinLoss({ entries }: { entries: Trade[] }) {
  const { wins, losses, total } = useMemo(() => {
    const pnls = entries.map(e => pnlNum(e)).filter(v => v !== null) as number[];
    return { wins: pnls.filter(v => v > 0).length, losses: pnls.filter(v => v < 0).length, total: pnls.length };
  }, [entries]);

  if (!total) return <NoData />;
  const pct = wins / total;
  const R = 48, CX = 65, CY = 65, sw = 14, circ = 2 * Math.PI * R;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
      <div style={{ position: "relative", width: "130px", height: "130px", flexShrink: 0 }}>
        <svg width="130" height="130" viewBox="0 0 130 130">
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#ef4444" strokeWidth={sw} opacity="0.25" />
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="#22c55e" strokeWidth={sw}
            strokeDasharray={`${circ * pct} ${circ * (1 - pct)}`} transform={`rotate(-90 ${CX} ${CY})`} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color: "#F9FAFB", fontWeight: 800, fontSize: "24px", lineHeight: 1 }}>{Math.round(pct * 100)}%</span>
          <span style={{ color: "#6B7280", fontSize: "10px", marginTop: "3px" }}>Win Rate</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {[{ c: "#22c55e", l: "Wins", n: wins }, { c: "#ef4444", l: "Losses", n: losses }, { c: "#374151", l: "Break-even", n: total - wins - losses }].map(x => (
          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: x.c }} />
              <span style={{ color: "#9CA3AF", fontSize: "13px" }}>{x.l}</span>
            </div>
            <strong style={{ color: "#F9FAFB", fontSize: "13px", fontWeight: 700 }}>{x.n}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Widget: Weekday Performance ──────────────────────────────────────────────
function WWeekday({ entries }: { entries: Trade[] }) {
  const bars = useMemo(() => {
    const map: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] };
    entries.forEach(e => { const p = pnlNum(e); if (p !== null) map[new Date(e.trade_date).getDay()].push(p); });
    return [1, 2, 3, 4, 5, 6, 0].map((d, i) => {
      const v = map[d]; const avg = v.length ? v.reduce((s, x) => s + x, 0) / v.length : 0;
      return { label: DAYS[i], avg, count: v.length };
    });
  }, [entries]);

  const maxAbs = Math.max(1, ...bars.map(b => Math.abs(b.avg)));
  const PT = 14, BAR = 80, PB = 24, bW = 22, gap = 8;
  const tW = bars.length * (bW + gap) - gap + 16;
  const mid = PT + BAR * 0.72, maxPos = BAR * 0.72 - 2, maxNeg = BAR * 0.28 - 2;

  return (
    <div style={{ height: "170px" }}>
    <svg viewBox={`0 0 ${tW} ${PT + BAR + PB}`} style={{ width: "100%", height: "100%", display: "block" }}>
      {bars.map((b, i) => {
        const x = i * (bW + gap) + 8;
        const h = b.avg >= 0 ? (Math.abs(b.avg) / maxAbs) * maxPos : (Math.abs(b.avg) / maxAbs) * maxNeg;
        const color = b.avg >= 0 ? "#22c55e" : "#ef4444";
        return (
          <g key={b.label}>
            {i === 0 && <line x1={0} y1={mid} x2={tW} y2={mid} stroke="#1F2937" strokeWidth="1" />}
            {b.count > 0 && <rect x={x} y={b.avg >= 0 ? mid - h : mid} width={bW} height={Math.max(h, 2)} rx="3" fill={color} opacity="0.8" />}
            {b.count > 0 && <text x={x + bW / 2} y={b.avg >= 0 ? mid - h - 3 : mid + h + 9} textAnchor="middle" fill={color} fontSize="8" fontWeight="600">{b.avg.toFixed(1)}</text>}
            <text x={x + bW / 2} y={PT + BAR + 12} textAnchor="middle" fill="#6B7280" fontSize="9">{b.label}</text>
            {b.count > 0 && <text x={x + bW / 2} y={PT + BAR + 22} textAnchor="middle" fill="#374151" fontSize="7">{b.count}x</text>}
          </g>
        );
      })}
    </svg>
    </div>
  );
}

// ─── Widget: Monthly P&L ──────────────────────────────────────────────────────
function WMonthly({ entries }: { entries: Trade[] }) {
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
  const PT = 14, BAR = 80, PB = 24, bW = 32, gap = 10;
  const tW = bars.length * (bW + gap) - gap + 28;
  const mid = PT + BAR * 0.72, maxPos = BAR * 0.72 - 2, maxNeg = BAR * 0.28 - 2;

  return (
    <div style={{ height: "170px" }}>
    <svg viewBox={`0 0 ${tW} ${PT + BAR + PB}`} style={{ width: "100%", height: "100%", display: "block" }}>
      {bars.map((b, i) => {
        const x = i * (bW + gap) + 14;
        const h = b.total >= 0 ? (Math.abs(b.total) / maxAbs) * maxPos : (Math.abs(b.total) / maxAbs) * maxNeg;
        const color = b.total >= 0 ? "#22c55e" : "#ef4444";
        return (
          <g key={b.key}>
            {i === 0 && <line x1={0} y1={mid} x2={tW} y2={mid} stroke="#1F2937" strokeWidth="1" />}
            {b.count > 0 && <rect x={x} y={b.total >= 0 ? mid - h : mid} width={bW} height={Math.max(h, 2)} rx="4" fill={color} opacity="0.75" />}
            {b.count > 0 && <text x={x + bW / 2} y={b.total >= 0 ? mid - h - 3 : mid + h + 9} textAnchor="middle" fill={color} fontSize="7" fontWeight="600">{b.total >= 0 ? "+" : ""}{b.total.toFixed(0)}</text>}
            <text x={x + bW / 2} y={PT + BAR + 12} textAnchor="middle" fill="#6B7280" fontSize="8">{b.label}</text>
            {b.count > 0 && <text x={x + bW / 2} y={PT + BAR + 21} textAnchor="middle" fill="#374151" fontSize="7">{b.count}tr</text>}
          </g>
        );
      })}
    </svg>
    </div>
  );
}

// ─── Widget: Trade Calendar ───────────────────────────────────────────────────
function WCalendar({ entries }: { entries: Trade[] }) {
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
              <p style={{ color: "#9CA3AF", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>{MONTHS[m]} {y}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px", marginBottom: "2px" }}>
                {DAYS.map(d => <div key={d} style={{ textAlign: "center", color: "#374151", fontSize: "9px" }}>{d}</div>)}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px" }}>
                {cells.map((day, i) => {
                  if (!day) return <div key={i} />;
                  const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const isWeekend = i % 7 === 5 || i % 7 === 6;
                  const isToday = today.getDate() === day && today.getMonth() === m && today.getFullYear() === y;
                  const trade = pnlByDate[key];
                  const holiday = getMarketHoliday(key);
                  let bg = "#0d1117", border = "transparent", color = "#374151", lbl = "";
                  if (trade) {
                    if (trade.pnl > 0) { bg = `rgba(34,197,94,${Math.min(0.85, 0.3 + trade.pnl / 200)})`; color = "#F9FAFB"; }
                    else if (trade.pnl < 0) { bg = `rgba(239,68,68,${Math.min(0.85, 0.3 + Math.abs(trade.pnl) / 200)})`; color = "#F9FAFB"; }
                    else { bg = "rgba(107,114,128,0.3)"; color = "#F9FAFB"; }
                  } else if (holiday) { bg = "rgba(251,146,60,0.12)"; border = "rgba(251,146,60,0.4)"; color = "#fb923c"; lbl = "CLOSED"; }
                  else if (isWeekend) { bg = "#0a0a0a"; color = "#1F2937"; }
                  return (
                    <div key={i} title={trade ? `${trade.count} trade(s) · ${fmt(trade.pnl)}` : holiday ?? String(day)}
                      style={{ aspectRatio: "1", borderRadius: "3px", backgroundColor: bg, border: isToday ? "1px solid #8B5CF6" : `1px solid ${border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: "8px", color }}>
                      <span>{day}</span>
                      {lbl && <span style={{ fontSize: "6px", fontWeight: 700, lineHeight: 1 }}>{lbl}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "14px", marginTop: "12px", flexWrap: "wrap" }}>
        {[{ c: "rgba(34,197,94,0.6)", l: "Positive" }, { c: "rgba(239,68,68,0.6)", l: "Negative" }, { c: "rgba(107,114,128,0.3)", l: "Break-even" }, { c: "#0d1117", l: "No Trade" }].map(x => (
          <div key={x.l} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: x.c, border: "1px solid #1F2937" }} />
            <span style={{ color: "#4B5563", fontSize: "11px" }}>{x.l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Widget: P&L Distribution ─────────────────────────────────────────────────
function WHistogram({ entries }: { entries: Trade[] }) {
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
  const H = 100, bW = 36, gap = 8, tW = bars.length * (bW + gap) - gap + 20;

  return (
    <svg viewBox={`0 0 ${tW} ${H + 36}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {bars.map((b, i) => {
        const x = i * (bW + gap) + 10;
        const h = (b.count / maxCount) * (H - 16);
        const barColor = b.min >= 0 ? "#22c55e" : b.max <= 0 ? "#ef4444" : "#6B7280";
        return (
          <g key={b.label}>
            {b.count > 0 && <><rect x={x} y={H - h} width={bW} height={h} rx="4" fill={barColor} opacity="0.75" /><text x={x + bW / 2} y={H - h - 4} textAnchor="middle" fill={barColor} fontSize="10" fontWeight="600">{b.count}</text></>}
            {b.label.split("\n").map((ln, li) => <text key={li} x={x + bW / 2} y={H + 13 + li * 11} textAnchor="middle" fill="#6B7280" fontSize="8">{ln}</text>)}
          </g>
        );
      })}
      <line x1={0} y1={H} x2={tW} y2={H} stroke="#1F2937" strokeWidth="1" />
    </svg>
  );
}

// ─── Widget: Profit Factor ────────────────────────────────────────────────────
function WProfitFactor({ entries }: { entries: Trade[] }) {
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
  const metrics = [
    { l: "Profit Factor", v: m.pf.toFixed(2), c: m.pf >= 1.5 ? "#22c55e" : m.pf >= 1 ? "#F59E0B" : "#ef4444" },
    { l: "Gross Profit", v: fmt(m.gw), c: "#22c55e" },
    { l: "Gross Loss", v: `-${m.gl.toFixed(2)}`, c: "#ef4444" },
    { l: "Expectancy", v: fmt(m.exp), c: m.exp >= 0 ? "#22c55e" : "#ef4444" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
      {metrics.map(x => (
        <div key={x.l} style={{ padding: "4px 0" }}>
          <p style={{ color: "#64748b", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 700, marginBottom: "4px" }}>{x.l}</p>
          <p style={{ color: x.c, fontWeight: 800, fontSize: "18px", lineHeight: 1, letterSpacing: "-0.02em" }}>{x.v}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Widget: Trade Frequency ──────────────────────────────────────────────────
function WFrequency({ entries }: { entries: Trade[] }) {
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
  const H = 100, bW = 32, gap = 10, tW = bars.length * (bW + gap) - gap + 20;

  return (
    <>
      <p style={{ fontSize: "36px", fontWeight: 800, lineHeight: 1, letterSpacing: "-0.03em", background: "linear-gradient(135deg, #c4b5fd, #8B5CF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: "12px" }}>{totalTrades}</p>
      <div style={{ height: "128px" }}>
      <svg viewBox={`0 0 ${tW} ${H + 30}`} style={{ width: "100%", height: "100%", display: "block" }}>
        {bars.map((b, i) => {
          const x = i * (bW + gap) + 10; const h = (b.count / maxCount) * (H - 12);
          return (
            <g key={b.key}>
              {b.count > 0 && <><rect x={x} y={H - h} width={bW} height={h} rx="4" fill="#8B5CF6" opacity="0.7" /><text x={x + bW / 2} y={H - h - 4} textAnchor="middle" fill="#8B5CF6" fontSize="10" fontWeight="600">{b.count}</text></>}
              <text x={x + bW / 2} y={H + 13} textAnchor="middle" fill="#6B7280" fontSize="8">{b.label}</text>
            </g>
          );
        })}
        <line x1={0} y1={H} x2={tW} y2={H} stroke="#1F2937" strokeWidth="1" />
      </svg>
      </div>
    </>
  );
}

// ─── NEW Widget: Setup Performance ───────────────────────────────────────────
function WSetupPerf({ entries }: { entries: Trade[] }) {
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

  const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #1F2937" };
  const td: React.CSSProperties = { padding: "10px 14px", fontSize: "13px", borderBottom: "1px solid #0f1923" };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#0f1923" }}>
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
              <td style={{ ...td, color: "#F9FAFB", fontWeight: 600 }}>{r.setup}</td>
              <td style={{ ...td, color: "#9CA3AF", textAlign: "right" }}>{r.trades}</td>
              <td style={{ ...td, textAlign: "right" }}>
                {r.winRate !== null
                  ? <span style={{ color: r.winRate >= 50 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{r.winRate}%</span>
                  : <span style={{ color: "#374151" }}>—</span>}
              </td>
              <td style={{ ...td, textAlign: "right" }}>
                {r.avgPnl !== null
                  ? <span style={{ color: r.avgPnl >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>{fmt(r.avgPnl)}</span>
                  : <span style={{ color: "#374151" }}>—</span>}
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
  const result = useMemo(() => {
    const riskRule = journal.risk_per_trade;
    const startBal = journal.starting_balance;
    if (!riskRule || startBal == null) return null;

    const withRisk = entries.filter(e => getField(e, "Risk Amount") !== null);
    if (!withRisk.length) return null;

    const sorted = [...withRisk].sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());

    let balance = startBal;
    let compliant = 0, breakCount = 0, sumBreakRisk = 0;

    for (const trade of sorted) {
      const riskAmtStr = getField(trade, "Risk Amount");
      if (riskAmtStr && balance > 0) {
        const riskAmt = parseFloat(riskAmtStr);
        if (!isNaN(riskAmt)) {
          const actualPct = (riskAmt / balance) * 100;
          if (Math.abs(actualPct - riskRule) <= 0.5) { compliant++; }
          else { breakCount++; sumBreakRisk += actualPct; }
        }
      }
      const p = pnlNum(trade);
      if (p !== null) balance += p;
    }

    const total = compliant + breakCount;
    const pct = total ? Math.round((compliant / total) * 100) : null;
    const avgBreakRisk = breakCount > 0 ? sumBreakRisk / breakCount : null;
    return { compliant, total, pct, breakCount, avgBreakRisk };
  }, [entries, journal]);

  if (!result) {
    if (!journal.risk_per_trade || journal.starting_balance == null)
      return <NoData text="Set Risk % and Starting Balance in journal settings to enable risk tracking." />;
    return <NoData text="No trades with 'Risk Amount' field found." />;
  }

  const { compliant, total, pct, breakCount, avgBreakRisk } = result;
  const color = pct !== null && pct >= 80 ? "#22c55e" : pct !== null && pct >= 60 ? "#F59E0B" : "#ef4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ color: "#D1D5DB", fontSize: "13px", marginBottom: "3px" }}>
            Rule: <strong style={{ color: "#A78BFA" }}>{journal.risk_per_trade}% risk per trade</strong>
          </p>
          <p style={{ color: "#6B7280", fontSize: "12px" }}>±0.5% tolerance · balance-adjusted</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ color, fontSize: "28px", fontWeight: 800, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
            {pct !== null ? `${pct}%` : "—"}
          </p>
          <p style={{ color: "#6B7280", fontSize: "11px", marginTop: "2px" }}>{compliant}/{total} trades</p>
        </div>
      </div>

      <div style={{ height: "8px", backgroundColor: "#1F2937", borderRadius: "4px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct ?? 0}%`, backgroundColor: color, borderRadius: "4px", transition: "width 0.5s ease" }} />
      </div>

      {breakCount > 0 ? (
        <div style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ color: "#f87171", fontSize: "13px" }}>⚠ {breakCount} rule break{breakCount !== 1 ? "s" : ""}</span>
          {avgBreakRisk !== null && (
            <span style={{ color: "#6B7280", fontSize: "12px" }}>avg {avgBreakRisk.toFixed(1)}% on violations</span>
          )}
        </div>
      ) : total > 0 ? (
        <div style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "10px", padding: "10px 14px", textAlign: "center" }}>
          <span style={{ color: "#22c55e", fontSize: "13px" }}>✓ Perfect risk discipline!</span>
        </div>
      ) : null}
    </div>
  );
}

// ─── NEW Widget: Rule Compliance ──────────────────────────────────────────────
function WRuleCompliance({ entries, journal }: { entries: Trade[]; journal: Journal }) {
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
    return { text: `⏰ Trading Hours (${journal.time_from}–${journal.time_to})`, followed, total, pct: total ? Math.round((followed / total) * 100) : null };
  }, [entries, journal]);

  if (!bars.length && !timeBar) return <NoData text="No rule compliance data yet. Log trades with rules to see this." />;

  const renderBar = (b: { text: string; followed: number; total: number; pct: number | null }) => (
    <div key={b.text}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
        <span style={{ color: "#D1D5DB", fontSize: "13px", flex: 1, paddingRight: "16px" }}>{b.text}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          <span style={{ color: "#6B7280", fontSize: "11px" }}>{b.followed}/{b.total}</span>
          <span style={{ color: b.pct !== null && b.pct >= 70 ? "#22c55e" : b.pct !== null && b.pct >= 40 ? "#F59E0B" : "#ef4444", fontWeight: 700, fontSize: "13px", minWidth: "38px", textAlign: "right" }}>
            {b.pct !== null ? `${b.pct}%` : "—"}
          </span>
        </div>
      </div>
      <div style={{ height: "6px", backgroundColor: "#1F2937", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${b.pct ?? 0}%`, borderRadius: "3px", transition: "width 0.4s ease", backgroundColor: b.pct !== null && b.pct >= 70 ? "#22c55e" : b.pct !== null && b.pct >= 40 ? "#F59E0B" : "#ef4444" }} />
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {timeBar && (
        <>
          <p style={{ color: "#4B5563", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>Session Rule</p>
          {renderBar(timeBar)}
          {bars.length > 0 && <div style={{ borderTop: "1px solid #1F2937", paddingTop: "4px" }} />}
        </>
      )}
      {bars.length > 0 && (
        <>
          {timeBar && <p style={{ color: "#4B5563", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: 0 }}>My Rules</p>}
          {bars.map(b => renderBar(b))}
        </>
      )}
    </div>
  );
}

// ─── NEW Widget: Emotions at Rule Breaks ──────────────────────────────────────
function WEmotionsBreaks({ entries }: { entries: Trade[] }) {
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
      <p style={{ color: "#6B7280", fontSize: "12px", marginBottom: "4px" }}>Which emotions appear most when you break rules?</p>
      {bars.map(([emotion, count]) => {
        const pct = Math.round((count / maxCount) * 100);
        const color = EMOTION_COLORS[emotion] ?? "#6B7280";
        return (
          <div key={emotion}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
              <span style={{ color, fontSize: "13px", fontWeight: 500 }}>{emotion}</span>
              <span style={{ color: "#6B7280", fontSize: "11px" }}>{count}x</span>
            </div>
            <div style={{ height: "6px", backgroundColor: "#1F2937", borderRadius: "3px", overflow: "hidden" }}>
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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const sorted = useMemo(() =>
    [...entries].sort((a, b) => new Date(b.trade_date).getTime() - new Date(a.trade_date).getTime()).slice(0, 50),
    [entries]
  );

  if (!sorted.length) return <NoData text="No trades in this period" />;

  const th: React.CSSProperties = { padding: "10px 14px", textAlign: "left", fontSize: "10px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid #1F2937", whiteSpace: "nowrap" };
  const td: React.CSSProperties = { padding: "10px 14px", fontSize: "13px", borderBottom: "1px solid #0f1923" };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ backgroundColor: "#0f1923" }}>
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
                  style={{ borderBottom: isExpanded ? "none" : "1px solid #0f1923", cursor: "pointer", transition: "background 0.15s", backgroundColor: isExpanded ? "rgba(255,255,255,0.02)" : undefined }}
                  onMouseEnter={e => { if (!isExpanded) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "rgba(255,255,255,0.02)"; }}
                  onMouseLeave={e => { if (!isExpanded) (e.currentTarget as HTMLTableRowElement).style.backgroundColor = ""; }}>
                  <td style={{ ...td, color: "#6B7280" }}>{`${String(d.getUTCDate()).padStart(2,"0")}/${String(d.getUTCMonth()+1).padStart(2,"0")}/${String(d.getUTCFullYear()).slice(2)}`}</td>
                  <td style={{ ...td, color: "#F9FAFB", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: p !== null ? (p >= 0 ? "#22c55e" : "#ef4444") : "#374151", flexShrink: 0 }} />
                      {getField(t, "Symbol") ?? "—"}
                    </div>
                  </td>
                  <td style={td}>
                    {dir && <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px", backgroundColor: dir === "Long" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)", color: dir === "Long" ? "#22c55e" : "#ef4444" }}>{dir === "Long" ? "▲L" : "▼S"}</span>}
                  </td>
                  <td style={{ ...td, color: "#9CA3AF" }}>{getField(t, "Setup") ?? <span style={{ color: "#374151" }}>—</span>}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    {p !== null ? <span style={{ color: p >= 0 ? "#22c55e" : "#ef4444", fontWeight: 700 }}>{p >= 0 ? "+" : ""}{p.toFixed(2)}</span> : <span style={{ color: "#374151" }}>—</span>}
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", gap: "3px", flexWrap: "wrap" }}>
                      {emos.slice(0, 2).map(e => (
                        <span key={e} style={{ padding: "1px 6px", borderRadius: "8px", fontSize: "10px", backgroundColor: `${EMOTION_COLORS[e] ?? "#6B7280"}22`, color: EMOTION_COLORS[e] ?? "#6B7280" }}>{e}</span>
                      ))}
                      {emos.length > 2 && <span style={{ color: "#6B7280", fontSize: "10px" }}>+{emos.length - 2}</span>}
                    </div>
                  </td>
                  <td style={td}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {totalBreaks > 0
                        ? <span style={{ color: "#ef4444", fontSize: "12px", fontWeight: 600 }}>✗ {totalBreaks} break{totalBreaks > 1 ? "s" : ""}</span>
                        : hasData
                          ? <span style={{ color: "#22c55e", fontSize: "12px", fontWeight: 600 }}>✓ All OK</span>
                          : <span style={{ color: "#374151", fontSize: "12px" }}>—</span>}
                      <span style={{ color: "#4B5563", fontSize: "11px" }}>{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={7} style={{ backgroundColor: "#0d1219", borderBottom: "1px solid #1F2937", padding: "0" }}>
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
                            <span style={{ color: "#6B7280", fontSize: "12px" }}>{r.text}</span>
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
  { id: "kpi",             name: "KPI Overview",           desc: "Trades, P&L, Win Rate, Drawdown, Streak",             icon: "📊", dotColor: "#22c55e", size: "full", defaultOn: true,  component: ({ entries }) => <WKpi entries={entries} /> },
  { id: "equity",          name: "Equity Curve",           desc: "Cumulative P&L across all trades",                    icon: "📈", dotColor: "#8B5CF6", size: "full", defaultOn: true,  component: ({ entries }) => <WEquity entries={entries} /> },
  { id: "winloss",         name: "Win / Loss",             desc: "Wins, Losses and Break-even donut chart",             icon: "🎯", dotColor: "#60a5fa", size: "half", defaultOn: true,  component: ({ entries }) => <WWinLoss entries={entries} /> },
  { id: "weekday",         name: "Weekday Performance",    desc: "Average P&L by weekday",                              icon: "📅", dotColor: "#8B5CF6", size: "half", defaultOn: true,  component: ({ entries }) => <WWeekday entries={entries} /> },
  { id: "monthly",         name: "Monthly P&L",            desc: "P&L bar chart for the last 6 months",                 icon: "🗓️", dotColor: "#22c55e", size: "half", defaultOn: true,  component: ({ entries }) => <WMonthly entries={entries} /> },
  { id: "frequency",       name: "Trade Frequency",        desc: "Number of trades per month over the last 8 months",   icon: "🔢", dotColor: "#60a5fa", size: "half", defaultOn: true,  component: ({ entries }) => <WFrequency entries={entries} /> },
  { id: "calendar",        name: "Trade Calendar",         desc: "Daily P&L heatmap for the last 3 months",             icon: "📆", dotColor: "#f59e0b", size: "full", defaultOn: true,  component: ({ entries }) => <WCalendar entries={entries} /> },
  { id: "setup-perf",      name: "Setup Performance",      desc: "Win Rate and P&L broken down by setup type",          icon: "🔬", dotColor: "#60a5fa", size: "full", defaultOn: true,  component: ({ entries }) => <WSetupPerf entries={entries} /> },
  { id: "risk-discipline", name: "Risk Discipline",        desc: "How consistently you stick to your risk % rule",      icon: "🎯", dotColor: "#f59e0b", size: "half", defaultOn: true,  component: ({ entries, journal }) => <WRiskDiscipline entries={entries} journal={journal} /> },
  { id: "rule-compliance", name: "Rule Compliance",        desc: "How often each journal rule was followed",            icon: "✅", dotColor: "#22c55e", size: "half", defaultOn: true,  component: ({ entries, journal }) => <WRuleCompliance entries={entries} journal={journal} /> },
  { id: "emotions-breaks", name: "Emotions at Rule Breaks",desc: "Emotions that appear most when you break rules",      icon: "🧠", dotColor: "#ef4444", size: "half", defaultOn: true,  component: ({ entries }) => <WEmotionsBreaks entries={entries} /> },
  { id: "profit-factor",   name: "Profit Factor",          desc: "Profit Factor, Gross Profit/Loss, Expectancy",        icon: "⚡", dotColor: "#8B5CF6", size: "half", defaultOn: true,  component: ({ entries }) => <WProfitFactor entries={entries} /> },
  { id: "trade-analysis",  name: "Trade Analysis",         desc: "Full trade list with setup, emotions, rule status",   icon: "📋", dotColor: "#94a3b8", size: "full", defaultOn: true,  component: ({ entries, journal }) => <WTradeAnalysis entries={entries} journal={journal} /> },
  { id: "histogram",       name: "P&L Distribution",       desc: "Frequency distribution of trade results by bucket",   icon: "📉", dotColor: "#ef4444", size: "full", defaultOn: false, component: ({ entries }) => <WHistogram entries={entries} /> },
];

const STORAGE_KEY = "tj-stats-prefs-v1";

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange}
      style={{ width: "44px", height: "26px", borderRadius: "13px", backgroundColor: on ? "#8B5CF6" : "#1F2937", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
      <div style={{ position: "absolute", top: "4px", left: on ? "22px" : "4px", width: "18px", height: "18px", borderRadius: "50%", backgroundColor: "#fff", transition: "left 0.2s" }} />
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function JournalStats({ entries, journal }: Props) {
  const [period, setPeriod] = useState<Period>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [active, setActive] = useState<string[]>(() => WIDGETS.filter(w => w.defaultOn).map(w => w.id));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY); if (s) setActive(JSON.parse(s));
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  const toggle = (id: string) => {
    setActive(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const filtered = useMemo(() => applyPeriod(entries, period, customFrom, customTo), [entries, period, customFrom, customTo]);
  const activeWidgets = useMemo(() => WIDGETS.filter(w => active.includes(w.id)), [active]);

  const balanceInfo = useMemo(() => {
    if (journal.starting_balance == null) return null;
    const sorted = [...entries].sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
    const totalPnl = sorted.reduce((sum, t) => sum + (pnlNum(t) ?? 0), 0);
    const current = journal.starting_balance + totalPnl;
    return { starting: journal.starting_balance, totalPnl, current };
  }, [entries, journal.starting_balance]);

  const cell = (id: string) => {
    if (!active.includes(id)) return null;
    const w = WIDGETS.find(x => x.id === id);
    if (!w) return null;
    return (
      <div key={w.id} style={card}>
        <SectionTitle color={w.dotColor}>{w.icon} {w.name}</SectionTitle>
        <w.component entries={filtered} journal={journal} />
      </div>
    );
  };

  // IDs assigned to fixed rows (not part of "extra" row)
  const fixedIds = ["kpi", "equity", "winloss", "weekday", "monthly", "frequency", "calendar", "setup-perf", "risk-discipline"];
  const extraWidgets = activeWidgets.filter(w => !fixedIds.includes(w.id));

  if (!loaded) return null;

  const inpStyle: React.CSSProperties = { backgroundColor: "#1a2332", border: "1px solid #1F2937", borderRadius: "8px", padding: "6px 10px", color: "#F9FAFB", fontSize: "13px", outline: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Account Balance Card */}
      {balanceInfo && (
        <div style={{ background: "linear-gradient(145deg, #0f0f18, #090909)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", boxShadow: "0 4px 32px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04)", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "18px" }}>💰</span>
            <span style={{ color: "#6B7280", fontSize: "13px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Account Balance</span>
          </div>
          <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#6B7280", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Starting</div>
              <div style={{ color: "#9CA3AF", fontSize: "16px", fontWeight: 600 }}>${balanceInfo.starting.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#6B7280", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Total P&L</div>
              <div style={{ color: balanceInfo.totalPnl >= 0 ? "#22c55e" : "#ef4444", fontSize: "16px", fontWeight: 600 }}>{fmt(balanceInfo.totalPnl)}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#6B7280", fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Current Balance</div>
              <div style={{ color: balanceInfo.current >= balanceInfo.starting ? "#22c55e" : "#ef4444", fontSize: "22px", fontWeight: 700, letterSpacing: "-0.02em" }}>${balanceInfo.current.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            </div>
          </div>
        </div>
      )}

      {/* Period Filter Bar */}
      <div style={{ background: "linear-gradient(145deg, #0f0f18, #090909)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "12px", boxShadow: "0 4px 32px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.04)", padding: "10px 16px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
          {(["today", "week", "month", "year", "all", "custom"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ padding: "6px 13px", borderRadius: "8px", border: `1px solid ${period === p ? "rgba(139,92,246,0.5)" : "#374151"}`, backgroundColor: period === p ? "rgba(139,92,246,0.1)" : "transparent", color: period === p ? "#A78BFA" : "#9CA3AF", cursor: "pointer", fontSize: "13px", fontWeight: period === p ? 600 : 400 }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        {period === "custom" && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} style={inpStyle} />
            <span style={{ color: "#6B7280", fontSize: "13px" }}>→</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} style={inpStyle} />
          </div>
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ color: "#6B7280", fontSize: "13px" }}>{filtered.length} trade{filtered.length !== 1 ? "s" : ""}</span>
          <button onClick={() => setEditOpen(true)}
            style={{ display: "flex", alignItems: "center", gap: "7px", padding: "7px 14px", borderRadius: "10px", border: "1px solid #1F2937", backgroundColor: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "13px" }}>
            ⊞ Edit Widgets
          </button>
        </div>
      </div>

      {/* Empty State */}
      {filtered.length === 0 && (
        <div style={{ ...card, textAlign: "center", padding: "60px" }}>
          <p style={{ fontSize: "36px", marginBottom: "12px" }}>📊</p>
          <p style={{ color: "#4B5563", fontSize: "14px" }}>No trades in this period — try a wider range or log some trades first.</p>
        </div>
      )}

      {/* Widget Rows — fixed layout matching HTML reference */}
      {filtered.length > 0 && (
        <>
          {/* Row 1: KPI (1fr) | Equity (2fr) | Win/Loss (1fr) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: "20px", alignItems: "stretch" }}>
            {cell("kpi")}{cell("equity")}{cell("winloss")}
          </div>

          {/* Row 2: Weekday | Monthly | Frequency */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", alignItems: "stretch" }}>
            {cell("weekday")}{cell("monthly")}{cell("frequency")}
          </div>

          {/* Row 3: Calendar | Setup Perf | Risk Discipline */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", alignItems: "stretch" }}>
            {cell("calendar")}{cell("setup-perf")}{cell("risk-discipline")}
          </div>

          {/* Extra widgets (histogram, rule-compliance, emotions-breaks, profit-factor, trade-analysis) */}
          {extraWidgets.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}>
              {extraWidgets.map(w => (
                <div key={w.id} style={{ ...card, gridColumn: w.size === "full" ? "span 12" : "span 6" }}>
                  <SectionTitle color={w.dotColor}>{w.icon} {w.name}</SectionTitle>
                  <w.component entries={filtered} journal={journal} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Edit Widgets Side Panel */}
      {editOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex" }} onClick={() => setEditOpen(false)}>
          <div style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }} />
          <div style={{ width: "360px", maxWidth: "95vw", backgroundColor: "#111827", borderLeft: "1px solid #1F2937", display: "flex", flexDirection: "column", height: "100%" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "24px", borderBottom: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <div>
                <h3 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "16px", margin: 0 }}>Edit Widgets</h3>
                <p style={{ color: "#6B7280", fontSize: "12px", marginTop: "4px" }}>{active.length} of {WIDGETS.length} active</p>
              </div>
              <button onClick={() => setEditOpen(false)} style={{ padding: "8px 18px", borderRadius: "10px", border: "none", backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>Done</button>
            </div>
            <div style={{ flex: 1, overflowY: "scroll", padding: "16px" }}>
              <p style={{ color: "#6B7280", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px", paddingLeft: "4px" }}>Active</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "20px" }}>
                {WIDGETS.filter(w => active.includes(w.id)).map(w => (
                  <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: "linear-gradient(145deg, #0f0f18, #090909)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span style={{ fontSize: "20px", flexShrink: 0 }}>{w.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "#F9FAFB", fontSize: "13px", fontWeight: 600 }}>{w.name}</p>
                      <p style={{ color: "#4B5563", fontSize: "11px", marginTop: "1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.desc}</p>
                    </div>
                    <Toggle on={true} onChange={() => toggle(w.id)} />
                  </div>
                ))}
              </div>
              {WIDGETS.some(w => !active.includes(w.id)) && (
                <>
                  <p style={{ color: "#6B7280", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px", paddingLeft: "4px" }}>Available</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {WIDGETS.filter(w => !active.includes(w.id)).map(w => (
                      <div key={w.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: "linear-gradient(145deg, #0f0f18, #090909)", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", opacity: 0.7 }}>
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
