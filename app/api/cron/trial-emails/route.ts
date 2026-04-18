import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendTrialEmail, TrialEmailType } from "@/lib/email";
import { hasActiveSubscription } from "@/lib/trial";

function getEmailType(trialEndsAt: string): TrialEmailType | null {
  const diffDays = (Date.now() - new Date(trialEndsAt).getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays >= -2.5 && diffDays < -1.5) return "day5";
  if (diffDays >= -1.5 && diffDays < -0.5) return "day6";
  if (diffDays >= -0.5 && diffDays < 0.5)  return "day7";
  if (diffDays >= 0.5  && diffDays < 1.5)  return "day8";
  if (diffDays >= 6.5  && diffDays < 7.5)  return "week1";
  if (diffDays >= 13.5 && diffDays < 14.5) return "week2";
  if (diffDays >= 20.5 && diffDays < 21.5) return "week3";
  return null;
}

export async function GET(req: NextRequest) {
  const secret =
    req.nextUrl.searchParams.get("secret") ??
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: users, error } = await db
    .from("users")
    .select("id, email, trial_ends_at, subscription_status, current_period_end, trial_emails_sent");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const results = { sent: 0, skipped: 0, errors: 0 };

  for (const user of users ?? []) {
    if (hasActiveSubscription(user)) { results.skipped++; continue; }

    const emailType = getEmailType(user.trial_ends_at);
    if (!emailType) { results.skipped++; continue; }

    const alreadySent: string[] = user.trial_emails_sent ?? [];
    if (alreadySent.includes(emailType)) { results.skipped++; continue; }

    try {
      await sendTrialEmail(user.email, emailType);
      await db.from("users").update({
        trial_emails_sent: [...alreadySent, emailType],
      }).eq("id", user.id);
      results.sent++;
    } catch {
      results.errors++;
    }
  }

  return NextResponse.json(results);
}
