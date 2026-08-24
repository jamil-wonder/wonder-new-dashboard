"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText, Search, Wrench, ArrowRight, CheckCircle2, Circle,
  Building2, Settings, ExternalLink, Mail,
} from "lucide-react";
import BlogReaderModal from "../../components/blogs/BlogReaderModal";
import { useBusiness } from "../../context/BusinessContext";
import { useOverviewData } from "../../hooks/useOverviewData";
import { useToast } from "../../context/ToastContext";
import { fetchApi } from "../../lib/api";

async function getValidMongoBusinessId(business: any): Promise<string | null> {
  if (!business?.url) return null;
  if (business.id && /^[0-9a-fA-F]{24}$/.test(business.id)) {
    return business.id;
  }
  try {
    const res = await fetchApi<any>("/api/user/businesses", {
      method: "POST",
      body: JSON.stringify({
        url: business.url,
        category: business.category || "",
        location: business.location || "",
        businessName: business.name || "",
      }),
    });
    if (res && res.id && /^[0-9a-fA-F]{24}$/.test(res.id)) {
      return res.id;
    }
  } catch (err) {
    console.error("Failed to sync business profile to DB:", err);
  }
  return null;
}

const getWeeklyBlogTaskKey = (businessId: string) => `wonder_blog_weekly_active_${businessId}`;

type PlanAction = {
  id: string;
  kind: "content" | "presence" | "flex";
  categoryLabel: string;
  impact: "High" | "Medium";
  title: string;
  why: string;
  doItYourselfHref?: string;
  doItYourselfLabel: string;
  onOpenAsset?: () => void;
};

function getDoneKey(businessId: string) {
  // Weekly-scoped so "done" resets naturally when the Sunday-night run
  // regenerates the plan for a new week, instead of accumulating forever.
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekKey = weekStart.toISOString().slice(0, 10);
  return `wonder_plan_done_${businessId}_${weekKey}`;
}

function useDoneTracking(businessId: string, serverDoneIds: string[]) {
  const key = businessId ? getDoneKey(businessId) : "";
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!key) return;
    let localIds: string[] = [];
    try {
      const raw = localStorage.getItem(key);
      localIds = raw ? JSON.parse(raw) : [];
    } catch {}
    // Server is the durable source (survives cleared storage/a different
    // device); localStorage is only a same-session fast mirror on top of
    // it, same pattern as trackedQuestions elsewhere in this app.
    setDone(new Set([...localIds, ...serverDoneIds]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, serverDoneIds.join(",")]);

  const markDone = useCallback((id: string, title: string, category: string) => {
    if (!key) return;
    setDone((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem(key, JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
    if (businessId) {
      fetchApi(`/api/user/businesses/${businessId}/actions/complete`, {
        method: "POST",
        body: JSON.stringify({ action_id: id, title, category }),
      }).catch(() => {});
    }
  }, [key, businessId]);

  return { done, markDone };
}

export default function PlanPage() {
  const { activeBusiness } = useBusiness();
  const { showToast } = useToast();
  const overviewData = useOverviewData(activeBusiness?.url || "", undefined, activeBusiness?.completeness);
  const serverDoneIds = (activeBusiness?.completedActions || []).map((a) => a.action_id);
  const { done, markDone } = useDoneTracking(activeBusiness?.id || "", serverDoneIds);

  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(true);
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<any | null>(null);
  const weeklyRequestIdRef = useRef(0);

  const ensureWeeklyBlogs = useCallback(async (force = false, targetMongoId?: string) => {
    if (!activeBusiness?.id) return;
    try {
      setIsGeneratingWeekly(true);
      const mongoId = targetMongoId || (await getValidMongoBusinessId(activeBusiness));
      if (!mongoId) return;
      if (force) {
        showToast(`Generating this week's content for ${activeBusiness.name || "your business"}. This can take 1-5 minutes.`, "info");
      }
      if (typeof window !== "undefined") {
        localStorage.setItem(getWeeklyBlogTaskKey(mongoId), JSON.stringify({ businessId: mongoId, startedAt: Date.now(), force }));
      }
      const res = await fetchApi<any>("/api/blogs/weekly/ensure", {
        method: "POST",
        body: JSON.stringify({
          business_id: mongoId,
          force,
          voice: activeBusiness.blogVoice || "",
          keywords: activeBusiness.blogKeywords || [],
        }),
      });
      if (res && res.success && res.weekly) {
        setWeeklyData(res.weekly);
        if (force) showToast("Regenerated this week's content.", "success");
      }
    } catch (err) {
      console.error("Weekly content generation error:", err);
      showToast("Content generation hit an issue.", "error");
    } finally {
      if (typeof window !== "undefined") {
        try {
          const mongoId = targetMongoId || (activeBusiness?.id && /^[0-9a-fA-F]{24}$/.test(activeBusiness.id) ? activeBusiness.id : "");
          if (mongoId) localStorage.removeItem(getWeeklyBlogTaskKey(mongoId));
        } catch {}
      }
      setIsGeneratingWeekly(false);
      setIsLoadingWeekly(false);
    }
  }, [activeBusiness, showToast]);

  const loadWeeklyBlogs = useCallback(async () => {
    if (!activeBusiness?.id) return;
    const requestId = ++weeklyRequestIdRef.current;
    setWeeklyData(null);
    try {
      setIsLoadingWeekly(true);
      const mongoId = await getValidMongoBusinessId(activeBusiness);
      if (!mongoId) {
        if (weeklyRequestIdRef.current === requestId) setIsLoadingWeekly(false);
        return;
      }
      const res = await fetchApi<any>(`/api/blogs/weekly?business_id=${encodeURIComponent(mongoId)}`);
      if (weeklyRequestIdRef.current !== requestId) return;
      if (res && res.success) {
        setWeeklyData(res.weekly || null);
        if (!res.weekly || !res.weekly.drafts || res.weekly.drafts.length === 0) {
          ensureWeeklyBlogs(false, mongoId);
        }
      }
    } catch (err) {
      console.error("Failed to load weekly content from DB:", err);
    } finally {
      if (weeklyRequestIdRef.current === requestId) setIsLoadingWeekly(false);
    }
  }, [activeBusiness, ensureWeeklyBlogs]);

  useEffect(() => { loadWeeklyBlogs(); }, [loadWeeklyBlogs]);

  if (!activeBusiness?.id) {
    return (
      <div className="bg-white border border-[#ece3d1] rounded-[22px] p-12 text-center shadow-xs my-8 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-[#f6f3ec] border border-[#ece3d1] flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6 text-[#9b927f]" />
        </div>
        <div className="font-spectral text-[19px] font-semibold text-[#23211b]">No business added yet</div>
        <p className="text-[13px] text-[#8a8273] mt-1.5 max-w-[360px]">
          Add a business profile to get your first weekly plan.
        </p>
        <Link
          href="/settings?tab=entity"
          className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-[#15463b] hover:bg-[#1a5c44] px-4 py-2.5 rounded-lg transition-colors"
        >
          + Add a business
        </Link>
      </div>
    );
  }

  const drafts: any[] = Array.isArray(weeklyData?.drafts) ? weeklyData.drafts : [];
  const weakestAreas = [...overviewData.auditAreas].sort((a, b) => a.score - b.score);
  const topGaps = overviewData.queryEvidence.filter((q) => q.missing.length > 0).slice(0, 2);

  // Assemble this week's 5 actions: 2 content, 2 presence/quick-win, 1 flex
  // (the weakest audit area) — mirrors Part 4's "typically 2 content pieces
  // + 2 quick wins + 1 other, flexing to the weakest area."
  const actions: PlanAction[] = [];

  drafts.slice(0, 2).forEach((draft, i) => {
    actions.push({
      id: `content-${i}`,
      kind: "content",
      categoryLabel: "Content",
      impact: i === 0 ? "High" : "Medium",
      title: draft.title || `Article ${i + 1}`,
      why: draft.excerpt || "A written piece prepared from this week's freshest gaps.",
      doItYourselfLabel: "Read & copy",
      onOpenAsset: () => setSelectedBlog(draft),
    });
  });

  topGaps.forEach((gap, i) => {
    actions.push({
      id: `presence-${i}`,
      kind: "presence",
      categoryLabel: "Presence / Quick win",
      impact: "Medium",
      title: `Close a gap: "${gap.query}"`,
      why: gap.missing[0]
        ? `You're missing this because: ${gap.missing[0]}`
        : "AI models aren't citing you for this question yet.",
      doItYourselfHref: "/query",
      doItYourselfLabel: "Open in Search Tracker",
    });
  });

  if (weakestAreas[0]) {
    actions.push({
      id: `flex-${weakestAreas[0].id}`,
      kind: "flex",
      categoryLabel: "Technical fix",
      impact: weakestAreas[0].score < 50 ? "High" : "Medium",
      title: `Fix: ${weakestAreas[0].label}`,
      why: `This area scored ${weakestAreas[0].score}/100 — your weakest right now.`,
      doItYourselfHref: "/analyser",
      doItYourselfLabel: "Open in Analyzer",
    });
  }

  const thisWeek = actions.slice(0, 5);
  const doneCount = thisWeek.filter((a) => done.has(a.id)).length;
  const doneItems = thisWeek.filter((a) => done.has(a.id));
  const comingUp = [
    ...weakestAreas.slice(1, 3).map((a) => `Fix: ${a.label} (${a.score}/100)`),
    ...overviewData.queryEvidence.filter((q) => q.missing.length > 0).slice(2, 4).map((q) => `Close a gap: "${q.query}"`),
  ];

  const kindIcon = { content: FileText, presence: Search, flex: Wrench };

  return (
    <div className="space-y-6 pb-10">
      {/* This week */}
      <div className="bg-white border border-[#ece3d1] rounded-[18px] p-5 md:p-[22px_26px] shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <div>
            <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f]">This week's plan</div>
            <h1 className="font-spectral text-[22px] font-semibold text-[#15463b] mt-0.5">
              {thisWeek.length > 0 ? `${thisWeek.length} prepared actions, in priority order` : "Getting your plan ready"}
            </h1>
          </div>
          {thisWeek.length > 0 && (
            <span className="text-[12.5px] font-bold text-[#15463b] bg-[#eef3f0] border border-[#d0e4d6] px-3 py-1.5 rounded-full">
              {doneCount} of {thisWeek.length} done
            </span>
          )}
        </div>

        {isLoadingWeekly && thisWeek.length === 0 ? (
          <div className="py-10 text-center text-[13px] text-[#8a8273]">Loading this week's plan…</div>
        ) : thisWeek.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[13px] text-[#8a8273] mb-3">
              {isGeneratingWeekly ? "Preparing this week's content — this can take a few minutes." : "Run Analyzer and Search Tracker first so we have gaps to build a plan from."}
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {thisWeek.map((action) => {
              const Icon = kindIcon[action.kind];
              const isDone = done.has(action.id);
              return (
                <motion.div
                  key={action.id}
                  layout
                  className={`border rounded-xl p-4 flex items-start gap-3.5 transition-colors ${
                    isDone ? "border-[#d0e4d6] bg-[#f7faf8]" : "border-[#ece3d1] bg-[#fdfcf8]"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => markDone(action.id, action.title, action.categoryLabel)}
                    disabled={isDone}
                    className="shrink-0 mt-0.5 cursor-pointer disabled:cursor-default"
                    title={isDone ? "Done" : "Mark as done"}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-[#1e7d4f]" />
                    ) : (
                      <Circle className="w-5 h-5 text-[#c2b69c]" />
                    )}
                  </button>

                  <div className="w-8 h-8 rounded-lg bg-white border border-[#ece3d1] flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-[#15463b]" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-[#8a8273]">{action.categoryLabel}</span>
                      <span className={`text-[9.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${
                        action.impact === "High" ? "bg-[#f6dcd5] text-[#b1442a]" : "bg-[#f7e7c4] text-[#9a6a12]"
                      }`}>
                        {action.impact} impact
                      </span>
                    </div>
                    <div className={`text-[14.5px] font-semibold mt-1 ${isDone ? "text-[#8a8273] line-through" : "text-[#23211b]"}`}>
                      {action.title}
                    </div>
                    <p className="text-[12.5px] text-[#6f6757] mt-0.5 leading-relaxed">{action.why}</p>

                    <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                      {action.onOpenAsset ? (
                        <button
                          type="button"
                          onClick={action.onOpenAsset}
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#15463b] hover:underline cursor-pointer bg-transparent border-none"
                        >
                          {action.doItYourselfLabel} <ExternalLink className="w-3 h-3" />
                        </button>
                      ) : action.doItYourselfHref ? (
                        <Link
                          href={action.doItYourselfHref}
                          className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#15463b] hover:underline"
                        >
                          {action.doItYourselfLabel} <ArrowRight className="w-3 h-3" />
                        </Link>
                      ) : null}

                      {/* "We'll do it" — no concierge/fulfillment backend exists
                          yet, so this is honest: it opens an email intent
                          rather than faking a submitted/writing/live status
                          pipeline we haven't built. */}
                      <a
                        href={`mailto:support@wonderscore.ai?subject=${encodeURIComponent(`Please handle: ${action.title}`)}`}
                        className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#8a8273] hover:text-[#15463b] transition-colors"
                      >
                        <Mail className="w-3 h-3" /> We'll do it
                      </a>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Done, with impact */}
      {doneItems.length > 0 && (
        <div className="bg-white border border-[#ece3d1] rounded-[18px] p-5 md:p-[22px_26px] shadow-sm">
          <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f] mb-3">Done, with impact</div>
          <div className="space-y-2">
            {doneItems.map((a) => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b border-[#f1eadf] last:border-0">
                <CheckCircle2 className="w-4 h-4 text-[#1e7d4f] shrink-0" />
                <span className="text-[13px] text-[#4a4437] flex-1 min-w-0 truncate">{a.title}</span>
                <span className="text-[11px] text-[#9b927f] shrink-0">Impact tracking coming soon</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coming up */}
      {comingUp.length > 0 && (
        <div className="bg-[#f6f3ec] border border-[#ece3d1] rounded-[18px] p-5 md:p-[22px_26px]">
          <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f] mb-3">Coming up</div>
          <div className="space-y-1.5">
            {comingUp.map((text, i) => (
              <div key={i} className="text-[13px] text-[#6f6757] py-1">{text}</div>
            ))}
          </div>
        </div>
      )}

      <div className="text-center">
        <Link href="/settings?tab=voice" className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#15463b] hover:underline">
          <Settings className="w-3.5 h-3.5" /> Tune AI voice & keywords for future content
        </Link>
      </div>

      <BlogReaderModal blog={selectedBlog} onClose={() => setSelectedBlog(null)} />
    </div>
  );
}
