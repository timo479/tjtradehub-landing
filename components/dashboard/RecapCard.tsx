import Link from "next/link";

/**
 * Weekly retrospective recap — shown to Basic users after a losing week.
 * Hits peak upgrade motivation right after the pain. Numbers are computed
 * server-side in app/dashboard/page.tsx from the user's own trades.
 */
export default function RecapCard({ nTrades, nLosses, sumLosses, nFlagged }: {
  nTrades: number; nLosses: number; sumLosses: number; nFlagged: number;
}) {
  const money = `$${Math.round(sumLosses).toLocaleString("en-US")}`;
  return (
    <div
      className="rounded-2xl p-5 mb-6"
      style={{
        background: "linear-gradient(120deg, rgba(239,68,68,0.16) 0%, rgba(180,40,40,0.10) 55%, rgba(0,0,0,0) 100%)",
        border: "1px solid rgba(239,68,68,0.32)",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", minWidth: 0 }}>
        <div style={{ width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(239,68,68,0.18)", border: "1px solid rgba(239,68,68,0.35)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 18l-9.5-9.5-5 5L1 6" /><polyline points="17 18 23 18 23 12" /></svg>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: "#F87171", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
            Last week · {nTrades} trade{nTrades !== 1 ? "s" : ""}
          </div>
          <div style={{ color: "#F9FAFB", fontSize: "16px", fontWeight: 700, lineHeight: 1.35 }}>
            You took {nLosses} losing trade{nLosses !== 1 ? "s" : ""} <span style={{ color: "#F87171" }}>(−{money})</span>.
          </div>
          <div style={{ color: "#9CA3AF", fontSize: "13px", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            {nFlagged > 0
              ? <>Pro flagged <strong style={{ color: "#E5E7EB" }}>{nFlagged}</strong> of them as avoidable — rule breaks &amp; tilt.</>
              : <>Pro shows you exactly what went wrong.</>}
          </div>
        </div>
      </div>
      <Link href="/billing" style={{ textDecoration: "none", flexShrink: 0 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "10px 18px", borderRadius: "10px", background: "linear-gradient(135deg, #8B5CF6, #7C3AED)", color: "#fff", fontSize: "14px", fontWeight: 700, boxShadow: "0 6px 20px rgba(139,92,246,0.3)" }}>
          See which trades →
        </span>
      </Link>
    </div>
  );
}
