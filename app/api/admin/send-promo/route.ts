import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Exclusive Discount – TJ TradeHub</title>
</head>
<body style="margin:0;padding:0;background:#0a0812;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0812;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <img src="https://www.tjtradehub.com/logo-tj-transparent.png" alt="TJ TradeHub" width="52" height="52" style="display:inline-block;vertical-align:middle;margin-right:12px;" />
              <span style="color:#F9FAFB;font-size:20px;font-weight:700;vertical-align:middle;letter-spacing:-0.01em;">TJ TradeHub</span>
            </td>
          </tr>
          <tr>
            <td style="background:linear-gradient(145deg,#13101f,#0f0d1a);border:1px solid rgba(139,92,246,0.25);border-radius:16px;padding:48px 40px;box-shadow:0 0 60px rgba(139,92,246,0.08);">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="height:2px;background:linear-gradient(90deg,transparent,#8B5CF6,#6366F1,#8B5CF6,transparent);border-radius:2px;margin-bottom:40px;display:block;"></td></tr>
              </table>
              <p style="color:#C4B5FD;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 12px 0;">Exclusive Offer</p>
              <h1 style="color:#F9FAFB;font-size:28px;font-weight:700;margin:0 0 24px 0;line-height:1.3;">Hey Nathan, you're getting<br/>a special deal 🎁</h1>
              <p style="color:#9CA3AF;font-size:15px;line-height:1.7;margin:0 0 32px 0;">
                We wanted to personally reach out and give you an exclusive discount on your TJ TradeHub subscription.<br/><br/>
                As a valued member of our community, you get <strong style="color:#F9FAFB;">$15 off every month</strong> — just use the code below at checkout.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center" style="background:rgba(139,92,246,0.1);border:1.5px dashed rgba(139,92,246,0.5);border-radius:12px;padding:28px 20px;">
                    <p style="color:#9CA3AF;font-size:12px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 10px 0;">Your Discount Code</p>
                    <p style="color:#C4B5FD;font-size:32px;font-weight:800;letter-spacing:0.15em;margin:0 0 10px 0;font-family:'Courier New',monospace;">FOUNDER15</p>
                    <p style="color:#6B7280;font-size:13px;margin:0;">$15 off / month · Applied at checkout</p>
                  </td>
                </tr>
              </table>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:36px;">
                <tr>
                  <td align="center">
                    <a href="https://www.tjtradehub.com/billing" style="display:inline-block;background:linear-gradient(135deg,#8B5CF6,#6366F1);color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:10px;letter-spacing:0.02em;box-shadow:0 4px 24px rgba(139,92,246,0.35);">Claim My Discount →</a>
                  </td>
                </tr>
              </table>
              <hr style="border:none;border-top:1px solid rgba(255,255,255,0.07);margin:0 0 28px 0;" />
              <p style="color:#6B7280;font-size:13px;line-height:1.7;margin:0;">
                With your subscription you get full access to the <strong style="color:#9CA3AF;">Trading Journal</strong>,
                <strong style="color:#9CA3AF;">MT4/MT5 Auto-Sync</strong>, <strong style="color:#9CA3AF;">Charts</strong>,
                <strong style="color:#9CA3AF;">AI Market Insights</strong> and much more.<br/><br/>
                If you have any questions, just reply to this email — we're always happy to help.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="color:#4B5563;font-size:12px;margin:0;line-height:1.6;">
                TJ TradeHub · tjtradehub.com<br/>
                <a href="https://www.tjtradehub.com" style="color:#6B7280;text-decoration:underline;">Visit Website</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== "promo2026") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const to = searchParams.get("to") ?? "timo@tjtradehub.com";

  const { data, error } = await resend.emails.send({
    from: "TJ TradeHub <noreply@tjtradehub.com>",
    to: [to],
    subject: "Your Exclusive Discount – FOUNDER15 🎁",
    html,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data?.id, sentTo: to });
}
