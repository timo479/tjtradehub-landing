import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { removeAccount } from "@/lib/metaapi";
import { sendTikTokCompletePayment } from "@/lib/tiktok-events";
import { claimFounderSlot } from "@/lib/founders";
import { sendFounderWelcomeEmail } from "@/lib/email";
import { generateUniqueReferralCode } from "@/lib/lottery";

async function cleanupMetaAccount(stripeCustomerId: string) {
  const { data: user } = await db
    .from("users")
    .select("id, metaapi_account_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();

  if (user?.metaapi_account_id) {
    await removeAccount(user.metaapi_account_id).catch((e) =>
      console.error("MetaAPI removeAccount failed (account may be orphaned):", e, "account:", user.metaapi_account_id, "user:", user.id)
    );
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
      if (session.payment_status !== "paid") break;

      // One-time Founder Lifetime payment (mode='payment')
      if (session.mode === "payment" && session.metadata?.kind === "founder_lifetime") {
        const email = (session.customer_details?.email ?? "").toLowerCase().trim();
        if (!email) {
          console.error("FOUNDER_NO_EMAIL — refund required. session:", session.id);
          return NextResponse.json({ error: "No customer email" }, { status: 400 });
        }

        let userId = session.metadata.userId ?? null;
        let resetToken: string | null = null;

        // Guest checkout: find or create user
        if (!userId) {
          const { data: existing } = await db
            .from("users")
            .select("id")
            .eq("email", email)
            .maybeSingle();

          if (existing) {
            userId = existing.id;
          } else {
            // Create a fresh account for the buyer. Password set later via email link.
            const randomPwHash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 12);
            const trialEnds = new Date();
            trialEnds.setDate(trialEnds.getDate() + 7);
            const referralCode = await generateUniqueReferralCode(email);

            const { data: created, error: createErr } = await db
              .from("users")
              .insert({
                email,
                name: session.customer_details?.name ?? email.split("@")[0],
                password_hash: randomPwHash,
                email_verified: true, // Stripe paid → email is real
                trial_ends_at: trialEnds.toISOString(),
                subscription_status: "trialing",
                stripe_customer_id: (session.customer as string | null) ?? null,
                referral_code: referralCode,
              })
              .select("id")
              .single();

            if (createErr || !created) {
              console.error(
                "FOUNDER_USER_CREATE_FAILED — refund required. session:",
                session.id,
                "email:",
                email,
                "error:",
                createErr
              );
              return NextResponse.json({ error: "User create failed" }, { status: 500 });
            }
            userId = created.id;
          }

          // Issue a password-reset token so they can set up access
          resetToken = crypto.randomBytes(32).toString("hex");
          const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
          await db
            .from("users")
            .update({
              password_reset_token: resetToken,
              password_reset_token_expires: expires,
            })
            .eq("id", userId);
        }

        const result = await claimFounderSlot({
          userId: userId!,
          email,
          acquiredVia: "sale",
          stripeSessionId: session.id,
        });

        if ("error" in result) {
          console.error(
            "FOUNDER_SLOT_CLAIM_FAILED — refund required:",
            result.error,
            "session:",
            session.id,
            "user:",
            userId,
            "amount:",
            session.amount_total
          );
          return NextResponse.json({ error: result.error }, { status: 500 });
        }

        console.log(`Founder #${String(result.slot).padStart(3, "0")} claimed by ${userId}`);

        // Welcome email (best-effort — user can recover via /forgot-password)
        try {
          await sendFounderWelcomeEmail({
            to: email,
            resetToken,
            founderNumber: result.slot,
          });
        } catch (emailErr) {
          console.error("Founder welcome email failed:", emailErr, "user:", userId);
        }

        await sendTikTokCompletePayment({
          eventId: event.id,
          eventTime: event.created,
          email,
          externalId: userId,
          value: session.amount_total != null ? session.amount_total / 100 : null,
          currency: session.currency,
        });
        break;
      }

      // Existing subscription flow ($29/mo)
      if (session.mode !== "subscription" || !session.subscription) break;

      const sub = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
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
      if (csErr) {
        console.error("Webhook DB error (checkout.completed):", csErr, "customer:", customerId);
        return NextResponse.json({ error: "DB update failed" }, { status: 500 });
      }

      await sendTikTokCompletePayment({
        eventId: event.id,
        eventTime: event.created,
        email: session.customer_details?.email,
        externalId: session.metadata?.userId ?? null,
        value: session.amount_total != null ? session.amount_total / 100 : null,
        currency: session.currency,
      });
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
      if (cuErr) {
        console.error("Webhook DB error (subscription.created/updated):", cuErr, "customer:", customerId);
        return NextResponse.json({ error: "DB update failed" }, { status: 500 });
      }
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
      if (sdErr) {
        console.error("Webhook DB error (subscription.deleted):", sdErr, "customer:", customerId);
        return NextResponse.json({ error: "DB update failed" }, { status: 500 });
      }
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
      if (pfErr) {
        console.error("Webhook DB error (payment_failed):", pfErr, "customer:", customerId);
        return NextResponse.json({ error: "DB update failed" }, { status: 500 });
      }
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
        if (psErr) {
          console.error("Webhook DB error (payment_succeeded):", psErr, "customer:", customerId);
          return NextResponse.json({ error: "DB update failed" }, { status: 500 });
        }
      } catch (e) {
        console.error("Webhook payment_succeeded retrieve error:", e);
        return NextResponse.json({ error: "Stripe retrieve failed" }, { status: 500 });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
