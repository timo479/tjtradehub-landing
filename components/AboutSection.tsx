import ScrollReveal from "@/components/ScrollReveal";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="py-16 md:py-[120px]"
      style={{ backgroundColor: "#000000" }}
    >
      <div
        className="mx-auto px-6 text-center"
        style={{ maxWidth: "700px" }}
      >
        <ScrollReveal>
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#8B5CF6" }}
          >
            About
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold leading-tight mb-6"
            style={{ color: "#F9FAFB" }}
          >
            Built by <span style={{ color: "#8B5CF6" }}>Traders.</span>
          </h2>
        </ScrollReveal>
        <div className="flex flex-col gap-4">
          <ScrollReveal delay={0}>
            <p className="text-lg leading-relaxed" style={{ color: "#9CA3AF" }}>
              TJ TradeHub was built out of frustration. We were serious, system-based
              traders who needed a journal that understood rules — not just P&amp;L.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={70}>
            <p className="text-base leading-relaxed" style={{ color: "#9CA3AF" }}>
              Every tool we tried logged our trades beautifully. None of them
              could tell us whether we actually traded our system. We were left to
              manually review logs, build spreadsheets, and guess whether discipline
              was the problem.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={140}>
            <p className="text-base leading-relaxed" style={{ color: "#9CA3AF" }}>
              So we built the tool we needed. TJ TradeHub is designed from the ground
              up for traders who have a defined system and want real data on how well
              they execute it.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={210}>
            <p
              className="text-xl md:text-2xl font-semibold leading-snug text-left"
              style={{
                color: "#F9FAFB",
                borderLeft: "3px solid #8B5CF6",
                paddingLeft: "20px",
                paddingTop: "12px",
                paddingBottom: "12px",
                paddingRight: "16px",
                backgroundColor: "rgba(139,92,246,0.05)",
                borderRadius: "8px",
                marginTop: "8px",
              }}
            >
              If you have rules, you deserve to know how well you follow them.
            </p>
          </ScrollReveal>

          <div className="flex items-center justify-center gap-3 mt-6 pt-6" style={{ borderTop: "1px solid #1F2937" }}>
            <div style={{ display: "flex" }}>
              {["T", "J"].map((initial, i) => (
                <div
                  key={initial}
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    backgroundColor: "#1F2937",
                    border: "2px solid #000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "#8B5CF6",
                    marginLeft: i > 0 ? "-12px" : "0",
                    zIndex: 2 - i,
                    position: "relative",
                  }}
                >
                  {initial}
                </div>
              ))}
            </div>
            <p style={{ color: "#6B7280", fontSize: "13px" }}>
              Built by <span style={{ color: "#9CA3AF", fontWeight: 500 }}>Timo &amp; Julien</span>, active traders from Switzerland 🇨🇭
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
