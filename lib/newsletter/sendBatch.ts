/**
 * Sends an approved newsletter to all opted-in users.
 * Per-user personalization: each recipient gets their own UserStats and
 * their own unsubscribe token in the URL.
 *
 * Synchronous loop — fine for <100 subscribers. Beyond that, fan out via
 * Resend batch endpoint or background worker.
 */

import { db } from "@/lib/db";
import { Resend } from "resend";
import {
  collectUserStats,
  getWeekStart,
} from "./collectors";
import { renderNewsletterHtml } from "./render-email";
import type { GeneratedNewsletter } from "./generateContent";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface BatchSendResult {
  newsletterId: string;
  attempted: number;
  succeeded: number;
  failed: number;
  failures: { email: string; error: string }[];
  elapsedMs: number;
}

export async function sendNewsletterBatch(newsletterId: string): Promise<BatchSendResult> {
  const startedAt = Date.now();

  // Load the newsletter
  const { data: nl, error: nlErr } = await db
    .from("newsletters")
    .select("id, week_of, subject, content_json, status")
    .eq("id", newsletterId)
    .single();

  if (nlErr || !nl) {
    throw new Error(`Newsletter ${newsletterId} not found`);
  }
  if (nl.status !== "approved" && nl.status !== "sending") {
    throw new Error(`Newsletter status is "${nl.status}" — expected "approved"`);
  }

  const newsletter = nl.content_json as GeneratedNewsletter;
  const weekStart = getWeekStart(new Date(nl.week_of + "T00:00:00Z"));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.tjtradehub.com";

  // Mark as sending (atomic — only flip from approved → sending)
  await db
    .from("newsletters")
    .update({ status: "sending" })
    .eq("id", newsletterId)
    .eq("status", "approved");

  // Get all opt-in users (verified email only — avoid sending to unverified)
  const { data: recipients } = await db
    .from("users")
    .select("id, email, name, unsubscribe_token")
    .eq("newsletter_opt_in", true)
    .eq("email_verified", true)
    .neq("is_banned", true);

  const list = recipients ?? [];
  const failures: { email: string; error: string }[] = [];
  let succeeded = 0;

  for (const user of list) {
    if (!user.email || !user.unsubscribe_token) {
      failures.push({ email: user.email ?? "unknown", error: "Missing email or unsubscribe_token" });
      continue;
    }

    try {
      const userStats = await collectUserStats(user.id, weekStart);
      const unsubscribeUrl = `${appUrl}/unsubscribe?t=${user.unsubscribe_token}`;
      const oneClickUrl = `${appUrl}/api/unsubscribe?t=${user.unsubscribe_token}`;
      const html = renderNewsletterHtml({
        newsletter,
        userStats,
        recipientName: user.name,
        unsubscribeUrl,
      });

      const sendResult = await resend.emails.send({
        from: "TJ TradeHub <noreply@tjtradehub.com>",
        to: user.email,
        subject: newsletter.subject,
        html,
        headers: {
          // RFC 8058 one-click unsubscribe header (Gmail/Yahoo bulk-sender requirement).
          // Gmail POSTs to oneClickUrl directly without a confirmation page.
          "List-Unsubscribe": `<${oneClickUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      const resendId = sendResult.data?.id ?? null;

      // Track in newsletter_sends (UNIQUE on newsletter_id + user_id — upsert)
      await db.from("newsletter_sends").upsert(
        {
          newsletter_id: newsletterId,
          user_id: user.id,
          email: user.email,
          resend_id: resendId,
          sent_at: new Date().toISOString(),
        },
        { onConflict: "newsletter_id,user_id" },
      );

      succeeded++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[newsletter] send to ${user.email} failed:`, msg);
      failures.push({ email: user.email, error: msg });

      // Record the failure too (with sent_at = now as a "tried at" marker)
      await db.from("newsletter_sends").upsert(
        {
          newsletter_id: newsletterId,
          user_id: user.id,
          email: user.email,
          sent_at: new Date().toISOString(),
          error_message: msg,
        },
        { onConflict: "newsletter_id,user_id" },
      );
    }
  }

  // Finalize newsletter status
  const finalStatus = failures.length === list.length && list.length > 0 ? "failed" : "sent";
  await db
    .from("newsletters")
    .update({
      status: finalStatus,
      sent_at: new Date().toISOString(),
      recipient_count: succeeded,
      error_message: failures.length > 0 ? `${failures.length} sends failed` : null,
    })
    .eq("id", newsletterId);

  return {
    newsletterId,
    attempted: list.length,
    succeeded,
    failed: failures.length,
    failures,
    elapsedMs: Date.now() - startedAt,
  };
}
