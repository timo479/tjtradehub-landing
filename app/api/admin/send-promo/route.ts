import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Resend } from "resend";

export const maxDuration = 120;

const resend = new Resend(process.env.RESEND_API_KEY);

function buildFounderPromoHtml(): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.tjtradehub.com";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body bgcolor="#080808" style="margin:0;padding:0;background-color:#080808;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#080808" style="background-color:#080808;padding:56px 0;">
  <tr><td align="center" bgcolor="#080808" style="background-color:#080808;">
    <table width="580" cellpadding="0" cellspacing="0" bgcolor="#0c0c0c" style="background-color:#0c0c0c;border:1px solid #222222;border-radius:20px;overflow:hidden;max-width:580px;">

      <!-- BADGE -->
      <tr>
        <td align="center" style="padding:36px 48px 0;">
          <div style="display:inline-block;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.3);border-radius:100px;padding:7px 20px;">
            <span style="font-size:11px;font-weight:700;letter-spacing:0.2em;color:#FBBF24;text-transform:uppercase;">&#x2726; &nbsp;Founder Lifetime Offer</span>
          </div>
        </td>
      </tr>

      <!-- LOGO -->
      <tr>
        <td align="center" style="padding:20px 48px 0;">
          <span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">TJ <span style="color:#a855f7;">TradeHub</span></span>
        </td>
      </tr>

      <!-- HEADLINE -->
      <tr>
        <td align="center" style="padding:36px 48px 0;">
          <h1 style="margin:0;font-size:38px;font-weight:800;line-height:1.1;letter-spacing:-1px;color:#F9FAFB;">
            Only <span style="color:#FBBF24;">80 spots</span><br/>left at $149&nbsp;&#8212;&nbsp;forever.
          </h1>
          <p style="margin:18px 0 0;font-size:16px;color:#9CA3AF;line-height:1.7;max-width:400px;">
            100 traders get lifetime access to TJ TradeHub. 20 spots are already gone. Once they&apos;re sold, this price disappears permanently.
          </p>
        </td>
      </tr>

      <!-- PROGRESS BAR -->
      <tr>
        <td style="padding:36px 48px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;">
                  <tr>
                    <td style="font-size:12px;font-weight:600;color:#6B7280;letter-spacing:0.05em;text-transform:uppercase;">Spots claimed</td>
                    <td align="right" style="font-size:12px;font-weight:700;color:#FBBF24;">20 / 100</td>
                  </tr>
                </table>
                <div style="background:#1a1a1a;border-radius:100px;height:10px;overflow:hidden;border:1px solid #2a2a2a;">
                  <div style="background:linear-gradient(90deg,#F59E0B,#FCD34D);height:10px;width:20%;border-radius:100px;"></div>
                </div>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;">
                  <tr>
                    <td style="font-size:12px;color:#4B5563;">0</td>
                    <td align="center" style="font-size:13px;font-weight:700;color:#EF4444;">80 remaining</td>
                    <td align="right" style="font-size:12px;color:#4B5563;">100</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- PRICE BLOCK -->
      <tr>
        <td style="padding:32px 48px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#111827;border:1px solid #1E3A5F;border-radius:16px;">
            <tr>
              <td style="padding:28px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align:top;">
                      <div style="font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#60A5FA;margin-bottom:12px;">What you get</div>
                      <div style="font-size:42px;font-weight:900;color:#ffffff;letter-spacing:-1.5px;line-height:1;">$149</div>
                      <div style="font-size:13px;color:#6B7280;margin-top:4px;">once &nbsp;&#183;&nbsp; no subscription, ever</div>
                      <div style="margin-top:16px;height:1px;background:#1E3A5F;"></div>
                      <table cellpadding="0" cellspacing="0" style="margin-top:16px;">
                        <tr><td style="padding:5px 0;white-space:nowrap;">
                          <span style="color:#22C55E;font-size:15px;margin-right:10px;">&#10003;</span>
                          <span style="color:#D1D5DB;font-size:13px;">Full Pro access &#8212; every feature unlocked</span>
                        </td></tr>
                        <tr><td style="padding:5px 0;white-space:nowrap;">
                          <span style="color:#22C55E;font-size:15px;margin-right:10px;">&#10003;</span>
                          <span style="color:#D1D5DB;font-size:13px;">MT4 &amp; MT5 auto-sync via MetaAPI</span>
                        </td></tr>
                        <tr><td style="padding:5px 0;white-space:nowrap;">
                          <span style="color:#22C55E;font-size:15px;margin-right:10px;">&#10003;</span>
                          <span style="color:#D1D5DB;font-size:13px;">Advanced journal &amp; trade analytics</span>
                        </td></tr>
                        <tr><td style="padding:5px 0;white-space:nowrap;">
                          <span style="color:#22C55E;font-size:15px;margin-right:10px;">&#10003;</span>
                          <span style="color:#D1D5DB;font-size:13px;">Every future feature &#8212; included forever</span>
                        </td></tr>
                        <tr><td style="padding:5px 0;white-space:nowrap;">
                          <span style="color:#22C55E;font-size:15px;margin-right:10px;">&#10003;</span>
                          <span style="color:#D1D5DB;font-size:13px;"><strong style="color:#FBBF24;">Founder #001&#8211;100</strong> badge on your account</span>
                        </td></tr>
                      </table>
                    </td>
                    <td style="vertical-align:top;padding-left:24px;min-width:110px;text-align:right;">
                      <table cellpadding="0" cellspacing="0" style="background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:16px 14px;display:inline-block;">
                        <tr><td align="center">
                          <div style="font-size:11px;color:#6B7280;text-decoration:line-through;letter-spacing:0.05em;">$29 &#215; 12</div>
                          <div style="font-size:22px;font-weight:800;color:#EF4444;margin:4px 0 2px;letter-spacing:-0.5px;">$348</div>
                          <div style="font-size:10px;color:#6B7280;text-transform:uppercase;letter-spacing:0.1em;">per year</div>
                          <div style="margin:10px 0;height:1px;background:#2a2a2a;"></div>
                          <div style="font-size:10px;font-weight:700;color:#22C55E;text-transform:uppercase;letter-spacing:0.1em;">You save</div>
                          <div style="font-size:20px;font-weight:900;color:#22C55E;">$199+</div>
                          <div style="font-size:10px;color:#4B5563;">in year one</div>
                        </td></tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- URGENCY -->
      <tr>
        <td style="padding:20px 48px 0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:12px;">
            <tr>
              <td style="padding:16px 20px;">
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="font-size:22px;padding-right:14px;vertical-align:middle;">&#9889;</td>
                    <td style="vertical-align:middle;">
                      <div style="font-size:13px;font-weight:700;color:#FCA5A5;margin-bottom:3px;">This offer has no deadline &#8212; but it has a hard cap.</div>
                      <div style="font-size:12px;color:#6B7280;line-height:1.5;">When spot #100 is claimed, the Founder price closes permanently. No extensions, no exceptions.</div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- CTA -->
      <tr>
        <td align="center" style="padding:36px 48px 0;">
          <a href="${appUrl}/billing" style="display:inline-block;background:linear-gradient(135deg,#FCD34D,#F59E0B);color:#0c0a00;text-decoration:none;font-size:17px;font-weight:800;padding:18px 52px;border-radius:12px;letter-spacing:0.01em;">
            Claim your Founder spot &#8594;
          </a>
          <p style="margin:14px 0 0;font-size:12px;color:#4B5563;">Secure checkout via Stripe &nbsp;&#183;&nbsp; Instant access</p>
        </td>
      </tr>

      <!-- SECONDARY CTA -->
      <tr>
        <td align="center" style="padding:28px 48px 0;">
          <p style="margin:0;font-size:14px;color:#6B7280;">
            Already on Pro? <a href="${appUrl}/billing" style="color:#a855f7;text-decoration:none;font-weight:600;">Upgrade to Lifetime &nbsp;&#8594;</a>
          </p>
        </td>
      </tr>

      <!-- FOOTER -->
      <tr>
        <td style="background-color:#070707;border-top:1px solid #1c1c1c;padding:28px 48px;margin-top:40px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <span style="font-size:16px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">TJ <span style="color:#a855f7;">TradeHub</span></span>
              <p style="margin:10px 0 0;font-size:12px;color:#3F3F46;line-height:1.8;">
                You&apos;re receiving this as a TJ TradeHub user.<br/>
                <a href="${appUrl}/dashboard/settings" style="color:#52525b;text-decoration:underline;">Unsubscribe from promotional emails</a>
              </p>
            </td></tr>
          </table>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Optional: dry-run mode — pass { dryRun: true } in body to just return recipient list
  let dryRun = false;
  try {
    const body = await req.json();
    dryRun = body?.dryRun === true;
  } catch {
    // no body is fine
  }

  // Fetch all users who do NOT already have lifetime access
  const { data: users, error } = await db
    .from("users")
    .select("email, subscription_status")
    .not("subscription_status", "eq", "lifetime");

  if (error) {
    console.error("[send-promo] DB error:", error);
    return NextResponse.json({ error: "DB error", details: error.message }, { status: 500 });
  }

  const recipients = (users ?? []).map((u) => u.email).filter(Boolean);

  if (dryRun) {
    return NextResponse.json({ dryRun: true, count: recipients.length, recipients });
  }

  if (recipients.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: "No eligible recipients" });
  }

  const html = buildFounderPromoHtml();

  // Resend batch: max 100 per call — chunk just in case
  const CHUNK = 100;
  const results: { id?: string; error?: unknown }[] = [];

  for (let i = 0; i < recipients.length; i += CHUNK) {
    const chunk = recipients.slice(i, i + CHUNK);
    const batch = chunk.map((to) => ({
      from: "TJ TradeHub <noreply@tjtradehub.com>",
      to: [to],
      subject: "Only 80 Founder spots left — lifetime access at $149",
      html,
    }));

    const { data, error: sendError } = await resend.batch.send(batch);
    if (sendError) {
      console.error("[send-promo] batch error:", sendError);
      results.push({ error: sendError });
    } else {
      results.push(...(data?.data ?? []).map((d) => ({ id: d.id })));
    }
  }

  const failures = results.filter((r) => r.error);
  console.log(`[send-promo] sent=${results.length - failures.length} failed=${failures.length}`);

  return NextResponse.json({
    ok: true,
    sent: results.length - failures.length,
    failed: failures.length,
    total: recipients.length,
  });
}

// GET: dry-run via URL for quick check in browser
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: users, error } = await db
    .from("users")
    .select("email, subscription_status")
    .not("subscription_status", "eq", "lifetime");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const recipients = (users ?? []).map((u) => u.email).filter(Boolean);
  return NextResponse.json({ dryRun: true, count: recipients.length, recipients });
}
