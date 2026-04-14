import { useMemo, useState } from "react";
import { useGetAssetsQuery, useGetProfitSummaryQuery } from "@/features/api/apiSlice";
import { LandingHeader } from "@/components/sections/public/LandingHeader";
import { HeroSection } from "@/components/sections/public/HeroSection";
import { ValuePillarsSection } from "@/components/sections/public/ValuePillarsSection";
import { HowItWorksSection } from "@/components/sections/public/HowItWorksSection";
import { AssetCategoriesSection } from "@/components/sections/public/AssetCategoriesSection";
import { CalculatorSection } from "@/components/sections/public/CalculatorSection";
import { FeaturedAssetsSection } from "@/components/sections/public/FeaturedAssetsSection";
import { GovernanceSection } from "@/components/sections/public/GovernanceSection";
import { TestimonialsSection } from "@/components/sections/public/TestimonialsSection";
import { FaqSection } from "@/components/sections/public/FaqSection";
import { ContactCtaSection } from "@/components/sections/public/ContactCtaSection";
import { LandingFooter } from "@/components/sections/public/LandingFooter";
import { useTheme } from "@/context/ThemeProvider";

const formatCurrency = (value) => {
  const number = Number(value) || 0;
  return `$${number.toLocaleString()}`;
};

export const LandingPage = () => {
  const { data: assetsResponse } = useGetAssetsQuery();
  const { data: profitResponse } = useGetProfitSummaryQuery();
  const { isDark, toggleTheme } = useTheme();

  const [shares, setShares] = useState(5);
  const [pricePerShare, setPricePerShare] = useState(250);
  const [roiRate, setRoiRate] = useState(14);

  const assets = assetsResponse?.data || [];
  const totalDistributed = profitResponse?.data?.totalDistributed || 0;

  const projectedReturn = useMemo(() => {
    const investment = shares * pricePerShare;
    const annualReturn = investment * (roiRate / 100);
    return Math.round(annualReturn / 12);
  }, [shares, pricePerShare, roiRate]);

  const metrics = useMemo(
    () => [
      {
        label: "Listed Assets",
        labelBn: "তালিকাভুক্ত অ্যাসেট",
        value: assets.length > 0 ? String(assets.length) : "12+",
      },
      {
        label: "Target Annual ROI",
        labelBn: "লক্ষ্যমাত্রা বার্ষিক ROI",
        value: "14.8%",
      },
      {
        label: "Distributed Profit",
        labelBn: "বণ্টিত মুনাফা",
        value: totalDistributed > 0 ? formatCurrency(totalDistributed) : "$1.2M",
      },
    ],
    [assets.length, totalDistributed]
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingHeader isDark={isDark} onToggleTheme={toggleTheme} />
      <main>
        <HeroSection metrics={metrics} />
        <ValuePillarsSection />
        <HowItWorksSection />
        <AssetCategoriesSection />

        <section className="mx-auto grid max-w-6xl gap-4 px-4 pb-14 lg:grid-cols-[1fr,1fr]">
          <CalculatorSection
            shares={shares}
            pricePerShare={pricePerShare}
            roiRate={roiRate}
            onSharesChange={setShares}
            onPricePerShareChange={setPricePerShare}
            onRoiRateChange={setRoiRate}
            projectedReturn={projectedReturn}
          />
          <FeaturedAssetsSection assets={assets} />
        </section>

        <GovernanceSection />
        <TestimonialsSection />
        <FaqSection />
        <ContactCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
};
