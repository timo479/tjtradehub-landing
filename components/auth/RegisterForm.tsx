"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

      // Auto-login after registration
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created, but login failed. Please sign in manually.");
        router.push("/login");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
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
  );
}
