"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function RegisterForm() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div
        className="flex flex-col items-center gap-4 py-6 px-4 rounded-xl text-center"
        style={{ backgroundColor: "rgba(168, 85, 247, 0.08)", border: "1px solid rgba(168, 85, 247, 0.3)" }}
      >
        <div style={{ fontSize: "40px" }}>📬</div>
        <h3 className="text-lg font-semibold" style={{ color: "#F9FAFB" }}>Check your email</h3>
        <p className="text-sm" style={{ color: "#9CA3AF" }}>
          We sent a verification link to <span style={{ color: "#F9FAFB" }}>{form.email}</span>.<br />
          Click the link to activate your account.
        </p>
        <p className="text-xs" style={{ color: "#6B7280" }}>
          Can&apos;t find it? Check your <strong style={{ color: "#9CA3AF" }}>spam / junk folder</strong>.
        </p>
        <p className="text-xs" style={{ color: "#6B7280" }}>
          Already verified?{" "}
          <a href="/login" style={{ color: "#8B5CF6" }}>Sign in</a>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-3 transition-all"
        style={{ backgroundColor: "#111827", border: "1px solid #1F2937", color: "#F9FAFB", cursor: "pointer" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Sign up with Google
      </button>

      <div className="flex items-center gap-3">
        <div style={{ flex: 1, height: "1px", backgroundColor: "#1F2937" }} />
        <span style={{ color: "#4B5563", fontSize: "12px" }}>or sign up with email</span>
        <div style={{ flex: 1, height: "1px", backgroundColor: "#1F2937" }} />
      </div>

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
          Name
        </label>
        <input
          type="text"
          placeholder="Your name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
          style={{
            backgroundColor: "#000000",
            border: "1px solid #1F2937",
            color: "#F9FAFB",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#8B5CF6")}
          onBlur={(e) => (e.target.style.borderColor = "#1F2937")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: "#9CA3AF" }}>
          Email
        </label>
        <input
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
          style={{
            backgroundColor: "#000000",
            border: "1px solid #1F2937",
            color: "#F9FAFB",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#8B5CF6")}
          onBlur={(e) => (e.target.style.borderColor = "#1F2937")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium" style={{ color: "#9CA3AF" }}>
          Password
        </label>
        <input
          type="password"
          placeholder="Min. 8 chars, 1 uppercase, 1 number"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-colors"
          style={{
            backgroundColor: "#000000",
            border: "1px solid #1F2937",
            color: "#F9FAFB",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#8B5CF6")}
          onBlur={(e) => (e.target.style.borderColor = "#1F2937")}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 mt-2"
        style={{
          backgroundColor: loading ? "#6D4FCF" : "#8B5CF6",
          color: "#F9FAFB",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Creating account…" : "Start 7-Day Free Trial"}
      </button>

      <p className="text-xs text-center mt-2" style={{ color: "#6B7280" }}>
        No credit card required · Cancel anytime
      </p>

      <p className="text-sm text-center mt-4" style={{ color: "#9CA3AF" }}>
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium transition-colors"
          style={{ color: "#8B5CF6" }}
        >
          Sign in
        </Link>
      </p>
    </form>
    </div>
  );
}
