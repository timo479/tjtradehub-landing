import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
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

  // Always return success to avoid user enumeration
  if (!user) {
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
    return NextResponse.json({ error: "Failed to send email. Please try again in a moment." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
