import HeroV2 from "@/components/v2/HeroV2";
import LogoMarquee from "@/components/v2/LogoMarquee";
import StatsCounter from "@/components/v2/StatsCounter";
import BentoFeatures from "@/components/v2/BentoFeatures";
import HowItWorks from "@/components/v2/HowItWorks";
import TestimonialsMarquee from "@/components/v2/TestimonialsMarquee";
import PricingV2 from "@/components/v2/PricingV2";
import FAQ from "@/components/v2/FAQ";
import FinalCTAV2 from "@/components/v2/FinalCTAV2";
import FooterV2 from "@/components/v2/FooterV2";

export default function V2Page() {
  return (
    <>
      <main>
        <HeroV2 />
        <LogoMarquee />
        <StatsCounter />
        <BentoFeatures />
        <HowItWorks />
        <TestimonialsMarquee />
        <PricingV2 />
        <FAQ />
        <FinalCTAV2 />
      </main>
      <FooterV2 />
    </>
  );
}
