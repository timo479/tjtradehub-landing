const problems = [
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          stroke="#8B5CF6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "You Break Rules. Nothing Flags It.",
    desc: "Generic journals log every trade equally — even the ones that violated your own setup criteria.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="#8B5CF6" strokeWidth="1.5" />
        <path
          d="M12 8v4l3 3"
          stroke="#8B5CF6"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
    title: "Emotions Look Like Decisions.",
    desc: "FOMO and frustration leave no fingerprint in a basic journal. You can't fix what you can't see.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          stroke="#8B5CF6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "The Same Mistake. Every Week.",
    desc: "Overtrading. Stop-moving. Without data, you can't measure how often — or what it's costing.",
  },
  {
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          stroke="#8B5CF6"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
    title: "You Don't Know Why You Really Lost.",
    desc: "Bad setup? Bad execution? A broken rule? Generic journals can't tell. Yours should.",
  },
];

export default function ProblemSection() {
  return (
    <section
      className="py-16 md:py-[120px]"
      style={{ backgroundColor: "#000000" }}
    >
      <div
        className="mx-auto px-6"
        style={{ maxWidth: "1200px" }}
      >
        {/* Centered Headline */}
        <div className="text-center mb-16" style={{ maxWidth: "720px", margin: "0 auto 64px" }}>
          <div className="inline-flex items-center gap-3 mb-5">
            <span
              className="text-sm font-bold"
              style={{
                color: "#8B5CF6",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "0.05em",
              }}
            >
              01
            </span>
            <span
              className="h-px w-8"
              style={{ backgroundColor: "rgba(139,92,246,0.4)" }}
            />
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#9CA3AF" }}
            >
              The Real Problem
            </p>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold leading-tight"
            style={{ color: "#F9FAFB" }}
          >
            Your Journal Doesn&apos;t Know Your Rules.{" "}
            <span style={{ color: "#8B5CF6" }}>
              So It Can&apos;t Tell You When You Break Them.
            </span>
          </h2>
          <p
            className="mt-4 text-lg leading-relaxed"
            style={{ color: "#9CA3AF" }}
          >
            A generic journal records what happened. TJ TradeHub tracks whether it should have happened — based on your rules.
          </p>
        </div>

        {/* 4-Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((p, i) => (
            <div
              key={i}
              className="card-hover rounded-2xl p-6 flex flex-col gap-4 transition-all duration-200"
              style={{
                backgroundColor: "#111827",
                border: "1px solid #1F2937",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(139, 92, 246, 0.1)" }}
              >
                {p.icon}
              </div>
              <div>
                <p
                  className="font-semibold text-base mb-2"
                  style={{ color: "#F9FAFB" }}
                >
                  {p.title}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "#9CA3AF" }}>
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
