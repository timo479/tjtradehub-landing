import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = rateLimit(ip, "resend-verification", 3, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.toLowerCase().trim() : null;
    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const { data: user } = await db
      .from("users")
      .select("id, email_verified")
      .eq("email", email)
      .single();

    // Always return success to avoid user enumeration
    if (!user || user.email_verified) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db.from("users").update({
      verification_token: token,
      verification_token_expires: expires,
    }).eq("id", user.id);

    await sendVerificationEmail(email, token);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true }); // never reveal errors
  }
}
