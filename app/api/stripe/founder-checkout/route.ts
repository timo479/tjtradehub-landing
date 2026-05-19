import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { getFounderStats } from "@/lib/founders";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please sign in to claim a Founder spot" }, { status: 401 });
  }

  const priceId = process.env.STRIPE_FOUNDER_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "Founder checkout not yet configured" }, { status: 503 });
  }

  const { data: user } = await db
    .from("users")
    .select("stripe_customer_id, email, subscription_status, founder_number")
    .eq("id", session.user.id)
    .single();

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.subscription_status === "lifetime" || user.founder_number) {
    return NextResponse.json({ error: "You already have a Founder Lifetime spot" }, { status: 400 });
  }

  // Cap check (race condition acceptable — webhook enforces hard cap atomically)
  const stats = await getFounderStats();
  if (stats.remainingForSale <= 0) {
    return NextResponse.json({ error: "All Founder spots are sold out" }, { status: 410 });
  }

  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: session.user.id },
    });
    customerId = customer.id;
    await db.from("users").update({ stripe_customer_id: customerId }).eq("id", session.user.id);
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?founder=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/founders?cancelled=true`,
    metadata: {
      userId: session.user.id,
      kind: "founder_lifetime",
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
