import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasActiveSubscription } from "@/lib/trial";
import { getAccountState, provisionAccount, removeAccount, updateAccount, deployAccount, undeployAccount } from "@/lib/metaapi";
import { encrypt } from "@/lib/encrypt";
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
  // Slot reserviert aber bewusst getrennt (mt_login fehlt) → nicht auto-redeploy triggern
  if (!user?.mt_login) return NextResponse.json({ connected: false });

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
  } catch (err) {
    // 404 = MetaAPI hat den Account gelöscht (z.B. Broker-Handshake fehlgeschlagen)
    // → DB bereinigen, User kann sauber neu verbinden
    if (err instanceof Error && err.message.startsWith("MetaAPI 404")) {
      await db.from("users").update({
        metaapi_account_id: null,
        metaapi_account_state: null,
      }).eq("id", session.user.id);
      return NextResponse.json({ connected: false });
    }
    // Andere Fehler (Netzwerk, MetaAPI temporär down) → stale State zurückgeben
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

  const { data: userSub } = await db
    .from("users")
    .select("subscription_status, current_period_end")
    .eq("id", session.user.id)
    .single();

  if (!userSub || !hasActiveSubscription(userSub)) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const { login, password, server, platform } = await req.json();
  if (!login || !password || !server || !platform) {
    return NextResponse.json({ error: "Login, password, server and platform are required" }, { status: 400 });
  }

  const { data: existing } = await db
    .from("users").select("metaapi_account_id, mt_platform").eq("id", session.user.id).single();

  const accountName = `TJTradeHub-${session.user.id.slice(0, 8)}-${login}`;

  try {
    // Reuse existing MetaAPI slot if platform matches → no extra billing
    if (existing?.metaapi_account_id && existing.mt_platform === platform) {
      try {
        // Undeploy first so credentials can be updated cleanly (ok if already undeployed)
        await undeployAccount(existing.metaapi_account_id).catch(() => null);
        await updateAccount(existing.metaapi_account_id, { login, password, server, name: accountName });
        await deployAccount(existing.metaapi_account_id);
        await db.from("users").update({
          mt_login: login,
          mt_password: encrypt(password),
          mt_server: server,
          mt_platform: platform,
          metaapi_account_state: "DEPLOYING",
          last_meta_sync: null,
          meta_last_active: new Date().toISOString(),
        }).eq("id", session.user.id);
        return NextResponse.json({ success: true, accountId: existing.metaapi_account_id, state: "DEPLOYING" });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        // Only create a new account if MetaAPI says the account no longer exists (404)
        // For all other errors (network, timeout, etc.) return an error – do NOT provision a new key
        if (!msg.startsWith("MetaAPI 404")) {
          return NextResponse.json({ error: "Reconnect failed – please try again." }, { status: 502 });
        }
        // Account was deleted externally → clean up reference and provision fresh below
        await removeAccount(existing.metaapi_account_id).catch(() => null);
      }
    } else if (existing?.metaapi_account_id) {
      // Platform changed (mt4↔mt5) → must create new account
      await removeAccount(existing.metaapi_account_id).catch(() => null);
    }

    // Create new account
    const account = await provisionAccount({
      login,
      password,
      server,
      platform: platform as "mt4" | "mt5",
      name: accountName,
    });

    await db.from("users").update({
      mt_login: login,
      mt_password: encrypt(password),
      mt_server: server,
      mt_platform: platform,
      metaapi_account_id: account.id,
      metaapi_account_state: "DEPLOYING",
      last_meta_sync: null,
      meta_last_active: new Date().toISOString(),
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
    // Nur undeploy (nicht löschen) → Slot bleibt, kein neuer Key beim Reconnect
    await undeployAccount(user.metaapi_account_id).catch(() => null);
  }

  await db.from("users").update({
    mt_login: null, mt_password: null, mt_server: null,
    // metaapi_account_id + mt_platform bleiben → Slot-Wiederverwendung beim Reconnect
    metaapi_account_state: "UNDEPLOYED",
    last_meta_sync: null,
  }).eq("id", session.user.id);

  return NextResponse.json({ success: true });
}
