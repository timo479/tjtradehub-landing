import Stripe from "stripe";

let _stripe: Stripe | null = null;

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    if (!_stripe) {
      const key = process.env.STRIPE_SECRET_KEY;
      if (!key) throw new Error("STRIPE_SECRET_KEY nicht konfiguriert");
      _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
    }
    return (_stripe as never)[prop as never];
  },
});
