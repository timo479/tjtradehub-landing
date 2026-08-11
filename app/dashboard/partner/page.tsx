"use client";

import { useEffect, useState } from "react";
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

type Signup = {
  label: string;
  signedUpAt: string;
  state: "free" | "paying" | "cancelled";
  monthlyCents: number;
};

type PartnerData = {
  isPartner: boolean;
  partner?: {
    name: string;
    promoCode: string;
    ratePct: number;
    status: "active" | "paused" | "ended";
    payoutMethod: string | null;
  };
  totals?: Totals;
  signups?: Signup[];
  payout?: { nextDate: string; minimumCents: number; holdDays: number };
};

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`;

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function stateBadge(state: Signup["state"]) {
  const map = {
    paying: { label: "Pro, active", cls: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" },
    free: { label: "Basic (free)", cls: "bg-zinc-700/50 text-zinc-400 border-zinc-600" },
    cancelled: { label: "cancelled", cls: "bg-red-500/20 text-red-300 border-red-500/30" },
  } as const;
  const s = map[state];
  return <span className={`px-2 py-0.5 rounded text-xs border ${s.cls}`}>{s.label}</span>;
}

export default function PartnerDashboardPage() {
  const [data, setData] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/partner")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ isPartner: false }))
      .finally(() => setLoading(false));
  }, []);

  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* Clipboard kann blockiert sein — dann bleibt der Text zum Markieren da. */
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 text-zinc-500 p-8 text-sm">Loading…</div>;
  }

  if (!data?.isPartner || !data.partner || !data.totals || !data.payout) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
        <div className="max-w-lg mx-auto text-center mt-20">
          <h1 className="text-2xl font-bold">Partner program</h1>
          <p className="text-zinc-400 mt-3 text-sm">
            This area is for TJ TradeHub partners. If you create trading content and want to earn
            30% recurring on every subscriber you bring, get in touch.
          </p>
          <Link
            href="/dashboard"
            className="inline-block mt-6 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm transition"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { partner, totals, signups = [], payout } = data;
  const link = `https://tjtradehub.com/r/${partner.promoCode}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Dashboard
        </Link>
        <div className="flex items-center gap-3 mt-1 mb-1">
          <h1 className="text-2xl font-bold">Partner</h1>
          {partner.status === "paused" && (
            <span className="px-2 py-0.5 rounded text-xs border bg-amber-500/20 text-amber-300 border-amber-500/30">
              paused
            </span>
          )}
        </div>
        <p className="text-sm text-zinc-500 mb-6">
          {partner.ratePct}% recurring on every subscription you bring, for as long as it runs.
        </p>

        {/* Code + Link */}
        <div className="grid md:grid-cols-2 gap-3 mb-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Your code</div>
            <div className="flex items-center gap-3">
              <code className="text-xl font-mono text-emerald-300">{partner.promoCode}</code>
              <button
                onClick={() => copy(partner.promoCode, "code")}
                className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs transition"
              >
                {copied === "code" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Your followers get 20% off their first 3 months with this.
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Your link</div>
            <div className="flex items-center gap-3">
              <code className="text-sm font-mono text-zinc-300 truncate">{link}</code>
              <button
                onClick={() => copy(link, "link")}
                className="px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs transition shrink-0"
              >
                {copied === "link" ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              Works for 60 days — even if they sign up free first and upgrade later.
            </p>
          </div>
        </div>

        {/* Kennzahlen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card label="Signups" value={String(totals.signups)} />
          <Card label="Paying now" value={String(totals.payingActive)} tone="text-emerald-400" />
          <Card label="Monthly income" value={usd(totals.mrrCents)} tone="text-emerald-400" />
          <Card label="Earned total" value={usd(totals.earnedCents)} />
        </div>

        {/* Auszahlung — Hold transparent machen, sonst wirkt es wie eine Kürzung */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-6">
          <div className="text-sm font-semibold mb-3">Payout</div>
          <div className="space-y-2 text-sm">
            <Row
              label="Ready for payout"
              value={usd(totals.payableCents)}
              valueClass="text-emerald-400 font-semibold"
              note={`paid out ${fmtDate(payout.nextDate)}`}
            />
            <Row
              label="Still on hold"
              value={usd(totals.pendingCents)}
              note={`released ${payout.holdDays} days after each payment (refund protection)`}
            />
            <Row label="Already paid out" value={usd(totals.paidOutCents)} />
            {totals.clawedBackCents > 0 && (
              <Row
                label="Reversed (refunds)"
                value={`− ${usd(totals.clawedBackCents)}`}
                valueClass="text-red-400"
              />
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-4 pt-3 border-t border-zinc-800">
            Payouts go out at the end of each month. Minimum {usd(payout.minimumCents)} — anything
            below rolls over to the next month.
            {partner.payoutMethod ? ` Sent to: ${partner.payoutMethod}.` : ""}
          </p>
        </div>

        {/* Signups — bewusst ohne Identitäten */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <div className="text-sm font-semibold">Your signups</div>
            <div className="text-xs text-zinc-500">{signups.length} total</div>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Anonymised — we never share who signed up. That&apos;s our customers&apos; data, and it
            protects your audience too.
          </p>

          {signups.length === 0 ? (
            <div className="text-sm text-zinc-500 py-8 text-center">
              Nothing yet. Share your link or code to get started.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {[...signups].reverse().map((s) => (
                <div key={s.label} className="flex items-center justify-between py-2.5 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm text-zinc-400 font-mono shrink-0">{s.label}</span>
                    <span className="text-xs text-zinc-600 shrink-0">{fmtDate(s.signedUpAt)}</span>
                    {stateBadge(s.state)}
                  </div>
                  <div className="text-sm shrink-0">
                    {s.monthlyCents > 0 ? (
                      <span className="text-emerald-400">{usd(s.monthlyCents)}/mo</span>
                    ) : (
                      <span className="text-zinc-600">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-xs text-zinc-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${tone ?? ""}`}>{value}</div>
    </div>
  );
}

function Row({
  label,
  value,
  note,
  valueClass,
}: {
  label: string;
  value: string;
  note?: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <div>
        <span className="text-zinc-300">{label}</span>
        {note && <span className="block text-xs text-zinc-600">{note}</span>}
      </div>
      <span className={valueClass ?? "text-zinc-200"}>{value}</span>
    </div>
  );
}
