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
          Built by Traders.
        </h2>
        <div className="flex flex-col gap-4">
          <p className="text-lg leading-relaxed" style={{ color: "#9CA3AF" }}>
            TJ TradeHub was built out of frustration. We were serious, system-based
            traders who needed a journal that understood rules — not just P&amp;L.
          </p>
          <p className="text-base leading-relaxed" style={{ color: "#9CA3AF" }}>
            Every other tool we tried logged our trades beautifully. None of them
            could tell us whether we actually traded our system. We were left to
            manually review logs, build spreadsheets, and guess whether discipline
            was the problem.
          </p>
          <p className="text-base leading-relaxed" style={{ color: "#9CA3AF" }}>
            So we built the tool we needed. TJ TradeHub is designed from the ground
            up for traders who have a defined system and want real data on how well
            they execute it.
          </p>
          <p className="text-base font-semibold" style={{ color: "#F9FAFB" }}>
            If you have rules, you deserve to know how well you follow them.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6 pt-6" style={{ borderTop: "1px solid #1F2937" }}>
            <div style={{ display: "flex", gap: "-8px" }}>
              {["T", "J"].map((initial) => (
                <div
                  key={initial}
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    backgroundColor: "#1F2937",
                    border: "2px solid #000",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#8B5CF6",
                    marginLeft: initial === "J" ? "-8px" : "0",
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
