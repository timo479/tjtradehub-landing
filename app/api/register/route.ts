import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { sendVerificationEmail } from "@/lib/email";
import { awardLots, generateUniqueReferralCode, LOTS_PER_REFERRAL, LOTS_PER_SOURCE } from "@/lib/lottery";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  ref: z.string().trim().min(1).max(64).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = rateLimit(ip, "register", 3, 60 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${rl.retryAfter} seconds.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, password, ref } = result.data;

    // Check if user exists
    const { data: existing } = await db
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Resolve referrer (if any) — must exist and not be self
    let referredByUserId: string | null = null;
    if (ref) {
      const { data: referrer } = await db
        .from("users")
        .select("id, email")
        .eq("referral_code", ref.toLowerCase())
        .maybeSingle();
      if (referrer) referredByUserId = referrer.id;
    }

    const password_hash = await bcrypt.hash(password, 12);
    const verification_token = crypto.randomBytes(32).toString("hex");
    const verification_token_expires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    ).toISOString();

    const trialDays = parseInt(process.env.TRIAL_DAYS ?? "7");
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + trialDays);

    const referralCode = await generateUniqueReferralCode(email);

    const { data: inserted, error } = await db
      .from("users")
      .insert({
        name,
        email,
        password_hash,
        email_verified: false,
        verification_token,
        verification_token_expires,
        trial_ends_at: trialEnds.toISOString(),
        subscription_status: "trialing",
        referral_code: referralCode,
        referred_by_user_id: referredByUserId,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      console.error("DB insert error:", error);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    // Award lottery lots (best-effort, never block registration)
    try {
      await awardLots(inserted.id, email, "register", LOTS_PER_SOURCE.register);
      if (referredByUserId) {
        const { data: referrer } = await db
          .from("users")
          .select("email")
          .eq("id", referredByUserId)
          .single();
        if (referrer?.email) {
          await awardLots(referredByUserId, referrer.email, "referrals", LOTS_PER_REFERRAL);
        }
      }
    } catch (lotteryErr) {
      console.error("Lottery award error:", lotteryErr);
    }

    try {
      await sendVerificationEmail(email, verification_token);
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
      // Don't fail registration if email fails – user can request resend later
    }

    return NextResponse.json(
      { success: true, message: "Account created. Please check your email to verify your address." },
      { status: 201 }
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
