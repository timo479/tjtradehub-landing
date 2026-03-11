"use client";
import { useCallback, useEffect, useRef, useState } from "react";

interface ConnectionInfo {
  connected: boolean;
  state?: string;
  connectionStatus?: string;
  login?: string;
  server?: string;
  platform?: string;
  accountId?: string;
  lastSync?: string | null;
}

interface AccountInfo {
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  currency: string;
  broker: string;
  server: string;
  name: string;
  login: string;
}

const AUTO_SYNC_MS = 15 * 60 * 1000;
const POLL_MS = 5_000;

const inp: React.CSSProperties = {
  backgroundColor: "#0a0a0a", border: "1px solid #1F2937", borderRadius: "10px",
  color: "#F9FAFB", padding: "10px 14px", fontSize: "13px", outline: "none",
  width: "100%", boxSizing: "border-box",
};

function StateTag({ state, connectionStatus }: { state?: string; connectionStatus?: string }) {
  if (!state) return null;
  if (state === "DEPLOYED" && connectionStatus === "CONNECTED")
    return <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", backgroundColor: "rgba(34,197,94,0.15)", color: "#22c55e" }}>Connected</span>;
  if (state === "DEPLOYED")
    return <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", backgroundColor: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>Ready · Broker offline</span>;
  if (state === "DEPLOYING")
    return <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", backgroundColor: "rgba(139,92,246,0.15)", color: "#A78BFA" }}>Connecting...</span>;
  if (state === "UNDEPLOYED")
    return <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", backgroundColor: "rgba(239,68,68,0.12)", color: "#f87171" }}>Disconnected</span>;
  return <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "6px", backgroundColor: "#1F2937", color: "#6B7280" }}>{state}</span>;
}

export default function MetaConnect() {
  const [conn, setConn] = useState<ConnectionInfo | null>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [server, setServer] = useState("");
  const [platform, setPlatform] = useState<"mt4" | "mt5">("mt5");
  const [connecting, setConnecting] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ synced: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const syncTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadConn = useCallback(async () => {
    const res = await fetch("/api/meta/settings");
    if (res.ok) setConn(await res.json());
  }, []);

  const loadAccount = useCallback(async () => {
    const res = await fetch("/api/meta/account");
    if (res.ok) setAccount(await res.json());
    else setAccount(null);
  }, []);

  const doSync = useCallback(async (auto = false, reset = false) => {
    if (syncing) return;
    setSyncing(true);
    if (!auto) { setError(null); setSyncResult(null); }
    const res = await fetch(`/api/meta/sync${reset ? "?reset=true" : ""}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      if (!auto) {
        if (data.error === "not_connected") {
          setError("Account is not connected to broker yet. Please wait a moment and try again.");
        } else {
          setError(data.error ?? "Sync failed");
        }
      }
    } else {
      setSyncResult({ synced: data.synced, skipped: data.skipped });
      setConn(prev => prev ? { ...prev, lastSync: new Date().toISOString() } : prev);
    }
    setSyncing(false);
  }, [syncing]);

  // Poll until DEPLOYED + CONNECTED
  const startPolling = useCallback(() => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    pollTimer.current = setInterval(async () => {
      const res = await fetch("/api/meta/settings");
      if (!res.ok) return;
      const data: ConnectionInfo = await res.json();
      setConn(data);
      if (data.state === "DEPLOYED") {
        clearInterval(pollTimer.current!);
        pollTimer.current = null;
        await loadAccount();
        await doSync(true);
      }
    }, POLL_MS);
  }, [doSync, loadAccount]);

  useEffect(() => { loadConn(); }, [loadConn]);

  useEffect(() => {
    if (!conn) return;
    if (conn.state === "UNDEPLOYED") {
      // Auto-redeploy silently when page loads
      redeploy();
      return;
    }
    if (conn.state === "DEPLOYING") {
      startPolling();
      return;
    }
    if (conn.state === "DEPLOYED") {
      loadAccount();
      // Always sync on page load to pick up new trades
      doSync(true);
      if (syncTimer.current) clearInterval(syncTimer.current);
      syncTimer.current = setInterval(() => doSync(true), AUTO_SYNC_MS);
    }
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
      if (syncTimer.current) clearInterval(syncTimer.current);
    };
  }, [conn?.state]);

  const connect = async () => {
    if (!login || !password || !server) { setError("Please fill in all fields"); return; }
    setConnecting(true); setError(null);
    const res = await fetch("/api/meta/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password, server, platform }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Connection failed"); setConnecting(false); return; }
    setConnecting(false);
    setShowForm(false);
    setPassword("");
    setConn({ connected: true, state: "DEPLOYING", login, server, platform });
    startPolling();
  };

  const redeploy = async () => {
    setDeploying(true);
    setError(null);
    const res = await fetch("/api/meta/deploy", { method: "POST" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Failed to reconnect");
      setDeploying(false);
      return;
    }
    setConn(prev => prev ? { ...prev, state: "DEPLOYING" } : prev);
    setDeploying(false);
    startPolling();
  };

  const disconnect = async () => {
    if (!confirm("Disconnect MetaTrader?")) return;
    await fetch("/api/meta/settings", { method: "DELETE" });
    setConn({ connected: false });
    setAccount(null);
    setSyncResult(null);
  };

  const card: React.CSSProperties = {
    backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "20px 24px",
  };

  if (conn === null) return (
    <div style={{ ...card, display: "flex", alignItems: "center", gap: "10px" }}>
      <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#374151" }} />
      <span style={{ color: "#4B5563", fontSize: "13px" }}>Loading MetaTrader connection...</span>
    </div>
  );

  return (
    <>
      <div style={card}>
        {/* Header Row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, backgroundColor: conn.state === "DEPLOYED" && conn.connectionStatus === "CONNECTED" ? "#22c55e" : conn.state === "DEPLOYING" ? "#F59E0B" : "#374151" }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "14px" }}>
                  {conn.connected ? `MT${conn.platform === "mt5" ? "5" : "4"} · ${conn.login} · ${conn.server}` : "MetaTrader · Not connected"}
                </span>
                <StateTag state={conn.state} connectionStatus={conn.connectionStatus} />
              </div>
              {conn.lastSync && (
                <p style={{ color: "#4B5563", fontSize: "11px", marginTop: "2px" }}>
                  Last sync: {new Date(conn.lastSync).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {conn.state === "UNDEPLOYED" && (
              <button onClick={redeploy} disabled={deploying}
                style={{ padding: "7px 14px", borderRadius: "9px", border: "1px solid rgba(245,158,11,0.4)", backgroundColor: "transparent", color: "#F59E0B", cursor: deploying ? "not-allowed" : "pointer", fontSize: "12px", opacity: deploying ? 0.6 : 1 }}>
                {deploying ? "Reconnecting..." : "↺ Reconnect"}
              </button>
            )}
            {conn.state === "DEPLOYED" && (
              <>
                <button onClick={() => doSync(false)} disabled={syncing}
                  style={{ padding: "7px 14px", borderRadius: "9px", border: "1px solid rgba(139,92,246,0.4)", backgroundColor: "transparent", color: "#A78BFA", cursor: syncing ? "not-allowed" : "pointer", fontSize: "12px", opacity: syncing ? 0.6 : 1 }}>
                  {syncing ? "Sync..." : "↻ Sync now"}
                </button>
                <button onClick={() => doSync(false, true)} disabled={syncing}
                  style={{ padding: "7px 14px", borderRadius: "9px", border: "1px solid rgba(107,114,128,0.4)", backgroundColor: "transparent", color: "#6B7280", cursor: syncing ? "not-allowed" : "pointer", fontSize: "12px", opacity: syncing ? 0.6 : 1 }}
                  title="Re-import all history (2 years)">
                  Full Resync
                </button>
              </>
            )}
            {conn.connected ? (
              <button onClick={disconnect}
                style={{ padding: "7px 12px", borderRadius: "9px", border: "1px solid rgba(239,68,68,0.3)", backgroundColor: "transparent", color: "#ef4444", cursor: "pointer", fontSize: "12px" }}>
                Disconnect
              </button>
            ) : (
              <button onClick={() => { setShowForm(true); setError(null); }}
                style={{ padding: "7px 16px", borderRadius: "9px", border: "none", backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}>
                Connect MT4/MT5
              </button>
            )}
          </div>
        </div>

        {/* Deploying hint */}
        {conn.state === "DEPLOYING" && (
          <div style={{ marginTop: "14px", backgroundColor: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "10px", padding: "12px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "14px", height: "14px", border: "2px solid #8B5CF6", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
            <p style={{ color: "#A78BFA", fontSize: "12px" }}>Establishing connection – this takes about 1–2 minutes...</p>
          </div>
        )}

        {/* Sync Result */}
        {syncResult && (
          <div style={{ marginTop: "12px", backgroundColor: "rgba(34,197,94,0.07)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "10px", padding: "10px 14px" }}>
            <p style={{ color: "#22c55e", fontSize: "12px" }}>
              ✓ {syncResult.synced} trade{syncResult.synced !== 1 ? "s" : ""} imported{syncResult.skipped > 0 ? ` · ${syncResult.skipped} already exist` : ""}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ marginTop: "12px", backgroundColor: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "10px", padding: "10px 14px" }}>
            <p style={{ color: "#ef4444", fontSize: "12px" }}>{error}</p>
          </div>
        )}

        {/* Account Stats */}
        {account && (
          <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px" }}>
            {[
              { label: "Balance",     value: `${account.balance.toFixed(2)} ${account.currency}`,     color: "#F9FAFB" },
              { label: "Equity",      value: `${account.equity.toFixed(2)} ${account.currency}`,      color: account.equity >= account.balance ? "#22c55e" : "#ef4444" },
              { label: "Margin",      value: `${account.margin.toFixed(2)} ${account.currency}`,      color: "#F59E0B" },
              { label: "Free Margin", value: `${account.freeMargin.toFixed(2)} ${account.currency}`,  color: "#9CA3AF" },
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: "#0d1117", border: "1px solid #1F2937", borderRadius: "10px", padding: "10px 12px" }}>
                <p style={{ color: "#6B7280", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "4px" }}>{s.label}</p>
                <p style={{ color: s.color, fontWeight: 700, fontSize: "14px" }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connect Modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
          onClick={() => setShowForm(false)}>
          <div style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "20px", width: "100%", maxWidth: "440px" }}
            onClick={e => e.stopPropagation()}>

            <div style={{ padding: "22px 26px", borderBottom: "1px solid #1F2937", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ color: "#F9FAFB", fontWeight: 700, fontSize: "16px", margin: 0 }}>Connect MetaTrader</h3>
                <p style={{ color: "#6B7280", fontSize: "12px", marginTop: "3px" }}>MT4 or MT5 trading account</p>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "20px" }}>✕</button>
            </div>

            <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* Platform Toggle */}
              <div>
                <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "8px" }}>Platform</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  {(["mt5", "mt4"] as const).map(p => (
                    <button key={p} type="button" onClick={() => setPlatform(p)}
                      style={{ flex: 1, padding: "9px", borderRadius: "10px", cursor: "pointer", fontWeight: 600, fontSize: "13px", border: `1px solid ${platform === p ? "#8B5CF6" : "#1F2937"}`, backgroundColor: platform === p ? "rgba(139,92,246,0.15)" : "#0a0a0a", color: platform === p ? "#A78BFA" : "#6B7280" }}>
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Login Number *</label>
                <input style={inp} placeholder="e.g. 12345678" value={login} onChange={e => setLogin(e.target.value)} />
              </div>

              <div>
                <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Password *</label>
                <input style={inp} type="password" placeholder="Your trading password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>

              <div>
                <label style={{ color: "#9CA3AF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Broker Server *</label>
                <input style={inp} placeholder="e.g. ICMarkets-Live01" value={server} onChange={e => setServer(e.target.value)} />
                <p style={{ color: "#374151", fontSize: "11px", marginTop: "5px" }}>Found in your broker email or in MetaTrader under File → Accounts</p>
              </div>

              <div style={{ backgroundColor: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "10px", padding: "10px 14px" }}>
                <p style={{ color: "#9CA3AF", fontSize: "11px" }}>
                  🔒 Your credentials are transmitted encrypted. The connection runs via MetaAPI.cloud – read-only access to your trade history.
                </p>
              </div>

              {error && <p style={{ color: "#ef4444", fontSize: "12px" }}>{error}</p>}
            </div>

            <div style={{ padding: "16px 26px", borderTop: "1px solid #1F2937", display: "flex", gap: "10px" }}>
              <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: "11px", borderRadius: "11px", border: "1px solid #1F2937", backgroundColor: "transparent", color: "#9CA3AF", cursor: "pointer", fontSize: "14px" }}>
                Cancel
              </button>
              <button onClick={connect} disabled={connecting || !login || !password || !server}
                style={{ flex: 2, padding: "11px", borderRadius: "11px", border: "none", backgroundColor: login && password && server ? "#8B5CF6" : "#1F2937", color: "#F9FAFB", fontWeight: 600, cursor: connecting ? "not-allowed" : "pointer", fontSize: "14px", opacity: connecting ? 0.7 : 1 }}>
                {connecting ? "Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
