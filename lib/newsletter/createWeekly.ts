/**
 * Generates and persists this week's newsletter, then notifies admins.
 * Idempotent: if a newsletter for the same week_of already exists (any status),
 * this is a no-op.
 *
 * Called by the Monday cron and (optionally) by a manual admin trigger.
 */

import { db } from "@/lib/db";
import { Resend } from "resend";
import {
  collectMarketNews,
  collectCommunityStats,
  collectFeatures,
  getWeekStart,
  addDays,
  toIsoDate,
} from "./collectors";
import { generateNewsletter } from "./generateContent";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface CreateResult {
  newsletterId: string;
  weekOf: string;
  status: "created" | "already_exists" | "skipped_no_admins";
  notifiedAdmins: string[];
}

export async function createWeeklyNewsletter(): Promise<CreateResult> {
  // Newsletter covers the PREVIOUS week (last Mon–Sun)
  const today = new Date();
  today.setUTCDate(today.getUTCDate() - 7);
  const weekStart = getWeekStart(today);
  const weekOf = toIsoDate(weekStart);

  // Idempotency: skip if we already have one for this week
  const { data: existing } = await db
    .from("newsletters")
    .select("id, status")
    .eq("week_of", weekOf)
    .maybeSingle();

  if (existing) {
    return {
      newsletterId: existing.id,
      weekOf,
      status: "already_exists",
      notifiedAdmins: [],
    };
  }

  // Collect data
  const [community, features] = await Promise.all([
    collectCommunityStats(weekStart),
    collectFeatures(weekStart),
  ]);
  const market = collectMarketNews(weekStart);

  // Generate via Claude
  const newsletter = await generateNewsletter({ market, community, features });

  // Persist
  const { data: inserted, error: insertErr } = await db
    .from("newsletters")
    .insert({
      week_of: weekOf,
      subject: newsletter.subject,
      content_json: newsletter,
      status: "pending_approval",
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    throw new Error(`Failed to persist newsletter: ${insertErr?.message ?? "unknown"}`);
  }

  // Notify admins
  const { data: admins } = await db
    .from("users")
    .select("email, name")
    .eq("role", "admin");

  const adminList = (admins ?? []).filter((a) => a.email);
  if (adminList.length === 0) {
    return {
      newsletterId: inserted.id,
      weekOf,
      status: "skipped_no_admins",
      notifiedAdmins: [],
    };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.tjtradehub.com";
  const reviewUrl = `${appUrl}/dashboard/admin/newsletter`;
  const previewUrl = `${appUrl}/api/admin/newsletter/preview?id=${inserted.id}`;

  const weekEnd = toIsoDate(addDays(weekStart, 6));
  const subscriberCount = await getOptInCount();

  const notified: string[] = [];
  for (const admin of adminList) {
    try {
      await resend.emails.send({
        from: "TJ TradeHub <noreply@tjtradehub.com>",
        to: admin.email,
        subject: `Newsletter ready for review — week of ${weekOf}`,
        html: renderAdminNotification({
          adminName: admin.name,
          subject: newsletter.subject,
          weekOf,
          weekEnd,
          subscriberCount,
          reviewUrl,
          previewUrl,
        }),
      });
      notified.push(admin.email);
    } catch (err) {
      console.error(`[newsletter] failed to notify admin ${admin.email}:`, err);
    }
  }

  return {
    newsletterId: inserted.id,
    weekOf,
    status: "created",
    notifiedAdmins: notified,
  };
}

async function getOptInCount(): Promise<number> {
  const { count } = await db
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("newsletter_opt_in", true);
  return count ?? 0;
}

function renderAdminNotification(args: {
  adminName: string | null;
  subject: string;
  weekOf: string;
  weekEnd: string;
  subscriberCount: number;
  reviewUrl: string;
  previewUrl: string;
}): string {
  const greeting = args.adminName ? `Hi ${escapeHtml(args.adminName.split(" ")[0])},` : "Hi,";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;border:1px solid #1f1f1f;border-radius:12px;padding:40px;">
        <tr><td align="center" style="padding-bottom:24px;">
          <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">TJ <span style="color:#a855f7;">TradeHub</span></span>
          <p style="margin:6px 0 0 0;font-size:11px;color:#52525b;letter-spacing:0.06em;text-transform:uppercase;">Admin Notification</p>
        </td></tr>
        <tr><td style="padding-bottom:16px;">
          <h1 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">Your weekly newsletter is ready for review</h1>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <p style="margin:0 0 12px 0;font-size:15px;color:#d4d4d8;line-height:1.6;">${escapeHtml(greeting)}</p>
          <p style="margin:0;font-size:15px;color:#d4d4d8;line-height:1.6;">
            Claude generated the newsletter for the week of <strong style="color:#ffffff;">${escapeHtml(args.weekOf)} to ${escapeHtml(args.weekEnd)}</strong>. Review it, then approve or discard.
          </p>
        </td></tr>
        <tr><td style="padding-bottom:24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;border:1px solid #1f1f1f;border-radius:10px;">
            <tr><td style="padding:18px 20px;">
              <p style="margin:0 0 6px 0;font-size:11px;color:#71717a;letter-spacing:0.05em;text-transform:uppercase;">Subject line</p>
              <p style="margin:0 0 16px 0;font-size:14px;color:#ffffff;font-weight:500;line-height:1.4;">${escapeHtml(args.subject)}</p>
              <p style="margin:0 0 6px 0;font-size:11px;color:#71717a;letter-spacing:0.05em;text-transform:uppercase;">Will be sent to</p>
              <p style="margin:0;font-size:14px;color:#a855f7;font-weight:600;">${args.subscriberCount} subscriber${args.subscriberCount === 1 ? "" : "s"}</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding-bottom:16px;">
          <a href="${args.reviewUrl}" style="display:inline-block;background-color:#a855f7;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 32px;border-radius:8px;">
            Review &amp; Approve →
          </a>
        </td></tr>
        <tr><td align="center" style="padding-bottom:32px;">
          <a href="${args.previewUrl}" style="color:#a1a1aa;font-size:13px;text-decoration:underline;">Preview the rendered email</a>
        </td></tr>
        <tr><td>
          <p style="margin:0;font-size:12px;color:#52525b;text-align:center;line-height:1.6;">
            Nothing is sent until you click <strong style="color:#a1a1aa;">Approve &amp; Send</strong>.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
