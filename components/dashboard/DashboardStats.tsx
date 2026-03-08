"use client";
import { useEffect, useState } from "react";
import WidgetGrid, { Entry } from "@/components/journal/v2/WidgetGrid";

export default function DashboardStats() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v2/entries")
      .then(r => r.ok ? r.json() : [])
      .then(data => setEntries(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "120px" }}>
        <p style={{ color: "#4B5563", fontSize: "13px" }}>Lade Statistiken...</p>
      </div>
    );
  }

  return <WidgetGrid entries={entries} />;
}
