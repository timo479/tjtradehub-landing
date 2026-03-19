const included = [
  "Unlimited trade logging",
  "Full MT4 & MT5 auto-sync",
  "Strategy rule tracking",
  "Setup tagging",
  "Discipline score & trends",
  "Execution analytics (coming soon)",
  "Multi-account support",
  "Export & data ownership",
];

export default function PricingSection() {
  return (
    <section
      id="pricing"
      className="py-16 md:py-[120px]"
      style={{ backgroundColor: "#111827" }}
    >
      <div
        className="mx-auto px-6 flex flex-col items-center"
        style={{ maxWidth: "1200px" }}
      >
        {/* Header */}
        <div className="text-center mb-12" style={{ maxWidth: "580px" }}>
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#8B5CF6" }}
          >
            Pricing
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold leading-tight"
            style={{ color: "#F9FAFB" }}
          >
            Simple Pricing. No Surprises.
          </h2>
          <p
            className="mt-4 text-lg leading-relaxed"
            style={{ color: "#9CA3AF" }}
          >
            One plan. Everything included. Cancel anytime.
          </p>
        </div>

        {/* Pricing Card */}
        <div
          className="w-full rounded-3xl p-8 md:p-10"
          style={{
            maxWidth: "420px",
            backgroundColor: "#000000",
            border: "1px solid rgba(139, 92, 246, 0.3)",
          }}
        >
          {/* Badge */}
          <div className="flex items-center justify-between mb-6">
            <span
              className="text-sm font-semibold"
              style={{ color: "#F9FAFB" }}
            >
              Founder Access
            </span>
            <span
              className="px-3 py-1 text-xs font-semibold rounded-full"
              style={{
                backgroundColor: "rgba(139, 92, 246, 0.15)",
                color: "#8B5CF6",
              }}
            >
              Early Bird
            </span>
          </div>

          {/* Price */}
          <div className="flex items-end gap-2 mb-2">
            <span
              className="text-5xl font-bold leading-none"
              style={{ color: "#F9FAFB" }}
            >
              CHF 29
            </span>
            <span
              className="text-base font-medium mb-1"
              style={{ color: "#9CA3AF" }}
            >
              / month
            </span>
          </div>
          <p className="text-sm mb-8" style={{ color: "#9CA3AF" }}>
            Locked-in founder rate. Price will increase after launch.
          </p>

          {/* CTA */}
          <a
            href="/register"
            className="btn-accent block w-full text-center px-6 py-4 font-semibold text-base transition-all duration-200 mb-4"
            style={{
              backgroundColor: "#8B5CF6",
              color: "#F9FAFB",
              borderRadius: "14px",
            }}
          >
            Start 7-Day Free Trial
          </a>

          <p className="text-xs text-center mb-8" style={{ color: "#9CA3AF" }}>
            No credit card required &nbsp;·&nbsp; Cancel anytime
          </p>

          {/* Divider */}
          <div
            className="w-full h-px mb-8"
            style={{ backgroundColor: "#1F2937" }}
          />

          {/* Features */}
          <ul className="flex flex-col gap-3">
            {included.map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <div
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(139, 92, 246, 0.15)" }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5L4 7.5L8 2.5"
                      stroke="#8B5CF6"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="text-sm" style={{ color: "#9CA3AF" }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
