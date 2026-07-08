/**
 * Economic calendar ingest — pulls scheduled events from the free ForexFactory
 * weekly JSON feeds and upserts them into `economic_events`.
 *
 * The feed publishes times in US Eastern (ISO strings with a -04:00/-05:00
 * offset), which `new Date(...).toISOString()` normalises to UTC on the way in.
 * The free feed carries no `actual` value — only forecast/previous.
 */

import { db } from "@/lib/db";

const FEED_URLS = [
  "https://nfs.faireconomy.media/ff_calendar_thisweek.json",
  "https://nfs.faireconomy.media/ff_calendar_nextweek.json",
];

const RETENTION_DAYS = 30;

interface RawEvent {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string;
  previous: string;
}

export interface EconomicEventRow {
  title: string;
  country: string;
  event_time: string; // ISO UTC
  impact: "high" | "medium" | "low";
  forecast: string | null;
  previous: string | null;
}

function normalizeImpact(raw: string): "high" | "medium" | "low" | null {
  const v = (raw ?? "").toLowerCase();
  if (v === "high" || v === "medium" || v === "low") return v;
  return null; // "Holiday" and anything unexpected → dropped
}

/** Fetch + normalise both weekly feeds. Keeps only High/Medium impact events. */
export async function fetchForexFactoryEvents(): Promise<EconomicEventRow[]> {
  const rows: EconomicEventRow[] = [];
  const seen = new Set<string>();
  const errors: string[] = [];
  let anyOk = false;

  for (const url of FEED_URLS) {
    let data: RawEvent[];
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" }, cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      data = (await res.json()) as RawEvent[];
    } catch (err) {
      // One feed (e.g. nextweek before it's published) being unavailable must not
      // kill the whole ingest — record it and keep going with the others.
      errors.push(`${url}: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    anyOk = true;
    if (!Array.isArray(data)) continue;

    for (const e of data) {
      const impact = normalizeImpact(e.impact);
      if (!impact || impact === "low") continue; // MVP: high + medium only
      if (!e.title || !e.country || !e.date) continue;

      const t = new Date(e.date);
      if (isNaN(t.getTime())) continue;
      const event_time = t.toISOString();

      // Dedup within a fetch (thisweek/nextweek can overlap around week boundary).
      const key = `${e.country}|${e.title}|${event_time}`;
      if (seen.has(key)) continue;
      seen.add(key);

      rows.push({
        title: e.title.slice(0, 200),
        country: e.country.slice(0, 8),
        event_time,
        impact,
        forecast: e.forecast || null,
        previous: e.previous || null,
      });
    }
  }

  // Only treat it as a hard failure if EVERY feed was unreachable.
  if (!anyOk) throw new Error(`all economic feeds failed — ${errors.join("; ")}`);
  if (errors.length) console.warn("[economic-calendar] partial fetch:", errors.join("; "));
  return rows;
}

/** Fetch → upsert → prune old rows. Errors are surfaced to the caller. */
export async function syncEconomicCalendar(): Promise<{ upserted: number; deleted: number }> {
  const rows = await fetchForexFactoryEvents();

  let upserted = 0;
  if (rows.length > 0) {
    const { error } = await db
      .from("economic_events")
      .upsert(rows, { onConflict: "country,title,event_time" });
    if (error) throw new Error(`upsert: ${error.message}`);
    upserted = rows.length;
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data: deletedRows, error: delErr } = await db
    .from("economic_events")
    .delete()
    .lt("event_time", cutoff)
    .select("id");
  if (delErr) throw new Error(`cleanup: ${delErr.message}`);

  return { upserted, deleted: deletedRows?.length ?? 0 };
}
