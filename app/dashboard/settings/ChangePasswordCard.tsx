"use client";

import { useState } from "react";

interface Props {
  /** false = Google-Anmeldung ohne Passwort → nur setzen, kein altes abfragen. */
  hasPassword: boolean;
}

const card: React.CSSProperties = {
  backgroundColor: "#0A0A0A",
  border: "1px solid #1F2937",
  borderRadius: "16px",
  padding: "24px",
  marginTop: "16px",
};

const input: React.CSSProperties = {
  width: "100%",
  marginTop: "6px",
  padding: "10px 12px",
  borderRadius: "10px",
  backgroundColor: "#000",
  border: "1px solid #1F2937",
  color: "#F9FAFB",
  fontSize: "14px",
  outline: "none",
};

const label: React.CSSProperties = {
  color: "#9CA3AF",
  fontSize: "13px",
  display: "block",
  marginBottom: "14px",
};

export default function ChangePasswordCard({ hasPassword }: Props) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(false);

    // Der Abgleich der Wiederholung passiert nur hier — der Server braucht ihn
    // nicht, es ist reiner Tippfehlerschutz.
    if (next !== confirm) {
      setError("The two new passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          hasPassword ? { currentPassword: current, newPassword: next } : { newPassword: next }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={card}>
      <div style={{ marginBottom: "16px" }}>
        <h2 style={{ color: "#F9FAFB", fontSize: "16px", fontWeight: 600, margin: "0 0 4px" }}>
          {hasPassword ? "Password" : "Set a password"}
        </h2>
        <p style={{ color: "#6B7280", fontSize: "13px", margin: 0 }}>
          {hasPassword
            ? "At least 8 characters, with one uppercase letter and one number."
            : "You signed in with Google. Set a password if you'd like to log in with your email too."}
        </p>
      </div>

      <form onSubmit={submit}>
        {hasPassword && (
          <label style={label}>
            Current password
            <input
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              autoComplete="current-password"
              required
              style={input}
            />
          </label>
        )}

        <label style={label}>
          New password
          <input
            type="password"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            style={input}
          />
        </label>

        <label style={label}>
          Repeat new password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            style={input}
          />
        </label>

        {error && (
          <div style={{ color: "#ef4444", fontSize: "12px", marginBottom: "12px" }}>{error}</div>
        )}
        {done && (
          <div style={{ color: "#22c55e", fontSize: "12px", marginBottom: "12px" }}>
            ✓ Password updated. Use it next time you log in.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          style={{
            padding: "10px 18px",
            borderRadius: "10px",
            border: "none",
            backgroundColor: "#8B5CF6",
            color: "#fff",
            fontSize: "14px",
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : hasPassword ? "Change password" : "Set password"}
        </button>
      </form>
    </div>
  );
}
