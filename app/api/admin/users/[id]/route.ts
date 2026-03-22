import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") return null;
  return session;
}

async function logAction(adminEmail: string, targetEmail: string, action: string, details?: string) {
  await db.from("admin_activity_log").insert({
    admin_email: adminEmail,
    target_email: targetEmail,
    action,
    details: details ?? null,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();
  const { action, note } = body as { action: string; note?: string };

  const validActions = ["ban", "unban", "lifetime", "cancel_subscription", "save_note"];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const { data: user } = await db
    .from("users")
    .select("id, email, subscription_id, subscription_status")
    .eq("id", id)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const adminEmail = session.user.email ?? "unknown";

  if (action === "ban") {
    await db.from("users").update({ is_banned: true }).eq("id", id);
    await logAction(adminEmail, user.email, "ban");
    return NextResponse.json({ success: true });
  }

  if (action === "unban") {
    await db.from("users").update({ is_banned: false }).eq("id", id);
    await logAction(adminEmail, user.email, "unban");
    return NextResponse.json({ success: true });
  }

  if (action === "lifetime") {
    if (user.subscription_id) {
      try { await stripe.subscriptions.cancel(user.subscription_id); } catch { /* already cancelled */ }
    }
    await db.from("users").update({ subscription_status: "lifetime", subscription_id: null }).eq("id", id);
    await logAction(adminEmail, user.email, "lifetime");
    return NextResponse.json({ success: true });
  }

  if (action === "cancel_subscription") {
    if (!user.subscription_id) return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    await stripe.subscriptions.cancel(user.subscription_id);
    await db.from("users").update({ subscription_status: "canceled", subscription_id: null }).eq("id", id);
    await logAction(adminEmail, user.email, "cancel_subscription");
    return NextResponse.json({ success: true });
  }

  if (action === "save_note") {
    await db.from("users").update({ admin_note: note ?? null }).eq("id", id);
    await logAction(adminEmail, user.email, "save_note", note ?? "cleared");
    return NextResponse.json({ success: true });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const { data: user } = await db.from("users").select("id, email, subscription_id").eq("id", id).single();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.subscription_id) {
    try { await stripe.subscriptions.cancel(user.subscription_id); } catch { /* already cancelled */ }
  }

  await logAction(session.user.email ?? "unknown", user.email, "delete");

  const { error } = await db.from("users").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });

  return NextResponse.json({ success: true });
}
