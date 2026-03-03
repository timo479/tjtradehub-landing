import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const getCustomerId = (obj: unknown) =>
    (obj as { customer?: string })?.customer ?? null;

  // In Stripe API 2026+, current_period_end moved to items.data[0]
  const getPeriodEnd = (sub: Stripe.Subscription): string | null => {
    const ts = sub.items?.data?.[0]?.current_period_end;
    if (!ts) return null;
    return new Date(ts * 1000).toISOString();
  };

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription" || !session.subscription) break;

      const sub = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      const customerId = session.customer as string;
      if (!customerId) break;

      await db
        .from("users")
        .update({
          subscription_id: sub.id,
          subscription_status: sub.status,
          current_period_end: getPeriodEnd(sub),
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = getCustomerId(sub);
      if (!customerId) break;

      await db
        .from("users")
        .update({
          subscription_id: sub.id,
          subscription_status: sub.status,
          current_period_end: getPeriodEnd(sub),
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = getCustomerId(sub);
      if (!customerId) break;

      await db
        .from("users")
        .update({
          subscription_status: "canceled",
          current_period_end: null,
        })
        .eq("stripe_customer_id", customerId);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = getCustomerId(invoice);
      if (!customerId) break;

      await db
        .from("users")
        .update({ subscription_status: "past_due" })
        .eq("stripe_customer_id", customerId);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
