import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deployAccount } from "@/lib/metaapi";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await db
    .from("users")
    .select("metaapi_account_id")
    .eq("id", session.user.id)
    .single();

  if (!user?.metaapi_account_id) {
    return NextResponse.json({ error: "not_configured" }, { status: 404 });
  }

  try {
    await deployAccount(user.metaapi_account_id);
    await db.from("users").update({ metaapi_account_state: "DEPLOYING" }).eq("id", session.user.id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Deploy failed" }, { status: 502 });
  }
}
