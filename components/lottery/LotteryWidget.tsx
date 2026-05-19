"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const LAUNCH_DATE = new Date("2026-06-02T00:00:00+02:00").getTime();

function format(ms: number) {
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return { days, hours, minutes };
}

export default function LotteryWidget() {
  const [lots, setLots] = useState<number | null>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch("/api/lottery/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.lots === "number") setLots(d.lots);
      })
      .catch(() => null);
  }, []);

  const diff = LAUNCH_DATE - now;
  if (diff <= 0) return null;
  const { days, hours, minutes } = format(diff);

  return (
    <Link
      href="/dashboard/lottery"
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        className="rounded-2xl p-5 mb-6 transition-transform"
        style={{
          background:
            "linear-gradient(120deg, rgba(139,92,246,0.18) 0%, rgba(109,40,217,0.12) 60%, rgba(0,0,0,0) 100%)",
          border: "1px solid rgba(139,92,246,0.35)",
          cursor: "pointer",
        }}
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "rgba(139,92,246,0.2)",
                fontSize: 22,
              }}
            >
              🎁
            </div>
            <div>
              <div
                className="text-xs uppercase tracking-wider"
                style={{ color: "#A78BFA", fontWeight: 600 }}
              >
                Founder Lottery · launches in{" "}
                <span style={{ fontVariantNumeric: "tabular-nums" }}>
                  {days}d {hours}h {minutes}m
                </span>
              </div>
              <div
                className="font-semibold mt-0.5"
                style={{ color: "#F9FAFB", fontSize: 16 }}
              >
                {lots === null
                  ? "Earn entries to win 1 of 10 Lifetime spots"
                  : lots > 0
                  ? `You have ${lots} ${lots === 1 ? "entry" : "entries"} — earn more`
                  : "Earn entries to win 1 of 10 Lifetime spots"}
              </div>
            </div>
          </div>
          <div
            className="px-4 py-2 rounded-lg text-sm font-semibold"
            style={{ backgroundColor: "#8B5CF6", color: "#F9FAFB" }}
          >
            View entries →
          </div>
        </div>
      </div>
    </Link>
  );
}
