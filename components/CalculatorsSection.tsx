import Image from "next/image";

const TOOLS = [
  {
    id: "risk",
    badge: "Position Size · Risk · R:R",
    title: "Risk Calculator",
    description:
      "Enter your balance, risk percentage, instrument and stop loss — get your exact lot size, risk amount, potential profit and margin requirement instantly. Supports all MT5 symbols.",
    bullets: [
      "65+ instruments incl. Forex, Gold, Indices",
      "Price mode & Pips mode",
      "Commission and leverage aware",
      "Saves last calculations",
    ],
    image: "/screenshots/ss-calculator.png",
    href: "/register",
  },
  {
    id: "drawdown",
    badge: "Recovery · Losing Streak · Compound",
    title: "Drawdown Tool",
    description:
      "See exactly how much gain you need to recover from any loss — and why risk management is critical. Includes a losing streak simulator and compound interest planner.",
    bullets: [
      "Visual asymmetry chart",
      "Losing streak simulator",
      "Compound interest planner",
      "Full reference table -1% to -99%",
    ],
    image: "/screenshots/ss-drawdown.png",
    href: "/register",
  },
];

export default function CalculatorsSection() {
  return (
    <section
      className="py-16 md:py-[120px] relative overflow-hidden"
      style={{ backgroundColor: "#050507" }}
    >
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 40% at 50% 100%, rgba(139,92,246,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="mx-auto px-6 relative z-10" style={{ maxWidth: "1200px" }}>

        {/* Header */}
        <div className="text-center mb-14 md:mb-20">
          {/* Built-in-house badge */}
          <div className="flex items-center justify-center gap-2 mb-5">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
              style={{
                backgroundColor: "rgba(139,92,246,0.1)",
                border: "1px solid rgba(139,92,246,0.25)",
                color: "#A78BFA",
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1l1.5 3 3.3.5-2.4 2.3.6 3.2L6 8.5 3 10.1l.6-3.3L1.2 4.5 4.5 4z" fill="#A78BFA" />
              </svg>
              Built in-house · Powered by TJ TradeHub
            </div>
          </div>

          <h2
            className="text-3xl md:text-5xl font-bold leading-tight mb-5"
            style={{ color: "#F9FAFB" }}
          >
            Professional Tools.{" "}
            <span style={{ color: "#8B5CF6" }}>Designed by Traders.</span>
          </h2>
          <p
            className="text-lg leading-relaxed mx-auto"
            style={{ color: "#9CA3AF", maxWidth: "580px" }}
          >
            Every tool in TJ TradeHub was built from scratch by traders, for traders.
            No third-party embeds — fully integrated into your dashboard.
          </p>
        </div>

        {/* Tool cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {TOOLS.map((tool) => (
            <div
              key={tool.id}
              className="flex flex-col rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "#0d0d14",
                border: "1px solid rgba(139,92,246,0.2)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.05)",
              }}
            >
              {/* Top accent */}
              <div style={{ height: "2px", background: "linear-gradient(90deg, #7C3AED, #A78BFA, #7C3AED)" }} />

              {/* Screenshot */}
              <div
                style={{
                  position: "relative",
                  overflow: "hidden",
                  height: "220px",
                  borderBottom: "1px solid rgba(139,92,246,0.1)",
                }}
              >
                <Image
                  src={tool.image}
                  alt={tool.title}
                  fill
                  sizes="600px"
                  style={{ objectFit: "cover", objectPosition: "top" }}
                />
                {/* Fade to bottom */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to bottom, transparent 40%, #0d0d14 100%)",
                  }}
                />
                {/* Badge overlay */}
                <div
                  style={{
                    position: "absolute",
                    top: "14px",
                    left: "14px",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    backgroundColor: "rgba(0,0,0,0.7)",
                    border: "1px solid rgba(139,92,246,0.3)",
                    color: "#A78BFA",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {tool.badge}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col gap-5 p-6 flex-1">
                <div>
                  <h3
                    className="text-xl font-bold mb-3"
                    style={{ color: "#F9FAFB" }}
                  >
                    {tool.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>
                    {tool.description}
                  </p>
                </div>

                {/* Bullets */}
                <ul className="flex flex-col gap-2">
                  {tool.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-3">
                      <div
                        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: "rgba(139,92,246,0.15)" }}
                      >
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <span className="text-sm" style={{ color: "#D1D5DB" }}>{b}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="mt-auto pt-2">
                  <a
                    href={tool.href}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                    style={{
                      background: "linear-gradient(135deg, #7C3AED, #8B5CF6)",
                      color: "#fff",
                      boxShadow: "0 4px 14px rgba(139,92,246,0.3)",
                    }}
                  >
                    Try for free
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 7h8M8 4l3 3-3 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm mt-10" style={{ color: "#4B5563" }}>
          Both tools are included in every plan — no add-ons, no extra fees.
        </p>

      </div>
    </section>
  );
}
