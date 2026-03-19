const testimonials = [
  {
    quote:
      "Finally a journal that actually tracks whether I followed my rules — not just if I made money. The Discipline Score alone changed how I review my week.",
    name: "— Early Access User",
    role: "Forex Trader",
  },
  {
    quote:
      "The MT4 sync is seamless. I open my journal in the morning and every trade from the night session is already there. Zero manual entry.",
    name: "— Early Access User",
    role: "Futures Trader",
  },
  {
    quote:
      "I've tried Edgewonk and Tradervue. TJ TradeHub is the first one built around a system-based approach. The strategy checklists are exactly what I needed.",
    name: "— Early Access User",
    role: "Prop Firm Trader",
  },
];

export default function TestimonialsSection() {
  return (
    <section
      className="py-16 md:py-[120px]"
      style={{ backgroundColor: "#000000" }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: "1200px" }}>
        {/* Header */}
        <div
          className="text-center mb-16"
          style={{ maxWidth: "580px", margin: "0 auto 64px" }}
        >
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#8B5CF6" }}
          >
            What Traders Say
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold leading-tight"
            style={{ color: "#F9FAFB" }}
          >
            Built for Traders Who Take Execution Seriously.
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl p-8 flex flex-col gap-6"
              style={{
                backgroundColor: "#111827",
                border: "1px solid #1F2937",
              }}
            >
              {/* Stars */}
              <div className="flex gap-1">
                {[...Array(5)].map((_, s) => (
                  <svg key={s} width="16" height="16" viewBox="0 0 16 16" fill="#8B5CF6">
                    <path d="M8 1.5l1.545 3.13 3.455.5-2.5 2.435.59 3.435L8 9.385l-3.09 1.615.59-3.435L3 5.13l3.455-.5L8 1.5z" />
                  </svg>
                ))}
              </div>

              <p
                className="text-sm leading-relaxed flex-1"
                style={{ color: "#D1D5DB" }}
              >
                &ldquo;{t.quote}&rdquo;
              </p>

              <div>
                <p className="text-sm font-semibold" style={{ color: "#F9FAFB" }}>
                  {t.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                  {t.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
