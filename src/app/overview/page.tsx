"use client";

import HeroSection from "../../components/overview/HeroSection";
import SprintSection from "../../components/overview/SprintSection";
import MarketRankSection from "../../components/overview/MarketRankSection";
import PlatformVisSection from "../../components/overview/PlatformVisSection";
import SourcesSection from "../../components/overview/SourcesSection";
import CitationBand from "../../components/overview/CitationBand";
import AuditBreakdown from "../../components/overview/AuditBreakdown";

export default function OverviewPage() {
  return (
    <div className="space-y-5 pb-10">
      <HeroSection />
      <SprintSection />

      {/* Three Column Row — stacks to 1 col on mobile, 3 on lg */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        <MarketRankSection />
        <PlatformVisSection />
        <SourcesSection />
      </div>

      <CitationBand />
      <AuditBreakdown />
    </div>
  );
}
