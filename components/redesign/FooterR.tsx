import Link from "next/link";

export default function FooterR() {
  return (
    <footer
      style={{
        backgroundColor: "#000",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "48px 0 32px",
      }}
    >
      <div
        className="mx-auto px-6"
        style={{ maxWidth: 1200, display: "grid", gap: 28 }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/redesign" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
            <span style={{ color: "#F4F4F5", fontWeight: 600, fontSize: 15 }}>
              TJ TradeHub
            </span>
          </Link>
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <Link href="/privacy" style={{ color: "#71717a", textDecoration: "none" }} className="hover:text-white transition">Privacy</Link>
            <Link href="/terms" style={{ color: "#71717a", textDecoration: "none" }} className="hover:text-white transition">Terms</Link>
            <Link href="/impressum" style={{ color: "#71717a", textDecoration: "none" }} className="hover:text-white transition">Legal</Link>
            <a href="mailto:support@tjtradehub.com" style={{ color: "#71717a", textDecoration: "none" }} className="hover:text-white transition">Contact</a>
          </div>
        </div>
        <div
          className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <span style={{ color: "#3f3f46", fontSize: 11, fontWeight: 500 }}>
            Guides:
          </span>
          {[
            ["Trading Journal", "/trading-journal"],
            ["Forex Journal", "/forex-trading-journal"],
            ["Futures Journal", "/futures-trading-journal"],
            ["MT5 Journal", "/mt5-trading-journal"],
            ["What is a Journal", "/what-is-a-trading-journal"],
            ["How to use", "/how-to-use-a-trading-journal"],
            ["Performance Tracking", "/trading-performance-tracking"],
          ].map(([label, href]) => (
            <Link
              key={href}
              href={href}
              style={{ color: "#52525b", fontSize: 11.5, textDecoration: "none" }}
              className="hover:text-zinc-300 transition"
            >
              {label}
            </Link>
          ))}
        </div>
        <p style={{ color: "#3f3f46", fontSize: 11.5 }}>
          © 2026 TJ TradeHub. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
