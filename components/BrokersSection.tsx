export default function BrokersSection() {
  const brokers = [
    "IC Markets",
    "Pepperstone",
    "OANDA",
    "FTMO",
    "Exness",
    "FBS",
    "Tickmill",
    "FundedNext",
    "The5%ers",
    "MyForexFunds",
    "Vantage",
    "XM",
    "Admiral Markets",
    "FP Markets",
    "Eightcap",
    "ThinkMarkets",
    "RoboForex",
    "HF Markets",
  ];

  // Split into two rows for opposing marquees
  const rowOne = brokers.slice(0, 9);
  const rowTwo = brokers.slice(9);

  const Chip = ({ name }: { name: string }) => (
    <span
      className="text-sm font-medium px-5 py-2.5 rounded-full whitespace-nowrap transition-colors duration-200"
      style={{
        backgroundColor: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(139,92,246,0.18)",
        color: "#E5E7EB",
      }}
    >
      {name}
    </span>
  );

  return (
    <section
      className="relative py-16 md:py-[120px] overflow-hidden"
      style={{ backgroundColor: "#000000" }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        className="absolute pointer-events-none brokers-glow"
        style={{
          inset: "-200px 0",
          background:
            "radial-gradient(ellipse 800px 400px at 50% 50%, rgba(139,92,246,0.18) 0%, transparent 70%)",
          filter: "blur(40px)",
          zIndex: 0,
        }}
      />

      <div className="relative mx-auto px-6" style={{ maxWidth: "1100px", zIndex: 1 }}>
        {/* Heading block */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-3 mb-5">
            <span
              className="h-px w-8"
              style={{ backgroundColor: "rgba(139,92,246,0.4)" }}
            />
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#8B5CF6", letterSpacing: "0.18em" }}
            >
              Broker Compatibility
            </p>
            <span
              className="h-px w-8"
              style={{ backgroundColor: "rgba(139,92,246,0.4)" }}
            />
          </div>
          <h2
            className="text-3xl md:text-5xl font-bold leading-tight mb-5"
            style={{ color: "#F9FAFB", letterSpacing: "-0.02em" }}
          >
            Works with{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, #C4B5FD 0%, #8B5CF6 50%, #A855F7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              500+ brokers
            </span>{" "}
            worldwide.
          </h2>
          <p
            className="text-base md:text-lg leading-relaxed"
            style={{ color: "#9CA3AF", maxWidth: "620px", margin: "0 auto" }}
          >
            If your broker supports MetaTrader 4 or MetaTrader 5, you&apos;re
            ready to connect — no plugins, no exports, no extra setup.
          </p>
        </div>

        {/* MT4 / MT5 premium cards */}
        <div className="flex items-center justify-center gap-4 md:gap-6 mb-14">
          {[
            { label: "MT4", title: "MetaTrader 4" },
            { label: "MT5", title: "MetaTrader 5" },
          ].map((m) => (
            <div
              key={m.label}
              className="relative flex items-center gap-3.5 px-5 py-3.5 rounded-2xl"
              style={{
                background:
                  "linear-gradient(180deg, rgba(20,20,30,0.9) 0%, rgba(10,10,20,0.9) 100%)",
                border: "1px solid rgba(139,92,246,0.22)",
                boxShadow:
                  "0 10px 30px rgba(0,0,0,0.5), 0 0 30px rgba(139,92,246,0.08)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #1e40af, #0369a1)",
                  boxShadow: "0 4px 12px rgba(59,130,246,0.25)",
                }}
              >
                <span
                  style={{
                    color: "#FFFFFF",
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {m.label}
                </span>
              </div>
              <div className="text-left">
                <p
                  className="text-sm font-semibold leading-tight"
                  style={{ color: "#F9FAFB" }}
                >
                  {m.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full mt5-pulse"
                    style={{ backgroundColor: "#22c55e" }}
                  />
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "#22c55e", letterSpacing: "0.1em" }}
                  >
                    Supported
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Marquee broker chips */}
        <div
          className="relative brokers-marquee"
          style={{
            maskImage:
              "linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent 0%, #000 8%, #000 92%, transparent 100%)",
          }}
        >
          {/* Row 1 */}
          <div className="flex overflow-hidden mb-3">
            <div className="flex gap-3 brokers-track shrink-0 pr-3">
              {[...rowOne, ...rowOne].map((name, i) => (
                <Chip key={`r1-${i}`} name={name} />
              ))}
            </div>
          </div>
          {/* Row 2 - reverse direction */}
          <div className="flex overflow-hidden">
            <div className="flex gap-3 brokers-track-reverse shrink-0 pr-3">
              {[...rowTwo, ...rowTwo].map((name, i) => (
                <Chip key={`r2-${i}`} name={name} />
              ))}
            </div>
          </div>
        </div>

        {/* Plus badge */}
        <div className="flex justify-center mt-8 mb-10">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              backgroundColor: "rgba(139,92,246,0.08)",
              border: "1px solid rgba(139,92,246,0.25)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 5v14M5 12h14"
                stroke="#A78BFA"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span
              className="text-sm font-semibold"
              style={{ color: "#C4B5FD" }}
            >
              and 500+ more brokers
            </span>
          </div>
        </div>

        {/* Disclaimer */}
        <p
          className="text-xs leading-relaxed text-center"
          style={{ color: "#6B7280", maxWidth: "560px", margin: "0 auto" }}
        >
          TJ TradeHub is an independent trading journal and is not affiliated
          with, endorsed by, or sponsored by any of the brokers listed above.
          All trademarks are property of their respective owners.
        </p>
      </div>
    </section>
  );
}
