import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body bgcolor="#080808" style="margin:0;padding:0;background-color:#080808;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" bgcolor="#080808" style="background-color:#080808;padding:56px 0;">
  <tr><td align="center" bgcolor="#080808" style="background-color:#080808;">
    <table width="540" cellpadding="0" cellspacing="0" bgcolor="#0c0c0c" style="background-color:#0c0c0c;border:1px solid #222222;border-radius:16px;overflow:hidden;max-width:540px;">

      <tr>
        <td align="center" style="padding:40px 48px 32px;">
          <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">TJ <span style="color:#a855f7;">TradeHub</span></span>
        </td>
      </tr>
      <tr>
        <td style="padding:0 48px;">
          <div style="height:1px;background:#2a2a2a;"></div>
        </td>
      </tr>
      <tr>
        <td style="padding:32px 48px 0;">
          <p style="margin:0 0 20px 0;font-size:15px;color:#9CA3AF;line-height:1.8;">Hey,</p>
          <p style="margin:0 0 20px 0;font-size:15px;color:#9CA3AF;line-height:1.8;">
            ich wollte dich kurz fragen &#8212; w&#228;rst du offen damit, ein kurzes ehrliches Zitat &#252;ber deine Erfahrung mit TJ TradeHub zu teilen? Wir planen eine Marketing-Email und w&#252;rden gerne ein echtes Testimonial von einem unserer ersten Nutzer einbauen.
          </p>
          <p style="margin:0 0 32px 0;font-size:15px;color:#9CA3AF;line-height:1.8;">
            Kein Druck, nur falls es wirklich deiner Meinung entspricht.
          </p>
          <p style="margin:0;font-size:15px;color:#9CA3AF;line-height:1.8;">&#8212; TJ TradeHub</p>
        </td>
      </tr>
      <tr>
        <td bgcolor="#070707" style="background-color:#070707;border-top:1px solid #1c1c1c;padding:24px 48px;margin-top:40px;">
          <p style="margin:0;font-size:12px;color:#3F3F46;text-align:center;line-height:1.8;">
            TJ TradeHub &nbsp;&#183;&nbsp; <a href="https://www.tjtradehub.com" style="color:#52525b;text-decoration:underline;">tjtradehub.com</a>
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data, error } = await resend.emails.send({
    from: "TJ TradeHub <noreply@tjtradehub.com>",
    to: ["mlptradingllc@gmail.com"],
    subject: "Kurze Frage — Testimonial",
    html,
  });

  if (error) return NextResponse.json({ error }, { status: 500 });
  return NextResponse.json({ ok: true, id: data?.id });
}
