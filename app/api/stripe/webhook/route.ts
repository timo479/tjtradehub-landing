import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { removeAccount } from "@/lib/metaapi";

async function cleanupMetaAccount(stripeCustomerId: string) {
  const { data: user } = await db
    .from("users")
    .select("id, metaapi_account_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();

  if (user?.metaapi_account_id) {
    await removeAccount(user.metaapi_account_id).catch(() => null);
    await db.from("users").update({
      metaapi_account_id: null,
      metaapi_account_state: null,
      mt_login: null,
      mt_password: null,
      mt_server: null,
      mt_platform: null,
      last_meta_sync: null,
    }).eq("id", user.id);
  }
}

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

  // In Stripe API 2024-09-30.acacia+, current_period_end moved to items.data[0]
  const getPeriodEnd = (sub: Stripe.Subscription): string | null => {
    const ts =
      sub.items?.data?.[0]?.current_period_end ??
      (sub as unknown as { current_period_end?: number }).current_period_end;
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
      if (session.payment_status !== "paid") break;
      const customerId = session.customer as string;
      if (!customerId) break;

      const { error: csErr } = await db
        .from("users")
        .update({
          subscription_id: sub.id,
          subscription_status: sub.status,
          current_period_end: getPeriodEnd(sub),
        })
        .eq("stripe_customer_id", customerId);
      if (csErr) console.error("Webhook DB error (checkout.completed):", csErr, "customer:", customerId);
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = getCustomerId(sub);
      if (!customerId) break;

      const { error: cuErr } = await db
        .from("users")
        .update({
          subscription_id: sub.id,
          subscription_status: sub.status,
          current_period_end: getPeriodEnd(sub),
        })
        .eq("stripe_customer_id", customerId);
      if (cuErr) console.error("Webhook DB error (subscription.created/updated):", cuErr, "customer:", customerId);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = getCustomerId(sub);
      if (!customerId) break;

      await cleanupMetaAccount(customerId);
      const { error: sdErr } = await db
        .from("users")
        .update({
          subscription_status: "canceled",
          current_period_end: null,
        })
        .eq("stripe_customer_id", customerId);
      if (sdErr) console.error("Webhook DB error (subscription.deleted):", sdErr, "customer:", customerId);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = getCustomerId(invoice);
      if (!customerId) break;

      await cleanupMetaAccount(customerId);
      const { error: pfErr } = await db
        .from("users")
        .update({ subscription_status: "past_due" })
        .eq("stripe_customer_id", customerId);
      if (pfErr) console.error("Webhook DB error (payment_failed):", pfErr, "customer:", customerId);
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = getCustomerId(invoice);
      if (!customerId) break;

      const subscriptionId = (invoice as { subscription?: string }).subscription;
      if (!subscriptionId) break;

      try {
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const { error: psErr } = await db
          .from("users")
          .update({
            subscription_id: sub.id,
            subscription_status: sub.status,
            current_period_end: getPeriodEnd(sub),
          })
          .eq("stripe_customer_id", customerId);
        if (psErr) console.error("Webhook DB error (payment_succeeded):", psErr, "customer:", customerId);
      } catch (e) {
        console.error("Webhook payment_succeeded retrieve error:", e);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
