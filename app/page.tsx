import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Best Trading Journal for Forex & Futures Traders | TJ TradeHub",
  alternates: {
    canonical: "https://www.tjtradehub.com",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "TJ TradeHub",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web, Browser",
  url: "https://www.tjtradehub.com",
  description:
    "Advanced trading journal for system-based Forex and Futures traders. Track performance, analyze execution quality, and improve trading discipline.",
  offers: {
    "@type": "Offer",
    price: "29",
    priceCurrency: "CHF",
  },
  featureList: [
    "MT5 & MT4 Trade Import",
    "Performance Analytics Dashboard",
    "Discipline Score Tracking",
    "Trade Calendar",
    "Forex Trading Journal",
    "Futures Trading Journal",
    "Trading Performance Tracker",
  ],
};
import Hero from "@/components/Hero";
import MT5Section from "@/components/MT5Section";
import ProblemSection from "@/components/ProblemSection";
import DifferentiatorSection from "@/components/DifferentiatorSection";
import BuiltForSection from "@/components/BuiltForSection";
import PricingSection from "@/components/PricingSection";
import AboutSection from "@/components/AboutSection";
import FinalCTA from "@/components/FinalCTA";

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main>
        <Hero />
        <MT5Section />
        <ProblemSection />
        <DifferentiatorSection />
        <BuiltForSection />
        <PricingSection />
        <AboutSection />
        <FinalCTA />
      </main>
      <footer
        style={{
          backgroundColor: "#000000",
          borderTop: "1px solid #1F2937",
        }}
      >
        <div
          className="mx-auto px-6 pt-8 pb-4"
          style={{ maxWidth: "1200px" }}
        >
          {/* SEO Internal Links */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-3">
            <span className="text-xs font-medium" style={{ color: "#6B7280" }}>Trading Journals:</span>
            <Link href="/trading-journal" className="footer-link text-xs transition-colors duration-200" style={{ color: "#6B7280" }}>Trading Journal</Link>
            <Link href="/forex-trading-journal" className="footer-link text-xs transition-colors duration-200" style={{ color: "#6B7280" }}>Forex Trading Journal</Link>
            <Link href="/futures-trading-journal" className="footer-link text-xs transition-colors duration-200" style={{ color: "#6B7280" }}>Futures Trading Journal</Link>
            <Link href="/mt5-trading-journal" className="footer-link text-xs transition-colors duration-200" style={{ color: "#6B7280" }}>MT5 Trading Journal</Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
            <span className="text-xs font-medium" style={{ color: "#6B7280" }}>Guides:</span>
            <Link href="/what-is-a-trading-journal" className="footer-link text-xs transition-colors duration-200" style={{ color: "#6B7280" }}>What Is a Trading Journal</Link>
            <Link href="/how-to-use-a-trading-journal" className="footer-link text-xs transition-colors duration-200" style={{ color: "#6B7280" }}>How to Use a Trading Journal</Link>
            <Link href="/forex-trading-journal-guide" className="footer-link text-xs transition-colors duration-200" style={{ color: "#6B7280" }}>Forex Journal Guide</Link>
            <Link href="/trading-performance-tracking" className="footer-link text-xs transition-colors duration-200" style={{ color: "#6B7280" }}>Performance Tracking</Link>
          </div>
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4"
            style={{ borderTop: "1px solid #111827" }}
          >
            <p className="text-sm" style={{ color: "#9CA3AF" }}>
              © 2026 TJ TradeHub. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="footer-link text-sm transition-colors duration-200" style={{ color: "#9CA3AF" }}>Privacy Policy</a>
              <Link href="/terms" className="footer-link text-sm transition-colors duration-200" style={{ color: "#9CA3AF" }}>Terms of Service</Link>
              <a href="mailto:support@tjtradehub.com" className="footer-link text-sm transition-colors duration-200" style={{ color: "#9CA3AF" }}>Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
