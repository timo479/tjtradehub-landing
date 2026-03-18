import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasActiveSubscription } from "@/lib/trial";
import { deployAccount, provisionAccount } from "@/lib/metaapi";
import { decrypt } from "@/lib/encrypt";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await db
    .from("users")
    .select("metaapi_account_id, metaapi_account_state, mt_login, mt_password, mt_server, mt_platform, subscription_status, current_period_end")
    .eq("id", session.user.id)
    .single();

  if (!user || !hasActiveSubscription(user)) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  // If account was removed by cron (to save costs), re-provision automatically
  if (!user.metaapi_account_id) {
    if (!user.mt_login || !user.mt_password || !user.mt_server || !user.mt_platform) {
      return NextResponse.json({ error: "not_configured" }, { status: 404 });
    }
    try {
      const accountName = `TJTradeHub-${session.user.id.slice(0, 8)}-${user.mt_login}`;
      const account = await provisionAccount({
        login: user.mt_login,
        password: decrypt(user.mt_password),
        server: user.mt_server,
        platform: user.mt_platform as "mt4" | "mt5",
        name: accountName,
      });
      await db.from("users").update({
        metaapi_account_id: account.id,
        metaapi_account_state: "DEPLOYING",
        meta_last_active: new Date().toISOString(),
      }).eq("id", session.user.id);
      return NextResponse.json({ success: true, reprovisioned: true });
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Reprovision failed" }, { status: 502 });
    }
  }

  try {
    await deployAccount(user.metaapi_account_id);
    await db.from("users").update({ metaapi_account_state: "DEPLOYING", meta_last_active: new Date().toISOString() }).eq("id", session.user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Deploy failed" }, { status: 502 });
  }
}
