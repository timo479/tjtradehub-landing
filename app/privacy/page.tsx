import Link from "next/link";

export const metadata = {
  title: "Privacy Policy – TJ TradeHub",
};

export default function PrivacyPage() {
  return (
    <div style={{ backgroundColor: "#000000", minHeight: "100vh" }}>
      <div className="mx-auto px-6 py-16" style={{ maxWidth: "800px" }}>
        <Link href="/" style={{ color: "#8B5CF6", fontSize: "14px", textDecoration: "none" }}>
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mt-8 mb-2" style={{ color: "#F9FAFB" }}>
          Privacy Policy
        </h1>
        <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "48px" }}>
          Last updated: March 2026
        </p>

        <div className="flex flex-col gap-10" style={{ color: "#9CA3AF", lineHeight: "1.8" }}>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>1. Data Controller</h2>
            <p>The responsible party for data processing in connection with TJ TradeHub is:</p>
            <div className="mt-3 p-4 rounded-xl" style={{ backgroundColor: "#0D1117", border: "1px solid #1F2937" }}>
              <p style={{ color: "#F9FAFB" }}>Timo Lieberherr &amp; Julien Pircher</p>
              <p>Walkistrasse 37</p>
              <p>4658 Däniken</p>
              <p>Switzerland</p>
              <p className="mt-2">
                <a href="mailto:support@tjtradehub.com" style={{ color: "#8B5CF6" }}>support@tjtradehub.com</a>
              </p>
            </div>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>2. What Data We Collect</h2>
            <p>We collect the following categories of personal data:</p>
            <ul className="mt-3 flex flex-col gap-2" style={{ paddingLeft: "20px", listStyleType: "disc" }}>
              <li><span style={{ color: "#F9FAFB" }}>Account data:</span> Email address, display name, encrypted password (stored as a secure hash via Supabase Auth)</li>
              <li><span style={{ color: "#F9FAFB" }}>Trading journal data:</span> Trade entries, notes, performance metrics, and custom fields you enter manually</li>
              <li><span style={{ color: "#F9FAFB" }}>MetaTrader credentials:</span> Broker login credentials provided when connecting a MetaTrader account. These are transmitted to MetaAPI.cloud for read-only trade synchronization and are not stored on our servers in plaintext</li>
              <li><span style={{ color: "#F9FAFB" }}>Subscription data:</span> Billing status, subscription start/end dates. Payment details (card numbers, billing address) are processed exclusively by Stripe and never stored on our servers</li>
              <li><span style={{ color: "#F9FAFB" }}>Usage data:</span> Last activity timestamps used to manage MetaTrader connection efficiency</li>
              <li><span style={{ color: "#F9FAFB" }}>Technical data:</span> Session cookies required for authentication</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>3. Purpose and Legal Basis</h2>
            <p>We process your data for the following purposes:</p>
            <ul className="mt-3 flex flex-col gap-2" style={{ paddingLeft: "20px", listStyleType: "disc" }}>
              <li><span style={{ color: "#F9FAFB" }}>Providing the Service:</span> Account management, journal functionality, MetaTrader synchronization (legal basis: contract performance)</li>
              <li><span style={{ color: "#F9FAFB" }}>Payment processing:</span> Billing and subscription management via Stripe (legal basis: contract performance)</li>
              <li><span style={{ color: "#F9FAFB" }}>Transactional emails:</span> Account verification, password reset, billing notifications (legal basis: contract performance)</li>
              <li><span style={{ color: "#F9FAFB" }}>Service improvement:</span> Anonymous usage analytics to improve platform performance (legal basis: legitimate interest)</li>
              <li><span style={{ color: "#F9FAFB" }}>Cookies:</span> Essential session cookies for authentication (legal basis: legitimate interest / consent)</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>4. Third-Party Service Providers</h2>
            <p>We use the following third-party processors to operate TJ TradeHub. All providers are bound by data processing agreements:</p>
            <div className="mt-4 flex flex-col gap-3">
              {[
                { name: "Supabase (Supabase Inc., USA)", role: "Database and user authentication. Data stored in EU (Frankfurt) region.", link: "https://supabase.com/privacy" },
                { name: "Stripe (Stripe Inc., USA)", role: "Payment processing and subscription management. Subject to PCI-DSS compliance.", link: "https://stripe.com/privacy" },
                { name: "MetaAPI.cloud (MetaQuotes Software Corp.)", role: "MetaTrader account synchronization. Broker credentials are transmitted to MetaAPI for read-only trade data access.", link: "https://metaapi.cloud/privacy-policy" },
                { name: "Resend / Amazon SES (AWS, USA)", role: "Transactional email delivery (verification, password reset, billing).", link: "https://resend.com/privacy" },
                { name: "Vercel Inc. (USA)", role: "Web hosting and application delivery.", link: "https://vercel.com/legal/privacy-policy" },
              ].map((p) => (
                <div key={p.name} className="p-4 rounded-xl" style={{ backgroundColor: "#0D1117", border: "1px solid #1F2937" }}>
                  <p style={{ color: "#F9FAFB", fontWeight: 500 }}>{p.name}</p>
                  <p className="text-sm mt-1">{p.role}</p>
                  <a href={p.link} target="_blank" rel="noopener noreferrer" style={{ color: "#8B5CF6", fontSize: "12px" }}>Privacy Policy →</a>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>5. Data Transfers Outside Switzerland / EU</h2>
            <p>Some of our service providers are based in the United States. Data transfers to the US are carried out on the basis of Standard Contractual Clauses (SCCs) approved by the European Commission and recognised by the Swiss Federal Data Protection and Information Commissioner (FDPIC). By using TJ TradeHub, you acknowledge that your data may be processed in the US under these safeguards.</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>6. Data Retention</h2>
            <ul className="flex flex-col gap-2" style={{ paddingLeft: "20px", listStyleType: "disc" }}>
              <li>Account and journal data is retained for as long as your account is active</li>
              <li>Upon account deletion, all personal data is permanently deleted within 30 days</li>
              <li>Billing records are retained for 10 years as required by Swiss accounting law (OR Art. 958f)</li>
              <li>MetaTrader credentials are removed from MetaAPI upon account disconnection or subscription cancellation</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>7. Cookies and Local Storage</h2>
            <p>TJ TradeHub uses the following:</p>
            <ul className="mt-3 flex flex-col gap-2" style={{ paddingLeft: "20px", listStyleType: "disc" }}>
              <li><span style={{ color: "#F9FAFB" }}>Authentication cookies:</span> Strictly necessary session tokens to keep you logged in. These cannot be disabled without breaking core functionality</li>
              <li><span style={{ color: "#F9FAFB" }}>Cookie consent preference:</span> Stored in localStorage to remember your cookie choice</li>
            </ul>
            <p className="mt-3">We do not use third-party tracking cookies, advertising pixels, or Google Analytics.</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>8. Your Rights</h2>
            <p>Under GDPR (for EU users) and the Swiss nDSG (Federal Act on Data Protection), you have the following rights:</p>
            <ul className="mt-3 flex flex-col gap-2" style={{ paddingLeft: "20px", listStyleType: "disc" }}>
              <li><span style={{ color: "#F9FAFB" }}>Right of access:</span> Request a copy of all personal data we hold about you</li>
              <li><span style={{ color: "#F9FAFB" }}>Right to rectification:</span> Request correction of inaccurate data</li>
              <li><span style={{ color: "#F9FAFB" }}>Right to erasure:</span> Request deletion of your account and all associated data</li>
              <li><span style={{ color: "#F9FAFB" }}>Right to data portability:</span> Request your trading data in a machine-readable format</li>
              <li><span style={{ color: "#F9FAFB" }}>Right to restriction:</span> Request that we limit processing of your data</li>
              <li><span style={{ color: "#F9FAFB" }}>Right to object:</span> Object to processing based on legitimate interests</li>
            </ul>
            <p className="mt-4">To exercise any of these rights, contact us at <a href="mailto:support@tjtradehub.com" style={{ color: "#8B5CF6" }}>support@tjtradehub.com</a>. We will respond within 30 days.</p>
            <p className="mt-3">You also have the right to lodge a complaint with the Swiss Federal Data Protection and Information Commissioner (FDPIC) at <a href="https://www.edoeb.admin.ch" target="_blank" rel="noopener noreferrer" style={{ color: "#8B5CF6" }}>www.edoeb.admin.ch</a>.</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>9. Data Security</h2>
            <p>We implement appropriate technical and organisational measures to protect your data, including:</p>
            <ul className="mt-3 flex flex-col gap-2" style={{ paddingLeft: "20px", listStyleType: "disc" }}>
              <li>All data transmitted via HTTPS/TLS encryption</li>
              <li>Passwords stored as secure hashes (never in plaintext)</li>
              <li>Access to production systems restricted to authorised operators</li>
              <li>Payment processing handled entirely by Stripe (PCI-DSS Level 1 certified)</li>
            </ul>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>10. No Sale of Data</h2>
            <p>We do not sell, rent, or trade your personal data to any third parties for commercial purposes. Your trading data belongs to you.</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify registered users of material changes via email. Continued use of the Service after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>12. Contact</h2>
            <p>For any privacy-related questions or data requests, please contact us at:</p>
            <p className="mt-2"><a href="mailto:support@tjtradehub.com" style={{ color: "#8B5CF6" }}>support@tjtradehub.com</a></p>
          </section>

        </div>
      </div>
    </div>
  );
}
