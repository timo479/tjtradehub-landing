"use client";
import { useMemo } from "react";

interface FieldValue {
  id: string;
  field_id: string;
  value: string;
  template_fields: { id: string; label: string; field_type: string };
}

interface Entry {
  id: string;
  trade_date: string;
  template_id: string;
  journal_templates: { id: string; name: string; version: number };
  trade_field_values: FieldValue[];
}

interface Props {
  entries: Entry[];
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const getPnl = (entry: Entry): number | null => {
  for (const fv of entry.trade_field_values ?? []) {
    const label = (fv.template_fields?.label ?? "").toLowerCase();
    if (
      fv.template_fields?.field_type === "number" &&
      (label.includes("p&l") || label.includes("pnl") || label.includes("profit") || label.includes("gewinn"))
    ) {
      const n = parseFloat(fv.value);
      return isNaN(n) ? null : n;
    }
  }
  return null;
};

const fmt = (n: number, digits = 2) =>
  `${n >= 0 ? "+" : ""}${n.toFixed(digits)}`;

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

// ─── Sub-Components ──────────────────────────────────────────────────────────

function KpiCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "14px", padding: "18px 20px" }}>
      <p style={{ color: "#6B7280", fontSize: "11px", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</p>
      <p style={{ color, fontWeight: 700, fontSize: "22px", lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color: "#4B5563", fontSize: "11px", marginTop: "4px" }}>{sub}</p>}
    </div>
  );
}

function EquityCurve({ entries }: { entries: Entry[] }) {
  const data = useMemo(() => {
    const sorted = [...entries]
      .filter(e => getPnl(e) !== null)
      .sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
    let cum = 0;
    return sorted.map(e => {
      const pnl = getPnl(e)!;
      cum += pnl;
      return { cum, pnl };
    });
  }, [entries]);

  if (data.length < 2) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "160px", color: "#374151", fontSize: "13px" }}>
      Mindestens 2 Trades mit P&L nötig
    </div>
  );

  const W = 600, H = 160;
  const PL = 48, PR = 12, PT = 12, PB = 24;
  const cW = W - PL - PR, cH = H - PT - PB;

  const min = Math.min(0, ...data.map(d => d.cum));
  const max = Math.max(0, ...data.map(d => d.cum));
  const range = max - min || 1;

  const sx = (i: number) => PL + (i / (data.length - 1)) * cW;
  const sy = (v: number) => PT + cH - ((v - min) / range) * cH;
  const z = sy(0);

  const linePath = data.map((d, i) => `${i === 0 ? "M" : "L"}${sx(i).toFixed(1)},${sy(d.cum).toFixed(1)}`).join(" ");
  const fillPath = `${linePath} L${sx(data.length - 1).toFixed(1)},${z.toFixed(1)} L${PL},${z.toFixed(1)} Z`;

  const last = data[data.length - 1].cum;
  const color = last >= 0 ? "#22c55e" : "#ef4444";

  // Y axis labels
  const yLabels = [min, (min + max) / 2, max].map(v => ({ v, y: sy(v) }));

  // X axis labels (first + last date)
  const sorted = [...entries].filter(e => getPnl(e) !== null).sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
  const firstDate = sorted[0]?.trade_date ? new Date(sorted[0].trade_date).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" }) : "";
  const lastDate = sorted[sorted.length - 1]?.trade_date ? new Date(sorted[sorted.length - 1].trade_date).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit" }) : "";

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }}>
      <defs>
        <linearGradient id="eq-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yLabels.map(({ y }, i) => (
        <line key={i} x1={PL} y1={y} x2={W - PR} y2={y} stroke="#1F2937" strokeWidth="1" strokeDasharray="4,4" />
      ))}
      {/* Zero line */}
      <line x1={PL} y1={z} x2={W - PR} y2={z} stroke="#374151" strokeWidth="1" />

      {/* Fill */}
      <path d={fillPath} fill="url(#eq-fill)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* End dot */}
      <circle cx={sx(data.length - 1)} cy={sy(last)} r="4" fill={color} />

      {/* Y labels */}
      {yLabels.map(({ v, y }, i) => (
        <text key={i} x={PL - 6} y={y + 4} textAnchor="end" fill="#4B5563" fontSize="10">
          {v.toFixed(0)}
        </text>
      ))}

      {/* X labels */}
      <text x={PL} y={H - 4} textAnchor="start" fill="#4B5563" fontSize="10">{firstDate}</text>
      <text x={W - PR} y={H - 4} textAnchor="end" fill="#4B5563" fontSize="10">{lastDate}</text>
    </svg>
  );
}

function WinLossDonut({ wins, losses }: { wins: number; losses: number }) {
  const total = wins + losses;
  if (total === 0) return <div style={{ color: "#374151", fontSize: "13px", textAlign: "center", padding: "20px" }}>Keine Daten</div>;

  const winPct = wins / total;
  const R = 40, CX = 56, CY = 56, stroke = 12;
  const circ = 2 * Math.PI * R;
  const winDash = circ * winPct;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
      <svg width="112" height="112" viewBox="0 0 112 112" style={{ flexShrink: 0 }}>
        {/* Background ring */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#1F2937" strokeWidth={stroke} />
        {/* Loss arc */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#ef4444" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={0}
          strokeLinecap="butt" transform={`rotate(-90 ${CX} ${CY})`} opacity="0.3" />
        {/* Win arc */}
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#22c55e" strokeWidth={stroke}
          strokeDasharray={`${winDash} ${circ - winDash}`}
          strokeLinecap="butt" transform={`rotate(-90 ${CX} ${CY})`} />
        {/* Center text */}
        <text x={CX} y={CY - 4} textAnchor="middle" fill="#F9FAFB" fontSize="14" fontWeight="700">
          {Math.round(winPct * 100)}%
        </text>
        <text x={CX} y={CY + 12} textAnchor="middle" fill="#6B7280" fontSize="9">Win Rate</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#22c55e", flexShrink: 0 }} />
          <span style={{ color: "#9CA3AF", fontSize: "13px" }}>{wins} Wins</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#ef4444", flexShrink: 0 }} />
          <span style={{ color: "#9CA3AF", fontSize: "13px" }}>{losses} Losses</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: "#374151", flexShrink: 0 }} />
          <span style={{ color: "#9CA3AF", fontSize: "13px" }}>{total - wins - losses} Break-even</span>
        </div>
      </div>
    </div>
  );
}

function WeekdayBars({ entries }: { entries: Entry[] }) {
  const bars = useMemo(() => {
    const map: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] };
    for (const e of entries) {
      const pnl = getPnl(e);
      if (pnl === null) continue;
      const dow = new Date(e.trade_date).getDay();
      map[dow].push(pnl);
    }
    return [1, 2, 3, 4, 5, 6, 0].map((d, i) => {
      const vals = map[d];
      const avg = vals.length > 0 ? vals.reduce((s, v) => s + v, 0) / vals.length : 0;
      return { label: DAYS[i], avg, count: vals.length };
    });
  }, [entries]);

  const maxAbs = Math.max(1, ...bars.map(b => Math.abs(b.avg)));
  const H = 100, barW = 32, gap = 12;
  const totalW = bars.length * (barW + gap) - gap + 20;

  return (
    <svg viewBox={`0 0 ${totalW} ${H + 28}`} style={{ width: "100%", height: "auto", display: "block" }}>
      {bars.map((b, i) => {
        const x = i * (barW + gap) + 10;
        const pct = b.avg / maxAbs;
        const barH = Math.abs(pct) * (H / 2 - 4);
        const color = b.avg >= 0 ? "#22c55e" : "#ef4444";
        const midY = H / 2;
        const rectY = b.avg >= 0 ? midY - barH : midY;

        return (
          <g key={b.label}>
            {/* Zero line */}
            {i === 0 && <line x1={0} y1={midY} x2={totalW} y2={midY} stroke="#1F2937" strokeWidth="1" />}
            {/* Bar */}
            {b.count > 0 && (
              <rect
                x={x} y={rectY} width={barW} height={Math.max(barH, 2)}
                rx="4" fill={color} opacity="0.8"
              />
            )}
            {/* Value label */}
            {b.count > 0 && (
              <text
                x={x + barW / 2} y={b.avg >= 0 ? rectY - 4 : rectY + barH + 12}
                textAnchor="middle" fill={color} fontSize="9" fontWeight="600"
              >
                {b.avg.toFixed(1)}
              </text>
            )}
            {/* Day label */}
            <text x={x + barW / 2} y={H + 14} textAnchor="middle" fill="#6B7280" fontSize="10">{b.label}</text>
            {/* Count */}
            <text x={x + barW / 2} y={H + 24} textAnchor="middle" fill="#374151" fontSize="8">{b.count > 0 ? `${b.count}x` : ""}</text>
          </g>
        );
      })}
    </svg>
  );
}

function TradeCalendar({ entries }: { entries: Entry[] }) {
  const today = new Date();

  const months = useMemo(() => {
    const result = [];
    for (let m = 2; m >= 0; m--) {
      const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
      result.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    return result;
  }, []);

  const pnlByDate = useMemo(() => {
    const map: Record<string, { pnl: number; count: number }> = {};
    for (const e of entries) {
      const key = e.trade_date.slice(0, 10);
      const pnl = getPnl(e) ?? 0;
      if (!map[key]) map[key] = { pnl: 0, count: 0 };
      map[key].pnl += pnl;
      map[key].count += 1;
    }
    return map;
  }, [entries]);

  const cellColor = (key: string) => {
    const d = pnlByDate[key];
    if (!d) return "#0d1117";
    if (d.pnl > 0) return `rgba(34,197,94,${Math.min(0.9, 0.3 + d.pnl / 200)})`;
    if (d.pnl < 0) return `rgba(239,68,68,${Math.min(0.9, 0.3 + Math.abs(d.pnl) / 200)})`;
    return "rgba(107,114,128,0.3)";
  };

  return (
    <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
      {months.map(({ year, month }) => {
        const firstDay = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        // Monday-based: Mon=0 … Sun=6
        let startOffset = firstDay.getDay() - 1;
        if (startOffset < 0) startOffset = 6;

        const cells: (number | null)[] = [
          ...Array(startOffset).fill(null),
          ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
        ];
        // pad to full weeks
        while (cells.length % 7 !== 0) cells.push(null);

        return (
          <div key={`${year}-${month}`} style={{ flex: "1 1 180px", minWidth: "180px" }}>
            <p style={{ color: "#9CA3AF", fontSize: "12px", fontWeight: 600, marginBottom: "8px" }}>
              {MONTHS[month]} {year}
            </p>
            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", marginBottom: "3px" }}>
              {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => (
                <div key={d} style={{ textAlign: "center", color: "#374151", fontSize: "9px" }}>{d}</div>
              ))}
            </div>
            {/* Day cells */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px" }}>
              {cells.map((day, i) => {
                if (!day) return <div key={i} />;
                const key = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const d = pnlByDate[key];
                const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                return (
                  <div
                    key={i}
                    title={d ? `${d.count} Trade${d.count > 1 ? "s" : ""} · P&L: ${fmt(d.pnl)}` : String(day)}
                    style={{
                      aspectRatio: "1",
                      borderRadius: "3px",
                      backgroundColor: cellColor(key),
                      border: isToday ? "1px solid #8B5CF6" : "1px solid transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "8px",
                      color: d ? "#F9FAFB" : "#374151",
                      cursor: d ? "default" : "default",
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main StatsView ──────────────────────────────────────────────────────────

export default function StatsView({ entries }: Props) {
  const stats = useMemo(() => {
    const pnlEntries = entries.map(e => ({ e, pnl: getPnl(e) })).filter(x => x.pnl !== null) as { e: Entry; pnl: number }[];
    const pnls = pnlEntries.map(x => x.pnl);
    const total = pnls.reduce((s, v) => s + v, 0);
    const wins = pnls.filter(v => v > 0).length;
    const losses = pnls.filter(v => v < 0).length;
    const avg = pnls.length > 0 ? total / pnls.length : 0;
    const best = pnls.length > 0 ? Math.max(...pnls) : 0;
    const worst = pnls.length > 0 ? Math.min(...pnls) : 0;

    // Max Drawdown
    let peak = 0, cum = 0, maxDD = 0;
    const sorted = [...pnlEntries].sort((a, b) => new Date(a.e.trade_date).getTime() - new Date(b.e.trade_date).getTime());
    for (const { pnl } of sorted) {
      cum += pnl;
      if (cum > peak) peak = cum;
      const dd = peak - cum;
      if (dd > maxDD) maxDD = dd;
    }

    // Streak
    let streak = 0, currentStreak = 0;
    let streakType: "win" | "loss" | null = null;
    for (const pnl of [...pnls].reverse()) {
      const type = pnl > 0 ? "win" : "loss";
      if (streakType === null) streakType = type;
      if (type === streakType) { currentStreak++; streak = currentStreak; }
      else break;
    }

    return { total, wins, losses, avg, best, worst, maxDD, streak, streakType, hasPnl: pnls.length > 0, pnlCount: pnls.length };
  }, [entries]);

  const card: React.CSSProperties = {
    backgroundColor: "#111827",
    border: "1px solid #1F2937",
    borderRadius: "16px",
    padding: "20px 24px",
  };

  const sectionTitle = (title: string) => (
    <p style={{ color: "#6B7280", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "16px" }}>{title}</p>
  );

  if (entries.length === 0) {
    return (
      <div style={{ ...card, textAlign: "center", padding: "60px" }}>
        <p style={{ fontSize: "36px", marginBottom: "12px" }}>📊</p>
        <p style={{ color: "#4B5563", fontSize: "14px" }}>Noch keine Trades – Statistiken erscheinen sobald du Trades erfasst.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "12px" }}>
        <KpiCard label="Trades gesamt" value={String(entries.length)} color="#F9FAFB" />
        {stats.hasPnl && <>
          <KpiCard label="Gesamt P&L" value={fmt(stats.total)} color={stats.total >= 0 ? "#22c55e" : "#ef4444"} />
          <KpiCard label="Win Rate" value={`${stats.pnlCount > 0 ? Math.round((stats.wins / stats.pnlCount) * 100) : 0}%`} color={stats.wins / (stats.pnlCount || 1) >= 0.5 ? "#22c55e" : "#ef4444"} sub={`${stats.wins}W · ${stats.losses}L`} />
          <KpiCard label="Ø P&L / Trade" value={fmt(stats.avg)} color={stats.avg >= 0 ? "#22c55e" : "#ef4444"} />
          <KpiCard label="Bester Trade" value={fmt(stats.best)} color="#22c55e" />
          <KpiCard label="Schlechtester Trade" value={fmt(stats.worst)} color="#ef4444" />
          <KpiCard label="Max. Drawdown" value={`-${stats.maxDD.toFixed(2)}`} color="#F59E0B" />
          <KpiCard
            label="Aktuelle Serie"
            value={`${stats.streak}x ${stats.streakType === "win" ? "Win" : "Loss"}`}
            color={stats.streakType === "win" ? "#22c55e" : "#ef4444"}
          />
        </>}
      </div>

      {/* Equity Curve */}
      {stats.hasPnl && (
        <div style={card}>
          {sectionTitle("Equity Kurve")}
          <EquityCurve entries={entries} />
        </div>
      )}

      {/* Win/Loss + Weekday */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {stats.hasPnl && (
          <div style={card}>
            {sectionTitle("Win / Loss")}
            <WinLossDonut wins={stats.wins} losses={stats.losses} />
          </div>
        )}
        {stats.hasPnl && (
          <div style={card}>
            {sectionTitle("Ø P&L nach Wochentag")}
            <WeekdayBars entries={entries} />
          </div>
        )}
      </div>

      {/* Calendar */}
      <div style={card}>
        {sectionTitle("Trade Kalender")}
        <TradeCalendar entries={entries} />
        <div style={{ display: "flex", gap: "16px", marginTop: "14px", flexWrap: "wrap" }}>
          {[
            { color: "rgba(34,197,94,0.6)", label: "Positiver Tag" },
            { color: "rgba(239,68,68,0.6)", label: "Negativer Tag" },
            { color: "rgba(107,114,128,0.3)", label: "Break-even / kein P&L" },
            { color: "#0d1117", label: "Kein Trade" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", backgroundColor: l.color, border: "1px solid #1F2937" }} />
              <span style={{ color: "#4B5563", fontSize: "11px" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
