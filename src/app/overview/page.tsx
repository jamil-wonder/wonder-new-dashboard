"use client";

import { useEffect, useState } from "react";
import { useBusiness } from "../../context/BusinessContext";
import HeroSection from "../../components/overview/HeroSection";
import SprintSection from "../../components/overview/SprintSection";
import MarketRankSection from "../../components/overview/MarketRankSection";
import PlatformVisSection from "../../components/overview/PlatformVisSection";
import SourcesSection from "../../components/overview/SourcesSection";
import CitationBand from "../../components/overview/CitationBand";
import AuditBreakdown from "../../components/overview/AuditBreakdown";
import OverviewSkeleton from "../../components/overview/OverviewSkeleton";
import { useOverviewData } from "../../hooks/useOverviewData";
import { fetchApi } from "../../lib/api";
import Link from "next/link";
import { ArrowRight, SearchCheck, Sparkles } from "lucide-react";

type OverviewBlogDraft = {
  title: string;
  excerpt?: string;
  metaDescription?: string;
  sections?: unknown[];
  keywords?: string[];
  humanizedScore?: number;
  score?: number;
  wordCount?: number;
};

export default function OverviewPage() {
  const { activeBusiness, isLoading: isBusinessLoading } = useBusiness();
  const overviewData = useOverviewData(activeBusiness?.url || "");
  const [weeklyBlogDrafts, setWeeklyBlogDrafts] = useState<OverviewBlogDraft[]>([]);
  const [isBlogLoading, setIsBlogLoading] = useState(true);
  const [showInitialSkeleton, setShowInitialSkeleton] = useState(true);

  useEffect(() => {
    setShowInitialSkeleton(true);
    const timer = window.setTimeout(() => setShowInitialSkeleton(false), 450);
    return () => window.clearTimeout(timer);
  }, [activeBusiness?.id]);

  useEffect(() => {
    let cancelled = false;

    const loadWeeklyBlogs = async () => {
      const businessId = activeBusiness?.id || "";
      if (!/^[0-9a-fA-F]{24}$/.test(businessId)) {
        setWeeklyBlogDrafts([]);
        setIsBlogLoading(false);
        return;
      }

      try {
        setIsBlogLoading(true);
        const res = await fetchApi<any>(`/api/blogs/weekly?business_id=${encodeURIComponent(businessId)}`);
        if (cancelled) return;

        const drafts = Array.isArray(res?.weekly?.drafts) ? res.weekly.drafts : [];
        setWeeklyBlogDrafts(drafts.slice(0, 2));
      } catch {
        if (!cancelled) setWeeklyBlogDrafts([]);
      } finally {
        if (!cancelled) setIsBlogLoading(false);
      }
    };

    loadWeeklyBlogs();

    return () => {
      cancelled = true;
    };
  }, [activeBusiness?.id]);

  const enrichedData = {
    ...overviewData,
    location: overviewData.location || activeBusiness?.location || "",
    blogDrafts: weeklyBlogDrafts.length > 0 ? weeklyBlogDrafts : overviewData.blogDrafts,
  };

  const hasAnyOverviewData =
    enrichedData.hasAnalyserData ||
    enrichedData.hasQueryData ||
    enrichedData.blogDrafts.length > 0;

  if (isBusinessLoading || showInitialSkeleton || (isBlogLoading && !hasAnyOverviewData)) {
    return <OverviewSkeleton />;
  }

  return (
    <div className="space-y-5 pb-10">
      <HeroSection data={enrichedData} />

      {!hasAnyOverviewData && (
        <div className="bg-white border border-[#ece3d1] rounded-[16px] p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#eef3f0] border border-[#d0e4d6] text-[#15463b] flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="font-spectral text-[20px] font-semibold text-[#15463b]">No overview data yet</div>
                <p className="mt-1 text-[13px] leading-relaxed text-[#6f6757] max-w-[620px]">
                  Start with a website scan, then run Query to fill the market, AI visibility, sources, and weekly action sections.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/analyser"
                className="inline-flex items-center justify-center gap-1.5 rounded-[9px] bg-[#15463b] px-4 py-2.5 text-[12.5px] font-semibold text-white hover:bg-[#10362d]"
              >
                Run Analyser <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/query"
                className="inline-flex items-center justify-center gap-1.5 rounded-[9px] border border-[#d8cfbd] bg-white px-4 py-2.5 text-[12.5px] font-semibold text-[#23211b] hover:bg-[#f5f0e6]"
              >
                <SearchCheck className="w-3.5 h-3.5" /> Open Query
              </Link>
            </div>
          </div>
        </div>
      )}

      <SprintSection data={enrichedData} businessName={activeBusiness?.name} />

      {/* Three Column Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        <MarketRankSection data={enrichedData} url={activeBusiness?.url || ""} businessName={activeBusiness?.name || ""} location={activeBusiness?.location || ""} competitors={activeBusiness?.competitors || []} />
        <PlatformVisSection data={enrichedData} />
        <SourcesSection data={enrichedData} />
      </div>

      <CitationBand data={enrichedData} />
      <AuditBreakdown data={enrichedData} />
    </div>
  );
}
