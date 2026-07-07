"use client";

import { useState, useRef, useEffect, useCallback } from "react";

const CATEGORIES = [
  { key: "bug", label: "Bug", emoji: "🐛" },
  { key: "idea", label: "Idea", emoji: "💡" },
  { key: "question", label: "Question", emoji: "❓" },
  { key: "other", label: "Other", emoji: "💬" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

const VIOLET = "#8B5CF6";
const MIN_LEN = 10;

export default function FeedbackBubble() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<CategoryKey>("bug");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetForm = useCallback(() => {
    setCategory("bug");
    setMessage("");
    setError(null);
    setSent(false);
    setSending(false);
  }, []);

  const closePopover = useCallback(() => {
    setOpen(false);
    // Reset only when not showing the success state (so a fresh open starts clean).
    if (!sent) setError(null);
  }, [sent]);

  // Close on click outside — the bubble itself stays visible.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) closePopover();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePopover();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, closePopover]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const toggle = () => {
    if (open) {
      closePopover();
    } else {
      // Fresh form each time it opens (unless the success state is showing briefly).
      if (!sent) resetForm();
      setOpen(true);
    }
  };

  const submit = async () => {
    const trimmed = message.trim();
    if (trimmed.length < MIN_LEN) {
      setError(`Please enter at least ${MIN_LEN} characters.`);
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          category,
          page_url:
            typeof window !== "undefined"
              ? window.location.pathname + window.location.search
              : "",
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Something went wrong. Please try again.");
        setSending(false);
        return;
      }
      setSent(true);
      setSending(false);
      // Auto-close after 4s, then reset so the next open is fresh.
      closeTimer.current = setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 4000);
    } catch {
      setError("Network error. Please try again.");
      setSending(false);
    }
  };

  const canSend = message.trim().length >= MIN_LEN && !sending;

  return (
    <div ref={wrapRef} style={{ fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @keyframes fbPopIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .fb-popover {
          position: fixed;
          bottom: 88px;
          right: 24px;
          width: 320px;
          max-width: calc(100vw - 24px);
          z-index: 2147483000;
        }
        @media (max-width: 480px) {
          .fb-popover { left: 12px; right: 12px; width: auto; max-width: none; bottom: 84px; }
        }
      `}</style>

      {/* Popover */}
      {open && (
        <div
          role="dialog"
          aria-label="Feedback"
          className="fb-popover"
          style={{
            background: "#12101a",
            border: "1px solid rgba(139,92,246,0.28)",
            borderRadius: 16,
            boxShadow: "0 18px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,0,0,0.4)",
            padding: 18,
            animation: "fbPopIn 0.22s cubic-bezier(.22,1,.36,1) both",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ color: "#F9FAFB", fontSize: 15, fontWeight: 700 }}>Feedback</span>
            <button
              type="button"
              onClick={closePopover}
              aria-label="Close feedback"
              style={{
                background: "transparent",
                border: "none",
                color: "#6B7280",
                cursor: "pointer",
                display: "flex",
                padding: 4,
                borderRadius: 6,
                lineHeight: 0,
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#F9FAFB")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#6B7280")}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {sent ? (
            <div style={{ padding: "14px 4px 8px", textAlign: "center" }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  margin: "0 auto 12px",
                  background: "rgba(34,197,94,0.14)",
                  border: "1px solid rgba(34,197,94,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p style={{ color: "#F9FAFB", fontSize: 14, fontWeight: 600, margin: "0 0 6px" }}>
                Thanks for your feedback!
              </p>
              <p style={{ color: "#9CA3AF", fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>
                We&apos;ll look into it and reach out via email if needed.
              </p>
            </div>
          ) : (
            <>
              {/* Category toggles */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {CATEGORIES.map((c) => {
                  const active = category === c.key;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setCategory(c.key)}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 3,
                        padding: "8px 2px",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 10.5,
                        fontWeight: 600,
                        color: active ? "#fff" : "#9CA3AF",
                        background: active ? "rgba(139,92,246,0.18)" : "rgba(255,255,255,0.03)",
                        border: `1px solid ${active ? "rgba(139,92,246,0.6)" : "rgba(255,255,255,0.07)"}`,
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: 15, lineHeight: 1 }}>{c.emoji}</span>
                      {c.label}
                    </button>
                  );
                })}
              </div>

              {/* Message */}
              <textarea
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="What's on your mind?"
                rows={4}
                maxLength={2000}
                style={{
                  width: "100%",
                  resize: "none",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.09)",
                  borderRadius: 10,
                  padding: "10px 12px",
                  color: "#F9FAFB",
                  fontSize: 13,
                  fontFamily: "Inter, sans-serif",
                  outline: "none",
                  boxSizing: "border-box",
                  lineHeight: 1.5,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(139,92,246,0.5)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
              />

              {/* Live hint: how many more characters are needed. */}
              {!error && message.trim().length > 0 && message.trim().length < MIN_LEN && (
                <p style={{ color: "#9CA3AF", fontSize: 11.5, margin: "8px 0 0" }}>
                  {MIN_LEN - message.trim().length} more character
                  {MIN_LEN - message.trim().length === 1 ? "" : "s"} needed…
                </p>
              )}

              {error && (
                <p style={{ color: "#f87171", fontSize: 11.5, margin: "8px 0 0" }}>{error}</p>
              )}

              {/* Submit — stays clickable so an invalid message always gets clear feedback
                  (a disabled button silently swallows the click → "nothing happens"). */}
              <button
                type="button"
                onClick={submit}
                disabled={sending}
                style={{
                  width: "100%",
                  marginTop: 12,
                  padding: "11px 0",
                  borderRadius: 10,
                  border: "none",
                  background: canSend ? VIOLET : "rgba(139,92,246,0.55)",
                  color: "#fff",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: sending ? "wait" : "pointer",
                  fontFamily: "Inter, sans-serif",
                  transition: "background 0.15s ease, filter 0.15s ease",
                }}
                onMouseOver={(e) => { if (!sending) e.currentTarget.style.filter = "brightness(1.1)"; }}
                onMouseOut={(e) => (e.currentTarget.style.filter = "none")}
              >
                {sending ? "Sending…" : "Send Feedback"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Floating bubble */}
      <button
        type="button"
        onClick={toggle}
        aria-label="Give feedback"
        aria-expanded={open}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: VIOLET,
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 24px rgba(139,92,246,0.45)",
          zIndex: 2147483001,
          transition: "transform 0.18s ease, filter 0.18s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.filter = "brightness(1.12)";
          e.currentTarget.style.transform = "scale(1.06)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.filter = "none";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      </button>
    </div>
  );
}
