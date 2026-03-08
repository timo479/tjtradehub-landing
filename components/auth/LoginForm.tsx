"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
        className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-3 transition-all"
        style={{ backgroundColor: "#111827", border: "1px solid #1F2937", color: "#F9FAFB", cursor: "pointer" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3">
        <div style={{ flex: 1, height: "1px", backgroundColor: "#1F2937" }} />
        <span style={{ color: "#4B5563", fontSize: "12px" }}>or</span>
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
          placeholder="Your password"
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
        {loading ? "Signing in…" : "Sign In"}
      </button>

      <p className="text-sm text-center mt-4" style={{ color: "#9CA3AF" }}>
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium transition-colors"
          style={{ color: "#8B5CF6" }}
        >
          Start free trial
        </Link>
      </p>
    </form>
    </div>
  );
}
