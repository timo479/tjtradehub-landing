import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendNewsletterBatch } from "@/lib/newsletter/sendBatch";

export const maxDuration = 300;

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  // Atomic: only flip from pending_approval → approved if still pending
  const { data: updated, error } = await db
    .from("newsletters")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      approved_by_user_id: session.user.id,
    })
    .eq("id", id)
    .eq("status", "pending_approval")
    .select("id")
    .single();

  if (error || !updated) {
    return NextResponse.json(
      { error: "Newsletter not found or not in pending_approval state" },
      { status: 409 },
    );
  }

  // Synchronous send — fine for our subscriber count.
  // If this ever exceeds ~60s, move to a background worker.
  try {
    const result = await sendNewsletterBatch(id);
    return NextResponse.json({ success: true, result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[newsletter/approve] send failed:", msg);
    // Roll the status back so admin can retry
    await db
      .from("newsletters")
      .update({ status: "failed", error_message: msg })
      .eq("id", id);
    return NextResponse.json({ error: "Send failed", message: msg }, { status: 500 });
  }
}
