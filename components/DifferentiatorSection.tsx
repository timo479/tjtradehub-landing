const features = [
  {
    title: "Strategy Rule Tracking",
    desc: "Build your trading strategies with custom rules. Check off which rules you followed on every trade and track your adherence over time — automatically.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          stroke="#8B5CF6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Setup Tagging",
    desc: "Log the setup type for every trade to build a structured trade history. Identify which setups appear most in your journal and spot patterns across your entries.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
          stroke="#8B5CF6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Discipline Score",
    desc: "Get a quantified score for how consistently you follow your rules. Track your discipline over time and see how it relates to your trading results.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          stroke="#8B5CF6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Execution Analytics",
    desc: "Deep-dive into entry timing, position sizing consistency, stop placement, and target management. Know exactly where your execution breaks down.",
    comingSoon: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M16 8v8m-8-5v5m4-9v9M3 20h18"
          stroke="#8B5CF6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function DifferentiatorSection() {
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
        {/* Header */}
        <div className="text-center mb-16" style={{ maxWidth: "680px", margin: "0 auto 64px" }}>
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#8B5CF6" }}
          >
            Why TJ TradeHub
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold leading-tight"
            style={{ color: "#F9FAFB" }}
          >
            Your Strategy Is Yours.{" "}
            <span style={{ color: "#8B5CF6" }}>
              Your Rules Should Be Measurable.
            </span>
          </h2>
          <p
            className="mt-4 text-lg leading-relaxed"
            style={{ color: "#9CA3AF" }}
          >
            Core tools built for what system-based traders actually need.
          </p>
        </div>

        {/* 2x2 Feature Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="card-hover rounded-2xl p-8 flex flex-col gap-5 transition-all duration-200"
              style={{
                backgroundColor: "#000000",
                border: "1px solid #1F2937",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(139, 92, 246, 0.1)" }}
              >
                {f.icon}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-bold text-lg" style={{ color: "#F9FAFB" }}>
                    {f.title}
                  </p>
                  {f.comingSoon && (
                    <span
                      className="px-2 py-0.5 text-xs font-semibold rounded-full"
                      style={{
                        backgroundColor: "rgba(139, 92, 246, 0.12)",
                        color: "#8B5CF6",
                        border: "1px solid rgba(139, 92, 246, 0.25)",
                      }}
                    >
                      Coming Soon
                    </span>
                  )}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
