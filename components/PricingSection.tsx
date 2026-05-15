const included = [
  "Unlimited trade logging",
  "MT4 & MT5 auto-sync",
  "Strategy rule tracking",
  "Setup tagging",
  "Discipline score & trends",
  "Full trade history import",
  "Risk & drawdown tools",
  "Your data, always accessible",
];

const competitors = [
  { name: "Edgewonk", price: "$169" },
  { name: "Tradervue", price: "$49" },
  { name: "Tradezella", price: "$39" },
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
            One Plan.{" "}
            <span style={{ color: "#8B5CF6" }}>Everything Included.</span>
          </h2>
          <p
            className="mt-4 text-lg leading-relaxed"
            style={{ color: "#9CA3AF" }}
          >
            7 days free. Then just{" "}
            <span style={{ color: "#F9FAFB", fontWeight: 600 }}>$29/month</span>{" "}
            <span style={{ color: "#6B7280", textDecoration: "line-through" }}>
              $45
            </span>{" "}
            — locked in forever at the Founder rate.
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
              className="px-3 py-1 text-xs font-bold rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)",
                color: "#FFFFFF",
                letterSpacing: "0.03em",
              }}
            >
              SAVE 35%
            </span>
          </div>

          {/* Price */}
          <div className="flex items-end gap-3 mb-2">
            <span
              className="text-2xl font-medium leading-none mb-2"
              style={{
                color: "#6B7280",
                textDecoration: "line-through",
                textDecorationColor: "#EF4444",
                textDecorationThickness: "2px",
              }}
            >
              $45
            </span>
            <span
              className="text-5xl font-bold leading-none"
              style={{ color: "#F9FAFB" }}
            >
              $29
            </span>
            <span
              className="text-base font-medium mb-1"
              style={{ color: "#9CA3AF" }}
            >
              / month
            </span>
          </div>
          <p
            className="text-sm font-semibold mb-1"
            style={{ color: "#8B5CF6" }}
          >
            You save $16 every month — forever.
          </p>
          <p className="text-sm mb-5" style={{ color: "#9CA3AF" }}>
            Founder rate — locked in for as long as you stay subscribed.
          </p>

          {/* Competitor price anchor */}
          <div
            className="mb-6 px-4 py-3 rounded-xl"
            style={{
              backgroundColor: "rgba(255,255,255,0.02)",
              border: "1px solid #1F2937",
            }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: "#6B7280" }}>
              Compare
            </p>
            <div className="flex flex-col gap-1.5">
              {competitors.map((c) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <span style={{ color: "#9CA3AF" }}>{c.name}</span>
                  <span className="font-medium" style={{ color: "#6B7280", textDecoration: "line-through" }}>
                    {c.price}/mo
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between text-xs pt-2 mt-1" style={{ borderTop: "1px solid #1F2937" }}>
                <span className="font-semibold" style={{ color: "#F9FAFB" }}>TJ TradeHub</span>
                <span className="font-bold" style={{ color: "#8B5CF6" }}>$29/mo</span>
              </div>
            </div>
          </div>

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
