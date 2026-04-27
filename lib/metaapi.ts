const PROVISIONING = "https://mt-provisioning-api-v1.agiliumtrade.agiliumtrade.ai";

function getToken(): string {
  const t = process.env.METAAPI_TOKEN;
  if (!t) throw new Error("METAAPI_TOKEN not configured in .env");
  return t.replace(/\s+/g, "");
}

async function apiFetch(url: string, token: string, options?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers: {
        "auth-token": token,
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch (e) {
    const cause = (e as { cause?: { message?: string } })?.cause;
    throw new Error(`MetaAPI network error: ${cause?.message ?? (e instanceof Error ? e.message : String(e))}`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`MetaAPI ${res.status}: ${body.slice(0, 300)}`);
  }
  return res.json();
}

function clientUrl(region: string) {
  return `https://mt-client-api-v1.${region}.agiliumtrade.ai`;
}

// ─── Account Provisioning ─────────────────────────────────────────────────────

export async function provisionAccount(params: {
  login: string;
  password: string;
  server: string;
  platform: "mt4" | "mt5";
  name: string;
}) {
  const token = getToken();
  return apiFetch(`${PROVISIONING}/users/current/accounts`, token, {
    method: "POST",
    body: JSON.stringify({
      name: params.name,
      type: "cloud-g2",
      login: params.login,
      password: params.password,
      server: params.server,
      platform: params.platform,
      magic: 0,
      manualTrades: true,
      quoteStreamingIntervalInSeconds: 2.5,
      reliability: "regular",
    }),
  });
}

export async function getAccountState(accountId: string) {
  const token = getToken();
  return apiFetch(`${PROVISIONING}/users/current/accounts/${accountId}`, token);
}

export async function deployAccount(accountId: string) {
  const token = getToken();
  const url = `${PROVISIONING}/users/current/accounts/${accountId}/deploy`;
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "auth-token": token, "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
    });
  } catch (e) {
    const cause = (e as { cause?: { message?: string } })?.cause;
    throw new Error(`MetaAPI network error: ${cause?.message ?? (e instanceof Error ? e.message : String(e))}`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`MetaAPI ${res.status}: ${body.slice(0, 300)}`);
  }
  // deploy returns 204 No Content
  return null;
}

export async function updateAccount(accountId: string, params: {
  login: string;
  password: string;
  server: string;
  name: string;
}) {
  const token = getToken();
  return apiFetch(`${PROVISIONING}/users/current/accounts/${accountId}`, token, {
    method: "PUT",
    body: JSON.stringify({
      name: params.name,
      login: params.login,
      password: params.password,
      server: params.server,
    }),
  });
}

export async function undeployAccount(accountId: string) {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${PROVISIONING}/users/current/accounts/${accountId}/undeploy`, {
      method: "POST",
      headers: { "auth-token": token, "Content-Type": "application/json" },
      body: "{}",
      cache: "no-store",
    });
  } catch (e) {
    const cause = (e as { cause?: { message?: string } })?.cause;
    throw new Error(`MetaAPI network error: ${cause?.message ?? (e instanceof Error ? e.message : String(e))}`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`MetaAPI ${res.status}: ${body.slice(0, 300)}`);
  }
  return null;
}

export async function removeAccount(accountId: string): Promise<void> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${PROVISIONING}/users/current/accounts/${accountId}`, {
      method: "DELETE",
      headers: { "auth-token": token },
      cache: "no-store",
    });
  } catch (e) {
    const cause = (e as { cause?: { message?: string } })?.cause;
    throw new Error(`MetaAPI network error: ${cause?.message ?? (e instanceof Error ? e.message : String(e))}`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`MetaAPI ${res.status}: ${body.slice(0, 300)}`);
  }
}

// ─── Trading Data ─────────────────────────────────────────────────────────────

export interface MetaAccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  currency: string;
  server: string;
  broker: string;
  name: string;
  login: string;
  platform: string;
}

export interface MetaDeal {
  id: string;
  time: string;
  brokerTime: string;
  symbol: string;
  type: string;
  entryType: string;
  volume: number;
  price: number;
  commission?: number;
  swap?: number;
  profit?: number;
  comment?: string;
  positionId?: string;
}

export async function fetchAccountInfo(accountId: string): Promise<MetaAccountInfo> {
  const token = getToken();
  const account = await getAccountState(accountId);
  const region: string = account.region ?? "london";
  return apiFetch(
    `${clientUrl(region)}/users/current/accounts/${accountId}/account-information`,
    token
  );
}

export async function fetchDeals(accountId: string, from: Date, to: Date): Promise<MetaDeal[]> {
  const token = getToken();
  const account = await getAccountState(accountId);
  const region: string = account.region ?? "london";
  const url = `${clientUrl(region)}/users/current/accounts/${accountId}/history-deals/time/${from.toISOString()}/${to.toISOString()}`;
  const data = await apiFetch(url, token);
  return Array.isArray(data) ? data : (data.deals ?? []);
}
