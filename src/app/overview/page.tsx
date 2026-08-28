"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bot, Search, ArrowRight, RefreshCw } from "lucide-react";
import { useBusiness } from "../../context/BusinessContext";
import { useToast } from "../../context/ToastContext";
import HeroSection from "../../components/overview/HeroSection";
import SprintSection from "../../components/overview/SprintSection";
import MarketRankSection from "../../components/overview/MarketRankSection";
import PlatformVisSection from "../../components/overview/PlatformVisSection";
import SourcesSection from "../../components/overview/SourcesSection";
import CitationBand from "../../components/overview/CitationBand";
import AuditBreakdown from "../../components/overview/AuditBreakdown";
import TrainProfileSection from "../../components/overview/TrainProfileSection";
import OverviewSkeleton from "../../components/overview/OverviewSkeleton";
import { useOverviewData } from "../../hooks/useOverviewData";
import { buildRankedCompetitors } from "../../lib/competitorRanking";
import { fetchApi } from "../../lib/api";

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
  const { showToast } = useToast();
  const [isRunningNow, setIsRunningNow] = useState(false);

  const handleRunNow = async () => {
    if (!activeBusiness?.id || isRunningNow) return;
    setIsRunningNow(true);
    try {
      const res = await fetchApi<{ success: boolean; message?: string }>(
        `/api/user/businesses/${activeBusiness.id}/run-now`,
        { method: "POST" }
      );
      showToast(res?.message || "Your update is running now — this can take a few minutes.", "success");
    } catch (err: any) {
      if (err?.status === 429) {
        showToast("You've already run this today — try again tomorrow.", "info");
      } else {
        showToast("Couldn't start the update. Please try again.", "error");
      }
    } finally {
      // Stays disabled for a beat rather than snapping back immediately —
      // the real work continues for minutes in the background regardless,
      // this just prevents an accidental instant double-click.
      setTimeout(() => setIsRunningNow(false), 4000);
    }
  };
  // liveDeepCompetitors updates the instant a Query run finishes for this
  // business — passing it through forces useOverviewData to re-read the
  // query cache instead of staying frozen at whatever it computed the
  // first time this hook ran (see the hook's own comment for why).
  const overviewData = useOverviewData(activeBusiness?.url || "", liveDeepCompetitors, activeBusiness?.completeness, activeBusiness?.latestPhase1At, activeBusiness?.latestPhase1Score);

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

  // A brand-new business has nothing real to report yet — the weekly-
  // briefing dashboard this page is meant to be doesn't exist as a
  // concept until at least one Analyzer or Search Tracker run has actually
  // produced signal. Showing it anyway (mostly empty cards, a score of 0)
  // reads as broken rather than "not started."
  if (!hasAnyOverviewData) {
    return (
      <div className="bg-white border border-[#ece3d1] rounded-[22px] p-12 text-center shadow-xs my-8 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-[#f6f3ec] border border-[#ece3d1] flex items-center justify-center mb-4">
          <Bot className="w-6 h-6 text-[#9b927f]" />
        </div>
        <div className="font-spectral text-[20px] font-semibold text-[#23211b]">Your dashboard isn't ready yet</div>
        <p className="text-[13.5px] text-[#8a8273] mt-1.5 max-w-[420px]">
          Run the Analyzer or Search Tracker at least once for {activeBusiness?.name || "this business"} — once real results come in, this page fills in with your score, trend, and weekly plan.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <Link
            href="/analyser"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-[#15463b] hover:bg-[#1a5c44] px-4 py-2.5 rounded-lg transition-colors"
          >
            Run Analyzer <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/query"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#15463b] border border-[#ece3d1] hover:bg-[#f6f3ec] px-4 py-2.5 rounded-lg transition-colors"
          >
            <Search className="w-3.5 h-3.5" /> Open Search Tracker
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Part 5 of the flow spec: "No manual runs required (a 'run now'
          exists for the impatient)." Triggers the same full weekly pipeline
          the Sunday scheduler runs for this one business, on demand. */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[12.5px] text-[#8a8273]">
          Your score updates automatically every Sunday night — click run now if you don't want to wait, 1 attempt per day is allowed.
        </p>
        <button
          onClick={handleRunNow}
          disabled={isRunningNow || !activeBusiness?.id}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white bg-[#15463b] hover:bg-[#1a5c44] px-3.5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default"
          title="Re-run today's analysis now instead of waiting for Sunday night"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunningNow ? "animate-spin" : ""}`} />
          {isRunningNow ? "Starting…" : "Run now"}
        </button>
      </div>

      <HeroSection data={enrichedData} />

      <SprintSection data={enrichedData} businessName={activeBusiness?.name} />

      {/* Three Column Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        <MarketRankSection rows={competitorRows} />
        <PlatformVisSection data={enrichedData} />
        <SourcesSection data={enrichedData} />
      </div>

      <CitationBand data={enrichedData} />
      <AuditBreakdown data={enrichedData} />
      <TrainProfileSection business={activeBusiness} />
    </div>
  );
}
