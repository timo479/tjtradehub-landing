import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { token, password } = result.data;

  const { data: user } = await db
    .from("users")
    .select("id, password_reset_token_expires")
    .eq("password_reset_token", token)
    .single();

  if (!user) {
    return NextResponse.json({ error: "Invalid or expired reset link." }, { status: 400 });
  }

  if (new Date(user.password_reset_token_expires) < new Date()) {
    return NextResponse.json({ error: "This reset link has expired. Please request a new one." }, { status: 400 });
  }

  const password_hash = await bcrypt.hash(password, 12);

  await db
    .from("users")
    .update({
      password_hash,
      password_reset_token: null,
      password_reset_token_expires: null,
    })
    .eq("id", user.id);

  return NextResponse.json({ success: true });
}
