import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchDeals, getAccountState } from "@/lib/metaapi";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await db
    .from("users")
    .select("metaapi_account_id, last_meta_sync")
    .eq("id", session.user.id)
    .single();

  if (!user?.metaapi_account_id) return NextResponse.json({ error: "not_configured" }, { status: 404 });

  try {
    const accountState = await getAccountState(user.metaapi_account_id);
    const to = new Date();
    const from = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000);
    const deals = await fetchDeals(user.metaapi_account_id, from, to);

    // Show first 5 raw deals so we can see the structure
    const sample = deals.slice(0, 5);
    const entryTypes = [...new Set(deals.map((d: { entry: string }) => d.entry))];
    const dealTypes = [...new Set(deals.map((d: { type: string }) => d.type))];

    return NextResponse.json({
      accountState: { state: accountState.state, connectionStatus: accountState.connectionStatus, region: accountState.region },
      last_meta_sync: user.last_meta_sync,
      totalDeals: deals.length,
      entryTypes,
      dealTypes,
      sample,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
