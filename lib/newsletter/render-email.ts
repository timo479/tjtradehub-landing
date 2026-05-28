/**
 * Renders the weekly newsletter as inline-styled HTML for Resend.
 * Matches the existing transactional-email style in lib/email.ts:
 * black background, dark card, purple accents, table-based layout.
 *
 * Per-user stats are injected via `userStats` — pass null/undefined to skip
 * that section (e.g. for users with no trades that week).
 */

import type { GeneratedNewsletter } from "./generateContent";
import type { UserStats } from "./collectors";

interface RenderArgs {
  newsletter: GeneratedNewsletter;
  userStats: UserStats | null;
  recipientName: string | null;
  unsubscribeUrl: string;
  webViewUrl?: string;
}

export function renderNewsletterHtml(args: RenderArgs): string {
  const { newsletter, userStats, recipientName, unsubscribeUrl, webViewUrl } = args;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.tjtradehub.com";

  const greeting = recipientName
    ? `Hi ${escapeHtml(recipientName.split(" ")[0])},`
    : "Hi there,";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(newsletter.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <!-- Preheader (hidden, shows in inbox preview) -->
  <div style="display:none;font-size:1px;color:#000;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${escapeHtml(newsletter.intro.slice(0, 140))}
  </div>

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#000000;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background-color:#0a0a0a;border:1px solid #1f1f1f;border-radius:14px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:32px 32px 8px 32px;">
              <a href="${appUrl}" style="text-decoration:none;">
                <span style="font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">TJ <span style="color:#a855f7;">TradeHub</span></span>
              </a>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:0 32px 24px 32px;">
              <p style="margin:0;font-size:12px;color:#52525b;letter-spacing:0.06em;text-transform:uppercase;">Weekly Recap</p>
            </td>
          </tr>

          <!-- Subject as H1 -->
          <tr>
            <td style="padding:0 32px 16px 32px;">
              <h1 style="margin:0;font-size:24px;line-height:1.3;font-weight:700;color:#ffffff;letter-spacing:-0.3px;">
                ${escapeHtml(newsletter.subject)}
              </h1>
            </td>
          </tr>

          <!-- Intro -->
          <tr>
            <td style="padding:0 32px 32px 32px;">
              <p style="margin:0 0 12px 0;font-size:15px;color:#d4d4d8;line-height:1.6;">${escapeHtml(greeting)}</p>
              <p style="margin:0;font-size:15px;color:#d4d4d8;line-height:1.6;">${escapeHtml(newsletter.intro)}</p>
            </td>
          </tr>

          ${renderDivider()}

          <!-- Market Section -->
          ${renderSection({
            title: newsletter.marketSection.title,
            body: newsletter.marketSection.body,
          })}

          ${renderDivider()}

          <!-- Community Section -->
          ${renderSection({
            title: newsletter.communitySection.title,
            body: newsletter.communitySection.body,
            callout: newsletter.communitySection.highlight,
          })}

          ${userStats && userStats.hasData ? renderDivider() + renderUserStats(userStats) : ""}

          ${renderDivider()}

          <!-- Features Section -->
          ${renderFeatures(newsletter.featuresSection)}

          ${renderDivider()}

          <!-- Outro -->
          <tr>
            <td style="padding:0 32px 32px 32px;">
              <p style="margin:0;font-size:15px;color:#d4d4d8;line-height:1.6;">${escapeHtml(newsletter.outro)}</p>
              <p style="margin:24px 0 0 0;font-size:15px;color:#a1a1aa;">— The TJ TradeHub team</p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:0 32px 40px 32px;">
              <a href="${appUrl}/dashboard" style="display:inline-block;background-color:#a855f7;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;">
                Open Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#000000;border-top:1px solid #1f1f1f;">
              <p style="margin:0 0 8px 0;font-size:11px;color:#52525b;text-align:center;line-height:1.6;">
                You're receiving this because you opted in to the TJ TradeHub newsletter.
              </p>
              <p style="margin:0;font-size:11px;color:#52525b;text-align:center;line-height:1.6;">
                ${webViewUrl ? `<a href="${webViewUrl}" style="color:#71717a;text-decoration:underline;">View in browser</a> &nbsp;·&nbsp; ` : ""}<a href="${unsubscribeUrl}" style="color:#71717a;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// ============================================================
// Section helpers
// ============================================================

function renderDivider(): string {
  return `<tr><td style="padding:0 32px;"><div style="height:1px;background-color:#1f1f1f;"></div></td></tr>`;
}

function renderSection(args: { title: string; body: string; callout?: string }): string {
  const bodyParagraphs = args.body
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin:0 0 14px 0;font-size:15px;color:#d4d4d8;line-height:1.65;">${escapeHtml(p)}</p>`,
    )
    .join("");

  const callout = args.callout
    ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:8px 0 18px 0;background-color:rgba(168,85,247,0.08);border-left:3px solid #a855f7;border-radius:6px;">
        <tr><td style="padding:14px 18px;">
          <p style="margin:0;font-size:14px;color:#e4e4e7;line-height:1.5;font-weight:500;">${escapeHtml(args.callout)}</p>
        </td></tr>
      </table>`
    : "";

  return `<tr>
    <td style="padding:28px 32px;">
      <p style="margin:0 0 14px 0;font-size:11px;color:#a855f7;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">${escapeHtml(args.title)}</p>
      ${callout}
      ${bodyParagraphs}
    </td>
  </tr>`;
}

function renderFeatures(features: GeneratedNewsletter["featuresSection"]): string {
  const items = features.items
    .map(
      (item) => `<tr><td style="padding:0 0 18px 0;">
      <p style="margin:0 0 4px 0;font-size:15px;color:#ffffff;font-weight:600;line-height:1.4;">${escapeHtml(item.title)}</p>
      <p style="margin:0;font-size:14px;color:#a1a1aa;line-height:1.55;">${escapeHtml(item.description)}</p>
    </td></tr>`,
    )
    .join("");

  return `<tr>
    <td style="padding:28px 32px;">
      <p style="margin:0 0 18px 0;font-size:11px;color:#a855f7;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">${escapeHtml(features.title)}</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">${items}</table>
    </td>
  </tr>`;
}

function renderUserStats(stats: UserStats): string {
  const pnlColor = stats.totalPnl === null ? "#a1a1aa" : stats.totalPnl >= 0 ? "#22c55e" : "#ef4444";
  const pnlStr =
    stats.totalPnl === null
      ? "—"
      : `${stats.totalPnl >= 0 ? "+" : ""}${stats.totalPnl.toFixed(2)}`;
  const winRateColor =
    stats.winRate === null ? "#a1a1aa" : stats.winRate >= 50 ? "#22c55e" : "#ef4444";
  const winRateStr = stats.winRate === null ? "—" : `${stats.winRate}%`;

  return `<tr>
    <td style="padding:28px 32px;">
      <p style="margin:0 0 14px 0;font-size:11px;color:#a855f7;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">Your Week</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#000000;border:1px solid #1f1f1f;border-radius:10px;">
        <tr>
          <td width="25%" align="center" style="padding:18px 8px;border-right:1px solid #1f1f1f;">
            <p style="margin:0 0 4px 0;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Trades</p>
            <p style="margin:0;font-size:20px;color:#ffffff;font-weight:700;">${stats.trades}</p>
          </td>
          <td width="25%" align="center" style="padding:18px 8px;border-right:1px solid #1f1f1f;">
            <p style="margin:0 0 4px 0;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Win Rate</p>
            <p style="margin:0;font-size:20px;color:${winRateColor};font-weight:700;">${winRateStr}</p>
          </td>
          <td width="25%" align="center" style="padding:18px 8px;border-right:1px solid #1f1f1f;">
            <p style="margin:0 0 4px 0;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">P&amp;L</p>
            <p style="margin:0;font-size:20px;color:${pnlColor};font-weight:700;">${pnlStr}</p>
          </td>
          <td width="25%" align="center" style="padding:18px 8px;">
            <p style="margin:0 0 4px 0;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.05em;">Top Symbol</p>
            <p style="margin:0;font-size:14px;color:#ffffff;font-weight:700;">${stats.bestSymbol ? escapeHtml(stats.bestSymbol) : "—"}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// ============================================================
// HTML escaping
// ============================================================

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
