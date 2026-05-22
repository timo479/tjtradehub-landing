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

// ─── Error Mapping ─────────────────────────────────────────────────────────────

export interface FriendlyMetaError {
  code: "rate_limited" | "invalid_credentials" | "invalid_server" | "account_not_found" | "metaapi_down" | "network" | "unknown";
  message: string;
  retryAfterSeconds?: number;
}

// Maps the raw "MetaAPI <status>: <body>" error thrown by apiFetch into a
// short, user-facing message. Keep the original message available via .details.
export function translateMetaError(err: unknown): FriendlyMetaError {
  const raw = err instanceof Error ? err.message : String(err);

  // Network: "MetaAPI network error: ..."
  if (raw.startsWith("MetaAPI network error")) {
    return { code: "network", message: "Connection to MetaAPI failed. Please check your internet and try again." };
  }

  const statusMatch = raw.match(/^MetaAPI (\d{3})/);
  const status = statusMatch ? parseInt(statusMatch[1], 10) : null;
  const bodyStr = raw.replace(/^MetaAPI \d{3}:\s*/, "");

  // Parse the JSON body to extract the MetaAPI error code/message
  let body: { error?: string; message?: string; metadata?: { recommendedRetryDelayInSeconds?: number } } = {};
  try { body = JSON.parse(bodyStr); } catch { /* not JSON */ }

  // 429: rate limited — most often "credentials rejected too many times" or general quota
  if (status === 429 || body.error === "TooManyRequestsError") {
    const retry = body.metadata?.recommendedRetryDelayInSeconds;
    const hours = retry ? Math.ceil(retry / 3600) : 1;
    if (/rejected too many times|verify your trading account credentials/i.test(body.message ?? "")) {
      return {
        code: "rate_limited",
        message: `MetaAPI has locked this account for ${hours}h after too many failed validation attempts. Please double-check your login number, password and broker server, then retry in ${hours} hour${hours === 1 ? "" : "s"}.`,
        retryAfterSeconds: retry,
      };
    }
    return {
      code: "rate_limited",
      message: `Too many requests — please wait ${hours} hour${hours === 1 ? "" : "s"} before trying again.`,
      retryAfterSeconds: retry,
    };
  }

  // 401: bad token (server-side config issue, not user-facing — but report it)
  if (status === 401) {
    return { code: "invalid_credentials", message: "MetaAPI authentication failed. Please contact support." };
  }

  // 400: usually validation — invalid server name, malformed credentials, etc.
  if (status === 400) {
    if (/server/i.test(body.message ?? "")) {
      return { code: "invalid_server", message: "Broker server name not recognized. Check the exact server name in your MetaTrader (File → Accounts)." };
    }
    if (/login|password|credential/i.test(body.message ?? "")) {
      return { code: "invalid_credentials", message: "Login number or password is invalid. Please double-check the credentials." };
    }
    return { code: "invalid_credentials", message: body.message ?? "Invalid credentials. Please check login, password and broker server." };
  }

  // 404: account not found in MetaAPI
  if (status === 404) {
    return { code: "account_not_found", message: "MetaAPI account not found. Please reconnect to provision a new one." };
  }

  // 5xx: MetaAPI is down
  if (status != null && status >= 500) {
    return { code: "metaapi_down", message: "MetaAPI is temporarily unavailable. Please try again in a few minutes." };
  }

  return { code: "unknown", message: body.message ?? raw };
}

export async function fetchDeals(accountId: string, from: Date, to: Date): Promise<MetaDeal[]> {
  const token = getToken();
  const account = await getAccountState(accountId);
  const region: string = account.region ?? "london";
  const url = `${clientUrl(region)}/users/current/accounts/${accountId}/history-deals/time/${from.toISOString()}/${to.toISOString()}`;
  const data = await apiFetch(url, token);
  if (data == null) return [];
  if (Array.isArray(data)) return data;
  return Array.isArray(data.deals) ? data.deals : [];
}
