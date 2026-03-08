export default function MT5Section() {
  const bullets = [
    {
      title: "Zero Manual Entry",
      desc: "Every trade from your MT5 account syncs automatically — no copy-paste, no CSV imports.",
    },
    {
      title: "Real-Time Sync",
      desc: "Trades appear in your journal within seconds of execution, so your data is always current.",
    },
    {
      title: "Full Trade History",
      desc: "Access your complete trading history from day one, enriched with execution metadata.",
    },
    {
      title: "Multi-Account Support",
      desc: "Connect multiple MT5 accounts and track them unified in one dashboard.",
    },
  ];

  return (
    <section
      id="features"
      className="py-16 md:py-[120px]"
      style={{ backgroundColor: "#111827" }}
    >
      <div
        className="mx-auto px-6"
        style={{ maxWidth: "1200px" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div className="flex flex-col gap-8">
            <div>
              <p
                className="text-sm font-semibold uppercase tracking-widest mb-4"
                style={{ color: "#8B5CF6" }}
              >
                MT5 Integration
              </p>
              <h2
                className="text-3xl md:text-4xl font-bold leading-tight"
                style={{ color: "#F9FAFB" }}
              >
                Fully Automated MT5 Trade Sync.
              </h2>
              <p
                className="mt-4 text-lg leading-relaxed"
                style={{ color: "#9CA3AF" }}
              >
                Connect your MetaTrader 5 account once. TJ TradeHub handles the
                rest — automatically pulling every trade into your journal with
                full execution detail.
              </p>
            </div>

            <ul className="flex flex-col gap-6">
              {bullets.map((b, i) => (
                <li key={i} className="flex gap-4">
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                    style={{ backgroundColor: "rgba(139, 92, 246, 0.15)" }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                    >
                      <path
                        d="M2 6L5 9L10 3"
                        stroke="#8B5CF6"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <p
                      className="font-semibold text-sm mb-1"
                      style={{ color: "#F9FAFB" }}
                    >
                      {b.title}
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>
                      {b.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Sync Diagram (CSS) */}
          <div className="flex items-center justify-center">
            <div
              className="relative w-full"
              style={{ maxWidth: "420px" }}
            >
              {/* Diagram Card */}
              <div
                className="rounded-2xl p-8"
                style={{
                  backgroundColor: "#000000",
                  border: "1px solid #1F2937",
                }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-6 text-center"
                  style={{ color: "#9CA3AF" }}
                >
                  How Sync Works
                </p>

                {/* MT5 Box */}
                <div
                  className="rounded-xl p-4 mb-4 text-center"
                  style={{
                    backgroundColor: "#111827",
                    border: "1px solid #1F2937",
                  }}
                >
                  <p className="text-xs font-medium mb-1" style={{ color: "#9CA3AF" }}>
                    MetaTrader 5
                  </p>
                  <p className="font-semibold text-sm" style={{ color: "#F9FAFB" }}>
                    Trade Executed
                  </p>
                </div>

                {/* Arrow */}
                <div className="flex flex-col items-center gap-1 my-2">
                  <div
                    className="w-px h-6"
                    style={{ backgroundColor: "#8B5CF6" }}
                  />
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="#8B5CF6"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-xs font-medium" style={{ color: "#8B5CF6" }}>
                    Instant Sync
                  </p>
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                    <path
                      d="M1 1L5 5L9 1"
                      stroke="#8B5CF6"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div
                    className="w-px h-6"
                    style={{ backgroundColor: "#8B5CF6" }}
                  />
                </div>

                {/* TJ TradeHub Box */}
                <div
                  className="rounded-xl p-4 text-center"
                  style={{
                    backgroundColor: "rgba(139, 92, 246, 0.1)",
                    border: "1px solid rgba(139, 92, 246, 0.3)",
                  }}
                >
                  <p className="text-xs font-medium mb-1" style={{ color: "#8B5CF6" }}>
                    TJ TradeHub
                  </p>
                  <p className="font-semibold text-sm" style={{ color: "#F9FAFB" }}>
                    Logged &amp; Analyzed
                  </p>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[
                    { label: "Latency", value: "&lt;3s" },
                    { label: "Uptime", value: "99.9%" },
                    { label: "Accounts", value: "Multi" },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="rounded-lg p-3 text-center"
                      style={{
                        backgroundColor: "#111827",
                        border: "1px solid #1F2937",
                      }}
                    >
                      <p
                        className="font-bold text-sm"
                        style={{ color: "#F9FAFB" }}
                        dangerouslySetInnerHTML={{ __html: s.value }}
                      />
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: "#9CA3AF" }}
                      >
                        {s.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
