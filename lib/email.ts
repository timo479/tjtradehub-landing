import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Trial Emails ────────────────────────────────────────────────────────────

export type TrialEmailType = "day5" | "day6" | "day7" | "day8" | "week1" | "week2" | "week3";

const TRIAL_EMAIL_CONFIGS: Record<TrialEmailType, { subject: string; headline: string; body: string; cta: string }> = {
  day5: {
    subject: "⏰ 2 days left on your TJTradeHub trial",
    headline: "Your trial ends in 2 days",
    body: "You've been tracking your trades with TJTradeHub – don't lose access now. Upgrade to Pro and keep your edge with unlimited journal entries, MT4/MT5 sync, and advanced analytics.",
    cta: "Upgrade to Pro – $29/mo",
  },
  day6: {
    subject: "🔔 Tomorrow your TJTradeHub access ends",
    headline: "Last day tomorrow",
    body: "Your free trial expires tomorrow. After that, you'll lose access to your trading journal, performance stats, and MT4/MT5 sync. Upgrade now to keep everything.",
    cta: "Keep My Access – $29/mo",
  },
  day7: {
    subject: "⚠️ Your TJTradeHub trial expires today",
    headline: "Today is your last day",
    body: "Your trial ends today. Upgrade now to continue tracking your trades, viewing your performance stats, and syncing with MT4/MT5. Don't let your progress go to waste.",
    cta: "Upgrade Now – $29/mo",
  },
  day8: {
    subject: "Your TJTradeHub trial has ended",
    headline: "Your trial has ended",
    body: "Your free trial is over, but your data is safe. Upgrade to Pro to regain full access to your trading journal, performance analytics, and MT4/MT5 sync.",
    cta: "Restore My Access – $29/mo",
  },
  week1: {
    subject: "Still thinking about it? Your journal is waiting",
    headline: "Your trading journal misses you",
    body: "It's been a week since your trial ended. Your trades, stats, and journal entries are still saved – you just need to upgrade to access them again. Traders who journal consistently outperform those who don't.",
    cta: "Get Back to Trading – $29/mo",
  },
  week2: {
    subject: "Traders who track, win – here's why",
    headline: "The edge is in the data",
    body: "Traders who keep a detailed journal improve their win rate significantly over time. TJTradeHub gives you everything you need: custom fields, MT4/MT5 sync, and deep performance analytics. Your data is still waiting.",
    cta: "Start Winning – $29/mo",
  },
  week3: {
    subject: "Last reminder – your TJTradeHub data is waiting",
    headline: "One last reminder",
    body: "This is our final reminder. Your journal entries and trading history are still saved in TJTradeHub. Upgrade anytime to get back full access – we'll be here when you're ready.",
    cta: "Upgrade to Pro – $29/mo",
  },
};

function buildTrialEmailHtml(type: TrialEmailType, upgradeUrl: string): string {
  const config = TRIAL_EMAIL_CONFIGS[type];
  const logoUrl = "https://www.tjtradehub.com/logo-email.png";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;border:1px solid #1f1f1f;border-radius:12px;overflow:hidden;">

        <tr><td align="center" style="padding:36px 40px 24px;">
          <img src="${logoUrl}" alt="TJTradeHub" width="100" style="display:block;border-radius:8px;" />
        </td></tr>

        <tr><td style="padding:0 40px;"><div style="height:1px;background-color:#1f1f1f;"></div></td></tr>

        <tr><td style="padding:32px 40px 8px;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">${config.headline}</h1>
        </td></tr>
        <tr><td style="padding:16px 40px 32px;">
          <p style="margin:0;font-size:15px;color:#a1a1aa;line-height:1.7;">${config.body}</p>
        </td></tr>

        <tr><td style="padding:0 40px 32px;">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr><td style="padding:6px 0;">
              <span style="color:#a855f7;font-size:14px;font-weight:600;">✓</span>
              <span style="color:#d4d4d8;font-size:14px;margin-left:8px;">Unlimited journal entries &amp; custom fields</span>
            </td></tr>
            <tr><td style="padding:6px 0;">
              <span style="color:#a855f7;font-size:14px;font-weight:600;">✓</span>
              <span style="color:#d4d4d8;font-size:14px;margin-left:8px;">MT4/MT5 auto-sync</span>
            </td></tr>
            <tr><td style="padding:6px 0;">
              <span style="color:#a855f7;font-size:14px;font-weight:600;">✓</span>
              <span style="color:#d4d4d8;font-size:14px;margin-left:8px;">Advanced performance analytics &amp; stats</span>
            </td></tr>
            <tr><td style="padding:6px 0;">
              <span style="color:#a855f7;font-size:14px;font-weight:600;">✓</span>
              <span style="color:#d4d4d8;font-size:14px;margin-left:8px;">Calendar &amp; trade review tools</span>
            </td></tr>
          </table>
        </td></tr>

        <tr><td align="center" style="padding:0 40px 40px;">
          <a href="${upgradeUrl}" style="display:inline-block;background:linear-gradient(135deg,#9333ea,#a855f7);color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:8px;letter-spacing:0.2px;">
            ${config.cta}
          </a>
        </td></tr>

        <tr><td style="padding:24px 40px;border-top:1px solid #1f1f1f;">
          <p style="margin:0;font-size:12px;color:#52525b;text-align:center;">
            TJTradeHub · support@tjtradehub.com<br/>
            <a href="${upgradeUrl}" style="color:#52525b;text-decoration:none;">Upgrade</a> &nbsp;·&nbsp;
            <a href="https://www.tjtradehub.com" style="color:#52525b;text-decoration:none;">Visit Website</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendTrialEmail(to: string, type: TrialEmailType): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.tjtradehub.com";
  const config = TRIAL_EMAIL_CONFIGS[type];

  await resend.emails.send({
    from: "TJ TradeHub <support@tjtradehub.com>",
    to,
    subject: config.subject,
    html: buildTrialEmailHtml(type, `${appUrl}/billing`),
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  await resend.emails.send({
    from: "TJ TradeHub <noreply@tjtradehub.com>",
    to,
    subject: "Reset your password – TJ TradeHub",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;border:1px solid #1f1f1f;border-radius:12px;padding:40px;">
        <tr><td align="center" style="padding-bottom:32px;">
          <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">TJ <span style="color:#a855f7;">TradeHub</span></span>
        </td></tr>
        <tr><td style="padding-bottom:16px;">
          <h1 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">Reset your password</h1>
        </td></tr>
        <tr><td style="padding-bottom:32px;">
          <p style="margin:0;font-size:15px;color:#a1a1aa;line-height:1.6;">
            Click the button below to set a new password. This link expires in 1 hour.
          </p>
        </td></tr>
        <tr><td align="center" style="padding-bottom:32px;">
          <a href="${resetUrl}" style="display:inline-block;background-color:#a855f7;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 32px;border-radius:8px;">
            Reset Password
          </a>
        </td></tr>
        <tr><td>
          <p style="margin:0;font-size:12px;color:#52525b;text-align:center;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim(),
  });
}

export async function sendVerificationEmail(to: string, token: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verifyUrl = `${appUrl}/api/verify-email?token=${token}`;

  await resend.emails.send({
    from: "TJ TradeHub <noreply@tjtradehub.com>",
    to,
    subject: "Verify your email – TJ TradeHub",
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;border:1px solid #1f1f1f;border-radius:12px;padding:40px;">
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">TJ <span style="color:#a855f7;">TradeHub</span></span>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:16px;">
              <h1 style="margin:0;font-size:20px;font-weight:600;color:#ffffff;">Verify your email address</h1>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:32px;">
              <p style="margin:0;font-size:15px;color:#a1a1aa;line-height:1.6;">
                Click the button below to verify your email and activate your TJ TradeHub account. This link expires in 24 hours.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:32px;">
              <a href="${verifyUrl}" style="display:inline-block;background-color:#a855f7;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 32px;border-radius:8px;">
                Verify Email
              </a>
            </td>
          </tr>
          <tr>
            <td>
              <p style="margin:0;font-size:12px;color:#52525b;text-align:center;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}
