"use client";

import { useState, useRef, useEffect, useCallback } from "react";

type IconProps = { size?: number };

const CATEGORIES = [
  {
    key: "bug",
    label: "Bug",
    Icon: ({ size = 16 }: IconProps) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="m8 2 1.88 1.88" /><path d="M14.12 3.88 16 2" />
        <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
        <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
        <path d="M12 20v-9" /><path d="M6.53 9C4.6 8.8 3 7.1 3 5" /><path d="M6 13H2" />
        <path d="M3 21c0-2.1 1.7-3.9 3.8-4" /><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
        <path d="M22 13h-4" /><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
      </svg>
    ),
  },
  {
    key: "idea",
    label: "Idea",
    Icon: ({ size = 16 }: IconProps) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" /><path d="M10 22h4" />
      </svg>
    ),
  },
  {
    key: "question",
    label: "Question",
    Icon: ({ size = 16 }: IconProps) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" />
      </svg>
    ),
  },
  {
    key: "other",
    label: "Other",
    Icon: ({ size = 16 }: IconProps) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </svg>
    ),
  },
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
  const remaining = MIN_LEN - message.trim().length;

  return (
    <div ref={wrapRef} style={{ fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @keyframes fbPopIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fbFadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fbBorderFlow {
          0%   { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes fbBubblePulse {
          0%   { box-shadow: 0 10px 30px rgba(139,92,246,0.5), 0 0 0 0 rgba(139,92,246,0.45); }
          70%  { box-shadow: 0 10px 30px rgba(139,92,246,0.5), 0 0 0 14px rgba(139,92,246,0); }
          100% { box-shadow: 0 10px 30px rgba(139,92,246,0.5), 0 0 0 0 rgba(139,92,246,0); }
        }
        @keyframes fbShine { to { left: 140%; } }
        @keyframes fbCheckPop {
          0%   { transform: scale(0.4); opacity: 0; }
          60%  { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); }
        }
        .fb-popover {
          position: fixed;
          bottom: 92px;
          right: 24px;
          width: 344px;
          max-width: calc(100vw - 24px);
          z-index: 2147483000;
          border-radius: 20px;
          padding: 1.5px;
          background: linear-gradient(120deg, rgba(139,92,246,0.9), rgba(167,139,250,0.25), rgba(139,92,246,0.9));
          background-size: 200% 200%;
          animation: fbPopIn 0.32s cubic-bezier(.22,1,.36,1) both, fbBorderFlow 6s linear infinite;
          box-shadow: 0 24px 70px rgba(0,0,0,0.65), 0 0 40px rgba(139,92,246,0.22);
        }
        .fb-inner {
          background: rgba(15,13,22,0.92);
          -webkit-backdrop-filter: blur(22px);
          backdrop-filter: blur(22px);
          border-radius: 18.5px;
          padding: 18px;
        }
        .fb-stagger > * { animation: fbFadeUp 0.4s cubic-bezier(.22,1,.36,1) both; }
        .fb-cat {
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
          padding: 10px 2px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 10.5px;
          font-weight: 600;
          font-family: Inter, sans-serif;
          transition: transform .18s cubic-bezier(.22,1,.36,1), background .18s ease, border-color .18s ease, color .18s ease, box-shadow .18s ease;
        }
        .fb-cat:hover { transform: translateY(-2px); }
        .fb-send {
          position: relative;
          overflow: hidden;
          width: 100%;
          margin-top: 14px;
          padding: 12px 0;
          border-radius: 12px;
          border: none;
          color: #fff;
          font-size: 13.5px;
          font-weight: 700;
          font-family: Inter, sans-serif;
          transition: filter .15s ease, transform .15s ease, box-shadow .2s ease;
        }
        .fb-send::before {
          content: "";
          position: absolute;
          top: 0; left: -60%;
          width: 45%; height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.4), transparent);
          transform: skewX(-20deg);
        }
        .fb-send.is-ready:hover { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 10px 26px rgba(139,92,246,0.5); }
        .fb-send.is-ready:hover::before { animation: fbShine .85s ease; }
        .fb-send.is-ready:active { transform: translateY(0); }
        @media (max-width: 480px) {
          .fb-popover { left: 12px; right: 12px; width: auto; max-width: none; bottom: 86px; }
        }
      `}</style>

      {/* Popover */}
      {open && (
        <div role="dialog" aria-label="Feedback" className="fb-popover">
          <div className="fb-inner">
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 16 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  background: "linear-gradient(135deg, #A78BFA, #7C3AED)",
                  boxShadow: "0 6px 16px rgba(139,92,246,0.45)",
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#F9FAFB", fontSize: 15, fontWeight: 700, lineHeight: 1.1 }}>Feedback</div>
                <div style={{ color: "#8B85A0", fontSize: 11.5, marginTop: 2 }}>Help us make TJTradeHub better</div>
              </div>
              <button
                type="button"
                onClick={closePopover}
                aria-label="Close feedback"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#9CA3AF",
                  cursor: "pointer",
                  display: "flex",
                  padding: 6,
                  borderRadius: 8,
                  lineHeight: 0,
                  transition: "color .15s ease, background .15s ease",
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = "#F9FAFB"; e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
                onMouseOut={(e) => { e.currentTarget.style.color = "#9CA3AF"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {sent ? (
              <div style={{ padding: "20px 4px 12px", textAlign: "center" }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    margin: "0 auto 14px",
                    background: "radial-gradient(circle at 30% 30%, rgba(34,197,94,0.28), rgba(34,197,94,0.1))",
                    border: "1px solid rgba(34,197,94,0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 28px rgba(34,197,94,0.35)",
                    animation: "fbCheckPop 0.5s cubic-bezier(.22,1.4,.36,1) both",
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p style={{ color: "#F9FAFB", fontSize: 15, fontWeight: 700, margin: "0 0 6px" }}>
                  Thanks for your feedback!
                </p>
                <p style={{ color: "#9CA3AF", fontSize: 12.5, margin: 0, lineHeight: 1.5 }}>
                  We&apos;ll look into it and reach out via email if needed.
                </p>
              </div>
            ) : (
              <div className="fb-stagger">
                {/* Category toggles */}
                <div style={{ display: "flex", gap: 7, marginBottom: 13, animationDelay: "0.04s" }}>
                  {CATEGORIES.map((c) => {
                    const active = category === c.key;
                    const { Icon } = c;
                    return (
                      <button
                        key={c.key}
                        type="button"
                        onClick={() => setCategory(c.key)}
                        className="fb-cat"
                        style={{
                          color: active ? "#fff" : "#9CA3AF",
                          background: active
                            ? "linear-gradient(135deg, rgba(167,139,250,0.28), rgba(124,58,237,0.22))"
                            : "rgba(255,255,255,0.035)",
                          border: `1px solid ${active ? "rgba(139,92,246,0.7)" : "rgba(255,255,255,0.07)"}`,
                          boxShadow: active ? "0 6px 18px rgba(139,92,246,0.28)" : "none",
                        }}
                      >
                        <Icon size={17} />
                        {c.label}
                      </button>
                    );
                  })}
                </div>

                {/* Message */}
                <div style={{ animationDelay: "0.08s" }}>
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
                      background: "rgba(255,255,255,0.045)",
                      border: "1px solid rgba(255,255,255,0.09)",
                      borderRadius: 12,
                      padding: "11px 13px",
                      color: "#F9FAFB",
                      fontSize: 13,
                      fontFamily: "Inter, sans-serif",
                      outline: "none",
                      boxSizing: "border-box",
                      lineHeight: 1.5,
                      transition: "border-color .15s ease, box-shadow .15s ease",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(139,92,246,0.6)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.14)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Live hint / error / counter row */}
                <div style={{ minHeight: 16, marginTop: 8, animationDelay: "0.1s" }}>
                  {error ? (
                    <p style={{ color: "#f87171", fontSize: 11.5, margin: 0 }}>{error}</p>
                  ) : message.trim().length > 0 && remaining > 0 ? (
                    <p style={{ color: "#8B85A0", fontSize: 11.5, margin: 0 }}>
                      {remaining} more character{remaining === 1 ? "" : "s"} needed…
                    </p>
                  ) : null}
                </div>

                {/* Submit — stays clickable so an invalid message always gets clear feedback
                    (a disabled button silently swallows the click → "nothing happens"). */}
                <button
                  type="button"
                  onClick={submit}
                  disabled={sending}
                  className={`fb-send${canSend ? " is-ready" : ""}`}
                  style={{
                    animationDelay: "0.13s",
                    cursor: sending ? "wait" : "pointer",
                    background: canSend
                      ? "linear-gradient(135deg, #A78BFA, #7C3AED)"
                      : "linear-gradient(135deg, rgba(167,139,250,0.5), rgba(124,58,237,0.5))",
                    boxShadow: canSend ? "0 8px 20px rgba(139,92,246,0.4)" : "none",
                  }}
                >
                  {sending ? "Sending…" : "Send Feedback"}
                </button>
              </div>
            )}
          </div>
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
          width: 54,
          height: 54,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #A78BFA, #7C3AED)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2147483001,
          animation: open ? "none" : "fbBubblePulse 2.6s ease-out infinite",
          boxShadow: "0 10px 30px rgba(139,92,246,0.5)",
          transition: "transform 0.2s cubic-bezier(.22,1,.36,1), filter 0.2s ease",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.filter = "brightness(1.12)";
          e.currentTarget.style.transform = "scale(1.08) rotate(-6deg)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.filter = "none";
          e.currentTarget.style.transform = "scale(1) rotate(0deg)";
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.3s ease", transform: open ? "rotate(90deg)" : "none" }}>
          {open ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          )}
        </svg>
      </button>
    </div>
  );
}
