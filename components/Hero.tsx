import Image from "next/image";

export default function Hero() {
  return (
    <section
      className="flex items-center"
      style={{
        minHeight: "85vh",
        paddingTop: "80px",
        backgroundColor: "#0B0F1A",
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
              Advanced Trading Journal
            </div>

            <h1
              className="text-4xl md:text-5xl lg:text-[56px] font-bold leading-tight tracking-tight"
              style={{ color: "#F9FAFB" }}
            >
              Structured Trading Requires{" "}
              <span style={{ color: "#8B5CF6" }}>Structured Tracking.</span>
            </h1>

            <p
              className="text-lg leading-relaxed"
              style={{ color: "#9CA3AF", maxWidth: "480px" }}
            >
              TJ TradeHub is the only journal built for traders who follow rules.
              Track discipline, not just P&L. Measure execution, not just outcomes.
            </p>

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
                Start Free Trial – 7 Days
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

          {/* Right: 3D Logo with Glow */}
          <div className="flex items-center justify-center relative">
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(139, 92, 246, 0.25) 0%, transparent 70%)",
                filter: "blur(40px)",
              }}
            />
            <Image
              src="/logo-3d.png"
              alt="TJ TradeHub 3D Logo"
              width={420}
              height={420}
              className="relative z-10 object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
}
