import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// ─── Trial Emails ────────────────────────────────────────────────────────────

export type TrialEmailType = "day5" | "day6" | "day7" | "day8" | "week1" | "week2" | "week3";

const TRIAL_EMAIL_CONFIGS: Record<TrialEmailType, {
  subject: string;
  headline: string;
  moment: string;
  quote: string;
  body: string;
  benefits: [string, string, string];
  cta: string;
}> = {
  day5: {
    subject: "In 2 days, you lose your edge",
    headline: "In 2 days, you go back to guessing.",
    moment: "You know that trade. It feels right. You enter anyway – against your rule. No journal means no proof it was wrong. So you do it again next week.",
    quote: "You don't have a strategy problem. You have a discipline problem.",
    body: "Losing access isn't just losing a tool. It's losing the only thing holding you accountable.",
    benefits: [
      "See exactly which rules you break – and when",
      "Stop repeating the same losing setups week after week",
      "Trade from data, not from how you feel in the moment",
    ],
    cta: "Lock In My Edge",
  },
  day6: {
    subject: "Tomorrow it stops.",
    headline: "Tomorrow you lose your feedback loop.",
    moment: "That trade you took while frustrated after a loss – you knew it was wrong. Your journal caught it. Tomorrow it won't.",
    quote: "Discipline fades the moment you stop tracking it.",
    body: "One day left. After that, you trade alone – no record, no pattern, no accountability.",
    benefits: [
      "Catch the emotional spirals before they cost you",
      "Know your actual win rate – not the one you remember",
      "Keep the structure that keeps you from overtrading",
    ],
    cta: "Don't Lose the Streak",
  },
  day7: {
    subject: "Today. Commit or quit.",
    headline: "This is the moment. Commit or quit.",
    moment: "Most traders who say 'I'll come back to it' don't. They tell themselves they'll be more disciplined next week. They aren't.",
    quote: "Every trader has a plan until emotions take over.",
    body: "Your data is here. Your patterns are here. The only question is whether you are.",
    benefits: [
      "Stop guessing and start seeing your real patterns",
      "Keep the accountability you built over 7 days",
      "One click to lock in what you've already started",
    ],
    cta: "I'm In – Stay Consistent",
  },
  day8: {
    subject: "You stopped. Your losses didn't.",
    headline: "Your trial ended. The mistakes didn't.",
    moment: "Without a record, every loss feels like bad luck. It isn't. The patterns were always there. You just stopped looking.",
    quote: "Without data, you're just a trader with opinions.",
    body: "Your journal is still here. Your entries, your stats, your patterns – all saved. Come back to structure.",
    benefits: [
      "Resume instantly – zero setup, all data intact",
      "See the patterns that repeated while you were away",
      "Get back the clarity you had when you were tracking",
    ],
    cta: "Get Back in Control",
  },
  week1: {
    subject: "One week without structure. Be honest.",
    headline: "One week gone. How's the discipline?",
    moment: "You probably told yourself you'd track trades manually. Or remember them. Traders always say that. They don't.",
    quote: "Discipline doesn't survive without a system.",
    body: "The structure is still here. Your data is still here. The only thing missing is you.",
    benefits: [
      "Everything you logged during your trial is saved",
      "No catching up – just pick up where you left off",
      "Rebuild the routine before the old habits take over",
    ],
    cta: "Come Back to Structure",
  },
  week2: {
    subject: "Your best week vs. your worst. You know the difference.",
    headline: "You already know what separates them.",
    moment: "Your best week – you were tracking. Reviewing. Seeing what worked. Your worst – you were guessing and hoping it would fix itself.",
    quote: "The traders who win long-term aren't luckier. They're more honest with themselves.",
    body: "The edge isn't in a new strategy. It's in understanding your own behavior.",
    benefits: [
      "See exactly what makes your best days different",
      "Identify the setups you should have stopped taking",
      "Build consistency from patterns, not promises",
    ],
    cta: "Build My Edge",
  },
  week3: {
    subject: "Last call.",
    headline: "This is the last time we'll say this.",
    moment: "Three weeks without a journal. You know how that's gone. The same mistakes don't feel like mistakes anymore – they just feel like trading.",
    quote: "The cost of inconsistency compounds. Just like losses.",
    body: "Your data is still here. This is our last message. The decision is yours.",
    benefits: [
      "All your data is saved – no starting over",
      "Come back before the habits become permanent",
      "The hardest part is starting. You already did that once.",
    ],
    cta: "Reclaim My Edge",
  },
};

function buildTrialEmailHtml(type: TrialEmailType, upgradeUrl: string): string {
  const config = TRIAL_EMAIL_CONFIGS[type];
  const logoUrl = "https://www.tjtradehub.com/logo-email.png";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#060606;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#060606;padding:48px 0;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;border:1px solid #1c1c1c;border-radius:16px;overflow:hidden;">

        <!-- Logo -->
        <tr><td align="center" style="padding:36px 48px 32px;">
          <img src="${logoUrl}" alt="TJTradeHub" width="84" style="display:block;border-radius:10px;" />
        </td></tr>

        <!-- Gradient separator -->
        <tr><td><div style="height:1px;background:linear-gradient(90deg,#0a0a0a,#7c3aed 40%,#a855f7 60%,#0a0a0a);opacity:0.6;"></div></td></tr>

        <!-- Headline -->
        <tr><td style="padding:44px 48px 0;">
          <h1 style="margin:0;font-size:30px;font-weight:900;color:#ffffff;letter-spacing:-0.8px;line-height:1.2;">${config.headline}</h1>
        </td></tr>

        <!-- Moment trigger -->
        <tr><td style="padding:20px 48px 0;">
          <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.8;font-style:italic;">${config.moment}</p>
        </td></tr>

        <!-- Quote block – reality check -->
        <tr><td style="padding:28px 48px;">
          <div style="background-color:#050505;border:1px solid #2a1a3e;border-left:4px solid #a855f7;border-radius:4px 8px 8px 4px;padding:20px 24px;">
            <p style="margin:0;font-size:15px;font-weight:700;color:#e2d4f8;line-height:1.5;letter-spacing:0.1px;">${config.quote}</p>
          </div>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:0 48px 36px;">
          <p style="margin:0;font-size:15px;color:#9ca3af;line-height:1.8;">${config.body}</p>
        </td></tr>

        <!-- Benefits -->
        <tr><td style="padding:0 48px 44px;">
          <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #1c1c1c;border-radius:12px;background-color:#0f0f0f;">
            ${config.benefits.map((b, i) => `
            <tr><td style="padding:16px 22px;${i < 2 ? "border-bottom:1px solid #161616;" : ""}">
              <table cellpadding="0" cellspacing="0" width="100%"><tr>
                <td width="28" style="vertical-align:middle;">
                  <div style="width:22px;height:22px;background:linear-gradient(135deg,#3b1a6e,#6d28d9);border-radius:50%;text-align:center;line-height:22px;">
                    <span style="color:#e9d5ff;font-size:12px;font-weight:800;">✓</span>
                  </div>
                </td>
                <td style="padding-left:12px;"><span style="font-size:14px;color:#e5e7eb;line-height:1.6;">${b}</span></td>
              </tr></table>
            </td></tr>`).join("")}
          </table>
        </td></tr>

        <!-- CTA section – dark contrast block -->
        <tr><td style="background-color:#070707;border-top:1px solid #1c1c1c;padding:40px 48px;">
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr><td align="center">
              <a href="${upgradeUrl}" style="display:inline-block;background:linear-gradient(135deg,#6d28d9,#9333ea,#a855f7);color:#ffffff;text-decoration:none;font-size:17px;font-weight:800;padding:18px 56px;border-radius:10px;letter-spacing:0.4px;box-shadow:0 0 32px rgba(139,92,246,0.45),0 4px 16px rgba(0,0,0,0.5);">
                ${config.cta} →
              </a>
            </td></tr>
            <tr><td align="center" style="padding-top:14px;">
              <p style="margin:0;font-size:12px;color:#374151;">$29/mo &nbsp;·&nbsp; Cancel anytime</p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:22px 48px;border-top:1px solid #141414;">
          <p style="margin:0;font-size:11px;color:#2d2d2d;text-align:center;line-height:2;">
            TJTradeHub &nbsp;·&nbsp; support@tjtradehub.com<br/>
            <a href="${upgradeUrl}" style="color:#3f3f46;text-decoration:none;">Upgrade</a> &nbsp;·&nbsp;
            <a href="https://www.tjtradehub.com" style="color:#3f3f46;text-decoration:none;">Website</a>
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
