import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { fetchAccountInfo } from "@/lib/metaapi";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await db
    .from("users")
    .select("metaapi_account_id, metaapi_account_state")
    .eq("id", session.user.id)
    .single();

  if (!user?.metaapi_account_id) return NextResponse.json({ error: "not_configured" }, { status: 404 });
  if (user.metaapi_account_state !== "DEPLOYED") return NextResponse.json({ error: "not_ready", state: user.metaapi_account_state }, { status: 425 });

  try {
    const info = await fetchAccountInfo(user.metaapi_account_id);
    return NextResponse.json(info);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "MetaAPI Fehler" }, { status: 502 });
  }
}
