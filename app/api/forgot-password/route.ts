import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

const MIN_RESPONSE_MS = 1200; // constant-time response to prevent timing attacks

export async function POST(req: NextRequest) {
  const start = Date.now();

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(ip, "forgot-password", 3, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfter} seconds.` },
      { status: 429 }
    );
  }

  let body: unknown;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { email } = result.data;

  const { data: user } = await db
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  const pad = async () => {
    const elapsed = Date.now() - start;
    if (elapsed < MIN_RESPONSE_MS) await new Promise(r => setTimeout(r, MIN_RESPONSE_MS - elapsed));
  };

  // Always return success to avoid user enumeration – pad time to prevent timing attacks
  if (!user) {
    await pad();
    return NextResponse.json({ success: true });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

  await db
    .from("users")
    .update({ password_reset_token: token, password_reset_token_expires: expires })
    .eq("id", user.id);

  try {
    await sendPasswordResetEmail(email, token);
  } catch (err) {
    console.error("Reset email error:", err);
    await pad();
    return NextResponse.json({ error: "Failed to send email. Please try again in a moment." }, { status: 500 });
  }

  await pad();
  return NextResponse.json({ success: true });
}
