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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action } = body as { action: "ban" | "unban" | "lifetime" | "cancel_subscription" };

  if (!["ban", "unban", "lifetime", "cancel_subscription"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Get user first
  const { data: user } = await db
    .from("users")
    .select("id, subscription_id, stripe_customer_id, subscription_status")
    .eq("id", id)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (action === "ban") {
    await db.from("users").update({ is_banned: true }).eq("id", id);
    return NextResponse.json({ success: true });
  }

  if (action === "unban") {
    await db.from("users").update({ is_banned: false }).eq("id", id);
    return NextResponse.json({ success: true });
  }

  if (action === "lifetime") {
    // Cancel Stripe sub if exists
    if (user.subscription_id) {
      try {
        await stripe.subscriptions.cancel(user.subscription_id);
      } catch {
        // ignore if already cancelled
      }
    }
    await db.from("users").update({
      subscription_status: "lifetime",
      subscription_id: null,
    }).eq("id", id);
    return NextResponse.json({ success: true });
  }

  if (action === "cancel_subscription") {
    if (!user.subscription_id) {
      return NextResponse.json({ error: "No active subscription" }, { status: 400 });
    }
    await stripe.subscriptions.cancel(user.subscription_id);
    await db.from("users").update({
      subscription_status: "canceled",
      subscription_id: null,
    }).eq("id", id);
    return NextResponse.json({ success: true });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Get user to cancel Stripe sub first
  const { data: user } = await db
    .from("users")
    .select("id, subscription_id")
    .eq("id", id)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.subscription_id) {
    try {
      await stripe.subscriptions.cancel(user.subscription_id);
    } catch {
      // ignore if already cancelled
    }
  }

  const { error } = await db.from("users").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
