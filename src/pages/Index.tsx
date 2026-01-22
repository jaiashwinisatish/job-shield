import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/landing/HeroSection";
import TrustBadges from "@/components/landing/TrustBadges";
import HowItWorks from "@/components/landing/HowItWorks";
import QuickTips from "@/components/landing/QuickTips";
import ExtensionPromo from "@/components/landing/ExtensionPromo";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <TrustBadges />
      <HowItWorks />
      <QuickTips />
      <ExtensionPromo />
    </Layout>
  );
};

export default Index;
