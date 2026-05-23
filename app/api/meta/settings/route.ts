import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasActiveSubscription } from "@/lib/trial";
import { getAccountState, provisionAccount, removeAccount, undeployAccount, translateMetaError } from "@/lib/metaapi";
import { encrypt } from "@/lib/encrypt";
import { awardLots, LOTS_PER_SOURCE } from "@/lib/lottery";
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
    if (err instanceof Error && err.message.startsWith("MetaAPI 404")) {
      // Grace period: a freshly provisioned account often 404s for a few seconds
      // because of MetaAPI eventual consistency. Only treat 404 as "account deleted"
      // when we're past the deploying phase (DEPLOYED/UNDEPLOYED). For DEPLOYING/null,
      // report the stale state and let the next poll retry.
      if (user.metaapi_account_state === "DEPLOYING" || user.metaapi_account_state == null) {
        return NextResponse.json({
          connected: true,
          state: "DEPLOYING",
          login: user.mt_login,
          server: user.mt_server,
          platform: user.mt_platform,
          accountId: user.metaapi_account_id,
          lastSync: user.last_meta_sync,
        });
      }
      // Genuinely gone — cleanup so user can reconnect cleanly.
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
    .select("subscription_status, current_period_end, email")
    .eq("id", session.user.id)
    .single();

  if (!userSub || !hasActiveSubscription(userSub)) {
    return NextResponse.json({ error: "Pro plan required" }, { status: 403 });
  }

  const userEmail = userSub.email as string;
  const awardMt5Lots = () =>
    awardLots(session.user.id!, userEmail, "mt5_connect", LOTS_PER_SOURCE.mt5_connect).catch(
      (err) => console.error("Lottery mt5_connect error:", err)
    );

  const { login, password, server, platform } = await req.json();
  if (!login || !password || !server || !platform) {
    return NextResponse.json({ error: "Login, password, server and platform are required" }, { status: 400 });
  }

  const { data: existing } = await db
    .from("users").select("metaapi_account_id, mt_platform").eq("id", session.user.id).single();

  const accountName = `TJTradeHub-${session.user.id.slice(0, 8)}-${login}`;

  try {
    // Always rebuild from scratch when (re)connecting.
    // The previous "reuse slot via updateAccount" path had two failure modes:
    //   1) updateAccount can't change login on non-draft accounts (400)
    //   2) if the existing slot was rate-limited by MetaAPI (e.g. user typed
    //      wrong password a few times), every retry on the same slot keeps
    //      returning 429 even with new credentials, because MetaAPI's lock
    //      is tied to the metaapi-account-id.
    // Wiping the slot and provisioning fresh sidesteps both problems.
    if (existing?.metaapi_account_id) {
      await removeAccount(existing.metaapi_account_id).catch(() => null);
      await db.from("users").update({
        metaapi_account_id: null,
        metaapi_account_state: null,
      }).eq("id", session.user.id);
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

    await awardMt5Lots();
    return NextResponse.json({ success: true, accountId: account.id, state: "DEPLOYING" });
  } catch (e) {
    const friendly = translateMetaError(e);
    const httpStatus =
      friendly.code === "rate_limited" ? 429 :
      friendly.code === "validation_pending" ? 202 :
      502;
    return NextResponse.json(
      { error: friendly.message, code: friendly.code, retryAfterSeconds: friendly.retryAfterSeconds },
      { status: httpStatus }
    );
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
