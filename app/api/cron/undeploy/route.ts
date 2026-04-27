import { db } from "@/lib/db";
import { undeployAccount } from "@/lib/metaapi";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  let authorized = false;
  try {
    authorized =
      authHeader.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(expected));
  } catch {
    // length mismatch or buffer error → not authorized
  }
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Undeploy accounts inactive for more than 60 minutes
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: staleAccounts } = await db
    .from("users")
    .select("id, metaapi_account_id")
    .eq("metaapi_account_state", "DEPLOYED")
    .not("metaapi_account_id", "is", null)
    .or(`meta_last_active.lt.${cutoff},meta_last_active.is.null`);

  if (!staleAccounts?.length) {
    return NextResponse.json({ undeployed: 0 });
  }

  let undeployed = 0;
  for (const user of staleAccounts) {
    try {
      await undeployAccount(user.metaapi_account_id);
      await db.from("users").update({ metaapi_account_state: "UNDEPLOYED" }).eq("id", user.id);
      undeployed++;
    } catch {
      // Continue with next account
    }
  }

  return NextResponse.json({ undeployed, total: staleAccounts.length });
}
