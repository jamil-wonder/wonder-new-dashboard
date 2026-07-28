"use client";

import { useBusiness } from "../../context/BusinessContext";
import HeroSection from "../../components/overview/HeroSection";
import SprintSection from "../../components/overview/SprintSection";
import MarketRankSection from "../../components/overview/MarketRankSection";
import PlatformVisSection from "../../components/overview/PlatformVisSection";
import SourcesSection from "../../components/overview/SourcesSection";
import CitationBand from "../../components/overview/CitationBand";
import AuditBreakdown from "../../components/overview/AuditBreakdown";
import { useOverviewData } from "../../hooks/useOverviewData";

export default function OverviewPage() {
  const { activeBusiness } = useBusiness();
  const overviewData = useOverviewData(activeBusiness?.url || "");
  const enrichedData = {
    ...overviewData,
    location: overviewData.location || activeBusiness?.location || "",
  };

  return (
    <div className="space-y-5 pb-10">
      <HeroSection data={enrichedData} />
      <SprintSection data={overviewData} businessName={activeBusiness?.name} />

      {/* Three Column Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        <MarketRankSection data={overviewData} />
        <PlatformVisSection data={overviewData} />
        <SourcesSection data={overviewData} />
      </div>

      <CitationBand data={overviewData} />
      <AuditBreakdown data={overviewData} />
    </div>
  );
}
