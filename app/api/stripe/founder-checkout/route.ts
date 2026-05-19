import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { getFounderStats } from "@/lib/founders";

export async function POST() {
  const priceId = process.env.STRIPE_FOUNDER_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "Founder checkout not yet configured" }, { status: 503 });
  }

  const stats = await getFounderStats();
  if (stats.remainingForSale <= 0) {
    return NextResponse.json({ error: "All Founder spots are sold out" }, { status: 410 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.tjtradehub.com";

  // Logged-in path: link to existing Stripe customer, prevent double-claim
  let customerId: string | null = null;
  if (userId) {
    const { data: user } = await db
      .from("users")
      .select("stripe_customer_id, email, subscription_status, founder_number")
      .eq("id", userId)
      .single();

    if (user?.subscription_status === "lifetime" || user?.founder_number) {
      return NextResponse.json({ error: "You already have a Founder Lifetime spot" }, { status: 400 });
    }

    customerId = user?.stripe_customer_id ?? null;
    if (!customerId && user?.email) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      });
      customerId = customer.id;
      await db.from("users").update({ stripe_customer_id: customerId }).eq("id", userId);
    }
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    success_url: `${baseUrl}/founders/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/founders?cancelled=true`,
    metadata: {
      kind: "founder_lifetime",
      ...(userId ? { userId } : {}),
    },
    ...(customerId
      ? { customer: customerId }
      : {
          customer_creation: "always",
        }),
  });

  return NextResponse.json({ url: checkoutSession.url });
}
