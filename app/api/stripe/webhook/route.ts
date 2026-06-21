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

// Mappt rohe Stripe-Subscription-Status auf die internen Werte, die unsere App-Logik
// (hasActiveSubscription / canAccessDashboard) kennt. Ohne dieses Mapping landet ein
// Status wie "past_due"/"incomplete" 1:1 in der DB → ist weder "active" noch "basic"
// → der Kunde fällt durchs Raster und wird komplett auf die Paywall ausgesperrt.
// "past_due" → "active": Grace-Period — der Kunde behält Pro-Zugang, solange Stripe die
// Abbuchung automatisch erneut versucht. Die endgültige Herabstufung auf "basic" macht
// ausschließlich customer.subscription.deleted (Stripes finale Kündigung nach allen Retries).
function mapStripeStatus(status: Stripe.Subscription.Status): "active" | "basic" {
  switch (status) {
    case "active":
    case "trialing":
    case "past_due":
      return "active";
    default: // canceled, unpaid, incomplete, incomplete_expired, paused
      return "basic";
  }
}

// Findet den betroffenen User robust über mehrere Stripe-Referenzen. Wichtig für den
// Duplicate-Customer-Fall: ein Guest-Founder-Checkout konnte mehrere Stripe-Customer für
// dieselbe Person erzeugen, sodass ein Cancel-Event eine customer_id trägt, die NICHT in
// unserer DB steht → der alte reine customer_id-Lookup fand niemanden → MetaAPI-Account
// blieb verwaist deployed (Kosten-Leak ~$3-4/Mo).
// Reihenfolge: subscription_id (eindeutig pro Abo) → customer_id → Email des Stripe-Customers.
async function findUserForBilling(opts: {
  subscriptionId?: string | null;
  customerId?: string | null;
}): Promise<{ id: string; subscription_status: string; metaapi_account_id: string | null } | null> {
  const cols = "id, subscription_status, metaapi_account_id";

  if (opts.subscriptionId) {
    const { data } = await db.from("users").select(cols).eq("subscription_id", opts.subscriptionId).maybeSingle();
    if (data) return data;
  }
  if (opts.customerId) {
    const { data } = await db.from("users").select(cols).eq("stripe_customer_id", opts.customerId).maybeSingle();
    if (data) return data;

    // Letzter Fallback: Email vom Stripe-Customer holen und darüber matchen.
    try {
      const customer = await stripe.customers.retrieve(opts.customerId);
      const email = !("deleted" in customer) ? customer.email?.toLowerCase().trim() : null;
      if (email) {
        const { data: byEmail } = await db.from("users").select(cols).eq("email", email).maybeSingle();
        if (byEmail) return byEmail;
      }
    } catch (e) {
      console.error("findUserForBilling: Stripe customer retrieve failed:", e, "customer:", opts.customerId);
    }
  }
  return null;
}

async function cleanupMetaAccount(user: { id: string; metaapi_account_id: string | null }) {
  if (!user.metaapi_account_id) return;
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

  // Idempotenz: bereits verarbeitete Events überspringen. Stripe liefert at-least-once
  // und retried bei Timeout/Fehler — ohne diesen Check würde z.B. die Founder-Welcome-Mail
  // erneut versendet. (Schlägt der SELECT fehl, weil die Migration noch nicht eingespielt
  // ist, fällt der Webhook still auf das alte Verhalten zurück statt zu crashen.)
  const { data: seenEvent } = await db
    .from("stripe_events")
    .select("event_id")
    .eq("event_id", event.id)
    .maybeSingle();
  if (seenEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

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
            // claim_founder_slot RPC (called below) flips subscription_status to "lifetime".
            const randomPwHash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 12);
            const referralCode = await generateUniqueReferralCode(email);

            const { data: created, error: createErr } = await db
              .from("users")
              .insert({
                email,
                name: session.customer_details?.name ?? email.split("@")[0],
                password_hash: randomPwHash,
                email_verified: true, // Stripe paid → email is real
                trial_ends_at: null,
                subscription_status: "basic",
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
          subscription_status: mapStripeStatus(sub.status),
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
          subscription_status: mapStripeStatus(sub.status),
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
      const user = await findUserForBilling({ subscriptionId: sub.id, customerId: getCustomerId(sub) });
      if (!user) {
        console.error("subscription.deleted: kein passender User gefunden. sub:", sub.id, "customer:", getCustomerId(sub));
        break;
      }

      // Skip lifetime users — never downgrade them (e.g. founder slot)
      if (user.subscription_status === "lifetime") break;

      await cleanupMetaAccount(user);
      const { error: sdErr } = await db
        .from("users")
        .update({
          subscription_status: "basic",
          current_period_end: null,
        })
        .eq("id", user.id);
      if (sdErr) {
        console.error("Webhook DB error (subscription.deleted):", sdErr, "user:", user.id);
        return NextResponse.json({ error: "DB update failed" }, { status: 500 });
      }
      break;
    }

    case "invoice.payment_failed": {
      // Grace-Period (bewusste Entscheidung): Ein einzelner fehlgeschlagener Abbuchungs-
      // versuch stuft den Kunden NICHT herab und räumt den MetaAPI-Account NICHT ab.
      // Stripe versucht die Zahlung automatisch mehrfach erneut; in dieser Phase hält
      // customer.subscription.updated (Status past_due → "active") den Pro-Zugang aufrecht.
      // Erst Stripes endgültige Kündigung (customer.subscription.deleted) stuft auf "basic"
      // herab und entfernt den MetaAPI-Account. Hier nur Logging zur Sichtbarkeit.
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = getCustomerId(invoice);
      console.warn("invoice.payment_failed — Grace aktiv, keine Herabstufung. customer:", customerId);
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

  // Marker NACH erfolgreicher Verarbeitung setzen (mark-at-end): Bei einem Verarbeitungs-
  // fehler oben wurde bereits per non-2xx zurückgekehrt, der Marker also nicht gesetzt →
  // Stripe retried normal weiter, kein Event geht verloren. Insert-Fehler (fehlende Tabelle
  // oder PK-Konflikt durch parallelen Retry) sind unkritisch und werden nur geloggt.
  const { error: markErr } = await db
    .from("stripe_events")
    .insert({ event_id: event.id, type: event.type });
  if (markErr) {
    console.warn("stripe_events: Marker konnte nicht gesetzt werden (Migration fehlt oder Duplicate?):", markErr.code, event.id);
  }

  return NextResponse.json({ received: true });
}
