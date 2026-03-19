const testimonials = [
  {
    quote:
      "Before TJ TradeHub I told myself I was following my rules — but I had no proof. Having to check them off for every single trade makes it impossible to lie to yourself. My discipline improved just because I couldn't skip the process anymore.",
    name: "— Marc F.",
    role: "Forex Trader",
  },
  {
    quote:
      "The simple act of entering your rules into the journal changes how you trade. You become more conscious before you even open a position. I broke fewer rules in my first two weeks than in the two months before.",
    name: "— Leon K.",
    role: "Futures Trader",
  },
  {
    quote:
      "I always knew what my rules were — I just didn't track whether I followed them. Now I have a Discipline Score and I can actually see the weeks where I slipped. That feedback loop alone is worth it.",
    name: "— David S.",
    role: "Swing Trader",
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
              className="card-hover rounded-2xl p-8 flex flex-col gap-6 transition-all duration-200 hover:-translate-y-1.5"
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
