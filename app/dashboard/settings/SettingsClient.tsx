"use client";

import { useState } from "react";

interface Props {
  initialNewsletterOptIn: boolean;
}

export default function SettingsClient({ initialNewsletterOptIn }: Props) {
  const [newsletterOptIn, setNewsletterOptIn] = useState(initialNewsletterOptIn);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");

  async function toggleNewsletter() {
    const next = !newsletterOptIn;
    setNewsletterOptIn(next);
    setSaving(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsletter_opt_in: next }),
      });
      if (!res.ok) {
        setNewsletterOptIn(!next);
        setStatus("error");
      } else {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
      }
    } catch {
      setNewsletterOptIn(!next);
      setStatus("error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        backgroundColor: "#0A0A0A",
        border: "1px solid #1F2937",
        borderRadius: "16px",
        padding: "24px",
      }}
    >
      <div style={{ marginBottom: "16px" }}>
        <h2 style={{ color: "#F9FAFB", fontSize: "16px", fontWeight: 600, margin: "0 0 4px" }}>
          Email preferences
        </h2>
        <p style={{ color: "#6B7280", fontSize: "13px", margin: 0 }}>
          Choose what we send to your inbox.
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "16px",
          padding: "16px",
          borderRadius: "12px",
          backgroundColor: "#000",
          border: "1px solid #1F2937",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ color: "#F9FAFB", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
            Weekly newsletter
          </div>
          <div style={{ color: "#9CA3AF", fontSize: "13px", lineHeight: 1.5 }}>
            Market recap, community stats &amp; product updates. Sent every Monday. Unsubscribe anytime.
          </div>
          {status === "saved" && (
            <div style={{ color: "#22c55e", fontSize: "12px", marginTop: "8px" }}>✓ Saved</div>
          )}
          {status === "error" && (
            <div style={{ color: "#ef4444", fontSize: "12px", marginTop: "8px" }}>
              Failed to save. Please try again.
            </div>
          )}
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={newsletterOptIn}
          disabled={saving}
          onClick={toggleNewsletter}
          style={{
            position: "relative",
            width: "44px",
            height: "24px",
            borderRadius: "999px",
            border: "none",
            backgroundColor: newsletterOptIn ? "#8B5CF6" : "#374151",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
            transition: "background-color 0.2s",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: "absolute",
              top: "2px",
              left: newsletterOptIn ? "22px" : "2px",
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "#fff",
              transition: "left 0.2s",
            }}
          />
        </button>
      </div>
    </div>
  );
}
