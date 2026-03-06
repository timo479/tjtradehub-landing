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
  );
}
