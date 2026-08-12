/**
 * Baut MetaAPI-Accounts ab, die länger als 60 Minuten inaktiv sind.
 * Geteilt zwischen /api/cron/undeploy (legacy) und /api/cron/daily.
 */

import { db } from "@/lib/db";
import { getAccountState, undeployAccount } from "@/lib/metaapi";

const INACTIVITY_MS = 60 * 60 * 1000;

export interface UndeployResult {
  undeployed: number;
  /** DB-Status wich vom echten MetaAPI-Status ab und wurde korrigiert (kein Abbau nötig). */
  reconciled: number;
  /** Account existiert in MetaAPI nicht mehr → DB-Referenz bereinigt. */
  cleared: number;
  total: number;
  failureCount: number;
  failures?: { userId: string; accountId: string; error: string }[];
}

/** MetaAPI-Zustände, die tatsächlich Deployed-Kosten verursachen. */
const BILLING_STATES = ["DEPLOYED", "DEPLOYING", "UNDEPLOYING"];

async function withRetries<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown = null;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastErr;
}

export async function undeployStaleAccounts(): Promise<UndeployResult> {
  const cutoff = new Date(Date.now() - INACTIVITY_MS).toISOString();

  // Bewusst NICHT nach `metaapi_account_state` filtern.
  //
  // Der echte Zustand landet nur an EINER Stelle in der DB: in
  // app/api/meta/settings/route.ts, wenn der Browser des Kunden den
  // Settings-Endpunkt pollt. Der Deploy selbst schreibt immer nur "DEPLOYING".
  // Schließt der Kunde den Tab, bevor sein Polling "DEPLOYED" erwischt, bleibt
  // die DB dauerhaft auf "DEPLOYING" stehen. Der frühere Filter
  // `.eq("metaapi_account_state","DEPLOYED")` hat solche Accounts deshalb NIE
  // gesehen — sie liefen unbegrenzt weiter und wurden zu $0.0126/h abgerechnet.
  // (Real passiert bei einem Account, ~1 Monat unentdeckt, ≈$9 verbrannt.)
  //
  // Der Abbau darf nicht davon abhängen, ob ein Browser etwas geschrieben hat.
  // Deshalb: alle Accounts mit abgelaufener Aktivität holen und den WAHREN
  // Zustand bei MetaAPI erfragen. GET-Calls sind bei MetaAPI kostenlos.
  //
  // Frisch deployte Accounts sind nicht in Gefahr: /api/meta/deploy setzt
  // `meta_last_active` mit, sie fallen also nicht unter den Cutoff.
  const { data: candidates, error: qErr } = await db
    .from("users")
    .select("id, metaapi_account_id, metaapi_account_state")
    .not("metaapi_account_id", "is", null)
    .or(`meta_last_active.lt.${cutoff},meta_last_active.is.null`);

  if (qErr) {
    console.error("Cron undeploy: Kandidaten-Query fehlgeschlagen", qErr);
    return { undeployed: 0, reconciled: 0, cleared: 0, total: 0, failureCount: 0 };
  }
  if (!candidates?.length) {
    return { undeployed: 0, reconciled: 0, cleared: 0, total: 0, failureCount: 0 };
  }

  let undeployed = 0;
  let reconciled = 0;
  let cleared = 0;
  const failures: { userId: string; accountId: string; error: string }[] = [];

  for (const user of candidates) {
    const accountId = user.metaapi_account_id as string;

    // 1) Wahren Zustand holen.
    let realState: string | null = null;
    try {
      const state = await withRetries(() => getAccountState(accountId));
      realState = (state as { state?: string })?.state ?? null;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);

      // 404 = Account existiert in MetaAPI nicht mehr (manuell gelöscht o.ä.).
      // DB-Referenz bereinigen; /api/meta/deploy provisioniert bei Bedarf neu,
      // solange die Zugangsdaten noch hinterlegt sind.
      if (msg.includes("MetaAPI 404")) {
        const { error: clrErr } = await db
          .from("users")
          .update({ metaapi_account_id: null, metaapi_account_state: null })
          .eq("id", user.id);
        if (clrErr) console.error("Cron undeploy: DB-Bereinigung fehlgeschlagen", { userId: user.id, clrErr });
        else cleared++;
        continue;
      }

      console.error("Cron undeploy: Zustand nicht abrufbar — Account wird ggf. weiter abgerechnet", {
        userId: user.id,
        accountId,
        error: msg,
      });
      failures.push({ userId: user.id, accountId, error: msg });
      continue;
    }

    // 2) Kostet nichts → nur den DB-Status geradeziehen, kein MetaAPI-Write.
    if (!realState || !BILLING_STATES.includes(realState)) {
      if (realState && realState !== user.metaapi_account_state) {
        await db.from("users").update({ metaapi_account_state: realState }).eq("id", user.id);
        reconciled++;
      }
      continue;
    }

    // 3) Läuft und ist inaktiv → abbauen.
    try {
      await withRetries(() => undeployAccount(accountId));
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error("Cron undeploy nach 3 Versuchen FEHLGESCHLAGEN — User wird weiter abgerechnet", {
        userId: user.id,
        accountId,
        error: errMsg,
      });
      failures.push({ userId: user.id, accountId, error: errMsg });
      continue;
    }

    const { error: dbErr } = await db
      .from("users")
      .update({ metaapi_account_state: "UNDEPLOYED" })
      .eq("id", user.id);
    if (dbErr) {
      // In MetaAPI abgebaut, DB hängt noch — der nächste Lauf zieht es nachträglich
      // gerade, weil jetzt gegen den echten Zustand abgeglichen wird.
      console.error("Cron undeploy: MetaAPI ok, DB-Update fehlgeschlagen", { userId: user.id, dbErr });
    }
    undeployed++;
  }

  return {
    undeployed,
    reconciled,
    cleared,
    total: candidates.length,
    failureCount: failures.length,
    failures: failures.length > 0 ? failures : undefined,
  };
}
