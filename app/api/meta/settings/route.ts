import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAccountState, provisionAccount, removeAccount } from "@/lib/metaapi";
import { NextRequest, NextResponse } from "next/server";

// GET – Status der Verbindung abrufen
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await db
    .from("users")
    .select("mt_login, mt_server, mt_platform, metaapi_account_id, metaapi_account_state, last_meta_sync")
    .eq("id", session.user.id)
    .single();

  if (!user?.metaapi_account_id) return NextResponse.json({ connected: false });

  // Live-State von MetaAPI holen
  try {
    const state = await getAccountState(user.metaapi_account_id);
    // State in DB aktualisieren
    await db.from("users").update({ metaapi_account_state: state.state }).eq("id", session.user.id);
    return NextResponse.json({
      connected: true,
      state: state.state,           // DEPLOYED, DEPLOYING, UNDEPLOYED, ...
      connectionStatus: state.connectionStatus,
      login: user.mt_login,
      server: user.mt_server,
      platform: user.mt_platform,
      accountId: user.metaapi_account_id,
      lastSync: user.last_meta_sync,
    });
  } catch {
    return NextResponse.json({
      connected: true,
      state: user.metaapi_account_state ?? "UNKNOWN",
      login: user.mt_login,
      server: user.mt_server,
      platform: user.mt_platform,
      accountId: user.metaapi_account_id,
      lastSync: user.last_meta_sync,
    });
  }
}

// POST – MT4/MT5 Konto verbinden
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { login, password, server, platform } = await req.json();
  if (!login || !password || !server || !platform) {
    return NextResponse.json({ error: "Login, password, server and platform are required" }, { status: 400 });
  }

  // Altes Konto entfernen falls vorhanden
  const { data: existing } = await db
    .from("users").select("metaapi_account_id").eq("id", session.user.id).single();
  if (existing?.metaapi_account_id) {
    await removeAccount(existing.metaapi_account_id).catch(() => null);
  }

  try {
    const account = await provisionAccount({
      login,
      password,
      server,
      platform: platform as "mt4" | "mt5",
      name: `TJTradeHub-${session.user.id.slice(0, 8)}-${login}`,
    });

    await db.from("users").update({
      mt_login: login,
      mt_password: password,
      mt_server: server,
      mt_platform: platform,
      metaapi_account_id: account.id,
      metaapi_account_state: "DEPLOYING",
    }).eq("id", session.user.id);

    return NextResponse.json({ success: true, accountId: account.id, state: "DEPLOYING" });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Connection failed" }, { status: 502 });
  }
}

// DELETE – Verbindung trennen
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: user } = await db
    .from("users").select("metaapi_account_id").eq("id", session.user.id).single();

  if (user?.metaapi_account_id) {
    await removeAccount(user.metaapi_account_id).catch(() => null);
  }

  await db.from("users").update({
    mt_login: null, mt_password: null, mt_server: null, mt_platform: null,
    metaapi_account_id: null, metaapi_account_state: null, last_meta_sync: null,
  }).eq("id", session.user.id);

  return NextResponse.json({ success: true });
}
