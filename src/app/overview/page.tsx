"use client";

import { useEffect, useMemo, useState } from "react";
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
import { buildRankedCompetitors } from "../../lib/competitorRanking";
import { fetchApi } from "../../lib/api";
import Link from "next/link";
import { ArrowRight, SearchCheck, Sparkles } from "lucide-react";

function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

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
  const { activeBusiness, isLoading: isBusinessLoading, liveDeepCompetitors } = useBusiness();
  // liveDeepCompetitors updates the instant a Query run finishes for this
  // business — passing it through forces useOverviewData to re-read the
  // query cache instead of staying frozen at whatever it computed the
  // first time this hook ran (see the hook's own comment for why).
  const overviewData = useOverviewData(activeBusiness?.url || "", liveDeepCompetitors);

  // Reads the EXACT same liveDeepCompetitors value Query does (see
  // BusinessContext) instead of a separately-fetched, separately-merged
  // backend snapshot. Query and Overview are now structurally guaranteed
  // to agree — there's no second data source that can drift or race.
  // Deliberate consequence: if no Query run has happened yet this session
  // for the active business, this is correctly empty rather than showing
  // an old "last known" list — competitors only ever appear once actually
  // discovered.
  const competitorRows = useMemo(() => buildRankedCompetitors(liveDeepCompetitors), [liveDeepCompetitors]);
  const userRow = competitorRows.find((c) => c.isUser) || null;
  const nearestAbove = userRow && userRow.rank > 1 ? competitorRows[userRow.rank - 2] : null;

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
      // Clear immediately — the previous business's blog drafts otherwise
      // stay visible (mislabeled) until this fetch resolves.
      setWeeklyBlogDrafts([]);
      if (!/^[0-9a-fA-F]{24}$/.test(businessId)) {
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

  const nearestAboveName = nearestAbove?.name || null;
  const nearestAboveGap = nearestAbove && userRow ? nearestAbove.score - userRow.score : null;

  const quickWins = [...overviewData.quickWins];
  if (nearestAboveName && nearestAboveGap !== null && nearestAboveGap <= 10) {
    quickWins.push({
      text: `You're only ${nearestAboveGap} points behind ${nearestAboveName}. One good week can close the gap.`,
      type: "info",
    });
  }

  const enrichedData = {
    ...overviewData,
    location: overviewData.location || activeBusiness?.location || "",
    blogDrafts: weeklyBlogDrafts.length > 0 ? weeklyBlogDrafts : overviewData.blogDrafts,
    competitors: competitorRows,
    userRank: userRow?.rank ?? 1,
    userRankOrdinal: ordinal(userRow?.rank ?? 1),
    nearestAboveName,
    nearestAboveGap,
    quickWins,
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
        <MarketRankSection rows={competitorRows} />
        <PlatformVisSection data={enrichedData} />
        <SourcesSection data={enrichedData} />
      </div>

      <CitationBand data={enrichedData} />
      <AuditBreakdown data={enrichedData} />
    </div>
  );
}
