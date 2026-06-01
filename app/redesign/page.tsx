import type { Metadata } from "next";
import NavR from "@/components/redesign/NavR";
import HeroR from "@/components/redesign/HeroR";
import TrustStrip from "@/components/redesign/TrustStrip";
import HowItWorks from "@/components/redesign/HowItWorks";
import BentoFeatures from "@/components/redesign/BentoFeatures";
import MetaSync from "@/components/redesign/MetaSync";
import PricingR from "@/components/redesign/PricingR";
import FaqR from "@/components/redesign/FaqR";
import FinalCtaR from "@/components/redesign/FinalCtaR";
import FooterR from "@/components/redesign/FooterR";

export const metadata: Metadata = {
  title: "Redesign Preview · TJ TradeHub",
  robots: { index: false, follow: false },
};

export default function RedesignPage() {
  return (
    <div style={{ backgroundColor: "#000", color: "#F4F4F5", minHeight: "100vh" }}>
      <NavR />
      <main>
        <HeroR />
        <TrustStrip />
        <HowItWorks />
        <BentoFeatures />
        <MetaSync />
        <PricingR />
        <FaqR />
        <FinalCtaR />
      </main>
      <FooterR />
    </div>
  );
}
