"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";

export default function UserMenu({ name, email }: { name?: string | null; email?: string | null }) {
  const [open, setOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowConfirm(false);
        setConfirmText("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleDelete() {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    await fetch("/api/account", { method: "DELETE" });
    await signOut({ callbackUrl: "/" });
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => { setOpen(!open); setShowConfirm(false); setConfirmText(""); }}
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: "none", border: "1px solid #1F2937",
          borderRadius: "8px", padding: "6px 12px", cursor: "pointer",
          color: "#9CA3AF", fontSize: "14px", transition: "border-color 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "#8B5CF6")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "#1F2937")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="4" stroke="#9CA3AF" strokeWidth="2"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        {name}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.5 }}>
          <path d="M6 9l6 6 6-6" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 8px)",
          backgroundColor: "#111827", border: "1px solid #1F2937",
          borderRadius: "12px", minWidth: "220px", zIndex: 50,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}>
          {/* User info */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #1F2937" }}>
            <p style={{ color: "#F9FAFB", fontSize: "14px", fontWeight: 600, margin: 0 }}>{name}</p>
            {email && <p style={{ color: "#6B7280", fontSize: "12px", margin: "2px 0 0" }}>{email}</p>}
          </div>

          {!showConfirm ? (
            <>
              {/* Sign Out */}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                style={{
                  width: "100%", padding: "11px 16px", textAlign: "left",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#9CA3AF", fontSize: "14px", display: "flex",
                  alignItems: "center", gap: "10px",
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#1F2937")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"
                    stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Sign Out
              </button>

              {/* Divider */}
              <div style={{ height: "1px", backgroundColor: "#1F2937", margin: "0 16px" }} />

              {/* Delete Account */}
              <button
                onClick={() => setShowConfirm(true)}
                style={{
                  width: "100%", padding: "11px 16px", textAlign: "left",
                  background: "none", border: "none", cursor: "pointer",
                  color: "#ef4444", fontSize: "14px", display: "flex",
                  alignItems: "center", gap: "10px",
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <polyline points="3 6 5 6 21 6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"
                    stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Delete Account
              </button>
            </>
          ) : (
            <div style={{ padding: "16px" }}>
              <p style={{ color: "#F9FAFB", fontSize: "13px", fontWeight: 600, margin: "0 0 4px" }}>
                Delete your account?
              </p>
              <p style={{ color: "#6B7280", fontSize: "12px", margin: "0 0 12px", lineHeight: 1.5 }}>
                This permanently deletes all your data. Type <strong style={{ color: "#ef4444" }}>DELETE</strong> to confirm.
              </p>
              <input
                type="text"
                placeholder="DELETE"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                style={{
                  width: "100%", padding: "8px 10px", borderRadius: "8px",
                  backgroundColor: "#000", border: "1px solid #374151",
                  color: "#F9FAFB", fontSize: "13px", outline: "none",
                  boxSizing: "border-box", marginBottom: "10px",
                }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => { setShowConfirm(false); setConfirmText(""); }}
                  style={{
                    flex: 1, padding: "8px", borderRadius: "8px",
                    backgroundColor: "#1F2937", border: "none",
                    color: "#9CA3AF", fontSize: "13px", cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== "DELETE" || deleting}
                  style={{
                    flex: 1, padding: "8px", borderRadius: "8px",
                    backgroundColor: confirmText === "DELETE" ? "#ef4444" : "#374151",
                    border: "none", color: "#fff", fontSize: "13px",
                    cursor: confirmText === "DELETE" ? "pointer" : "not-allowed",
                    opacity: deleting ? 0.6 : 1,
                  }}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
