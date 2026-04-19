import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const oneYearAgo = Math.floor((Date.now() - 365 * 24 * 3600 * 1000) / 1000);

  // ── Revenue (Stripe charges last 12 months) ──────────────────────────────
  const revenueByMonth: Record<string, { amount: number; count: number }> = {};
  try {
    let hasMore = true;
    let startingAfter: string | undefined;
    while (hasMore) {
      const charges = await stripe.charges.list({
        limit: 100,
        created: { gte: oneYearAgo },
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      for (const charge of charges.data) {
        if (charge.status !== "succeeded") continue;
        const month = new Date(charge.created * 1000).toISOString().slice(0, 7);
        if (!revenueByMonth[month]) revenueByMonth[month] = { amount: 0, count: 0 };
        revenueByMonth[month].amount += (charge.amount_captured ?? charge.amount) / 100;
        revenueByMonth[month].count += 1;
      }
      hasMore = charges.has_more;
      if (hasMore && charges.data.length > 0) {
        startingAfter = charges.data[charges.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
  } catch { /* Stripe error – return empty */ }

  // ── Churn (canceled subscriptions last 12 months) ────────────────────────
  const churnByMonth: Record<string, number> = {};
  let activeSubscriptionCount = 0;
  try {
    // Count currently active subscriptions for churn rate calculation
    const activeSubs = await stripe.subscriptions.list({ status: "active", limit: 100 });
    activeSubscriptionCount = activeSubs.data.length;

    let hasMore = true;
    let startingAfter: string | undefined;
    while (hasMore) {
      const canceled = await stripe.subscriptions.list({
        status: "canceled",
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      });
      for (const sub of canceled.data) {
        if (!sub.canceled_at) continue;
        const canceledDate = sub.canceled_at * 1000;
        if (canceledDate < oneYearAgo * 1000) continue;
        const month = new Date(canceledDate).toISOString().slice(0, 7);
        churnByMonth[month] = (churnByMonth[month] ?? 0) + 1;
      }
      hasMore = canceled.has_more;
      if (hasMore && canceled.data.length > 0) {
        startingAfter = canceled.data[canceled.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
  } catch { /* Stripe error – return empty */ }

  // ── MetaAPI stats (Supabase) ──────────────────────────────────────────────
  const metaapi = { connected: 0, mt4: 0, mt5: 0, deployed: 0, undeployed: 0, recentlyActive: 0, total: 0 };
  try {
    const { data: allUsers } = await db
      .from("users")
      .select("metaapi_account_id, mt_platform, metaapi_account_state, meta_last_active, role");

    const nonAdmins = (allUsers ?? []).filter((u) => u.role !== "admin");
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    metaapi.total = nonAdmins.length;
    metaapi.connected = nonAdmins.filter((u) => u.metaapi_account_id).length;
    metaapi.mt4 = nonAdmins.filter((u) => u.mt_platform === "mt4").length;
    metaapi.mt5 = nonAdmins.filter((u) => u.mt_platform === "mt5").length;
    metaapi.deployed = nonAdmins.filter((u) => u.metaapi_account_state === "DEPLOYED").length;
    metaapi.undeployed = nonAdmins.filter((u) => u.metaapi_account_state === "UNDEPLOYED").length;
    metaapi.recentlyActive = nonAdmins.filter(
      (u) => u.meta_last_active && u.meta_last_active > sevenDaysAgo
    ).length;
  } catch { /* DB error – return zeros */ }

  // ── Vercel Analytics (visitors last 14 days) ──────────────────────────────
  let visitors: Array<{ date: string; pageviews: number }> = [];
  try {
    const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
    const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
    const VERCEL_ORG_ID = process.env.VERCEL_ORG_ID;

    if (VERCEL_TOKEN && VERCEL_PROJECT_ID) {
      const to = new Date().toISOString().slice(0, 10);
      const from = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().slice(0, 10);

      const params = new URLSearchParams({
        projectId: VERCEL_PROJECT_ID,
        environment: "production",
        from,
        to,
      });
      if (VERCEL_ORG_ID) params.set("teamId", VERCEL_ORG_ID);

      const res = await fetch(`https://vercel.com/api/web-analytics/timeseries?${params}`, {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` },
        next: { revalidate: 0 },
      });

      if (res.ok) {
        const json = await res.json();
        const rows = json.data ?? json;
        if (Array.isArray(rows)) {
          visitors = rows.map((item: { key?: string; date?: string; total?: number; pageviews?: number }) => ({
            date: item.key ?? item.date ?? "",
            pageviews: item.total ?? item.pageviews ?? 0,
          }));
        }
      }
    }
  } catch { /* Analytics unavailable */ }

  // ── Build last-12-months array ────────────────────────────────────────────
  const revenue = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (11 - i));
    const month = d.toISOString().slice(0, 7);
    return {
      month,
      amount: Math.round((revenueByMonth[month]?.amount ?? 0) * 100) / 100,
      count: revenueByMonth[month]?.count ?? 0,
    };
  });

  const churn = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (11 - i));
    const month = d.toISOString().slice(0, 7);
    const canceled = churnByMonth[month] ?? 0;
    const rate = activeSubscriptionCount > 0 ? Math.round((canceled / activeSubscriptionCount) * 1000) / 10 : 0;
    return { month, canceled, rate };
  });

  return NextResponse.json({ revenue, churn, metaapi, visitors });
}
