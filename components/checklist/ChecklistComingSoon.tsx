export default function ChecklistComingSoon() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "32px" }}>
      {/* Main card */}
      <div
        style={{
          background: "rgba(139,92,246,0.06)",
          border: "1px solid rgba(139,92,246,0.25)",
          borderRadius: "20px",
          padding: "56px 48px",
          maxWidth: "560px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 0 60px rgba(139,92,246,0.08)",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "18px",
            background: "rgba(139,92,246,0.15)",
            border: "1px solid rgba(139,92,246,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 28px",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
        </div>

        {/* Badge */}
        <div style={{ marginBottom: "20px" }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#8B5CF6",
              background: "rgba(139,92,246,0.15)",
              border: "1px solid rgba(139,92,246,0.3)",
              borderRadius: 6,
              padding: "4px 12px",
              textTransform: "uppercase",
            }}
          >
            Coming Soon
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "#F9FAFB",
            marginBottom: "16px",
            fontFamily: "'Space Grotesk', sans-serif",
          }}
        >
          Trade Checklist
        </h1>

        {/* Description */}
        <p style={{ fontSize: "15px", color: "#9CA3AF", lineHeight: 1.7, marginBottom: "40px" }}>
          Your pre-trade, during-trade, and post-trade checklist — synced across all your devices.
          Build disciplined habits and never skip a step again.
        </p>

        {/* Feature pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center", marginBottom: "40px" }}>
          {["Before Trade", "During Trade", "After Trade", "Cloud Sync", "Custom Rules"].map((f) => (
            <span
              key={f}
              style={{
                fontSize: 12,
                color: "#6B7280",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                padding: "5px 12px",
              }}
            >
              {f}
            </span>
          ))}
        </div>

        {/* CTA hint */}
        <p style={{ fontSize: "13px", color: "#4B5563" }}>
          This feature is being rolled out shortly. Stay tuned.
        </p>
      </div>
    </div>
  );
}
