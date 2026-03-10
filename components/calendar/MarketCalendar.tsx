"use client";
import { useState } from "react";
import { getMarketHoliday, getHolidaysForYear, getUpcomingHolidays } from "@/lib/market-holidays";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" });
}

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `in ${diff} days`;
}

export default function MarketCalendar() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const totalCells = startOffset + lastDay.getDate();
  const rows = Math.ceil(totalCells / 7);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const yearHolidays = getHolidaysForYear(year);
  const upcomingHolidays = getUpcomingHolidays(6);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>

      {/* Header */}
      <div>
        <h1 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "22px" }}>Market Calendar</h1>
        <p style={{ color: "#6B7280", fontSize: "13px", marginTop: "2px" }}>
          NYSE / USD – Days when the market is closed
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "24px", alignItems: "start" }}>

        {/* Calendar */}
        <div style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "24px" }}>

          {/* Month Navigation */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <button onClick={prevMonth} style={{
              background: "none", border: "1px solid #1F2937", borderRadius: "8px",
              color: "#9CA3AF", cursor: "pointer", padding: "6px 14px", fontSize: "16px",
            }}>‹</button>
            <div style={{ textAlign: "center" }}>
              <h2 style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "18px" }}>
                {MONTHS[month]} {year}
              </h2>
              <p style={{ color: "#4B5563", fontSize: "12px", marginTop: "2px" }}>
                {yearHolidays.filter(h => new Date(h.date + "T00:00:00").getMonth() === month).length} holidays this month
              </p>
            </div>
            <button onClick={nextMonth} style={{
              background: "none", border: "1px solid #1F2937", borderRadius: "8px",
              color: "#9CA3AF", cursor: "pointer", padding: "6px 14px", fontSize: "16px",
            }}>›</button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px", marginBottom: "4px" }}>
            {WEEKDAYS.map((d, i) => (
              <div key={d} style={{
                textAlign: "center",
                color: i >= 5 ? "#374151" : "#6B7280",
                fontSize: "12px",
                fontWeight: 500,
                padding: "4px 0",
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "4px" }}>
            {Array.from({ length: rows * 7 }).map((_, i) => {
              const dayNum = i - startOffset + 1;
              const isValid = dayNum >= 1 && dayNum <= lastDay.getDate();

              if (!isValid) return <div key={i} style={{ height: "72px" }} />;

              const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const holiday = getMarketHoliday(dateStr);
              const dayOfWeek = (i % 7); // 0=Mo, 6=So
              const isWeekend = dayOfWeek >= 5;
              const isToday = year === today.getFullYear() && month === today.getMonth() && dayNum === today.getDate();
              const isPast = new Date(dateStr + "T00:00:00") < new Date(today.getFullYear(), today.getMonth(), today.getDate());

              let bg = "transparent";
              let borderColor = "#1F2937";
              let dayColor = "#9CA3AF";

              if (isToday) {
                borderColor = "#8B5CF6";
                bg = "rgba(139, 92, 246, 0.08)";
                dayColor = "#A78BFA";
              } else if (holiday) {
                bg = "rgba(251, 146, 60, 0.1)";
                borderColor = "rgba(251, 146, 60, 0.4)";
                dayColor = "#fb923c";
              } else if (isWeekend) {
                dayColor = "#374151";
              } else if (isPast) {
                dayColor = "#4B5563";
              } else {
                dayColor = "#9CA3AF";
              }

              return (
                <div key={i} title={holiday ?? undefined} style={{
                  height: "72px",
                  borderRadius: "8px",
                  border: `1px solid ${borderColor}`,
                  backgroundColor: bg,
                  padding: "8px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: isToday ? "0 0 0 1px rgba(139,92,246,0.4)" : undefined,
                }}>
                  <span style={{ fontSize: "13px", fontWeight: isToday ? 700 : 400, color: dayColor }}>
                    {dayNum}
                  </span>
                  {holiday && (
                    <p style={{
                      color: "#fb923c",
                      fontSize: "9px",
                      fontWeight: 700,
                      lineHeight: 1.3,
                      overflow: "hidden",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}>
                      CLOSED
                    </p>
                  )}
                  {!holiday && isWeekend && (
                    <p style={{ color: "#1F2937", fontSize: "9px" }}>—</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: "20px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #1F2937" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.4)" }} />
              <span style={{ color: "#6B7280", fontSize: "12px" }}>Market Closed</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "rgba(139,92,246,0.08)", border: "1px solid #8B5CF6" }} />
              <span style={{ color: "#6B7280", fontSize: "12px" }}>Today</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "transparent", border: "1px solid #1F2937" }} />
              <span style={{ color: "#6B7280", fontSize: "12px" }}>Trading Day</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Upcoming Holidays */}
          <div style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "20px" }}>
            <h3 style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "14px", marginBottom: "16px" }}>
              Upcoming Holidays
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {upcomingHolidays.map(({ date, name }) => (
                <div key={date} style={{ display: "flex", flexDirection: "column", gap: "2px", paddingBottom: "10px", borderBottom: "1px solid #1F2937" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: "#F9FAFB", fontSize: "13px", fontWeight: 500 }}>{name}</span>
                    <span style={{ color: "#fb923c", fontSize: "11px", fontWeight: 600 }}>{daysUntil(date)}</span>
                  </div>
                  <span style={{ color: "#4B5563", fontSize: "11px" }}>{formatDate(date)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* All holidays this year */}
          <div style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "20px" }}>
            <h3 style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "14px", marginBottom: "16px" }}>
              All Holidays {year}
            </h3>
            {yearHolidays.length === 0 ? (
              <p style={{ color: "#4B5563", fontSize: "13px" }}>No data for {year}.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {yearHolidays.map(({ date, name }) => {
                  const isPast = date < new Date().toISOString().slice(0, 10);
                  return (
                    <div key={date} style={{ display: "flex", gap: "10px", alignItems: "center", opacity: isPast ? 0.45 : 1 }}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: isPast ? "#374151" : "#fb923c", flexShrink: 0 }} />
                      <div>
                        <p style={{ color: "#D1D5DB", fontSize: "12px", fontWeight: 500 }}>{name}</p>
                        <p style={{ color: "#4B5563", fontSize: "11px" }}>{formatDate(date)}</p>
                      </div>
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
