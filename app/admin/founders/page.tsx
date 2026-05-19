"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Slot = {
  number: number;
  acquired_via: "sale" | "giveaway" | "soft_launch" | null;
  claimed_at: string;
  email: string | null;
  claimed_by_user_id: string;
};

function fmt(d: string) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function viaBadge(via: Slot["acquired_via"]) {
  const colors: Record<string, string> = {
    sale: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    giveaway: "bg-purple-500/20 text-purple-300 border-purple-500/30",
    soft_launch: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  };
  const c = colors[via ?? ""] ?? "bg-zinc-700 text-zinc-400 border-zinc-600";
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${c}`}>
      {via ?? "—"}
    </span>
  );
}

export default function AdminFoundersPage() {
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [granting, setGranting] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [via, setVia] = useState<"giveaway" | "soft_launch">("soft_launch");
  const [sendEmail, setSendEmail] = useState(true);

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/founders");
      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setError("Failed to load slots");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setGranting(true);
    try {
      const res = await fetch("/api/admin/founders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          acquired_via: via,
          send_email: sendEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Grant failed");
      } else {
        setSuccess(
          `Granted Founder #${String(data.slot).padStart(3, "0")} to ${email}${
            data.new_account ? " (new account)" : ""
          }${sendEmail ? " · welcome email sent" : ""}`
        );
        setEmail("");
        setName("");
        await fetchSlots();
      }
    } catch {
      setError("Network error");
    } finally {
      setGranting(false);
    }
  }

  const counts = {
    total: slots.length,
    sale: slots.filter((s) => s.acquired_via === "sale").length,
    giveaway: slots.filter((s) => s.acquired_via === "giveaway").length,
    soft_launch: slots.filter((s) => s.acquired_via === "soft_launch").length,
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-300">← Admin</Link>
            <h1 className="text-2xl font-bold mt-2">Founder Slots</h1>
            <p className="text-sm text-zinc-500 mt-1">
              Manually grant a Founder Lifetime spot. Used for giveaway winners and soft-launch friends.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: "Claimed", value: counts.total, hint: "of 100" },
            { label: "Sale", value: counts.sale, hint: "max 90" },
            { label: "Giveaway", value: counts.giveaway, hint: "lottery winners" },
            { label: "Soft launch", value: counts.soft_launch, hint: "friends / free" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-xs text-zinc-500 uppercase tracking-wider">{s.label}</div>
              <div className="text-2xl font-bold mt-1">{s.value}</div>
              <div className="text-xs text-zinc-600 mt-1">{s.hint}</div>
            </div>
          ))}
        </div>

        {/* Grant form */}
        <form
          onSubmit={handleGrant}
          className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 mb-6"
        >
          <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-zinc-400">
            Grant a slot
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="winner@example.com"
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Name (optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-xs text-zinc-500 mb-1 block">Type</label>
              <select
                value={via}
                onChange={(e) => setVia(e.target.value as "giveaway" | "soft_launch")}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:border-purple-500 focus:outline-none"
              >
                <option value="soft_launch">Soft launch (friend / free)</option>
                <option value="giveaway">Giveaway winner</option>
              </select>
            </div>
            <label className="flex items-center gap-2 self-end text-sm text-zinc-400 cursor-pointer">
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
                className="accent-purple-500"
              />
              Send welcome email with set-password link
            </label>
          </div>
          <button
            type="submit"
            disabled={granting}
            className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-semibold disabled:opacity-50 transition-colors"
          >
            {granting ? "Granting…" : "Grant Founder spot"}
          </button>
          {success && (
            <div className="mt-3 text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2">
              {success}
            </div>
          )}
          {error && (
            <div className="mt-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
        </form>

        {/* Slots table */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
          <div className="px-5 py-3 border-b border-zinc-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Claimed slots
            </h2>
            <span className="text-xs text-zinc-500">{counts.total} total</span>
          </div>
          {loading ? (
            <div className="p-6 text-sm text-zinc-500">Loading…</div>
          ) : slots.length === 0 ? (
            <div className="p-6 text-sm text-zinc-500">No slots claimed yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider">
                  <th className="px-5 py-2 font-medium">#</th>
                  <th className="px-5 py-2 font-medium">Email</th>
                  <th className="px-5 py-2 font-medium">Type</th>
                  <th className="px-5 py-2 font-medium">Claimed</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((s) => (
                  <tr key={s.number} className="border-t border-zinc-900 hover:bg-zinc-900/50">
                    <td className="px-5 py-2 font-mono font-semibold">
                      #{String(s.number).padStart(3, "0")}
                    </td>
                    <td className="px-5 py-2">{s.email ?? "—"}</td>
                    <td className="px-5 py-2">{viaBadge(s.acquired_via)}</td>
                    <td className="px-5 py-2 text-zinc-400">{fmt(s.claimed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
