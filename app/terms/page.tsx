import Link from "next/link";

export const metadata = {
  title: "Terms of Service – TJ TradeHub",
};

export default function TermsPage() {
  return (
    <div style={{ backgroundColor: "#000000", minHeight: "100vh" }}>
      <div className="mx-auto px-6 py-16" style={{ maxWidth: "800px" }}>
        <Link href="/" style={{ color: "#8B5CF6", fontSize: "14px", textDecoration: "none" }}>
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mt-8 mb-2" style={{ color: "#F9FAFB" }}>
          Terms of Service
        </h1>
        <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "48px" }}>
          Last updated: March 2026
        </p>

        <div className="flex flex-col gap-10" style={{ color: "#9CA3AF", lineHeight: "1.8" }}>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>1. Acceptance of Terms</h2>
            <p>By accessing or using TJ TradeHub ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. The Service is operated by TJ TradeHub and is available at tjtradehub.com.</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>2. Description of Service</h2>
            <p>TJ TradeHub is a trading journal and performance analytics platform designed for individual traders. The Service allows users to log trades, analyze performance metrics, and connect their MetaTrader 4/5 accounts for automatic trade synchronization.</p>
            <p className="mt-3" style={{ color: "#6B7280", fontStyle: "italic", fontSize: "13px" }}>
              ⚠️ TJ TradeHub is a journaling and analytics tool only. We do not provide financial advice, investment recommendations, or trading signals. Past performance data shown in the platform does not guarantee future results. Trading involves significant risk of loss.
            </p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>3. Account Registration</h2>
            <p>To use the Service, you must create an account. You agree to provide accurate and complete information and to keep your account credentials secure. You are responsible for all activity that occurs under your account. You must be at least 18 years old to use the Service.</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>4. Free Trial & Subscription</h2>
            <p>New users receive a 7-day free trial with full access to all features. No credit card is required for the trial. After the trial period, continued access requires a paid subscription at $29 per month.</p>
            <p className="mt-3">Subscriptions are billed monthly and renew automatically unless cancelled. You may cancel at any time through your account settings. No refunds are issued for partial billing periods.</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>5. MetaTrader Integration</h2>
            <p>When you connect a MetaTrader account, you provide your broker login credentials to enable trade synchronization. By doing so, you authorize TJ TradeHub to access your trading history in read-only mode via MetaAPI.cloud. We do not place trades, modify positions, or access funds on your behalf. You may disconnect your account at any time.</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>6. Data & Privacy</h2>
            <p>We collect and store trading data, account information, and usage data as described in our Privacy Policy. Your data is stored securely and is never sold to third parties. You retain ownership of your trading data and may request deletion of your account and all associated data at any time by contacting us.</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>7. Acceptable Use</h2>
            <p>You agree not to use the Service to:</p>
            <ul className="mt-2 flex flex-col gap-1" style={{ paddingLeft: "20px", listStyleType: "disc" }}>
              <li>Violate any applicable law or regulation</li>
              <li>Attempt to gain unauthorized access to the platform or other users&apos; accounts</li>
              <li>Reverse engineer, decompile, or disassemble the Service</li>
              <li>Use the Service for commercial resale without written permission</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>8. Disclaimer of Warranties</h2>
            <p>The Service is provided &quot;as is&quot; without warranties of any kind. TJ TradeHub does not guarantee that the Service will be uninterrupted, error-free, or that data shown is always accurate. We are not liable for any trading decisions made based on data displayed within the platform.</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, TJ TradeHub shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to trading losses, lost profits, or data loss.</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>10. Changes to Terms</h2>
            <p>We may update these Terms of Service from time to time. Continued use of the Service after changes constitutes acceptance of the new terms. We will notify registered users of significant changes via email.</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>11. Governing Law</h2>
            <p>These Terms are governed by the laws of Switzerland. Any disputes shall be subject to the exclusive jurisdiction of the courts of Switzerland.</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>12. Contact</h2>
            <p>For questions about these Terms, please contact us at: <a href="mailto:support@tjtradehub.com" style={{ color: "#8B5CF6" }}>support@tjtradehub.com</a></p>
          </section>

        </div>
      </div>
    </div>
  );
}
