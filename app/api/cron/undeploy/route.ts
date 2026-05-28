import { NextResponse } from "next/server";
import crypto from "crypto";
import { undeployStaleAccounts } from "@/lib/metaapi-undeploy";

// Legacy: kept for manual testing / backward compat. The daily cron now lives
// at /api/cron/daily (vercel.json) and handles both undeploy and the Monday
// newsletter.
export const maxDuration = 300;

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

  const result = await undeployStaleAccounts();
  return NextResponse.json(result);
}
