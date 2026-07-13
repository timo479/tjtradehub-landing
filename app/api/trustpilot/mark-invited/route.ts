import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

/**
 * Marks the current user as "Trustpilot-invited" after the client-side
 * Invitation JS has fired. Idempotent: only flips NULL -> now(), so a second
 * call (or a later cron pass) is a no-op.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await db
    .from("users")
    .update({ trustpilot_invited_at: new Date().toISOString() })
    .eq("id", session.user.id)
    .is("trustpilot_invited_at", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
