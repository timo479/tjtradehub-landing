"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import WidgetGrid, { Entry } from "@/components/journal/v2/WidgetGrid";

export default function DashboardStats() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [upgradeRequired, setUpgradeRequired] = useState(false);

  useEffect(() => {
    fetch("/api/v2/entries")
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => setEntries(Array.isArray(data) ? data : []))
      .catch((r) => {
        if (r instanceof Response && r.status === 403) setUpgradeRequired(true);
        setEntries([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "120px" }}>
        <p style={{ color: "#4B5563", fontSize: "13px" }}>Loading statistics...</p>
      </div>
    );
  }

  if (upgradeRequired) {
    return (
      <div style={{ backgroundColor: "#111827", border: "1px solid #1F2937", borderRadius: "16px", padding: "32px 24px", textAlign: "center" }}>
        <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "16px" }}>
          Statistics are available on the Pro plan.
        </p>
        <Link href="/billing" style={{ display: "inline-block", padding: "10px 24px", borderRadius: "10px", backgroundColor: "#8B5CF6", color: "#F9FAFB", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}>
          Upgrade to Pro →
        </Link>
      </div>
    );
  }

  return <WidgetGrid entries={entries} />;
}
