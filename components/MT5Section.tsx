import ScrollReveal from "@/components/ScrollReveal";

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
      className="relative overflow-hidden py-16 md:py-[120px]"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Background photo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/mt5-bg-2560.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center right",
          zIndex: 0,
        }}
      />
      {/* Dark overlay — keeps text readable, lets the screens glow through */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.78) 45%, rgba(0,0,0,0.64) 100%)",
          zIndex: 0,
        }}
      />

      <div
        className="relative mx-auto px-6"
        style={{ maxWidth: "1200px", zIndex: 1 }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Left: Text */}
          <div className="flex flex-col gap-8">
            <ScrollReveal>
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
                <span style={{ background: "linear-gradient(100deg, #8B5CF6, #C4B5FD 50%, #8B5CF6)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>Never Enter a Trade Manually Again.</span>
              </h2>
              <p
                className="mt-4 text-lg leading-relaxed"
                style={{ color: "#9CA3AF" }}
              >
                Link your MT4 or MT5 account and every trade lands in your journal automatically. All you do is review it — and decide if you followed your rules.
              </p>
            </div>
            </ScrollReveal>

            <ul className="flex flex-col gap-6">
              {bullets.map((b, i) => (
                <ScrollReveal key={i} delay={i * 80}>
                <li className="flex gap-4">
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
                </ScrollReveal>
              ))}
            </ul>
          </div>

          {/* Right: Live Sync Mockup */}
          <div className="flex items-center justify-center">
            <div className="relative w-full" style={{ maxWidth: "440px" }}>
              {/* Ambient glow */}
              <div
                className="absolute pointer-events-none"
                style={{
                  inset: "-30px",
                  background: "radial-gradient(ellipse at center, rgba(139,92,246,0.18) 0%, transparent 65%)",
                  filter: "blur(40px)",
                  zIndex: 0,
                }}
              />

              {/* MT5 Source Card */}
              <ScrollReveal>
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "#0a0a14",
                  border: "1px solid #1F2937",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
                }}
              >
                {/* MT5 header */}
                <div
                  className="flex items-center gap-2.5 px-4 py-3"
                  style={{ borderBottom: "1px solid #1a1a2e", backgroundColor: "#050507" }}
                >
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #1e40af, #0369a1)" }}
                  >
                    <span style={{ color: "#FFFFFF", fontSize: "10px", fontWeight: 800, letterSpacing: "-0.02em" }}>MT5</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: "#F9FAFB" }}>MetaTrader 5</p>
                    <p className="text-[10px]" style={{ color: "#6B7280" }}>Account · 8047113</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full" style={{ backgroundColor: "rgba(34,197,94,0.12)" }}>
                    <span className="w-1.5 h-1.5 rounded-full mt5-pulse" style={{ backgroundColor: "#22c55e" }} />
                    <span className="text-[10px] font-semibold" style={{ color: "#22c55e" }}>LIVE</span>
                  </div>
                </div>

                {/* Trade event */}
                <div className="px-4 py-3.5">
                  <p className="text-[10px] font-medium mb-1.5" style={{ color: "#6B7280" }}>POSITION CLOSED · 14:32:08</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#F9FAFB" }}>EURUSD</p>
                      <p className="text-[11px]" style={{ color: "#9CA3AF" }}>BUY · 0.50 lots</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: "#22c55e" }}>+$84.20</p>
                      <p className="text-[11px]" style={{ color: "#22c55e" }}>+0.42%</p>
                    </div>
                  </div>
                </div>
              </div>
              </ScrollReveal>

              {/* Sync Indicator */}
              <ScrollReveal delay={250}>
              <div className="relative flex items-center justify-center py-3">
                {/* Animated dots line */}
                <div className="flex flex-col items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full mt5-dot mt5-dot-1" style={{ backgroundColor: "#8B5CF6" }} />
                  <span className="w-1.5 h-1.5 rounded-full mt5-dot mt5-dot-2" style={{ backgroundColor: "#8B5CF6" }} />
                  <span className="w-1.5 h-1.5 rounded-full mt5-dot mt5-dot-3" style={{ backgroundColor: "#8B5CF6" }} />
                </div>
                <div
                  className="absolute left-1/2 -translate-x-1/2 px-3 py-1 rounded-full"
                  style={{
                    left: "calc(50% + 24px)",
                    backgroundColor: "rgba(139,92,246,0.12)",
                    border: "1px solid rgba(139,92,246,0.3)",
                  }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#A78BFA", letterSpacing: "0.08em" }}>
                    syncing
                  </span>
                </div>
              </div>
              </ScrollReveal>

              {/* TJ TradeHub Result Card */}
              <ScrollReveal delay={500}>
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: "#0a0a14",
                  border: "1px solid rgba(139,92,246,0.3)",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.5), 0 0 40px rgba(139,92,246,0.1)",
                }}
              >
                {/* TJ header */}
                <div
                  className="flex items-center gap-2.5 px-4 py-3"
                  style={{ borderBottom: "1px solid rgba(139,92,246,0.15)", background: "linear-gradient(90deg, rgba(139,92,246,0.08), transparent)" }}
                >
                  <div
                    className="flex items-center justify-center w-7 h-7 rounded-md flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #8B5CF6, #A855F7)" }}
                  >
                    <span style={{ color: "#FFFFFF", fontSize: "11px", fontWeight: 800 }}>TJ</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: "#F9FAFB" }}>TJ TradeHub</p>
                    <p className="text-[10px]" style={{ color: "#A78BFA" }}>Trade logged automatically</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L20 7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Trade entry preview */}
                <div className="px-4 py-3.5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#F9FAFB" }}>EURUSD <span style={{ color: "#22c55e", fontSize: "10px", marginLeft: "6px" }}>LONG</span></p>
                      <p className="text-[11px]" style={{ color: "#9CA3AF" }}>Setup: <span style={{ color: "#C4B5FD" }}>Breakout</span></p>
                    </div>
                    <p className="text-sm font-bold" style={{ color: "#22c55e" }}>+$84.20</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2" style={{ borderTop: "1px solid #1F2937" }}>
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-md" style={{ backgroundColor: "rgba(34,197,94,0.1)" }}>
                      <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span className="text-[10px] font-semibold" style={{ color: "#22c55e" }}>Rules 4/4</span>
                    </div>
                    <span className="text-[10px]" style={{ color: "#6B7280" }}>Discipline: 87 · Awaiting review</span>
                  </div>
                </div>
              </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
