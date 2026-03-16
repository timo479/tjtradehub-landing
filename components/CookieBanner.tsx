"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie-consent")) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", bottom: "24px", left: "50%", transform: "translateX(-50%)",
      zIndex: 999, width: "calc(100% - 48px)", maxWidth: "720px",
      backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "16px",
      padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: "16px", flexWrap: "wrap", boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      <p style={{ color: "#9CA3AF", fontSize: "13px", flex: 1, minWidth: "200px" }}>
        We use cookies for essential functionality and authentication.
        Learn more in our{" "}
        <Link href="/privacy" style={{ color: "#8B5CF6", textDecoration: "underline" }}>Privacy Policy</Link>.
      </p>
      <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
        <button onClick={decline} style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid #1F2937",
          backgroundColor: "transparent", color: "#6B7280", cursor: "pointer", fontSize: "13px",
        }}>
          Decline
        </button>
        <button onClick={accept} style={{
          padding: "8px 20px", borderRadius: "10px", border: "none",
          backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600, cursor: "pointer", fontSize: "13px",
        }}>
          Accept
        </button>
      </div>
    </div>
  );
}
