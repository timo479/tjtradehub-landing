import Link from "next/link";
import Header from "@/components/Header";
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
          className="mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ maxWidth: "1200px" }}
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
      </footer>
    </>
  );
}
