"use client";

import { useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    setSent(true);
  }

  return (
    <AuthLayout
      title="Forgot password?"
      subtitle="Enter your email and we'll send you a reset link."
    >
      {sent ? (
        <div
          className="flex flex-col items-center gap-4 py-6 px-4 rounded-xl text-center"
          style={{ backgroundColor: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.3)" }}
        >
          <div style={{ fontSize: "40px" }}>📬</div>
          <h3 className="text-lg font-semibold" style={{ color: "#F9FAFB" }}>Check your email</h3>
          <p className="text-sm" style={{ color: "#9CA3AF" }}>
            If an account exists for <span style={{ color: "#F9FAFB" }}>{email}</span>, you'll receive a reset link shortly.
          </p>
          <Link href="/login" style={{ color: "#8B5CF6", fontSize: "14px" }}>
            Back to Sign In
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div
              className="px-4 py-3 rounded-xl text-sm"
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#F87171",
              }}
            >
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" style={{ color: "#9CA3AF" }}>
              Email
            </label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl text-sm outline-none"
              style={{ backgroundColor: "#000000", border: "1px solid #1F2937", color: "#F9FAFB" }}
              onFocus={(e) => (e.target.style.borderColor = "#8B5CF6")}
              onBlur={(e) => (e.target.style.borderColor = "#1F2937")}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-semibold mt-2"
            style={{
              backgroundColor: loading ? "#6D4FCF" : "#8B5CF6",
              color: "#F9FAFB",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Sending…" : "Send Reset Link"}
          </button>

          <p className="text-sm text-center mt-2" style={{ color: "#9CA3AF" }}>
            <Link href="/login" style={{ color: "#8B5CF6" }}>
              Back to Sign In
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
