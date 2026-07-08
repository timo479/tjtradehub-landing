/**
 * Daily cron — runs every day at 06:00 UTC (configured in vercel.json).
 *
 * Always: undeploys stale MetaAPI accounts (cost control).
 * Always: deletes unpublished feed posts (draft/rejected) older than 7 days.
 * Mondays: also generates the weekly newsletter, persists it, and emails admins.
 */

import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { undeployStaleAccounts } from "@/lib/metaapi-undeploy";
import { createWeeklyNewsletter } from "@/lib/newsletter/createWeekly";

const FEED_RETENTION_DAYS = 7;

// Allow this route up to 5 minutes — newsletter generation alone takes ~30s
// and we run undeploy retries before it. Vercel Hobby cron functions cap at 60s,
// Pro caps at 5 min; pick the safe ceiling.
export const maxDuration = 300;

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  let authorized = false;
  try {
    authorized =
      authHeader.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
  } catch {
    // length mismatch or buffer error → not authorized
  }
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();

  // 1) Always: undeploy stale accounts
  const undeploy = await undeployStaleAccounts();

  // 2) Always: purge unpublished feed posts older than the retention window.
  // Filter on created_at (NOT published_at) — a rejected post keeps its old
  // published_at, so published_at would let re-rejected posts slip past.
  let feedCleanup: { deleted: number } | { error: string };
  try {
    const cutoff = new Date(startedAt - FEED_RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await db
      .from("feed_posts")
      .delete()
      .neq("status", "published")
      .lt("created_at", cutoff)
      .select("id");
    if (error) throw new Error(error.message);
    feedCleanup = { deleted: data?.length ?? 0 };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron/daily] feed cleanup failed:", msg);
    feedCleanup = { error: msg };
  }

  // 3) Mondays only: generate newsletter
  // Monday in UTC. Cron fires at 06:00 UTC daily, so we get exactly one
  // newsletter run per week. ?forceMonday=1 lets you test the flow on any day.
  const url = new URL(req.url);
  const forceMonday = url.searchParams.get("forceMonday") === "1";
  const todayUtc = new Date();
  const isMonday = forceMonday || todayUtc.getUTCDay() === 1;

  let newsletter: Awaited<ReturnType<typeof createWeeklyNewsletter>> | { skipped: true; reason: string } | { error: string };
  if (isMonday) {
    try {
      newsletter = await createWeeklyNewsletter();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[cron/daily] newsletter creation failed:", msg);
      newsletter = { error: msg };
    }
  } else {
    newsletter = { skipped: true, reason: `Not Monday (UTC day=${todayUtc.getUTCDay()})` };
  }

  return NextResponse.json({
    ranAt: new Date(startedAt).toISOString(),
    elapsedMs: Date.now() - startedAt,
    undeploy,
    feedCleanup,
    newsletter,
  });
}
