// NYSE / US Market Holidays (relevant für USD Trading)
// Markt geschlossen an diesen Tagen

const HOLIDAYS: Record<string, string> = {
  // 2024
  "2024-01-01": "New Year's Day",
  "2024-01-15": "Martin Luther King Jr. Day",
  "2024-02-19": "Presidents Day",
  "2024-03-29": "Good Friday",
  "2024-05-27": "Memorial Day",
  "2024-06-19": "Juneteenth",
  "2024-07-04": "Independence Day",
  "2024-09-02": "Labor Day",
  "2024-11-28": "Thanksgiving",
  "2024-12-25": "Christmas Day",

  // 2025
  "2025-01-01": "New Year's Day",
  "2025-01-09": "National Day of Mourning",
  "2025-01-20": "Martin Luther King Jr. Day",
  "2025-02-17": "Presidents Day",
  "2025-04-18": "Good Friday",
  "2025-05-26": "Memorial Day",
  "2025-06-19": "Juneteenth",
  "2025-07-04": "Independence Day",
  "2025-09-01": "Labor Day",
  "2025-11-27": "Thanksgiving",
  "2025-12-25": "Christmas Day",

  // 2026
  "2026-01-01": "New Year's Day",
  "2026-01-19": "Martin Luther King Jr. Day",
  "2026-02-16": "Presidents Day",
  "2026-04-03": "Good Friday",
  "2026-05-25": "Memorial Day",
  "2026-06-19": "Juneteenth",
  "2026-07-03": "Independence Day (observed)",
  "2026-09-07": "Labor Day",
  "2026-11-26": "Thanksgiving",
  "2026-12-25": "Christmas Day",

  // 2027
  "2027-01-01": "New Year's Day",
  "2027-01-18": "Martin Luther King Jr. Day",
  "2027-02-15": "Presidents Day",
  "2027-03-26": "Good Friday",
  "2027-05-31": "Memorial Day",
  "2027-06-18": "Juneteenth (observed)",
  "2027-07-05": "Independence Day (observed)",
  "2027-09-06": "Labor Day",
  "2027-11-25": "Thanksgiving",
  "2027-12-24": "Christmas Day (observed)",
};

export function getMarketHoliday(dateStr: string): string | null {
  return HOLIDAYS[dateStr] ?? null;
}

export function isMarketHoliday(dateStr: string): boolean {
  return dateStr in HOLIDAYS;
}

export function getHolidaysForYear(year: number): Array<{ date: string; name: string }> {
  return Object.entries(HOLIDAYS)
    .filter(([date]) => date.startsWith(String(year)))
    .map(([date, name]) => ({ date, name }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getUpcomingHolidays(count = 5): Array<{ date: string; name: string }> {
  const today = new Date().toISOString().slice(0, 10);
  return Object.entries(HOLIDAYS)
    .filter(([date]) => date >= today)
    .map(([date, name]) => ({ date, name }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, count);
}
