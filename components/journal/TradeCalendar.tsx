"use client";
import { useState, useMemo } from "react";

interface Trade {
  trade_date: string;
  profit_loss: number;
}

interface Props {
  trades: Trade[];
}

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const MONTHS = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
];

export default function TradeCalendar({ trades }: Props) {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Group trades by date
  const tradesByDate = useMemo(() => {
    const map: Record<string, { pnl: number; count: number }> = {};
    trades.forEach((t) => {
      const d = t.trade_date.slice(0, 10);
      if (!map[d]) map[d] = { pnl: 0, count: 0 };
      map[d].pnl += t.profit_loss;
      map[d].count += 1;
    });
    return map;
  }, [trades]);

  // Build calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday = 0, Sunday = 6
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = startOffset + lastDay.getDate();
  const rows = Math.ceil(totalCells / 7);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  // Stats for this month
  const monthTrades = Object.entries(tradesByDate).filter(([d]) => {
    const date = new Date(d);
    return date.getFullYear() === year && date.getMonth() === month;
  });
  const monthPnl = monthTrades.reduce((s, [, v]) => s + v.pnl, 0);
  const greenDays = monthTrades.filter(([, v]) => v.pnl > 0).length;
  const redDays = monthTrades.filter(([, v]) => v.pnl < 0).length;

  return (
    <div style={{
      backgroundColor: "#111827",
      border: "1px solid #1F2937",
      borderRadius: "16px",
      padding: "24px",
      marginBottom: "32px",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={prevMonth} style={{
            background: "none", border: "1px solid #1F2937", borderRadius: "8px",
            color: "#9CA3AF", cursor: "pointer", padding: "6px 12px", fontSize: "16px",
          }}>‹</button>
          <h3 style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "16px", minWidth: "160px", textAlign: "center" }}>
            {MONTHS[month]} {year}
          </h3>
          <button onClick={nextMonth} disabled={isCurrentMonth} style={{
            background: "none", border: "1px solid #1F2937", borderRadius: "8px",
            color: isCurrentMonth ? "#374151" : "#9CA3AF",
            cursor: isCurrentMonth ? "not-allowed" : "pointer", padding: "6px 12px", fontSize: "16px",
          }}>›</button>
        </div>

        {/* Month stats */}
        <div style={{ display: "flex", gap: "24px", fontSize: "13px" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#6B7280", marginBottom: "2px" }}>Trades-Tage</p>
            <p style={{ color: "#F9FAFB", fontWeight: 600 }}>{monthTrades.length}</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#6B7280", marginBottom: "2px" }}>Grüne Tage</p>
            <p style={{ color: "#22c55e", fontWeight: 600 }}>{greenDays}</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#6B7280", marginBottom: "2px" }}>Rote Tage</p>
            <p style={{ color: "#ef4444", fontWeight: 600 }}>{redDays}</p>
          </div>
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#6B7280", marginBottom: "2px" }}>Monats-P&L</p>
            <p style={{ color: monthPnl >= 0 ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
              {monthPnl >= 0 ? "+" : ""}{monthPnl.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "4px" }}>
        {WEEKDAYS.map((d) => (
          <div key={d} style={{ textAlign: "center", color: "#6B7280", fontSize: "12px", fontWeight: 500, padding: "4px 0" }}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
        {Array.from({ length: rows * 7 }).map((_, i) => {
          const dayNum = i - startOffset + 1;
          const isValid = dayNum >= 1 && dayNum <= lastDay.getDate();
          const isToday = isValid && year === today.getFullYear() && month === today.getMonth() && dayNum === today.getDate();

          if (!isValid) {
            return <div key={i} style={{ height: "64px" }} />;
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const data = tradesByDate[dateStr];

          let bg = "transparent";
          let borderColor = "#1F2937";
          let pnlColor = "#9CA3AF";

          if (data) {
            if (data.pnl > 0) {
              bg = "rgba(34, 197, 94, 0.1)";
              borderColor = "rgba(34, 197, 94, 0.4)";
              pnlColor = "#22c55e";
            } else if (data.pnl < 0) {
              bg = "rgba(239, 68, 68, 0.1)";
              borderColor = "rgba(239, 68, 68, 0.4)";
              pnlColor = "#ef4444";
            } else {
              bg = "rgba(107, 114, 128, 0.1)";
              borderColor = "rgba(107, 114, 128, 0.4)";
            }
          }

          return (
            <div key={i} style={{
              height: "64px",
              borderRadius: "8px",
              border: `1px solid ${isToday ? "#8B5CF6" : borderColor}`,
              backgroundColor: isToday && !data ? "rgba(139, 92, 246, 0.05)" : bg,
              padding: "6px 8px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              boxShadow: isToday ? "0 0 0 1px rgba(139,92,246,0.5)" : undefined,
            }}>
              <span style={{
                fontSize: "12px",
                fontWeight: isToday ? 700 : 400,
                color: isToday ? "#8B5CF6" : data ? "#F9FAFB" : "#4B5563",
              }}>
                {dayNum}
              </span>
              {data && (
                <div>
                  <p style={{ color: pnlColor, fontSize: "11px", fontWeight: 600, lineHeight: 1 }}>
                    {data.pnl >= 0 ? "+" : ""}{data.pnl.toFixed(0)}
                  </p>
                  <p style={{ color: "#6B7280", fontSize: "10px", marginTop: "1px" }}>
                    {data.count} Trade{data.count > 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
