import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

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

export async function sendFounderWelcomeEmail(args: {
  to: string;
  resetToken: string | null; // null means user already has a password (existing account)
  founderNumber: number;
}) {
  const { to, resetToken, founderNumber } = args;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.tjtradehub.com";
  const ctaUrl = resetToken
    ? `${appUrl}/reset-password?token=${resetToken}`
    : `${appUrl}/login`;
  const ctaLabel = resetToken ? "Set your password →" : "Sign in to your account →";
  const padded = String(founderNumber).padStart(3, "0");

  await resend.emails.send({
    from: "TJ TradeHub <noreply@tjtradehub.com>",
    to,
    subject: `Welcome, Founder #${padded} — your lifetime access is ready`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /></head>
<body style="margin:0;padding:0;background-color:#000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000;padding:48px 0;">
    <tr><td align="center">
      <table width="540" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;border:1px solid #1f1f1f;border-radius:14px;overflow:hidden;">
        <tr><td align="center" style="padding:40px 48px 8px;">
          <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;color:#FBBF24;text-transform:uppercase;">✦ Founder Lifetime</div>
        </td></tr>
        <tr><td align="center" style="padding:8px 48px 32px;">
          <div style="font-size:64px;font-weight:800;background:linear-gradient(135deg,#FCD34D,#F59E0B);-webkit-background-clip:text;-webkit-text-fill-color:transparent;line-height:1;">#${padded}</div>
          <div style="font-size:13px;color:#6B7280;margin-top:6px;letter-spacing:0.04em;">your founder number, forever yours</div>
        </td></tr>
        <tr><td style="padding:0 48px 24px;">
          <h1 style="margin:0;font-size:22px;font-weight:700;color:#F9FAFB;letter-spacing:-0.3px;">You're in.</h1>
          <p style="margin:14px 0 0;font-size:15px;color:#9CA3AF;line-height:1.7;">
            Thanks for backing TJ TradeHub. Your $149 paid for full Lifetime access — every feature, today and in every future release. No recurring charges, ever.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:8px 48px 36px;">
          <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#FCD34D,#F59E0B);color:#1a0a2e;text-decoration:none;font-size:15px;font-weight:800;padding:15px 36px;border-radius:10px;letter-spacing:0.02em;box-shadow:0 8px 24px rgba(251,191,36,0.35);">
            ${ctaLabel}
          </a>
          ${resetToken ? `<p style="margin:14px 0 0;font-size:12px;color:#52525b;">Link expires in 1 hour. Need a fresh one? Use <a href="${appUrl}/forgot-password" style="color:#A78BFA;">forgot password</a>.</p>` : ""}
        </td></tr>
        <tr><td style="background-color:#070707;border-top:1px solid #1c1c1c;padding:24px 48px;">
          <p style="margin:0;font-size:12px;color:#52525b;text-align:center;line-height:1.8;">
            TJ TradeHub · support@tjtradehub.com<br/>
            Founder #${padded} of 100 · One of one
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
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
