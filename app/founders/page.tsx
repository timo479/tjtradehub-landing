import { getFounderStats, FOUNDER_PRICE_USD } from "@/lib/founders";
import FoundersClient from "@/components/founders/FoundersClient";

export const metadata = {
  title: "Founder Lifetime · TJ TradeHub",
  description:
    "100 Lifetime Founder spots. Pay $149 once, never pay again. Limited to the first 90 buyers — 10 reserved for giveaway winners.",
  openGraph: {
    title: "TJ TradeHub Founder Launch — 100 Lifetime Spots",
    description: "$149 once. Forever. Only 90 for sale.",
  },
};

export const dynamic = "force-dynamic";

const FEATURES: { icon: string; title: string; body: string }[] = [
  {
    icon: "∞",
    title: "Lifetime access",
    body: "Never pay another cent. Every future feature included, forever.",
  },
  {
    icon: "✦",
    title: "Founder badge",
    body: "Display your Founder number proudly. Only 100 exist — ever.",
  },
  {
    icon: "⚡",
    title: "MT4 / MT5 unlimited",
    body: "Auto-sync every trade. No per-broker fees, no caps.",
  },
  {
    icon: "★",
    title: "Priority support",
    body: "Direct line to me. Feature requests get listened to first.",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Why only 100 spots?",
    a: "Founders fund a small indie SaaS without VC. After spot 100, only the $29/mo plan exists. The 100 cap is real and permanent.",
  },
  {
    q: "What does 'Lifetime' mean here?",
    a: "One payment of $149 today. You keep full TJ TradeHub access for as long as the product exists, including every future feature. No renewals, no surprise charges.",
  },
  {
    q: "What if I'm already a paying subscriber?",
    a: "Email support after upgrading and we'll cancel your $29/mo and refund the unused portion.",
  },
  {
    q: "How does the giveaway fit in?",
    a: "10 of the 100 spots are reserved for giveaway winners. They are awarded on launch day from lottery entries earned by signing up, connecting MT5, logging trades, sharing, and referrals.",
  },
  {
    q: "What if it sells out before I decide?",
    a: "It's first come, first served. Once 90 are sold, no more Founder spots will ever be sold — only the $29/mo plan remains.",
  },
];

export default async function FoundersPage() {
  const initialStats = await getFounderStats();

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,92,246,0.22) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(251,191,36,0.08) 0%, transparent 60%), #000",
        color: "#F9FAFB",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Floating background dots */}
      <div aria-hidden style={{ position: "absolute", top: "12%", left: "8%", width: 6, height: 6, borderRadius: "50%", backgroundColor: "#FBBF24", boxShadow: "0 0 12px #FBBF24", opacity: 0.6 }} />
      <div aria-hidden style={{ position: "absolute", top: "32%", left: "88%", width: 4, height: 4, borderRadius: "50%", backgroundColor: "#A78BFA", boxShadow: "0 0 10px #A78BFA", opacity: 0.6 }} />
      <div aria-hidden style={{ position: "absolute", top: "60%", left: "6%", width: 3, height: 3, borderRadius: "50%", backgroundColor: "#F9FAFB", boxShadow: "0 0 8px #fff", opacity: 0.5 }} />
      <div aria-hidden style={{ position: "absolute", top: "80%", left: "92%", width: 5, height: 5, borderRadius: "50%", backgroundColor: "#FBBF24", boxShadow: "0 0 10px #FBBF24", opacity: 0.5 }} />

      <main
        style={{
          position: "relative",
          maxWidth: 1100,
          margin: "0 auto",
          padding: "80px 24px 120px",
          textAlign: "center",
        }}
      >
        {/* Limited pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 999,
            background: "linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(251,191,36,0.06) 100%)",
            border: "1px solid rgba(251,191,36,0.5)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#FCD34D",
            backdropFilter: "blur(6px)",
            marginBottom: 28,
          }}
        >
          <span>✦</span> Limited · One time · Forever
        </div>

        {/* Hero headline */}
        <h1
          style={{
            fontSize: "clamp(40px, 7vw, 76px)",
            fontWeight: 800,
            lineHeight: 1.02,
            letterSpacing: "-0.025em",
            marginBottom: 18,
          }}
        >
          100 Founder
          <br />
          <span
            style={{
              background: "linear-gradient(135deg, #FCD34D 0%, #FBBF24 40%, #F59E0B 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Lifetime spots.
          </span>
        </h1>

        <p
          style={{
            fontSize: "clamp(16px, 1.6vw, 19px)",
            color: "#9CA3AF",
            maxWidth: 620,
            margin: "0 auto 40px",
            lineHeight: 1.55,
          }}
        >
          Pay <span style={{ color: "#F9FAFB", fontWeight: 700 }}>${FOUNDER_PRICE_USD} once</span>. Never pay again. After spot 90 sells, only the $29/mo plan remains — forever.
        </p>

        {/* Live counter + CTA (client) */}
        <FoundersClient initialStats={initialStats} />

        {/* Features grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginTop: 80,
            marginBottom: 80,
            textAlign: "left",
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                padding: 24,
                borderRadius: 20,
                background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "linear-gradient(135deg, rgba(251,191,36,0.18) 0%, rgba(251,191,36,0.04) 100%)",
                  border: "1px solid rgba(251,191,36,0.3)",
                  fontSize: 22,
                  color: "#FBBF24",
                  marginBottom: 14,
                  fontWeight: 700,
                }}
              >
                {f.icon}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: "#9CA3AF", lineHeight: 1.55 }}>{f.body}</div>
            </div>
          ))}
        </div>

        {/* The math */}
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto 80px",
            padding: "32px 28px",
            borderRadius: 24,
            background: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(0,0,0,0.4) 100%)",
            border: "1px solid rgba(139,92,246,0.25)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "#A78BFA", textTransform: "uppercase", marginBottom: 14 }}>
            The math
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 24, maxWidth: 560, margin: "0 auto" }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#F9FAFB", lineHeight: 1 }}>
                $29
              </div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>per month, forever</div>
              <div style={{ fontSize: 13, color: "#F87171", marginTop: 8, fontWeight: 600 }}>
                $348 / year
              </div>
            </div>
            <div style={{ fontSize: 24, color: "#6B7280", fontWeight: 700 }}>vs</div>
            <div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  lineHeight: 1,
                  background: "linear-gradient(135deg, #FCD34D 0%, #FBBF24 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                $149
              </div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 6 }}>once, lifetime</div>
              <div style={{ fontSize: 13, color: "#22c55e", marginTop: 8, fontWeight: 600 }}>
                pays back in 5 months
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "left" }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 32, letterSpacing: "-0.02em" }}>
            Questions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {FAQ.map((item) => (
              <details
                key={item.q}
                style={{
                  padding: "16px 20px",
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  cursor: "pointer",
                }}
              >
                <summary style={{ fontSize: 15, fontWeight: 600, color: "#F9FAFB", listStyle: "none" }}>
                  {item.q}
                </summary>
                <p style={{ fontSize: 14, color: "#9CA3AF", marginTop: 10, lineHeight: 1.65 }}>
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
