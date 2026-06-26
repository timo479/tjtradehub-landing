"use client";
import { useEffect, useMemo, useState } from "react";
import { getMarketHoliday, getHolidaysForYear, getUpcomingHolidays } from "@/lib/market-holidays";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ─── Types + helpers ──────────────────────────────────────────────────────────
interface Entry {
  trade_date: string;
  trade_field_values: { value: string; template_fields: { label: string; field_type: string } }[];
}
const getPnl = (e: Entry): number | null => {
  for (const fv of e.trade_field_values ?? []) {
    const label = (fv.template_fields?.label ?? "").toLowerCase();
    if (fv.template_fields?.field_type === "number" &&
      (label.includes("p&l") || label.includes("pnl") || label === "profit" || label.includes("gewinn") || label.includes("gain"))) {
      const n = parseFloat(fv.value); return isNaN(n) ? null : n;
    }
  }
  return null;
};
const pad = (n: number) => String(n).padStart(2, "0");
const money = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;
function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });
}
function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today"; if (diff === 1) return "Tomorrow"; return `in ${diff} days`;
}

// FX sessions in UTC (approx). open<close = same day; open>close = wraps midnight.
const SESSIONS = [
  { name: "Sydney", open: 22, close: 7, color: "#f59e0b" },
  { name: "Tokyo", open: 0, close: 9, color: "#ef4444" },
  { name: "London", open: 8, close: 17, color: "#60a5fa" },
  { name: "New York", open: 13, close: 22, color: "#8B5CF6" },
];
const sessionOpen = (s: { open: number; close: number }, h: number) =>
  s.open < s.close ? (h >= s.open && h < s.close) : (h >= s.open || h < s.close);

// ─── Shared card style ────────────────────────────────────────────────────────
const CARD: React.CSSProperties = {
  background: "linear-gradient(145deg, #110c1e, #080808)",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "18px",
  boxShadow: "0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
};
const icon = (paths: React.ReactNode, color = "currentColor", size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block", flexShrink: 0 }}>{paths}</svg>
);
const ICONS = {
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" /></>,
  globe: <><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></>,
  flag: <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></>,
  activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />,
  trending: <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></>,
};

export default function MarketCalendar() {
  const [now, setNow] = useState<Date | null>(null);
  const [viewDate, setViewDate] = useState(() => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), 1); });
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    fetch("/api/v2/entries").then(r => r.ok ? r.json() : []).then(d => setEntries(Array.isArray(d) ? d : [])).catch(() => {});
    return () => clearInterval(id);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const rows = Math.ceil((startOffset + lastDay.getDate()) / 7);

  const yearHolidays = getHolidaysForYear(year);
  const upcomingHolidays = getUpcomingHolidays(6);

  // P&L per date from the user's trades
  const pnlByDate = useMemo(() => {
    const map: Record<string, { pnl: number; count: number }> = {};
    entries.forEach(e => {
      const key = e.trade_date?.slice(0, 10); if (!key) return;
      const p = getPnl(e) ?? 0;
      if (!map[key]) map[key] = { pnl: 0, count: 0 };
      map[key].pnl += p; map[key].count++;
    });
    return map;
  }, [entries]);

  const maxAbs = useMemo(() => Math.max(50, ...Object.values(pnlByDate).map(d => Math.abs(d.pnl))), [pnlByDate]);

  // Month stats (trading days, days traded, holidays, net P&L)
  const monthStats = useMemo(() => {
    let tradingDays = 0, holidays = 0, daysTraded = 0, netPnl = 0;
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const ds = `${year}-${pad(month + 1)}-${pad(d)}`;
      const dow = new Date(year, month, d).getDay();
      const hol = getMarketHoliday(ds);
      if (hol) holidays++;
      else if (dow !== 0 && dow !== 6) tradingDays++;
      const t = pnlByDate[ds];
      if (t) { daysTraded++; netPnl += t.pnl; }
    }
    return { tradingDays, holidays, daysTraded, netPnl };
  }, [year, month, lastDay, pnlByDate]);

  // Live market status (NYSE-ish)
  const status = useMemo(() => {
    if (!now) return null;
    const ds = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
    const dow = now.getUTCDay();
    const hol = getMarketHoliday(ds);
    if (hol) return { open: false, label: "Closed", reason: hol, color: "#fb923c" };
    if (dow === 0 || dow === 6) return { open: false, label: "Closed", reason: "Weekend", color: "#6B7280" };
    const h = now.getUTCHours() + now.getUTCMinutes() / 60;
    if (h >= 13.5 && h < 20) return { open: true, label: "Open", reason: "Regular session", color: "#22c55e" };
    return { open: false, label: "Closed", reason: h < 13.5 ? "Pre-market" : "After-hours", color: "#F59E0B" };
  }, [now]);

  const utcHour = now ? now.getUTCHours() + now.getUTCMinutes() / 60 : -1;
  const todayStr = now ? `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` : null;

  const selData = selected ? { holiday: getMarketHoliday(selected), trade: pnlByDate[selected] } : null;

  const stats = [
    { label: "Trading Days", value: String(monthStats.tradingDays), accent: "139,92,246", icon: ICONS.calendar, color: "#F9FAFB" },
    { label: "Days You Traded", value: String(monthStats.daysTraded), accent: "96,165,250", icon: ICONS.activity, color: "#F9FAFB" },
    { label: "Market Holidays", value: String(monthStats.holidays), accent: "245,158,11", icon: ICONS.flag, color: monthStats.holidays > 0 ? "#fb923c" : "#F9FAFB" },
    { label: "Net P&L (Month)", value: monthStats.daysTraded ? money(monthStats.netPnl) : "—", accent: monthStats.netPnl >= 0 ? "34,197,94" : "239,68,68", icon: ICONS.trending, color: monthStats.daysTraded ? (monthStats.netPnl >= 0 ? "#22c55e" : "#ef4444") : "#6B7280" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <style>{`
        @keyframes mcIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mcPop { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        @keyframes mcGrowX { from { transform: scaleX(0); } to { transform: scaleX(1); } }
        @keyframes mcPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
        .mc-cell { transition: transform .12s ease, border-color .15s ease, box-shadow .15s ease; }
        .mc-cell:hover { transform: translateY(-2px); z-index: 2; }
        @media (prefers-reduced-motion: reduce) { [style*="animation"], .mc-cell { animation: none !important; transition: none !important; } }
      `}</style>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div style={{ ...CARD, position: "relative", overflow: "hidden", padding: "22px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "20px", animation: "mcIn 0.5s cubic-bezier(.22,1,.36,1) both" }}>
        <div style={{ position: "absolute", top: "-50%", left: "10%", width: "420px", height: "240px", background: "radial-gradient(ellipse, rgba(139,92,246,0.1), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "14px", position: "relative", zIndex: 1 }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "13px", background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.28)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {icon(ICONS.calendar, "#A78BFA", 22)}
          </div>
          <div>
            <h1 style={{ color: "#F9FAFB", fontWeight: 800, fontSize: "24px", letterSpacing: "-0.02em", lineHeight: 1.1 }}>Market Calendar</h1>
            <p style={{ color: "#9CA3AF", fontSize: "13px", marginTop: "3px" }}>NYSE / USD trading sessions, holidays &amp; your activity</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", position: "relative", zIndex: 1, flexWrap: "wrap" }}>
          {/* Live clock */}
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#6B7280", fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "2px" }}>UTC Time</div>
            <div style={{ color: "#F9FAFB", fontSize: "22px", fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>
              {now ? `${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}` : "––:––:––"}
            </div>
          </div>
          {/* Status pill */}
          {status && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 16px", borderRadius: "12px", background: `rgba(${status.open ? "34,197,94" : "107,114,128"},0.1)`, border: `1px solid rgba(${status.open ? "34,197,94" : "107,114,128"},0.3)` }}>
              <span style={{ position: "relative", width: "10px", height: "10px", borderRadius: "50%", background: status.color, boxShadow: `0 0 10px ${status.color}`, animation: status.open ? "mcPulse 1.8s infinite" : "none" }} />
              <div>
                <div style={{ color: status.color, fontSize: "14px", fontWeight: 800, lineHeight: 1 }}>Market {status.label}</div>
                <div style={{ color: "#6B7280", fontSize: "11px", marginTop: "2px" }}>{status.reason}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stat strip ─────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
        {stats.map((s, i) => (
          <div key={s.label} style={{ ...CARD, position: "relative", overflow: "hidden", padding: "16px 18px", animation: `mcIn 0.5s cubic-bezier(.22,1,.36,1) ${i * 70}ms both` }}>
            <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "3px", background: `rgb(${s.accent})` }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "11px" }}>
              <span style={{ color: "#9CA3AF", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>{s.label}</span>
              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: `rgba(${s.accent},0.12)`, border: `1px solid rgba(${s.accent},0.25)`, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon(s.icon, `rgb(${s.accent})`, 15)}</div>
            </div>
            <p style={{ color: s.color, fontWeight: 800, fontSize: "26px", lineHeight: 1, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Calendar + Sidebar ─────────────────────────────────────────────── */}
      <div className="calendar-layout">

        {/* Calendar */}
        <div style={{ ...CARD, padding: "24px" }}>
          {/* Month nav */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))} style={navBtn}>‹</button>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "19px", letterSpacing: "-0.01em" }}>{MONTHS[month]} {year}</h2>
              <p style={{ color: "#6B7280", fontSize: "12px", marginTop: "2px" }}>{monthStats.holidays} holiday{monthStats.holidays !== 1 ? "s" : ""} · {monthStats.daysTraded} day{monthStats.daysTraded !== 1 ? "s" : ""} traded</p>
            </div>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))} style={navBtn}>›</button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px", marginBottom: "5px" }}>
            {WEEKDAYS.map((d, i) => (
              <div key={d} style={{ textAlign: "center", color: i >= 5 ? "#374151" : "#6B7280", fontSize: "11px", fontWeight: 600, padding: "2px 0", textTransform: "uppercase", letterSpacing: "0.04em" }}>{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "5px" }}>
            {Array.from({ length: rows * 7 }).map((_, i) => {
              const dayNum = i - startOffset + 1;
              const valid = dayNum >= 1 && dayNum <= lastDay.getDate();
              if (!valid) return <div key={i} style={{ minHeight: "76px" }} />;

              const ds = `${year}-${pad(month + 1)}-${pad(dayNum)}`;
              const holiday = getMarketHoliday(ds);
              const isWeekend = (i % 7) >= 5;
              const isToday = ds === todayStr;
              const isSel = ds === selected;
              const trade = pnlByDate[ds];

              let bg = "rgba(255,255,255,0.015)", border = "rgba(255,255,255,0.05)", dayColor = "#6B7280";
              let glow = "none";
              if (trade) {
                const intensity = Math.min(0.85, 0.22 + (Math.abs(trade.pnl) / maxAbs) * 0.6);
                if (trade.pnl > 0) { bg = `rgba(34,197,94,${intensity})`; border = "rgba(34,197,94,0.5)"; dayColor = "#fff"; glow = "0 0 14px rgba(34,197,94,0.2)"; }
                else if (trade.pnl < 0) { bg = `rgba(239,68,68,${intensity})`; border = "rgba(239,68,68,0.5)"; dayColor = "#fff"; glow = "0 0 14px rgba(239,68,68,0.2)"; }
                else { bg = "rgba(148,163,184,0.18)"; dayColor = "#E5E7EB"; }
              } else if (holiday) { bg = "rgba(251,146,60,0.1)"; border = "rgba(251,146,60,0.35)"; dayColor = "#fb923c"; }
              else if (isWeekend) { bg = "transparent"; dayColor = "#374151"; }

              return (
                <div key={i} className="mc-cell" onClick={() => setSelected(isSel ? null : ds)}
                  title={holiday ?? (trade ? `${trade.count} trade${trade.count > 1 ? "s" : ""} · ${money(trade.pnl)}` : undefined)}
                  style={{
                    minHeight: "76px", borderRadius: "10px", border: `1px solid ${isToday ? "#8B5CF6" : isSel ? "rgba(139,92,246,0.6)" : border}`,
                    background: bg, padding: "8px 9px", display: "flex", flexDirection: "column", justifyContent: "space-between",
                    cursor: "pointer", boxShadow: isToday ? "0 0 0 1px rgba(139,92,246,0.5), 0 0 16px rgba(139,92,246,0.2)" : glow,
                    animation: `mcPop 0.3s ease ${Math.min(i, 30) * 12}ms both`, position: "relative",
                  }}>
                  <span style={{ fontSize: "13px", fontWeight: isToday ? 800 : trade ? 700 : 500, color: isToday ? "#A78BFA" : dayColor, fontVariantNumeric: "tabular-nums" }}>{dayNum}</span>
                  {trade ? (
                    <div>
                      <div style={{ fontSize: "12px", fontWeight: 800, color: dayColor, fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{money(trade.pnl)}</div>
                      <div style={{ fontSize: "9px", color: trade.pnl !== 0 ? "rgba(255,255,255,0.7)" : "#6B7280", marginTop: "2px" }}>{trade.count} trade{trade.count > 1 ? "s" : ""}</div>
                    </div>
                  ) : holiday ? (
                    <span style={{ color: "#fb923c", fontSize: "9px", fontWeight: 800, letterSpacing: "0.03em", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>CLOSED</span>
                  ) : null}
                </div>
              );
            })}
          </div>

          {/* Selected day detail */}
          {selData && (
            <div style={{ marginTop: "16px", padding: "14px 16px", borderRadius: "12px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", animation: "mcIn 0.25s ease both" }}>
              <div style={{ color: "#9CA3AF", fontSize: "13px", fontWeight: 700 }}>{formatDate(selected!)}</div>
              {selData.holiday && <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#fb923c", fontSize: "12px", fontWeight: 600 }}>{icon(ICONS.flag, "#fb923c", 13)} {selData.holiday} — Market closed</span>}
              {selData.trade ? (
                <span style={{ display: "flex", alignItems: "center", gap: "12px", marginLeft: "auto" }}>
                  <span style={{ color: "#6B7280", fontSize: "12px" }}>{selData.trade.count} trade{selData.trade.count > 1 ? "s" : ""}</span>
                  <span style={{ color: selData.trade.pnl >= 0 ? "#22c55e" : "#ef4444", fontSize: "16px", fontWeight: 800, fontVariantNumeric: "tabular-nums" }}>{money(selData.trade.pnl)}</span>
                </span>
              ) : !selData.holiday && (
                <span style={{ color: "#4B5563", fontSize: "12px", marginLeft: "auto" }}>No trades logged this day</span>
              )}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: "flex", gap: "16px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.06)", flexWrap: "wrap" }}>
            {[
              { c: "rgba(34,197,94,0.7)", l: "Profit day" },
              { c: "rgba(239,68,68,0.7)", l: "Loss day" },
              { c: "rgba(251,146,60,0.1)", b: "rgba(251,146,60,0.4)", l: "Market closed" },
              { c: "rgba(139,92,246,0.1)", b: "#8B5CF6", l: "Today" },
            ].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "11px", height: "11px", borderRadius: "3px", backgroundColor: x.c, border: `1px solid ${x.b ?? "rgba(255,255,255,0.1)"}` }} />
                <span style={{ color: "#6B7280", fontSize: "11px" }}>{x.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Live Market Sessions */}
          <div style={{ ...CARD, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              {icon(ICONS.globe, "#9CA3AF", 15)}
              <h3 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "14px", margin: 0 }}>Live Market Sessions</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {SESSIONS.map(s => {
                const open = utcHour >= 0 && sessionOpen(s, Math.floor(utcHour));
                const span = (s.close - s.open + 24) % 24 || 24;
                const elapsed = open ? ((utcHour - s.open + 24) % 24) : 0;
                const prog = open ? Math.min(100, (elapsed / span) * 100) : 0;
                return (
                  <div key={s.name}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: open ? "#22c55e" : "#374151", boxShadow: open ? "0 0 8px #22c55e" : "none" }} />
                        <span style={{ color: "#E5E7EB", fontSize: "13px", fontWeight: 600 }}>{s.name}</span>
                        <span style={{ color: "#4B5563", fontSize: "11px", fontVariantNumeric: "tabular-nums" }}>{pad(s.open)}:00–{pad(s.close)}:00</span>
                      </div>
                      <span style={{ color: open ? "#22c55e" : "#6B7280", fontSize: "11px", fontWeight: 700 }}>{open ? "OPEN" : "Closed"}</span>
                    </div>
                    <div style={{ height: "5px", borderRadius: "3px", background: "rgba(255,255,255,0.05)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${prog}%`, background: `linear-gradient(90deg, ${s.color}aa, ${s.color})`, borderRadius: "3px", transformOrigin: "left", animation: "mcGrowX 0.7s cubic-bezier(.22,1,.36,1) both", boxShadow: open ? `0 0 8px ${s.color}77` : "none" }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <p style={{ color: "#4B5563", fontSize: "11px", marginTop: "14px" }}>Approx. FX session hours in UTC.</p>
          </div>

          {/* Upcoming Holidays */}
          <div style={{ ...CARD, padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              {icon(ICONS.flag, "#9CA3AF", 15)}
              <h3 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "14px", margin: 0 }}>Upcoming Holidays</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {upcomingHolidays.map(({ date, name }) => {
                const dl = daysUntil(date);
                const soon = dl === "Today" || dl === "Tomorrow";
                return (
                  <div key={date} style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "12px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.25)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ color: "#fb923c", fontSize: "14px", fontWeight: 800, lineHeight: 1 }}>{new Date(date + "T00:00:00").getDate()}</span>
                      <span style={{ color: "#fb923c", fontSize: "8px", fontWeight: 600, opacity: 0.8, textTransform: "uppercase" }}>{MONTHS[new Date(date + "T00:00:00").getMonth()].slice(0, 3)}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "#F9FAFB", fontSize: "13px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                      <p style={{ color: "#4B5563", fontSize: "11px", marginTop: "1px" }}>{formatDate(date)}</p>
                    </div>
                    <span style={{ color: soon ? "#fb923c" : "#6B7280", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}>{dl}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All holidays this year */}
          <div style={{ ...CARD, padding: "20px" }}>
            <h3 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "14px", marginBottom: "14px" }}>All Holidays {year}</h3>
            {yearHolidays.length === 0 ? (
              <p style={{ color: "#4B5563", fontSize: "13px" }}>No data for {year}.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                {yearHolidays.map(({ date, name }) => {
                  const past = todayStr ? date < todayStr : false;
                  return (
                    <div key={date} style={{ display: "flex", gap: "10px", alignItems: "center", opacity: past ? 0.4 : 1 }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: past ? "#374151" : "#fb923c", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: "#D1D5DB", fontSize: "12px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                      </div>
                      <span style={{ color: "#4B5563", fontSize: "11px", flexShrink: 0 }}>{new Date(date + "T00:00:00").toLocaleDateString("en-US", { day: "2-digit", month: "short" })}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px",
  color: "#9CA3AF", cursor: "pointer", padding: "8px 16px", fontSize: "18px", lineHeight: 1, transition: "all .15s",
};
