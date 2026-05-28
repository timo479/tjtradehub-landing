/**
 * Handles unsubscribe via:
 *   1. RFC 8058 One-Click (Gmail/Yahoo POST with body "List-Unsubscribe=One-Click")
 *   2. User clicking the "Unsubscribe" button on /unsubscribe page (form POST)
 *
 * Token-based auth: the unsubscribe_token in the URL is the secret.
 * No session required — users must be able to unsubscribe without logging in.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");

  if (!token || token === "PREVIEW") {
    return NextResponse.json({ error: "Missing or invalid token" }, { status: 400 });
  }

  // Lookup user by token
  const { data: user } = await db
    .from("users")
    .select("id, newsletter_opt_in")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (!user) {
    // Don't leak whether the token exists — just return generic success.
    // Email scanners (Gmail/Yahoo) shouldn't be able to enumerate tokens.
    return NextResponse.json({ success: true });
  }

  // Idempotent: if already opted-out, return success without DB write
  if (!user.newsletter_opt_in) {
    return NextResponse.json({ success: true, alreadyUnsubscribed: true });
  }

  const { error: updateErr } = await db
    .from("users")
    .update({ newsletter_opt_in: false })
    .eq("id", user.id);

  if (updateErr) {
    console.error("[unsubscribe] failed to update user:", updateErr);
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 });
  }

  // Mark this user's most recent send as unsubscribed (best-effort, for analytics)
  await db
    .from("newsletter_sends")
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("unsubscribed_at", null)
    .order("sent_at", { ascending: false })
    .limit(1);

  return NextResponse.json({ success: true });
}
