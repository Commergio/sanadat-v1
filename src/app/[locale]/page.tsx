import { MarketingHeader } from "@/components/layout/marketing-header";
import { MarketingFooter } from "@/components/layout/marketing-footer";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { ShowcaseSection } from "@/components/landing/showcase-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { FaqSection } from "@/components/landing/faq-section";
import { CtaSection } from "@/components/landing/cta-section";
import { FloatingSupport } from "@/components/shared/floating-support";

export default function LandingPage() {
  return (
    <>
      <MarketingHeader />
      <main className="marketing-shell min-w-0">
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <ShowcaseSection />
        <PricingSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection />
      </main>
      <MarketingFooter />
      <FloatingSupport />
    </>
  );
}
