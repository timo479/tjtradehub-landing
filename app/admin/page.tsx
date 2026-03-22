"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

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
  trade_count: number;
}

function StatusBadge({ user }: { user: AdminUser }) {
  if (user.is_banned) {
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">Banned</span>;
  }
  if (user.role === "admin") {
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">Admin</span>;
  }
  const s = user.subscription_status;
  if (s === "lifetime") return <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">Lifetime</span>;
  if (s === "active") return <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">Active</span>;
  if (s === "trialing") {
    const daysLeft = Math.max(0, Math.ceil((new Date(user.trial_ends_at).getTime() - Date.now()) / 86400000));
    return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">Trial ({daysLeft}d)</span>;
  }
  return <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-700 text-zinc-400 border border-zinc-600">{s}</span>;
}

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) { router.push("/dashboard"); return; }
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch {
      setError("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  async function doAction(id: string, action: string) {
    setActionLoading(id + action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Action failed");
      } else {
        await fetchUsers();
      }
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteUser(id: string) {
    setActionLoading(id + "delete");
    setDeleteConfirm(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Delete failed");
      } else {
        await fetchUsers();
      }
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(null);
    }
  }

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase())
  );

  const total = users.length;
  const active = users.filter((u) => u.subscription_status === "active" || u.subscription_status === "lifetime").length;
  const trialing = users.filter((u) => u.subscription_status === "trialing").length;
  const banned = users.filter((u) => u.is_banned).length;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-white">TJTradeHub</span>
          <span className="text-zinc-600">/</span>
          <span className="text-zinc-400 font-medium">Admin Panel</span>
        </div>
        <a href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
          ← Dashboard
        </a>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Users", value: total, color: "text-white" },
            { label: "Active / Lifetime", value: active, color: "text-green-400" },
            { label: "Trialing", value: trialing, color: "text-blue-400" },
            { label: "Banned", value: banned, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{loading ? "—" : s.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-3">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-zinc-500 hover:text-white text-sm">
              Clear
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

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
                    <th className="text-left px-4 py-3 font-medium">User</th>
                    <th className="text-left px-4 py-3 font-medium">ID</th>
                    <th className="text-left px-4 py-3 font-medium">Registered</th>
                    <th className="text-left px-4 py-3 font-medium">Status</th>
                    <th className="text-left px-4 py-3 font-medium">Trades</th>
                    <th className="text-left px-4 py-3 font-medium">Last Meta</th>
                    <th className="text-right px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {filtered.map((user) => {
                    const isMe = user.role === "admin";
                    return (
                      <tr key={user.id} className="hover:bg-zinc-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-white">{user.name || "—"}</div>
                          <div className="text-xs text-zinc-500">{user.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigator.clipboard.writeText(user.id)}
                            title={user.id}
                            className="text-xs text-zinc-500 font-mono hover:text-white transition-colors group flex items-center gap-1"
                          >
                            {user.id.slice(0, 8)}…
                            <svg className="opacity-0 group-hover:opacity-100 transition-opacity" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {new Date(user.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge user={user} />
                        </td>
                        <td className="px-4 py-3 text-zinc-400">
                          {user.trade_count}
                        </td>
                        <td className="px-4 py-3 text-zinc-500 text-xs">
                          {user.meta_last_active
                            ? new Date(user.meta_last_active).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {!isMe && (
                              <>
                                {user.is_banned ? (
                                  <ActionButton
                                    label="Unban"
                                    color="green"
                                    loading={actionLoading === user.id + "unban"}
                                    onClick={() => doAction(user.id, "unban")}
                                  />
                                ) : (
                                  <ActionButton
                                    label="Ban"
                                    color="orange"
                                    loading={actionLoading === user.id + "ban"}
                                    onClick={() => doAction(user.id, "ban")}
                                  />
                                )}
                                {user.subscription_status !== "lifetime" && (
                                  <ActionButton
                                    label="Lifetime"
                                    color="purple"
                                    loading={actionLoading === user.id + "lifetime"}
                                    onClick={() => doAction(user.id, "lifetime")}
                                  />
                                )}
                                {user.subscription_id && (
                                  <ActionButton
                                    label="Cancel Sub"
                                    color="red"
                                    loading={actionLoading === user.id + "cancel_subscription"}
                                    onClick={() => doAction(user.id, "cancel_subscription")}
                                  />
                                )}
                                {deleteConfirm === user.id ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-red-400 mr-1">Confirm?</span>
                                    <button
                                      onClick={() => deleteUser(user.id)}
                                      disabled={!!actionLoading}
                                      className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                                    >
                                      Yes
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm(null)}
                                      className="px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-white rounded transition-colors"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <ActionButton
                                    label="Delete"
                                    color="red"
                                    loading={actionLoading === user.id + "delete"}
                                    onClick={() => setDeleteConfirm(user.id)}
                                  />
                                )}
                              </>
                            )}
                            {isMe && <span className="text-xs text-zinc-600">—</span>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-4 text-xs text-zinc-600 text-center">
          {filtered.length} of {total} users shown
        </p>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  color,
  loading,
  onClick,
}: {
  label: string;
  color: "green" | "orange" | "purple" | "red";
  loading: boolean;
  onClick: () => void;
}) {
  const colors = {
    green: "bg-green-600/20 hover:bg-green-600/40 text-green-400 border-green-600/30",
    orange: "bg-orange-600/20 hover:bg-orange-600/40 text-orange-400 border-orange-600/30",
    purple: "bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 border-purple-600/30",
    red: "bg-red-600/20 hover:bg-red-600/40 text-red-400 border-red-600/30",
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-2 py-1 text-xs rounded border transition-colors disabled:opacity-50 ${colors[color]}`}
    >
      {loading ? "..." : label}
    </button>
  );
}
