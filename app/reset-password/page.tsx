"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    setError("");

    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      return;
    }

    router.push("/login?reset=1");
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-sm mb-4" style={{ color: "#F87171" }}>Invalid reset link.</p>
        <Link href="/forgot-password" style={{ color: "#8B5CF6", fontSize: "14px" }}>
          Request a new one
        </Link>
      </div>
    );
  }

  return (
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
          New Password
        </label>
        <input
          type="password"
          placeholder="Min. 8 chars, 1 uppercase, 1 number"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl text-sm outline-none"
          style={{ backgroundColor: "#000000", border: "1px solid #1F2937", color: "#F9FAFB" }}
          onFocus={(e) => (e.target.style.borderColor = "#8B5CF6")}
          onBlur={(e) => (e.target.style.borderColor = "#1F2937")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: "#9CA3AF" }}>
          Confirm Password
        </label>
        <input
          type="password"
          placeholder="Repeat your new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
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
        {loading ? "Saving…" : "Set New Password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      title="Set new password"
      subtitle="Choose a strong password for your account."
    >
      <Suspense fallback={<p style={{ color: "#9CA3AF", fontSize: "14px" }}>Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
