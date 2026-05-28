"use client";

import { useState } from "react";

interface Props {
  token: string | null;
}

export default function UnsubscribeClient({ token }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleUnsubscribe() {
    if (!token) return;
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/unsubscribe?t=${encodeURIComponent(token)}`, { method: "POST" });
      if (res.ok) {
        setState("done");
      } else {
        const data = await res.json().catch(() => ({}));
        setState("error");
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
      }
    } catch {
      setState("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  if (!token) {
    return (
      <div style={{ textAlign: "center" }}>
        <h1 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, margin: "0 0 10px" }}>
          Invalid link
        </h1>
        <p style={{ color: "#9CA3AF", fontSize: "14px", lineHeight: 1.6, margin: 0 }}>
          This unsubscribe link is missing or malformed. Please use the link from one of our emails.
        </p>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            backgroundColor: "rgba(34, 197, 94, 0.12)",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            marginBottom: "20px",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, margin: "0 0 8px" }}>
          You&apos;re unsubscribed
        </h1>
        <p style={{ color: "#9CA3AF", fontSize: "14px", lineHeight: 1.6, margin: "0 0 24px" }}>
          You won&apos;t receive the weekly newsletter anymore. You can re-subscribe anytime from your account settings.
        </p>
        <a
          href="/dashboard/settings"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "1px solid #374151",
            color: "#9CA3AF",
            fontSize: "13px",
            textDecoration: "none",
          }}
        >
          Email preferences
        </a>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center" }}>
      <h1 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, margin: "0 0 10px" }}>
        Unsubscribe from the newsletter?
      </h1>
      <p style={{ color: "#9CA3AF", fontSize: "14px", lineHeight: 1.6, margin: "0 0 28px" }}>
        You&apos;ll stop receiving the weekly recap. Your TJ TradeHub account stays active.
      </p>

      {state === "error" && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "8px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            color: "#ef4444",
            fontSize: "13px",
            marginBottom: "16px",
          }}
        >
          {errorMsg}
        </div>
      )}

      <button
        type="button"
        onClick={handleUnsubscribe}
        disabled={state === "loading"}
        style={{
          width: "100%",
          padding: "12px 20px",
          borderRadius: "10px",
          border: "none",
          backgroundColor: state === "loading" ? "#6D4FCF" : "#A78BFA",
          color: "#fff",
          fontSize: "14px",
          fontWeight: 600,
          cursor: state === "loading" ? "not-allowed" : "pointer",
          marginBottom: "10px",
        }}
      >
        {state === "loading" ? "Unsubscribing…" : "Yes, unsubscribe"}
      </button>

      <a
        href="https://www.tjtradehub.com"
        style={{
          display: "block",
          padding: "12px 20px",
          color: "#6B7280",
          fontSize: "13px",
          textDecoration: "none",
        }}
      >
        Cancel
      </a>
    </div>
  );
}
