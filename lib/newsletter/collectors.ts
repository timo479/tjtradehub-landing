/**
 * Newsletter data collectors.
 * Each function pulls structured data from one source.
 * The output is later fed to Claude (lib/newsletter/generateContent.ts)
 * which turns it into the actual newsletter copy.
 */

import { db } from "@/lib/db";
import { getHolidaysForYear, getUpcomingHolidays } from "@/lib/market-holidays";

// ============================================================
// Helpers
// ============================================================

/** Returns the Monday (UTC) of the week containing `date`. */
export function getWeekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay(); // 0 = Sunday, 1 = Monday
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

/** Adds n days to a date (UTC). */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

/** YYYY-MM-DD */
export function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ============================================================
// Field-extraction helpers (JournalV2 schema is template-based,
// so labels like "P&L", "Symbol" vary per user)
// ============================================================

type FieldValue = {
  value: string;
  template_fields: { label: string | null; field_type: string | null } | null;
};
type EntryWithFields = {
  id: string;
  trade_date: string | null;
  user_id?: string;
  trade_field_values: FieldValue[] | null;
};

function extractPnl(entry: EntryWithFields): number | null {
  for (const fv of entry.trade_field_values ?? []) {
    const label = (fv.template_fields?.label ?? "").toLowerCase();
    if (
      fv.template_fields?.field_type === "number" &&
      (label.includes("p&l") || label.includes("pnl") || label === "profit" || label.includes("gewinn") || label.includes("gain"))
    ) {
      const n = parseFloat(fv.value);
      return isNaN(n) ? null : n;
    }
  }
  return null;
}

function extractSymbol(entry: EntryWithFields): string | null {
  for (const fv of entry.trade_field_values ?? []) {
    const label = (fv.template_fields?.label ?? "").toLowerCase();
    if (label.includes("symbol") || label.includes("pair") || label.includes("instrument") || label.includes("ticker")) {
      const v = (fv.value ?? "").trim().toUpperCase();
      if (v) return v;
    }
  }
  return null;
}

function extractRating(entry: EntryWithFields): number | null {
  for (const fv of entry.trade_field_values ?? []) {
    if ((fv.template_fields?.label ?? "").toLowerCase().includes("rating")) {
      const n = parseFloat(fv.value);
      return isNaN(n) ? null : n;
    }
  }
  return null;
}

// ============================================================
// 1) MARKET NEWS
// Claude generates the actual copy. We only feed it dates,
// holidays this week, and upcoming closures.
// ============================================================

export interface MarketNewsData {
  weekStart: string;
  weekEnd: string;
  holidaysThisWeek: { date: string; name: string }[];
  upcomingHolidays: { date: string; name: string; daysAway: number }[];
}

export function collectMarketNews(weekStart: Date): MarketNewsData {
  const weekEnd = addDays(weekStart, 6);
  const startIso = toIsoDate(weekStart);
  const endIso = toIsoDate(weekEnd);

  const yearHolidays = getHolidaysForYear(weekStart.getUTCFullYear());
  const holidaysThisWeek = yearHolidays
    .filter((h) => h.date >= startIso && h.date <= endIso)
    .map((h) => ({ date: h.date, name: h.name }));

  const upcoming = getUpcomingHolidays(4).map((h) => {
    const target = new Date(h.date + "T00:00:00Z");
    const daysAway = Math.round((target.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
    return { date: h.date, name: h.name, daysAway };
  });

  return {
    weekStart: startIso,
    weekEnd: endIso,
    holidaysThisWeek,
    upcomingHolidays: upcoming,
  };
}

// ============================================================
// 2) COMMUNITY STATS
// Aggregates across ALL users for the given week.
// ============================================================

export interface CommunityStats {
  weekStart: string;
  weekEnd: string;
  totalTrades: number;
  activeTraders: number;
  newUsers: number;
  totalUsers: number;
  topSymbols: { symbol: string; count: number }[];
  totalPnl: number | null;
  winRate: number | null;
}

export async function collectCommunityStats(weekStart: Date): Promise<CommunityStats> {
  const weekEnd = addDays(weekStart, 7); // exclusive
  const startIso = toIsoDate(weekStart);
  const endIso = toIsoDate(weekEnd);

  // All trades with their field values for the week
  const { data: entries } = await db
    .from("trade_entries")
    .select("id, trade_date, user_id, trade_field_values(value, template_fields(label, field_type))")
    .gte("trade_date", startIso)
    .lt("trade_date", endIso);

  const list = (entries ?? []) as unknown as EntryWithFields[];

  // Active traders = distinct user_ids that journaled this week
  const activeTraders = new Set(list.map((e) => e.user_id).filter(Boolean)).size;

  // Top symbols
  const symbolCounts = new Map<string, number>();
  for (const e of list) {
    const s = extractSymbol(e);
    if (s) symbolCounts.set(s, (symbolCounts.get(s) ?? 0) + 1);
  }
  const topSymbols = [...symbolCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([symbol, count]) => ({ symbol, count }));

  // P&L + win rate
  const pnls = list.map(extractPnl).filter((v): v is number => v !== null);
  const totalPnl = pnls.length ? pnls.reduce((s, v) => s + v, 0) : null;
  const wins = pnls.filter((v) => v > 0).length;
  const winRate = pnls.length ? Math.round((wins / pnls.length) * 100) : null;

  // User counts
  const { count: totalUsers } = await db
    .from("users")
    .select("id", { count: "exact", head: true });

  const { count: newUsers } = await db
    .from("users")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startIso)
    .lt("created_at", endIso);

  return {
    weekStart: startIso,
    weekEnd: toIsoDate(addDays(weekStart, 6)),
    totalTrades: list.length,
    activeTraders,
    newUsers: newUsers ?? 0,
    totalUsers: totalUsers ?? 0,
    topSymbols,
    totalPnl,
    winRate,
  };
}

// ============================================================
// 3) USER STATS (personalized — one per recipient)
// ============================================================

export interface UserStats {
  userId: string;
  weekStart: string;
  weekEnd: string;
  trades: number;
  totalPnl: number | null;
  winRate: number | null;
  bestSymbol: string | null;
  avgRating: number | null;
  hasData: boolean;
}

export async function collectUserStats(userId: string, weekStart: Date): Promise<UserStats> {
  const weekEnd = addDays(weekStart, 7);
  const startIso = toIsoDate(weekStart);
  const endIso = toIsoDate(weekEnd);

  const { data: entries } = await db
    .from("trade_entries")
    .select("id, trade_date, trade_field_values(value, template_fields(label, field_type))")
    .eq("user_id", userId)
    .gte("trade_date", startIso)
    .lt("trade_date", endIso);

  const list = (entries ?? []) as unknown as EntryWithFields[];

  const pnls = list.map(extractPnl).filter((v): v is number => v !== null);
  const ratings = list.map(extractRating).filter((v): v is number => v !== null);
  const symbolCounts = new Map<string, number>();
  for (const e of list) {
    const s = extractSymbol(e);
    if (s) symbolCounts.set(s, (symbolCounts.get(s) ?? 0) + 1);
  }
  const bestSymbol = [...symbolCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const totalPnl = pnls.length ? pnls.reduce((s, v) => s + v, 0) : null;
  const wins = pnls.filter((v) => v > 0).length;
  const winRate = pnls.length ? Math.round((wins / pnls.length) * 100) : null;
  const avgRating = ratings.length ? Number((ratings.reduce((s, v) => s + v, 0) / ratings.length).toFixed(1)) : null;

  return {
    userId,
    weekStart: startIso,
    weekEnd: toIsoDate(addDays(weekStart, 6)),
    trades: list.length,
    totalPnl,
    winRate,
    bestSymbol,
    avgRating,
    hasData: list.length > 0,
  };
}

// ============================================================
// 4) FEATURES (from GitHub API — repo: timo479/tjtradehub-landing)
// Public-API call first; if private/forbidden, falls back to empty.
// Optionally honors GITHUB_TOKEN env var.
// ============================================================

export interface FeatureUpdate {
  hash: string;
  message: string;
  date: string;
  url: string;
}

const GITHUB_REPO = "timo479/tjtradehub-landing";

export async function collectFeatures(weekStart: Date): Promise<FeatureUpdate[]> {
  const since = weekStart.toISOString();
  const until = addDays(weekStart, 7).toISOString();

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/commits?since=${since}&until=${until}&per_page=30`,
      { headers, cache: "no-store" },
    );
    if (!res.ok) {
      console.warn(`[newsletter] GitHub commits fetch failed: ${res.status}`);
      return [];
    }
    const data = (await res.json()) as Array<{
      sha: string;
      html_url: string;
      commit: { message: string; author: { date: string } };
    }>;

    return data
      .map((c) => ({
        hash: c.sha.slice(0, 7),
        message: c.commit.message.split("\n")[0],
        date: c.commit.author.date,
        url: c.html_url,
      }))
      // Filter out trivial commits
      .filter((c) => {
        const m = c.message.toLowerCase();
        return !m.startsWith("merge ") && !m.startsWith("revert ") && !m.includes("typo");
      });
  } catch (err) {
    console.warn("[newsletter] GitHub commits fetch threw:", err);
    return [];
  }
}

// ============================================================
// Combined: collect everything for ONE recipient
// ============================================================

export interface CollectedData {
  market: MarketNewsData;
  community: CommunityStats;
  user: UserStats;
  features: FeatureUpdate[];
}

export async function collectAllForUser(
  userId: string,
  weekStart: Date,
): Promise<CollectedData> {
  const [community, user, features] = await Promise.all([
    collectCommunityStats(weekStart),
    collectUserStats(userId, weekStart),
    collectFeatures(weekStart),
  ]);
  const market = collectMarketNews(weekStart);
  return { market, community, user, features };
}
