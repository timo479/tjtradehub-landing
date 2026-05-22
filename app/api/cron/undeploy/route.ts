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
  const failures: { userId: string; accountId: string; error: string }[] = [];

  for (const user of staleAccounts) {
    // Retry up to 3 times with brief backoff before giving up. MetaAPI undeploy
    // is critical for cost control — silent failure here means we keep paying.
    let lastErr: unknown = null;
    let success = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await undeployAccount(user.metaapi_account_id);
        success = true;
        break;
      } catch (e) {
        lastErr = e;
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    if (success) {
      const { error: dbErr } = await db.from("users").update({ metaapi_account_state: "UNDEPLOYED" }).eq("id", user.id);
      if (dbErr) {
        // MetaAPI is undeployed but DB still says DEPLOYED — next cron will try again, harmless.
        console.error("Cron undeploy: MetaAPI succeeded but DB update failed", { userId: user.id, dbErr });
      }
      undeployed++;
    } else {
      const errMsg = lastErr instanceof Error ? lastErr.message : String(lastErr);
      console.error("Cron undeploy FAILED after 3 attempts — user still being billed", {
        userId: user.id,
        accountId: user.metaapi_account_id,
        error: errMsg,
      });
      failures.push({ userId: user.id, accountId: user.metaapi_account_id, error: errMsg });
    }
  }

  return NextResponse.json({
    undeployed,
    total: staleAccounts.length,
    failureCount: failures.length,
    failures: failures.length > 0 ? failures : undefined,
  });
}
