"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const included = [
  "Unlimited trade logging",
  "MT4 & MT5 auto-sync",
  "Strategy rule tracking",
  "Setup tagging",
  "Discipline score & trends",
  "Execution analytics (coming soon)",
  "Full trade history import",
  "Your data, always accessible",
];

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpgrade = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
      });

      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.url) {
        setError(data.error || "Failed to start checkout");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-16"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 mb-10">
        <Image src="/logo-3d.png" alt="TJ TradeHub" width={36} height={36} />
        <span className="font-semibold text-lg" style={{ color: "#F9FAFB" }}>
          TJ TradeHub
        </span>
      </Link>

      {/* Header */}
      <div className="text-center mb-10" style={{ maxWidth: "500px" }}>
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium mb-6 rounded-lg"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            color: "#F87171",
            border: "1px solid rgba(239, 68, 68, 0.2)",
          }}
        >
          Trial ended
        </div>
        <h1
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ color: "#F9FAFB" }}
        >
          Continue with TJ TradeHub
        </h1>
        <p className="text-lg" style={{ color: "#9CA3AF" }}>
          Your 7-day trial has ended. Upgrade to keep full access for just{" "}
          <strong style={{ color: "#F9FAFB" }}>$29/month</strong>.
        </p>
      </div>

      {/* Pricing Card */}
      <div
        className="w-full rounded-3xl p-8"
        style={{
          maxWidth: "420px",
          backgroundColor: "#111827",
          border: "1px solid rgba(139, 92, 246, 0.3)",
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <span className="font-semibold" style={{ color: "#F9FAFB" }}>
            Founder Access
          </span>
          <span
            className="px-3 py-1 text-xs font-semibold rounded-full"
            style={{
              backgroundColor: "rgba(139, 92, 246, 0.15)",
              color: "#8B5CF6",
            }}
          >
            Early Bird
          </span>
        </div>

        <div className="flex items-end gap-2 mb-2">
          <span
            className="text-5xl font-bold leading-none"
            style={{ color: "#F9FAFB" }}
          >
            $29
          </span>
          <span className="text-base mb-1" style={{ color: "#9CA3AF" }}>
            / month
          </span>
        </div>
        <p className="text-sm mb-8" style={{ color: "#9CA3AF" }}>
          Locked-in founder rate. Price will increase after launch.
        </p>

        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm mb-4"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#F87171",
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="block w-full text-center px-6 py-4 font-semibold text-base transition-all duration-200 mb-4 rounded-2xl"
          style={{
            backgroundColor: loading ? "#6D4FCF" : "#8B5CF6",
            color: "#F9FAFB",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Redirecting to checkout…" : "Upgrade Now – $29/mo"}
        </button>

        <p className="text-xs text-center mb-8" style={{ color: "#9CA3AF" }}>
          Secure checkout via Stripe · Cancel anytime
        </p>

        <div className="w-full h-px mb-8" style={{ backgroundColor: "#1F2937" }} />

        <ul className="flex flex-col gap-3">
          {included.map((item, i) => (
            <li key={i} className="flex items-center gap-3">
              <div
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(139, 92, 246, 0.15)" }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5L4 7.5L8 2.5"
                    stroke="#8B5CF6"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <span className="text-sm" style={{ color: "#9CA3AF" }}>
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/dashboard"
        className="mt-6 text-sm transition-colors"
        style={{ color: "#6B7280" }}
      >
        ← Back to dashboard
      </Link>
    </div>
  );
}
