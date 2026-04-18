import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Trial Emails ────────────────────────────────────────────────────────────

export type TrialEmailType = "day5" | "day6" | "day7" | "day8" | "week1" | "week2" | "week3";

const TRIAL_EMAIL_CONFIGS: Record<TrialEmailType, {
  subject: string;
  headline: string;
  quote: string;
  body: string;
  benefits: [string, string, string];
  cta: string;
}> = {
  day5: {
    subject: "2 days left – don't lose your edge",
    headline: "In 2 days, your progress disappears.",
    quote: "You don't have a strategy problem. You have a discipline problem.",
    body: "You've been building something real. Every trade logged, every pattern tracked. That consistency is your edge – and it only grows if you keep showing up.",
    benefits: [
      "Know exactly when and why you break your rules",
      "Catch the emotional patterns that are costing you real money",
      "Build the consistency that separates pros from the rest",
    ],
    cta: "Keep Your Edge",
  },
  day6: {
    subject: "Tomorrow it stops.",
    headline: "Tomorrow, your journal goes dark.",
    quote: "The best traders aren't the smartest. They're the most consistent.",
    body: "One more day. After that, you'll trade without your data, your patterns, your feedback loop. Most traders who lose that structure never rebuild it.",
    benefits: [
      "Stop repeating the same losing trades over and over",
      "Catch yourself before emotions take the wheel",
      "See your real win rate – not the one you imagine",
    ],
    cta: "Don't Break the Streak",
  },
  day7: {
    subject: "Today is the day you decide.",
    headline: "Commit. Or go back to guessing.",
    quote: "Every trader says they'll be more disciplined next week. Most aren't.",
    body: "Your trial ends today. Your journal, your stats, your patterns – all still here. One decision away. Either you take your trading seriously, or you don't.",
    benefits: [
      "Finally understand why you keep making the same mistakes",
      "Replace gut feeling with data-backed decisions",
      "Stop losing money to patterns you can't even see",
    ],
    cta: "I'm Ready to Be Consistent",
  },
  day8: {
    subject: "You stopped. Your losses didn't.",
    headline: "Your trial ended. The mistakes didn't.",
    quote: "Without a journal, you're flying blind. Again.",
    body: "Traders who stop tracking fall back into old habits fast. The clarity you had during your trial fades without structure. Your data is still here – pick it back up.",
    benefits: [
      "Resume instantly – all your data is still saved",
      "Get back the clarity you had when you were tracking",
      "Trade with structure instead of emotion",
    ],
    cta: "Get Back in Control",
  },
  week1: {
    subject: "One week without structure. How's that going?",
    headline: "One week. Back to old habits?",
    quote: "Discipline doesn't survive without a system.",
    body: "It's been 7 days. No journal, no structure, no feedback loop. The traders who upgrade don't do it because they have to – they do it because they've felt the difference.",
    benefits: [
      "Your entries and trade history are still waiting for you",
      "Rebuild the routine that actually holds you accountable",
      "Stop trading on memory – start trading on data",
    ],
    cta: "Come Back to Structure",
  },
  week2: {
    subject: "What separates winning traders from losing ones.",
    headline: "The traders who win all have one thing in common.",
    quote: "They show up with data. Every single time.",
    body: "Not a better strategy. Not insider knowledge. Just a system. A journal. A way to see what's working and what isn't – before it costs them more money.",
    benefits: [
      "Turn inconsistency into a repeatable, trackable edge",
      "See patterns in your trading that no one else can show you",
      "Build confidence that comes from proof, not hope",
    ],
    cta: "Build My System",
  },
  week3: {
    subject: "Last call. Your data is still here.",
    headline: "Last call.",
    quote: "Your data is saved. Your edge isn't – that takes work.",
    body: "This is our final message. Everything you logged is still there. The hardest part is starting – and you already did that. Come back and keep going.",
    benefits: [
      "Pick up exactly where you left off – zero setup needed",
      "The journal that held you accountable is still here",
      "The longer you wait, the harder consistency gets",
    ],
    cta: "Reclaim Your Edge",
  },
};

function buildTrialEmailHtml(type: TrialEmailType, upgradeUrl: string): string {
  const config = TRIAL_EMAIL_CONFIGS[type];
  const logoUrl = "https://www.tjtradehub.com/logo-email.png";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#080808;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#080808;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background-color:#0d0d0d;border:1px solid #1a1a1a;border-radius:16px;overflow:hidden;">

        <!-- Logo -->
        <tr><td align="center" style="padding:32px 40px 28px;">
          <img src="${logoUrl}" alt="TJTradeHub" width="88" style="display:block;border-radius:10px;" />
        </td></tr>

        <tr><td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,#2a2a2a,transparent);"></div></td></tr>

        <!-- Headline -->
        <tr><td style="padding:36px 40px 0px;">
          <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;line-height:1.25;">${config.headline}</h1>
        </td></tr>

        <!-- Quote block -->
        <tr><td style="padding:24px 40px;">
          <div style="border-left:3px solid #a855f7;padding:12px 18px;background-color:#16101f;border-radius:0 6px 6px 0;">
            <p style="margin:0;font-size:14px;font-style:italic;color:#c084fc;line-height:1.6;">${config.quote}</p>
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:0 40px 28px;">
          <p style="margin:0;font-size:15px;color:#9ca3af;line-height:1.75;">${config.body}</p>
        </td></tr>

        <!-- Benefits -->
        <tr><td style="padding:0 40px 36px;">
          <table cellpadding="0" cellspacing="0" width="100%" style="background-color:#111111;border:1px solid #1f1f1f;border-radius:10px;padding:20px;">
            ${config.benefits.map((b) => `
            <tr><td style="padding:8px 0;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="vertical-align:top;padding-right:10px;padding-top:1px;">
                  <div style="width:18px;height:18px;background-color:#1e0a2e;border-radius:50%;text-align:center;line-height:18px;">
                    <span style="color:#a855f7;font-size:11px;font-weight:700;">✓</span>
                  </div>
                </td>
                <td><span style="font-size:14px;color:#d1d5db;line-height:1.5;">${b}</span></td>
              </tr></table>
            </td></tr>`).join("")}
          </table>
        </td></tr>

        <!-- CTA -->
        <tr><td align="center" style="padding:0 40px 44px;">
          <a href="${upgradeUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#a855f7);color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:16px 48px;border-radius:10px;letter-spacing:0.3px;box-shadow:0 0 24px rgba(168,85,247,0.3);">
            ${config.cta} →
          </a>
          <p style="margin:12px 0 0;font-size:12px;color:#4b5563;">$29/mo · Cancel anytime</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px;border-top:1px solid #1a1a1a;">
          <p style="margin:0;font-size:11px;color:#374151;text-align:center;line-height:1.8;">
            TJTradeHub · support@tjtradehub.com<br/>
            <a href="${upgradeUrl}" style="color:#4b5563;text-decoration:none;">Upgrade</a> &nbsp;·&nbsp;
            <a href="https://www.tjtradehub.com" style="color:#4b5563;text-decoration:none;">Website</a>
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
