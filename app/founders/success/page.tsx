import Link from "next/link";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "You're in — Founder Lifetime",
  robots: { index: false, follow: false },
};

export default async function FounderSuccessPage() {
  const session = await auth();
  const loggedIn = !!session?.user?.id;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(251,191,36,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 50% 100%, rgba(139,92,246,0.12) 0%, transparent 60%), #000",
        color: "#F9FAFB",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
      }}
    >
      <div style={{ maxWidth: 560, textAlign: "center" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: 999,
            background: "linear-gradient(135deg, rgba(251,191,36,0.2), rgba(251,191,36,0.06))",
            border: "1px solid rgba(251,191,36,0.55)",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#FCD34D",
            marginBottom: 24,
          }}
        >
          ✦ Founder Lifetime
        </div>

        <h1
          style={{
            fontSize: "clamp(38px, 6vw, 56px)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "-0.025em",
            marginBottom: 16,
          }}
        >
          You&apos;re in.
        </h1>

        <p
          style={{
            fontSize: 17,
            color: "#9CA3AF",
            lineHeight: 1.6,
            marginBottom: 36,
          }}
        >
          Payment received. Your Founder number has been reserved and your lifetime access is locked in — forever.
        </p>

        <div
          style={{
            padding: 24,
            borderRadius: 18,
            background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(0,0,0,0.4))",
            border: "1px solid rgba(139,92,246,0.25)",
            marginBottom: 32,
            textAlign: "left",
          }}
        >
          <h2
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: "#A78BFA",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            What happens next
          </h2>
          {loggedIn ? (
            <p style={{ fontSize: 14, color: "#D1D5DB", lineHeight: 1.65, margin: 0 }}>
              Your existing TJ TradeHub account is now Lifetime. Head to your dashboard — your Founder number shows up next to your name.
            </p>
          ) : (
            <p style={{ fontSize: 14, color: "#D1D5DB", lineHeight: 1.65, margin: 0 }}>
              We just sent you a welcome email with a link to set your password. Once you set it, you can sign in any time.{" "}
              <span style={{ color: "#9CA3AF" }}>
                (Didn&apos;t arrive in 1 minute? Check spam, or use{" "}
                <Link href="/forgot-password" style={{ color: "#A78BFA", textDecoration: "underline" }}>
                  forgot password
                </Link>{" "}
                with the email you paid with.)
              </span>
            </p>
          )}
        </div>

        <Link
          href={loggedIn ? "/dashboard" : "/login"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 28px",
            borderRadius: 999,
            background: "linear-gradient(135deg, #FCD34D 0%, #FBBF24 50%, #F59E0B 100%)",
            color: "#1a0a2e",
            fontSize: 15,
            fontWeight: 800,
            letterSpacing: "0.01em",
            textDecoration: "none",
            boxShadow: "0 8px 32px rgba(251,191,36,0.35)",
          }}
        >
          {loggedIn ? "Go to dashboard" : "Open sign-in page"} →
        </Link>
      </div>
    </div>
  );
}
