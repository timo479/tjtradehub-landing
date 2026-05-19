import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { claimFounderSlot } from "@/lib/founders";
import { generateUniqueReferralCode } from "@/lib/lottery";
import { sendFounderWelcomeEmail } from "@/lib/email";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return { status: 401 as const, error: "Unauthorized" };
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") return { status: 403 as const, error: "Forbidden" };
  return { adminEmail: session.user.email as string };
}

// GET — list all claimed slots
export async function GET() {
  const a = await requireAdmin();
  if ("error" in a) return NextResponse.json({ error: a.error }, { status: a.status });

  const { data: slots, error } = await db
    .from("founder_slots")
    .select("number, acquired_via, claimed_at, email, claimed_by_user_id")
    .not("claimed_by_user_id", "is", null)
    .order("number", { ascending: true });

  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });

  return NextResponse.json({ slots: slots ?? [] });
}

// POST — manually grant a slot (giveaway winner or soft-launch friend)
const grantSchema = z.object({
  email: z.string().email().transform((e) => e.toLowerCase().trim()),
  name: z.string().min(1).max(120).optional(),
  acquired_via: z.enum(["giveaway", "soft_launch"]),
  send_email: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  const a = await requireAdmin();
  if ("error" in a) return NextResponse.json({ error: a.error }, { status: a.status });

  const body = await req.json();
  const parsed = grantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { email, name, acquired_via, send_email } = parsed.data;

  // Find or create user
  const { data: existing } = await db
    .from("users")
    .select("id, founder_number")
    .eq("email", email)
    .maybeSingle();

  if (existing?.founder_number) {
    return NextResponse.json(
      { error: `User already has Founder #${existing.founder_number}` },
      { status: 409 }
    );
  }

  let userId = existing?.id ?? null;
  let isNewAccount = false;

  if (!userId) {
    const randomPwHash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 12);
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + 7);
    const referralCode = await generateUniqueReferralCode(email);

    const { data: created, error: createErr } = await db
      .from("users")
      .insert({
        email,
        name: name ?? email.split("@")[0],
        password_hash: randomPwHash,
        email_verified: true,
        trial_ends_at: trialEnds.toISOString(),
        subscription_status: "trialing",
        referral_code: referralCode,
      })
      .select("id")
      .single();

    if (createErr || !created) {
      console.error("Admin grant: user create failed", createErr);
      return NextResponse.json({ error: "Could not create user" }, { status: 500 });
    }
    userId = created.id;
    isNewAccount = true;
  }

  // Generate password-reset token for new accounts so they can set their password
  let resetToken: string | null = null;
  if (isNewAccount) {
    resetToken = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7d for admin grants
    await db
      .from("users")
      .update({
        password_reset_token: resetToken,
        password_reset_token_expires: expires,
      })
      .eq("id", userId);
  }

  const result = await claimFounderSlot({
    userId: userId!,
    email,
    acquiredVia: acquired_via,
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  // Audit log
  await db.from("admin_activity_log").insert({
    admin_email: a.adminEmail,
    target_email: email,
    action: "founder_grant",
    details: `Founder #${String(result.slot).padStart(3, "0")} via ${acquired_via}${isNewAccount ? " (new account)" : ""}`,
  });

  // Welcome email (best-effort)
  if (send_email) {
    try {
      await sendFounderWelcomeEmail({
        to: email,
        resetToken,
        founderNumber: result.slot,
      });
    } catch (err) {
      console.error("Admin grant: welcome email failed", err);
    }
  }

  return NextResponse.json({
    success: true,
    slot: result.slot,
    user_id: userId,
    new_account: isNewAccount,
  });
}
