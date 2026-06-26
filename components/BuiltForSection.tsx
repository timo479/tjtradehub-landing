import ScrollReveal from "@/components/ScrollReveal";

export default function BuiltForSection() {
  const traits = [
    "You have a defined system with entry rules, exit rules, and risk limits",
    "You want to know if your losses come from bad setups — or bad execution",
    "You're tired of guessing why you underperform and ready to see the actual data",
    "You've outgrown generic journals that can't tell a good trade from a rule break",
  ];

  return (
    <section
      className="py-16 md:py-[120px]"
      style={{ backgroundColor: "#000000" }}
    >
      <div
        className="mx-auto px-6 text-center"
        style={{ maxWidth: "800px" }}
      >
        <ScrollReveal>
          <div className="inline-flex items-center gap-3 mb-5">
            <span
              className="text-sm font-bold"
              style={{
                color: "#8B5CF6",
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "0.05em",
              }}
            >
              03
            </span>
            <span
              className="h-px w-8"
              style={{ backgroundColor: "rgba(139,92,246,0.4)" }}
            />
            <p
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#9CA3AF" }}
            >
              Who It&apos;s For
            </p>
          </div>
          <h2
            className="text-3xl md:text-4xl font-bold leading-tight mb-6"
            style={{ color: "#F9FAFB" }}
          >
            Not for Casual Traders.{" "}
            <span style={{ color: "#8B5CF6" }}>Built for Traders Who Are Done With Journals That Don&apos;t Fit Their System.</span>
          </h2>
          <p
            className="text-lg leading-relaxed mb-12"
            style={{ color: "#9CA3AF" }}
          >
            If your rules don&apos;t fit in a generic journal, build your own. TJ TradeHub gives you the structure — and holds you to it.
          </p>
        </ScrollReveal>

        {/* Traits List */}
        <ul className="flex flex-col gap-4 text-left max-w-xl mx-auto">
          {traits.map((trait, i) => (
            <ScrollReveal key={i} delay={i * 80}>
              <li className="flex items-start gap-4">
                <div
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5"
                  style={{ backgroundColor: "rgba(139, 92, 246, 0.15)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6L5 9L10 3"
                      stroke="#8B5CF6"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="text-base leading-relaxed" style={{ color: "#9CA3AF" }}>
                  {trait}
                </p>
              </li>
            </ScrollReveal>
          ))}
        </ul>

        <ScrollReveal>
          <div
            className="mt-12 rounded-2xl p-6"
            style={{
              backgroundColor: "#0a0a0a",
              border: "1px solid #1F2937",
              borderLeft: "3px solid #8B5CF6",
            }}
          >
            <p className="font-semibold text-base mb-2" style={{ color: "#F9FAFB" }}>
              Most traders don&apos;t have a strategy problem. They have a journal problem.
            </p>
            <p className="text-sm" style={{ color: "#9CA3AF" }}>
              Their journal doesn&apos;t know their rules. TJ TradeHub does — because you define them yourself.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
