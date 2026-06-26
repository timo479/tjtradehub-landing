const testimonials = [
  {
    quote:
      "Before TJ TradeHub I told myself I was following my rules — but I had no proof. Having to check them off for every single trade makes it impossible to lie to yourself. My discipline improved just because I couldn't skip the process anymore.",
    initials: "MF",
    name: "Marc F.",
    location: "Zürich, CH",
    role: "Forex Trader · FTMO $100k",
    color: "#8B5CF6",
  },
  {
    quote:
      "The simple act of entering your rules into the journal changes how you trade. You become more conscious before you even open a position. I broke fewer rules in my first two weeks than in the two months before.",
    initials: "LK",
    name: "Leon K.",
    location: "Hamburg, DE",
    role: "Futures Trader · Apex $50k",
    color: "#A855F7",
  },
  {
    quote:
      "I always knew what my rules were — I just didn't track whether I followed them. Now I have a Discipline Score and I can actually see the weeks where I slipped. That feedback loop alone is worth it.",
    initials: "DS",
    name: "David S.",
    location: "London, UK",
    role: "Swing Trader · 6 yrs experience",
    color: "#7C3AED",
  },
];

import ScrollReveal from "@/components/ScrollReveal";

export default function TestimonialsSection() {
  return (
    <section
      className="py-16 md:py-[120px]"
      style={{ backgroundColor: "#000000" }}
    >
      <div className="mx-auto px-6" style={{ maxWidth: "1200px" }}>
        {/* Header */}
        <ScrollReveal>
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
            Real Traders.{" "}
            <span style={{ color: "#8B5CF6" }}>Real Accountability.</span>
          </h2>
        </div>
        </ScrollReveal>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {testimonials.map((t, i) => (
            <ScrollReveal key={i} delay={i * 80}>
            <div
              className="card-hover rounded-2xl p-8 flex flex-col gap-6 transition-all duration-200 hover:-translate-y-1.5"
              style={{
                backgroundColor: "#0a0a0a",
                border: "1px solid rgba(139,92,246,0.15)",
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

              <div className="flex items-center gap-3 pt-2" style={{ borderTop: "1px solid #1F2937" }}>
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-full"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: `linear-gradient(135deg, ${t.color}, rgba(0,0,0,0.4))`,
                    color: "#FFFFFF",
                    fontSize: "13px",
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                  }}
                >
                  {t.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: "#F9FAFB" }}>
                    {t.name}
                    <span className="font-normal" style={{ color: "#6B7280" }}> · {t.location}</span>
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
            </ScrollReveal>
          ))}
        </div>
        <p className="text-center text-xs" style={{ color: "#4B5563" }}>
          Testimonials from real early access users. Individual results may vary.
        </p>
      </div>
    </section>
  );
}
