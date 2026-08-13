import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

// Dieselben Regeln wie bei der Registrierung (app/api/register/route.ts) — sonst
// könnte man sich über diesen Weg ein schwächeres Passwort setzen als beim Anmelden.
const schema = z.object({
  currentPassword: z.string().min(1).max(200).optional(),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Bremst Durchprobieren des aktuellen Passworts über diesen Endpunkt.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = rateLimit(ip, "change-password", 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Too many attempts. Try again in ${rl.retryAfter} seconds.` },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { currentPassword, newPassword } = parsed.data;

  const { data: user, error: readErr } = await db
    .from("users")
    .select("password_hash")
    .eq("id", session.user.id)
    .single();

  if (readErr || !user) {
    console.error("change-password: user lookup failed", { userId: session.user.id, readErr });
    return NextResponse.json({ error: "Could not load account" }, { status: 500 });
  }

  // Google-Anmeldungen werden mit password_hash = "" angelegt (lib/auth.ts). Diese
  // Accounts haben kein Passwort, das man bestätigen könnte — hier ist die
  // bestehende Session der Identitätsnachweis, also wird nur GESETZT statt geändert.
  const hasPassword = !!user.password_hash;

  if (hasPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required" }, { status: 400 });
    }
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
    const same = await bcrypt.compare(newPassword, user.password_hash);
    if (same) {
      return NextResponse.json(
        { error: "New password must be different from the current one" },
        { status: 400 }
      );
    }
  }

  const { error: updErr } = await db
    .from("users")
    .update({
      password_hash: await bcrypt.hash(newPassword, 12),
      // Offene Reset-Links entwerten: wer sein Passwort bewusst ändert, will nicht,
      // dass ein älterer "Passwort vergessen"-Link aus einer Mail noch funktioniert.
      password_reset_token: null,
      password_reset_token_expires: null,
    })
    .eq("id", session.user.id);

  if (updErr) {
    console.error("change-password: update failed", { userId: session.user.id, updErr });
    return NextResponse.json({ error: "Could not save new password" }, { status: 500 });
  }

  return NextResponse.json({ success: true, wasSet: !hasPassword });
}
