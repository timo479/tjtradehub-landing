import Image from "next/image";

export default function Hero() {
  return (
    <section
      className="flex items-center py-16 md:py-0"
      style={{
        minHeight: "85vh",
        paddingTop: "80px",
        backgroundColor: "#000000",
      }}
    >
      <div
        className="mx-auto w-full px-6"
        style={{ maxWidth: "1200px" }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div className="flex flex-col gap-6">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium w-fit"
              style={{
                backgroundColor: "#111827",
                color: "#8B5CF6",
                border: "1px solid #1F2937",
                borderRadius: "8px",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "#8B5CF6" }}
              />
              Trading Journal
            </div>

            <h1
              className="text-4xl md:text-5xl lg:text-[56px] font-bold leading-tight tracking-tight"
              style={{ color: "#F9FAFB" }}
            >
              Most Journals Are Built for Someone Else.{" "}
              <span style={{ color: "#8B5CF6" }}>This One Is Built by You.</span>
            </h1>

            <p
              className="text-lg leading-relaxed"
              style={{ color: "#9CA3AF", maxWidth: "480px" }}
            >
              Define your own entry rules, setups, and risk criteria. TJ TradeHub tracks every trade against your system — not a generic template.
            </p>

            {/* Custom Journal Highlight */}
            <div
              className="flex items-start gap-3 px-4 py-4 rounded-xl"
              style={{
                backgroundColor: "rgba(139,92,246,0.07)",
                border: "1px solid rgba(139,92,246,0.2)",
                maxWidth: "480px",
              }}
            >
              <span style={{ fontSize: "20px", lineHeight: 1, marginTop: "2px" }}>✦</span>
              <div>
                <p className="text-sm font-semibold mb-1" style={{ color: "#E2D9FF" }}>
                  It adapts to you. Not the other way around.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>
                  Every trader has different rules, different setups, different mistakes. TJ TradeHub doesn&apos;t force you into a template — you build the journal that fits your system, and it shows you exactly where you deviate from it.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <a
                href="/register"
                className="btn-accent inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold transition-all duration-200"
                style={{
                  backgroundColor: "#8B5CF6",
                  color: "#F9FAFB",
                  borderRadius: "14px",
                }}
              >
              Start Free – 7 Days
              </a>
              <a
                href="#features"
                className="btn-outline inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold transition-all duration-200"
                style={{
                  color: "#9CA3AF",
                  border: "1px solid #1F2937",
                  borderRadius: "14px",
                }}
              >
              See How It Works
              </a>
            </div>

            <p className="text-sm" style={{ color: "#9CA3AF" }}>
              No credit card required &nbsp;·&nbsp; Cancel anytime
            </p>
          </div>

          {/* Right: 3-Card Fan */}
          <div className="hero-fan-container">
            {/* Ambient glow */}
            <div
              className="absolute pointer-events-none"
              style={{
                inset: "-60px",
                background:
                  "radial-gradient(ellipse at center, rgba(139,92,246,0.28) 0%, transparent 65%)",
                filter: "blur(60px)",
                zIndex: 0,
              }}
            />

            {[
              { id: "journal", url: "tjtradehub.com/journal", image: "/screenshots/ss-journal.png", pos: "left" },
              { id: "dashboard", url: "tjtradehub.com/dashboard", image: "/screenshots/ss-dashboard-v2.png", pos: "center" },
              { id: "stats", url: "tjtradehub.com/statistics", image: "/screenshots/ss-stats.png", pos: "right" },
            ].map((card) => (
              <div key={card.id} className={`hero-card hero-card-${card.pos}`}>
                <div className="hero-card-chrome">
                  <div className="hero-card-dots">
                    <span style={{ backgroundColor: "#FF5F57" }} />
                    <span style={{ backgroundColor: "#FFBD2E" }} />
                    <span style={{ backgroundColor: "#28C840" }} />
                  </div>
                  <div className="hero-card-url">{card.url}</div>
                </div>
                <div className="hero-card-screenshot">
                  <Image
                    src={card.image}
                    alt={card.id}
                    width={1080}
                    height={1800}
                    unoptimized
                    priority={card.pos === "center"}
                    style={{ width: "100%", height: "auto", display: "block" }}
                  />
                  <div className="hero-card-fade" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
