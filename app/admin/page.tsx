"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
  subscription_status: string;
  current_period_end: string | null;
  trial_ends_at: string;
  stripe_customer_id: string | null;
  subscription_id: string | null;
  is_banned: boolean;
  role: string;
  meta_last_active: string | null;
  last_login_at: string | null;
  trade_count: number;
  admin_note: string | null;
}

interface ActivityLog {
  id: string;
  admin_email: string;
  target_email: string;
  action: string;
  details: string | null;
  created_at: string;
}

function StatusBadge({ user }: { user: AdminUser }) {
  if (user.is_banned) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">Banned</span>;
  if (user.role === "admin") return <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">Admin</span>;
  const s = user.subscription_status;
  if (s === "lifetime") return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Lifetime</span>;
  if (s === "active") return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">Active</span>;
  if (s === "trialing") {
    const daysLeft = Math.max(0, Math.ceil((new Date(user.trial_ends_at).getTime() - Date.now()) / 86400000));
    if (daysLeft === 0) return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">Expired</span>;
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">Trial ({daysLeft}d)</span>;
  }
  return <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-700 text-zinc-400 border border-zinc-600">{s}</span>;
}

function ActionBtn({ label, color, loading, onClick }: { label: string; color: "green" | "orange" | "purple" | "red" | "blue"; loading: boolean; onClick: () => void }) {
  const c = {
    green: "bg-green-600/20 hover:bg-green-600/40 text-green-400 border-green-600/30",
    orange: "bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 border-orange-600/30",
    purple: "bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border-purple-600/30",
    red: "bg-red-600/20 hover:bg-red-600/40 text-red-400 border-red-600/30",
    blue: "bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border-blue-600/30",
  };
  return (
    <button onClick={onClick} disabled={loading} className={`px-2 py-1 text-xs rounded border transition-colors disabled:opacity-50 ${c[color]}`}>
      {loading ? "..." : label}
    </button>
  );
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmt(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function exportCSV(users: AdminUser[]) {
  const headers = ["Email", "Name", "User ID", "Registered", "Last Login", "Status", "Trades", "Note"];
  const rows = users.map(u => [
    u.email, u.name, u.id, fmt(u.created_at), fmt(u.last_login_at),
    u.is_banned ? "Banned" : u.subscription_status,
    String(u.trade_count), u.admin_note ?? "",
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `tjtradehub-users-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [revenue, setRevenue] = useState({ mrr: 0, conversionRate: 0 });
  const [regByDay, setRegByDay] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"users" | "activity">("users");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<{ id: string; value: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) { router.push("/dashboard"); return; }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setUsers(data.users ?? []);
      setRevenue(data.revenue ?? { mrr: 0, conversionRate: 0 });
      setRegByDay(data.regByDay ?? {});
    } catch { setError("Failed to load users"); }
    finally { setLoading(false); }
  }, [router]);

  const fetchLogs = useCallback(async () => {
    const res = await fetch("/api/admin/log");
    if (res.ok) { const d = await res.json(); setLogs(d.logs ?? []); }
  }, []);

  useEffect(() => { fetchUsers(); fetchLogs(); }, [fetchUsers, fetchLogs]);

  async function doAction(id: string, action: string, extra?: Record<string, unknown>) {
    setActionLoading(id + action); setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Action failed"); }
      else { await fetchUsers(); await fetchLogs(); }
    } catch { setError("Network error"); }
    finally { setActionLoading(null); }
  }

  async function deleteUser(id: string) {
    setActionLoading(id + "delete"); setDeleteConfirm(null); setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Delete failed"); }
      else { await fetchUsers(); await fetchLogs(); }
    } catch { setError("Network error"); }
    finally { setActionLoading(null); }
  }

  async function impersonate(id: string) {
    setActionLoading(id + "impersonate"); setError(null);
    try {
      const res = await fetch(`/api/admin/impersonate/${id}`, { method: "POST" });
      if (!res.ok) { setError("Failed to impersonate"); return; }
      const { token } = await res.json();
      const result = await signIn("impersonate", { token, redirect: false });
      if (result?.error) { setError("Impersonation failed"); return; }
      router.push("/dashboard");
    } catch { setError("Network error"); }
    finally { setActionLoading(null); }
  }

  function copyId(id: string) {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  const nonAdmins = users.filter(u => u.role !== "admin");
  const total = nonAdmins.length;
  const active = nonAdmins.filter(u => u.subscription_status === "active" || u.subscription_status === "lifetime").length;
  const trialing = nonAdmins.filter(u => u.subscription_status === "trialing").length;
  const banned = nonAdmins.filter(u => u.is_banned).length;

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Registration chart – last 14 days
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
  const maxReg = Math.max(...last14.map(d => regByDay[d] ?? 0), 1);

  const actionLabels: Record<string, string> = {
    ban: "Banned", unban: "Unbanned", lifetime: "Gave Lifetime",
    cancel_subscription: "Cancelled Sub", delete: "Deleted", impersonate: "Impersonated", save_note: "Saved Note",
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold">TJTradeHub</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-400 font-medium">Admin Panel</span>
        </div>
        <a href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">← Dashboard</a>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: "Total Users", value: loading ? "—" : total, color: "text-white" },
            { label: "Active / Lifetime", value: loading ? "—" : active, color: "text-green-400" },
            { label: "Trialing", value: loading ? "—" : trialing, color: "text-blue-400" },
            { label: "Banned", value: loading ? "—" : banned, color: "text-red-400" },
            { label: "MRR", value: loading ? "—" : `$${revenue.mrr}`, color: "text-yellow-400" },
            { label: "Conversion", value: loading ? "—" : `${revenue.conversionRate}%`, color: "text-purple-400" },
          ].map(s => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {(["users", "activity"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${tab === t ? "bg-purple-600 border-purple-500 text-white" : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:text-white"}`}
            >
              {t === "users" ? "Users" : "Activity Log"}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <>
            {/* Registration Chart */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
              <h3 className="text-sm font-medium text-zinc-400 mb-4">Registrations – Last 14 Days</h3>
              <div className="flex items-end gap-1.5 h-24">
                {last14.map(day => {
                  const count = regByDay[day] ?? 0;
                  const height = count > 0 ? Math.max(8, Math.round((count / maxReg) * 80)) : 0;
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center gap-1">
                      {count > 0 && <span className="text-xs text-zinc-400">{count}</span>}
                      <div
                        className="w-full rounded-t bg-purple-600/60 hover:bg-purple-500/80 transition-colors"
                        style={{ height: `${height}px` }}
                        title={`${day}: ${count}`}
                      />
                      <span className="text-xs text-zinc-600" style={{ fontSize: "9px" }}>{day.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Search + Export */}
            <div className="mb-4 flex items-center gap-3">
              <input
                type="text"
                placeholder="Search by email or name..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
              {search && <button onClick={() => setSearch("")} className="text-zinc-500 hover:text-white text-sm">Clear</button>}
              <button
                onClick={() => exportCSV(filtered)}
                className="px-4 py-2.5 text-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-300 transition-colors whitespace-nowrap"
              >
                Export CSV
              </button>
              <button onClick={() => { fetchUsers(); fetchLogs(); }} className="px-3 py-2.5 text-sm bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-zinc-400 transition-colors">↻</button>
            </div>

            {/* Table */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              {loading ? (
                <div className="py-16 text-center text-zinc-500 text-sm">Loading users...</div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center text-zinc-500 text-sm">No users found</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-xs text-zinc-500 uppercase tracking-wide">
                        <th className="text-left px-4 py-3">User</th>
                        <th className="text-left px-4 py-3">ID</th>
                        <th className="text-left px-4 py-3">Registered</th>
                        <th className="text-left px-4 py-3">Last Login</th>
                        <th className="text-left px-4 py-3">Status</th>
                        <th className="text-left px-4 py-3">Trades</th>
                        <th className="text-left px-4 py-3">Note</th>
                        <th className="text-right px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {filtered.map(user => (
                        <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">{user.name || "—"}</div>
                            <div className="text-xs text-zinc-500">{user.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => copyId(user.id)}
                              title={user.id}
                              className="text-xs text-zinc-500 font-mono hover:text-white transition-colors group flex items-center gap-1"
                            >
                              {copiedId === user.id ? <span className="text-green-400">Copied!</span> : <>{user.id.slice(0, 8)}…</>}
                              <svg className="opacity-0 group-hover:opacity-100 transition-opacity" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            </button>
                          </td>
                          <td className="px-4 py-3 text-zinc-400 text-xs">{fmt(user.created_at)}</td>
                          <td className="px-4 py-3 text-zinc-500 text-xs">
                            {user.last_login_at ? timeAgo(user.last_login_at) : "—"}
                          </td>
                          <td className="px-4 py-3"><StatusBadge user={user} /></td>
                          <td className="px-4 py-3 text-zinc-400">{user.trade_count}</td>
                          <td className="px-4 py-3 min-w-[140px]">
                            {editingNote?.id === user.id ? (
                              <input
                                autoFocus
                                value={editingNote.value}
                                onChange={e => setEditingNote({ id: user.id, value: e.target.value })}
                                onKeyDown={e => {
                                  if (e.key === "Enter") {
                                    doAction(user.id, "save_note", { note: editingNote.value });
                                    setEditingNote(null);
                                  }
                                  if (e.key === "Escape") setEditingNote(null);
                                }}
                                onBlur={() => {
                                  doAction(user.id, "save_note", { note: editingNote.value });
                                  setEditingNote(null);
                                }}
                                className="w-full bg-zinc-800 border border-purple-500 rounded px-2 py-1 text-xs text-white outline-none"
                                placeholder="Add note..."
                              />
                            ) : (
                              <button
                                onClick={() => setEditingNote({ id: user.id, value: user.admin_note ?? "" })}
                                className="text-xs text-zinc-500 hover:text-white transition-colors text-left w-full group flex items-center gap-1"
                              >
                                <span>{user.admin_note || <span className="italic text-zinc-700">add note</span>}</span>
                                <svg className="opacity-0 group-hover:opacity-100 flex-shrink-0" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {user.role !== "admin" ? (
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                <ActionBtn label="View As" color="blue" loading={actionLoading === user.id + "impersonate"} onClick={() => impersonate(user.id)} />
                                {user.is_banned
                                  ? <ActionBtn label="Unban" color="green" loading={actionLoading === user.id + "unban"} onClick={() => doAction(user.id, "unban")} />
                                  : <ActionBtn label="Ban" color="orange" loading={actionLoading === user.id + "ban"} onClick={() => doAction(user.id, "ban")} />
                                }
                                {user.subscription_status !== "lifetime" && (
                                  <ActionBtn label="Lifetime" color="purple" loading={actionLoading === user.id + "lifetime"} onClick={() => doAction(user.id, "lifetime")} />
                                )}
                                {user.subscription_id && (
                                  <ActionBtn label="Cancel Sub" color="red" loading={actionLoading === user.id + "cancel_subscription"} onClick={() => doAction(user.id, "cancel_subscription")} />
                                )}
                                {deleteConfirm === user.id ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-red-400">Sure?</span>
                                    <button onClick={() => deleteUser(user.id)} disabled={!!actionLoading} className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors">Yes</button>
                                    <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-white rounded transition-colors">No</button>
                                  </div>
                                ) : (
                                  <ActionBtn label="Delete" color="red" loading={actionLoading === user.id + "delete"} onClick={() => setDeleteConfirm(user.id)} />
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-600 text-right block">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            <p className="mt-3 text-xs text-zinc-600 text-center">{filtered.length} of {total + users.filter(u => u.role === "admin").length} users shown</p>
          </>
        )}

        {/* ACTIVITY LOG TAB */}
        {tab === "activity" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {logs.length === 0 ? (
              <div className="py-16 text-center text-zinc-500 text-sm">No activity yet</div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {logs.map(log => (
                  <div key={log.id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-zinc-800/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${
                        log.action === "ban" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                        log.action === "unban" ? "bg-green-500/20 text-green-400 border-green-500/30" :
                        log.action === "lifetime" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                        log.action === "delete" ? "bg-red-600/30 text-red-300 border-red-600/30" :
                        log.action === "impersonate" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                        "bg-zinc-700 text-zinc-400 border-zinc-600"
                      }`}>
                        {actionLabels[log.action] ?? log.action}
                      </span>
                      <div className="min-w-0">
                        <span className="text-sm text-white truncate">{log.target_email}</span>
                        {log.details && <span className="text-xs text-zinc-500 ml-2">({log.details})</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-zinc-500">{log.admin_email}</div>
                      <div className="text-xs text-zinc-600">{timeAgo(log.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
