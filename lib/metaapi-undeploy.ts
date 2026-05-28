/**
 * Undeploys MetaAPI accounts that have been inactive for more than 60 minutes.
 * Shared between /api/cron/undeploy (legacy) and /api/cron/daily.
 */

import { db } from "@/lib/db";
import { undeployAccount } from "@/lib/metaapi";

export interface UndeployResult {
  undeployed: number;
  total: number;
  failureCount: number;
  failures?: { userId: string; accountId: string; error: string }[];
}

export async function undeployStaleAccounts(): Promise<UndeployResult> {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: staleAccounts } = await db
    .from("users")
    .select("id, metaapi_account_id")
    .eq("metaapi_account_state", "DEPLOYED")
    .not("metaapi_account_id", "is", null)
    .or(`meta_last_active.lt.${cutoff},meta_last_active.is.null`);

  if (!staleAccounts?.length) {
    return { undeployed: 0, total: 0, failureCount: 0 };
  }

  let undeployed = 0;
  const failures: { userId: string; accountId: string; error: string }[] = [];

  for (const user of staleAccounts) {
    // Retry up to 3 times with backoff. Silent failure here means MetaAPI cost leaks.
    let lastErr: unknown = null;
    let success = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await undeployAccount(user.metaapi_account_id);
        success = true;
        break;
      } catch (e) {
        lastErr = e;
        if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    if (success) {
      const { error: dbErr } = await db
        .from("users")
        .update({ metaapi_account_state: "UNDEPLOYED" })
        .eq("id", user.id);
      if (dbErr) {
        // MetaAPI undeployed but DB still says DEPLOYED — next cron retries, harmless.
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

  return {
    undeployed,
    total: staleAccounts.length,
    failureCount: failures.length,
    failures: failures.length > 0 ? failures : undefined,
  };
}
