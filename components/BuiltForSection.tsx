export default function BuiltForSection() {
  const traits = [
    "You trade a defined system with specific entry and exit rules",
    "You want to know if your losses come from bad setups or bad execution",
    "You're serious about separating discipline from randomness in your results",
    "You've outgrown basic journals that only track P&L",
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
        <p
          className="text-sm font-semibold uppercase tracking-widest mb-4"
          style={{ color: "#8B5CF6" }}
        >
          Who It&apos;s For
        </p>
        <h2
          className="text-3xl md:text-4xl font-bold leading-tight mb-6"
          style={{ color: "#F9FAFB" }}
        >
          Designed for Advanced &amp;{" "}
          <span style={{ color: "#8B5CF6" }}>System-Based Traders.</span>
        </h2>
        <p
          className="text-lg leading-relaxed mb-12"
          style={{ color: "#9CA3AF" }}
        >
          TJ TradeHub is not for casual traders. It&apos;s built for traders who
          have a system — and want to measure whether they execute it consistently.
        </p>

        {/* Traits List */}
        <ul className="flex flex-col gap-4 text-left max-w-xl mx-auto">
          {traits.map((trait, i) => (
            <li key={i} className="flex items-start gap-4">
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
          ))}
        </ul>

        <div
          className="mt-12 rounded-2xl p-6"
          style={{
            backgroundColor: "#111827",
            border: "1px solid #1F2937",
          }}
        >
          <p className="font-semibold text-base mb-2" style={{ color: "#F9FAFB" }}>
            If you have rules, you should be able to measure them.
          </p>
          <p className="text-sm" style={{ color: "#9CA3AF" }}>
            Most traders lose money not because their system is bad — but because
            they don&apos;t execute it consistently. TJ TradeHub shows you the difference.
          </p>
        </div>
      </div>
    </section>
  );
}
