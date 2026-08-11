"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Totals = {
  signups: number;
  payingActive: number;
  churned: number;
  earnedCents: number;
  pendingCents: number;
  payableCents: number;
  paidOutCents: number;
  clawedBackCents: number;
  mrrCents: number;
};

type Affiliate = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  instagram: string | null;
  promo_code: string;
  rate_bps: number;
  status: "active" | "paused" | "ended";
  payout_method: string | null;
  created_at: string;
  totals: Totals;
};

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusBadge(status: Affiliate["status"]) {
  const colors: Record<string, string> = {
    active: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    paused: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    ended: "bg-zinc-700 text-zinc-400 border-zinc-600",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colors[status]}`}>
      {status}
    </span>
  );
}

/**
 * Churn-Rate ist laut Strategie das wichtigste Qualitätssignal pro Partner:
 * viele Signups, die sofort wieder abspringen, bedeuten schlechten Traffic.
 */
function churnRate(t: Totals): number | null {
  const everPaid = t.payingActive + t.churned;
  if (everPaid === 0) return null;
  return Math.round((t.churned / everPaid) * 100);
}

/** 60-Tage-Regel: 0 Signups seit Start → Code deaktivieren. */
function isStale(a: Affiliate): boolean {
  if (a.status !== "active" || a.totals.signups > 0) return false;
  const days = (Date.now() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24);
  return days >= 60;
}

export default function AdminAffiliatesPage() {
  const router = useRouter();
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [ratePct, setRatePct] = useState("30");
  const [payoutMethod, setPayoutMethod] = useState("");
  const [grantPro, setGrantPro] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/affiliates");
      if (res.status === 403 || res.status === 401) {
        router.push("/dashboard");
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAffiliates(data.affiliates ?? []);
      setError(null);
    } catch {
      setError("Could not load partners.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  async function createAffiliate(e: React.FormEvent) {
    e.preventDefault();
    setBusy("create");
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          instagram,
          promo_code: promoCode,
          rate_bps: Math.round(parseFloat(ratePct || "30") * 100),
          payout_method: payoutMethod,
          grant_pro: grantPro,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");

      setSuccess(
        data.note
          ? `Partner created. ${data.note}`
          : `Partner created${data.proGranted ? " and Pro granted" : ""}.`
      );
      setName("");
      setEmail("");
      setInstagram("");
      setPromoCode("");
      setPayoutMethod("");
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function patch(id: string, body: Record<string, unknown>, label: string) {
    setBusy(id + label);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/admin/affiliates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      if (body.action === "mark_paid") {
        setSuccess(`Marked ${data.markedPaid} commissions as paid (${usd(data.totalCents)}).`);
      } else {
        setSuccess("Updated.");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  const totalPayable = affiliates.reduce((s, a) => s + a.totals.payableCents, 0);
  const totalMrr = affiliates.reduce((s, a) => s + a.totals.mrrCents, 0);
  const totalActive = affiliates.reduce((s, a) => s + a.totals.payingActive, 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-300">
              ← Admin
            </Link>
            <h1 className="text-2xl font-bold mt-1">Partners</h1>
            <p className="text-sm text-zinc-500 mt-1">
              30% recurring on the amount actually received · payouts monthly, 14-day refund hold,
              $50 minimum
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-medium transition"
          >
            {showForm ? "Cancel" : "+ New partner"}
          </button>
        </div>

        {/* Summenzeile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-xs text-zinc-500 uppercase tracking-wide">Partners</div>
            <div className="text-2xl font-bold mt-1">
              {affiliates.filter((a) => a.status === "active").length}
            </div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-xs text-zinc-500 uppercase tracking-wide">Paying customers</div>
            <div className="text-2xl font-bold mt-1">{totalActive}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-xs text-zinc-500 uppercase tracking-wide">Commission MRR</div>
            <div className="text-2xl font-bold mt-1">{usd(totalMrr)}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-xs text-zinc-500 uppercase tracking-wide">Payable now</div>
            <div className="text-2xl font-bold mt-1 text-emerald-400">{usd(totalPayable)}</div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm">
            {success}
          </div>
        )}

        {showForm && (
          <form
            onSubmit={createAffiliate}
            className="mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5 grid md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-2 text-sm text-amber-300/80 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              Create the matching promo code in Stripe first: <b>20% off</b>, duration{" "}
              <b>repeating / 3 months</b>, restricted to the Pro price. This form only registers the
              code — it does not write to Stripe.
            </div>
            <label className="text-sm">
              <span className="text-zinc-400">Name</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-1 w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-zinc-400">Email (links their account)</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-zinc-400">Instagram</span>
              <input
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@handle"
                className="mt-1 w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-zinc-400">Promo code (= link slug)</span>
              <input
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="SARAH20"
                required
                className="mt-1 w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 font-mono"
              />
            </label>
            <label className="text-sm">
              <span className="text-zinc-400">Rate %</span>
              <input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={ratePct}
                onChange={(e) => setRatePct(e.target.value)}
                className="mt-1 w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2"
              />
            </label>
            <label className="text-sm">
              <span className="text-zinc-400">Payout method</span>
              <input
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                placeholder="PayPal: name@mail.com"
                className="mt-1 w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2"
              />
            </label>
            <label className="md:col-span-2 flex items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={grantPro}
                onChange={(e) => setGrantPro(e.target.checked)}
                className="accent-emerald-500"
              />
              Grant free Pro (1 year) if an account with this email already exists
            </label>
            <div className="md:col-span-2">
              <button
                disabled={busy === "create"}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-sm font-medium transition"
              >
                {busy === "create" ? "Creating…" : "Create partner"}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="text-zinc-500 text-sm">Loading…</div>
        ) : affiliates.length === 0 ? (
          <div className="text-zinc-500 text-sm bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center">
            No partners yet.
          </div>
        ) : (
          <div className="space-y-3">
            {affiliates.map((a) => {
              const cr = churnRate(a.totals);
              return (
                <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{a.name}</span>
                        {statusBadge(a.status)}
                        <code className="px-2 py-0.5 rounded bg-zinc-800 text-emerald-300 text-xs font-mono">
                          {a.promo_code}
                        </code>
                        <span className="text-xs text-zinc-500">
                          {(a.rate_bps / 100).toFixed(1)}%
                        </span>
                        {!a.user_id && (
                          <span className="px-2 py-0.5 rounded text-xs border bg-amber-500/20 text-amber-300 border-amber-500/30">
                            no account linked
                          </span>
                        )}
                        {isStale(a) && (
                          <span className="px-2 py-0.5 rounded text-xs border bg-red-500/20 text-red-300 border-red-500/30">
                            60 days, 0 signups
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {a.email}
                        {a.instagram ? ` · ${a.instagram}` : ""} · since {fmtDate(a.created_at)}
                        {a.payout_method ? ` · ${a.payout_method}` : ""}
                      </div>
                      <div className="text-xs text-zinc-600 mt-1 font-mono">
                        tjtradehub.com/r/{a.promo_code}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {a.totals.payableCents > 0 && (
                        <button
                          onClick={() => patch(a.id, { action: "mark_paid" }, "pay")}
                          disabled={busy === a.id + "pay"}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-medium transition"
                        >
                          Mark {usd(a.totals.payableCents)} paid
                        </button>
                      )}
                      {!a.user_id && (
                        <button
                          onClick={() => patch(a.id, { action: "link_user" }, "link")}
                          disabled={busy === a.id + "link"}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs transition"
                        >
                          Link account
                        </button>
                      )}
                      {a.status === "active" ? (
                        <button
                          onClick={() => patch(a.id, { status: "paused" }, "pause")}
                          disabled={busy === a.id + "pause"}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs transition"
                        >
                          Pause
                        </button>
                      ) : a.status === "paused" ? (
                        <button
                          onClick={() => patch(a.id, { status: "active" }, "resume")}
                          disabled={busy === a.id + "resume"}
                          className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs transition"
                        >
                          Resume
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-7 gap-3 text-sm">
                    <Stat label="Signups" value={String(a.totals.signups)} />
                    <Stat
                      label="Paying"
                      value={String(a.totals.payingActive)}
                      tone="text-emerald-400"
                    />
                    <Stat label="Churned" value={String(a.totals.churned)} tone="text-red-400" />
                    <Stat
                      label="Churn rate"
                      value={cr === null ? "—" : `${cr}%`}
                      tone={cr !== null && cr >= 50 ? "text-red-400" : undefined}
                    />
                    <Stat label="Comm. MRR" value={usd(a.totals.mrrCents)} />
                    <Stat label="Pending" value={usd(a.totals.pendingCents)} />
                    <Stat
                      label="Payable"
                      value={usd(a.totals.payableCents)}
                      tone="text-emerald-400"
                    />
                  </div>
                  <div className="mt-2 text-xs text-zinc-600">
                    Earned total {usd(a.totals.earnedCents)} · paid out{" "}
                    {usd(a.totals.paidOutCents)}
                    {a.totals.clawedBackCents > 0 && (
                      <> · clawed back {usd(a.totals.clawedBackCents)}</>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <div className="text-xs text-zinc-500 uppercase tracking-wide">{label}</div>
      <div className={`font-semibold mt-0.5 ${tone ?? ""}`}>{value}</div>
    </div>
  );
}
