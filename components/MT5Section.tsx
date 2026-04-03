export default function MT5Section() {
  const bullets = [
    {
      title: "No Manual Entry",
      desc: "Trades sync the moment you close a position. No copy-paste, no CSV, no forgetting to log something.",
    },
    {
      title: "Review, Don't Re-enter",
      desc: "Each imported trade lands in your inbox. Add your setup, emotions, and rule checks in seconds — then it's done.",
    },
    {
      title: "Full History, Zero Gaps",
      desc: "Import your entire trade history on day one. Start with real data, not an empty journal.",
    },
    {
      title: "Always Current",
      desc: "Your journal reflects your actual account. No lag, no missing trades, no excuses to skip reviewing.",
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
                MT4 / MT5 Integration
              </p>
              <h2
                className="text-3xl md:text-4xl font-bold leading-tight"
                style={{ color: "#F9FAFB" }}
              >
                Connect Once.{" "}
                <span style={{ color: "#8B5CF6" }}>Never Enter a Trade Manually Again.</span>
              </h2>
              <p
                className="mt-4 text-lg leading-relaxed"
                style={{ color: "#9CA3AF" }}
              >
                Link your MT4 or MT5 account and every trade lands in your journal automatically. All you do is review it — and decide if you followed your rules.
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
                    MetaTrader 4 / 5
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
                    Auto Sync
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

              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
