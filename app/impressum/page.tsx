import Link from "next/link";

export const metadata = {
  title: "Legal Notice – TJ TradeHub",
};

export default function ImpressumPage() {
  return (
    <div style={{ backgroundColor: "#000000", minHeight: "100vh" }}>
      <div className="mx-auto px-6 py-16" style={{ maxWidth: "800px" }}>
        <Link href="/" style={{ color: "#8B5CF6", fontSize: "14px", textDecoration: "none" }}>
          ← Back to Home
        </Link>

        <h1 className="text-4xl font-bold mt-8 mb-2" style={{ color: "#F9FAFB" }}>
          Legal Notice
        </h1>
        <p style={{ color: "#6B7280", fontSize: "14px", marginBottom: "48px" }}>
          Impressum / Angaben gemäss Art. 3 Abs. 1 UWG (Switzerland)
        </p>

        <div className="flex flex-col gap-10" style={{ color: "#9CA3AF", lineHeight: "1.8" }}>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>Responsible Operators</h2>
            <div className="p-5 rounded-xl" style={{ backgroundColor: "#0D1117", border: "1px solid #1F2937" }}>
              <p style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "16px" }}>TJ TradeHub</p>
              <p className="mt-3" style={{ color: "#F9FAFB" }}>Timo Lieberherr &amp; Julien Pircher</p>
              <p>Walkistrasse 37</p>
              <p>4658 Däniken</p>
              <p>Switzerland</p>
              <p className="mt-3">
                Email: <a href="mailto:support@tjtradehub.com" style={{ color: "#8B5CF6" }}>support@tjtradehub.com</a>
              </p>
              <p className="mt-1">Website: <a href="https://www.tjtradehub.com" style={{ color: "#8B5CF6" }}>www.tjtradehub.com</a></p>
            </div>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>Nature of Business</h2>
            <p>TJ TradeHub is a software-as-a-service (SaaS) platform operated by private individuals. TJ TradeHub is not a registered company and is not entered in the Swiss commercial register (Handelsregister).</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>Disclaimer – No Financial Advice</h2>
            <div className="p-4 rounded-xl" style={{ backgroundColor: "#0D1117", border: "1px solid #292524" }}>
              <p>TJ TradeHub is an analytics and journaling tool for individual traders. <strong style={{ color: "#F9FAFB" }}>We do not provide financial advice, investment recommendations, or trading signals.</strong></p>
              <p className="mt-3">All information displayed within the platform reflects historical trading data entered by the user. Past performance does not guarantee future results. Trading financial instruments involves significant risk of loss and may not be suitable for all investors. You are solely responsible for your own trading decisions.</p>
              <p className="mt-3">TJ TradeHub is not regulated by FINMA (Swiss Financial Market Supervisory Authority), the FCA, BaFin, or any other financial authority. We are not a broker, investment adviser, or financial intermediary.</p>
            </div>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>Disclaimer – Liability</h2>
            <p>Despite careful content control, we assume no liability for the content of external links. The operators of linked pages are solely responsible for their content.</p>
            <p className="mt-3">TJ TradeHub makes no guarantee regarding the accuracy, completeness, or timeliness of information provided within the platform. Use of the Service is at your own risk.</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>Copyright</h2>
            <p>All content published on tjtradehub.com (texts, graphics, logos, code) is the intellectual property of TJ TradeHub unless otherwise stated. Reproduction or distribution without prior written consent is prohibited.</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>Applicable Law</h2>
            <p>This website is operated from Switzerland. All legal relationships arising from the use of this website are subject to Swiss law, excluding international private law provisions.</p>
          </section>

          <section>
            <h2 style={{ color: "#F9FAFB", fontSize: "20px", fontWeight: 600, marginBottom: "12px" }}>Contact for Legal Matters</h2>
            <p>For legal inquiries, please contact: <a href="mailto:support@tjtradehub.com" style={{ color: "#8B5CF6" }}>support@tjtradehub.com</a></p>
          </section>

        </div>
      </div>
    </div>
  );
}
