"use client";

import { useEffect, useState } from "react";

type Status = {
  lots: number;
  sources: Record<string, number>;
  referralCode: string;
  referralUrl: string;
  referredCount: number;
  rewards: {
    register: number;
    mt5_connect: number;
    five_trades: number;
    twitter_share: number;
    referral: number;
  };
};

const SHARE_TEXT =
  "I'm in for the @tjtradehub Founder Launch — 100 Lifetime spots, 10 given away. Join me:";

export default function LotteryView() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/lottery/status", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && res.ok) setStatus(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const copyLink = async () => {
    if (!status?.referralUrl) return;
    try {
      await navigator.clipboard.writeText(status.referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleShare = async () => {
    if (!status) return;
    setSharing(true);
    try {
      const tweet = `${SHARE_TEXT} ${status.referralUrl}`;
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`,
        "_blank",
        "noopener,noreferrer"
      );
      const res = await fetch("/api/lottery/share", { method: "POST" });
      const data = await res.json();
      if (res.ok && typeof data.lots === "number") {
        setStatus({ ...status, lots: data.lots, sources: { ...status.sources, twitter_share: status.rewards.twitter_share } });
      } else if (data.alreadyCredited) {
        // no-op, already counted
      }
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return <p style={{ color: "#9CA3AF" }}>Loading…</p>;
  }
  if (!status) {
    return <p style={{ color: "#ef4444" }}>Could not load your lottery status.</p>;
  }

  const has = (key: string) => Boolean(status.sources[key]);
  const referralLots = status.sources.referrals ?? 0;

  const actions: { key: string; label: string; lots: number; done: boolean; hint?: string }[] = [
    { key: "register", label: "Create your free account", lots: status.rewards.register, done: has("register") },
    { key: "mt5_connect", label: "Connect MT4 / MT5", lots: status.rewards.mt5_connect, done: has("mt5_connect") },
    { key: "five_trades", label: "Log 5 real trades", lots: status.rewards.five_trades, done: has("five_trades") },
    { key: "twitter_share", label: "Share on X / Twitter", lots: status.rewards.twitter_share, done: has("twitter_share") },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2" style={{ color: "#F9FAFB" }}>
        Founder Lottery
      </h1>
      <p className="mb-8" style={{ color: "#9CA3AF" }}>
        10 Lifetime spots will be drawn on launch day. Earn entries below — more entries, better odds.
      </p>

      {/* Big lots counter */}
      <div
        className="rounded-2xl p-8 mb-8 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))",
          border: "1px solid rgba(139,92,246,0.3)",
        }}
      >
        <div className="text-sm uppercase tracking-wider mb-2" style={{ color: "#A78BFA" }}>
          Your entries
        </div>
        <div className="text-6xl font-bold" style={{ color: "#F9FAFB" }}>
          {status.lots}
        </div>
        <div className="text-sm mt-2" style={{ color: "#9CA3AF" }}>
          {status.referredCount} friend{status.referredCount === 1 ? "" : "s"} referred
          {referralLots > 0 ? ` · +${referralLots} from referrals` : ""}
        </div>
      </div>

      {/* Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "#F9FAFB" }}>
          Earn more entries
        </h2>
        <div className="space-y-3">
          {actions.map((a) => (
            <div
              key={a.key}
              className="flex items-center justify-between rounded-xl p-4"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{
                    backgroundColor: a.done ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
                    color: a.done ? "#22c55e" : "#6B7280",
                    border: a.done ? "1px solid rgba(34,197,94,0.4)" : "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {a.done ? "✓" : ""}
                </div>
                <span style={{ color: "#F9FAFB" }}>{a.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold" style={{ color: "#A78BFA" }}>
                  +{a.lots}
                </span>
                {a.key === "twitter_share" && !a.done && (
                  <button
                    onClick={handleShare}
                    disabled={sharing}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ backgroundColor: "#8B5CF6", color: "#F9FAFB", opacity: sharing ? 0.6 : 1 }}
                  >
                    {sharing ? "…" : "Share"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Referral block */}
      <div
        className="rounded-2xl p-6"
        style={{
          backgroundColor: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <h2 className="text-lg font-semibold mb-1" style={{ color: "#F9FAFB" }}>
          Refer friends, get +{status.rewards.referral} per signup
        </h2>
        <p className="text-sm mb-4" style={{ color: "#9CA3AF" }}>
          Share your link. Every friend who signs up adds +{status.rewards.referral} entries to your total.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={status.referralUrl}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="flex-1 rounded-lg px-3 py-2 text-sm"
            style={{
              backgroundColor: "rgba(0,0,0,0.4)",
              color: "#F9FAFB",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          />
          <button
            onClick={copyLink}
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: "#8B5CF6", color: "#F9FAFB" }}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
