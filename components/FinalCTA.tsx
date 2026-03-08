export default function FinalCTA() {
  return (
    <section
      style={{
        background:
          "linear-gradient(135deg, #000000 0%, #1a1040 40%, #0d1a2e 70%, #000000 100%)",
        paddingTop: "120px",
        paddingBottom: "120px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background accent */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "300px",
          background:
            "radial-gradient(ellipse at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="relative mx-auto px-6 text-center"
        style={{ maxWidth: "800px" }}
      >
        <p
          className="text-sm font-semibold uppercase tracking-widest mb-6"
          style={{ color: "#8B5CF6" }}
        >
          Get Started Today
        </p>
        <h2
          className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-6"
          style={{ color: "#F9FAFB" }}
        >
          Stop Tracking Outcomes.{" "}
          <span style={{ color: "#8B5CF6" }}>Start Tracking Discipline.</span>
        </h2>
        <p
          className="text-lg leading-relaxed mb-10"
          style={{ color: "#9CA3AF", maxWidth: "560px", margin: "0 auto 40px" }}
        >
          Join traders who are serious about execution. 7 days free.
          No credit card required. Cancel anytime.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/register"
            className="btn-accent inline-flex items-center justify-center px-8 py-4 text-base font-semibold transition-all duration-200"
            style={{
              backgroundColor: "#8B5CF6",
              color: "#F9FAFB",
              borderRadius: "14px",
            }}
          >
            Start Free Trial – 7 Days
          </a>
          <a
            href="#features"
            className="btn-outline inline-flex items-center justify-center px-8 py-4 text-base font-semibold transition-all duration-200"
            style={{
              color: "#9CA3AF",
              border: "1px solid #1F2937",
              borderRadius: "14px",
            }}
          >
            See All Features
          </a>
        </div>

        {/* Footer note */}
        <p
          className="mt-8 text-sm"
          style={{ color: "#9CA3AF" }}
        >
          Founder rate: CHF 29/month &nbsp;·&nbsp; Full access &nbsp;·&nbsp; Cancel anytime
        </p>
      </div>
    </section>
  );
}
