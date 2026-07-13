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
import { syncEconomicCalendar } from "@/lib/economic-calendar";
import { sendTrustpilotInviteEmail } from "@/lib/email";

const FEED_RETENTION_DAYS = 7;
// Cap Trustpilot invite emails per run so a first-run backfill drains over a
// few days instead of blasting everyone at once (Resend + runtime headroom).
const TRUSTPILOT_INVITE_LIMIT = 200;

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

  // 3) Always: sync the economic calendar (ForexFactory feed → economic_events)
  let economicCalendar: { upserted: number; deleted: number } | { error: string };
  try {
    economicCalendar = await syncEconomicCalendar();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron/daily] economic calendar sync failed:", msg);
    economicCalendar = { error: msg };
  }

  // 4) Always: Trustpilot review-invitation fallback.
  // Server-side coverage for users who logged >= 1 trade but never triggered
  // the client-side Invitation JS (never revisited the dashboard). Shares the
  // `trustpilot_invited_at` flag with the client path, so no double invites.
  let trustpilot:
    | { sent: number; remaining: number; failed: number }
    | { error: string };
  try {
    // Uninvited, verified, opted-in, non-banned candidates.
    const { data: candidates, error: candErr } = await db
      .from("users")
      .select("id, email, name, unsubscribe_token")
      .is("trustpilot_invited_at", null)
      .eq("email_verified", true)
      .eq("newsletter_opt_in", true)
      .neq("is_banned", true);
    if (candErr) throw new Error(candErr.message);

    const candidateList = candidates ?? [];
    let sent = 0;
    let failed = 0;
    let remaining = 0;

    if (candidateList.length > 0) {
      // Keep only those with >= 1 logged trade (trade_entries — same source the
      // dashboard uses; MT5 sync writes here too).
      const ids = candidateList.map((u) => u.id);
      const { data: entryRows } = await db
        .from("trade_entries")
        .select("user_id")
        .in("user_id", ids);
      const withTrades = new Set((entryRows ?? []).map((r) => r.user_id));

      const eligible = candidateList.filter(
        (u) => u.email && u.unsubscribe_token && withTrades.has(u.id),
      );
      remaining = Math.max(0, eligible.length - TRUSTPILOT_INVITE_LIMIT);
      const batch = eligible.slice(0, TRUSTPILOT_INVITE_LIMIT);
      const invitedIds: string[] = [];

      for (const u of batch) {
        try {
          await sendTrustpilotInviteEmail({
            to: u.email as string,
            name: u.name ?? null,
            unsubscribeToken: u.unsubscribe_token as string,
          });
          invitedIds.push(u.id);
          sent++;
        } catch (err) {
          failed++;
          console.error(`[cron/daily] trustpilot invite failed for ${u.email}:`, err);
        }
      }

      // Mark only successfully-emailed users, so failures retry next run.
      if (invitedIds.length > 0) {
        await db
          .from("users")
          .update({ trustpilot_invited_at: new Date().toISOString() })
          .in("id", invitedIds);
      }
    }

    trustpilot = { sent, remaining, failed };
    if (remaining > 0) {
      console.log(`[cron/daily] trustpilot: ${sent} invited, ${remaining} deferred to next run (per-run cap ${TRUSTPILOT_INVITE_LIMIT})`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron/daily] trustpilot invites failed:", msg);
    trustpilot = { error: msg };
  }

  // 5) Mondays only: generate newsletter
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
    economicCalendar,
    trustpilot,
    newsletter,
  });
}
