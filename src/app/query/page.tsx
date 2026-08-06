"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import ModelSwitcher from "../../components/query/ModelSwitcher";
import QueryFilterBar from "../../components/query/QueryFilterBar";
import QueryTable from "../../components/query/QueryTable";
import QueryChatModal from "../../components/query/QueryChatModal";
import AddPromptModal from "../../components/query/AddPromptModal";
import SourcesSidebar from "../../components/query/SourcesSidebar";
import ScanProgressModal from "../../components/analyser/ScanProgressModal";
import { SearchQueryItem } from "../../types/dashboard";
import { useBusiness, isGenericName, cleanBrandNameFromDomain } from "../../context/BusinessContext";
import { useToast } from "../../context/ToastContext";
import { buildRankedCompetitors } from "../../lib/competitorRanking";
import { getAllSourcesForQueries } from "../../lib/querySources";
import { fetchApi } from "../../lib/api";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const ACTIVE_QUERY_JOB_MAX_AGE_MS = 6 * 60 * 60 * 1000;
const QUERY_CACHE_VERSION = "v3";

type QuestionMix = {
  branded: number;
  nonBranded: number;
  localSeo: number;
  broadSeo: number;
};

const DEFAULT_QUESTION_MIX: QuestionMix = {
  branded: 5,
  nonBranded: 5,
  localSeo: 5,
  broadSeo: 5,
};

const QUESTION_CATEGORIES: Array<{
  key: keyof QuestionMix;
  label: string;
  hint: string;
}> = [
  { key: "branded", label: "Branded", hint: "Business-name prompts" },
  { key: "nonBranded", label: "Non-branded", hint: "Category discovery prompts" },
  { key: "localSeo", label: "Local SEO", hint: "Location-specific prompts" },
  { key: "broadSeo", label: "Broad SEO", hint: "Nearby-area prompts" },
];

function extractDomain(urlOrDomain: string): string {
  const raw = (urlOrDomain || "").trim().toLowerCase();
  if (!raw) return "";
  try {
    const host = new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname;
    return host.replace(/^www\./, "").replace(/[),.;:]+$/g, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].replace(/[),.;:]+$/g, "");
  }
}

function extractSourcesFromProviderData(pData: any): string[] {
  if (!pData) return [];
  const directSources = Array.isArray(pData.sources) ? pData.sources : [];
  const directRefs = Array.isArray(pData.references) ? pData.references : [];
  const directUrls = Array.isArray(pData.source_urls || pData.sourceUrls) ? (pData.source_urls || pData.sourceUrls) : [];

  let jsonRefs: string[] = [];
  const rawText = pData.llm_response || pData.llmResponse || pData.reasoning || "";
  if (rawText && typeof rawText === "string") {
    try {
      const unfenced = rawText.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
      const parsed = JSON.parse(unfenced);
      if (parsed && Array.isArray(parsed.references)) {
        jsonRefs = parsed.references;
      }
    } catch {}
  }

  const merged = [...directSources, ...directRefs, ...directUrls, ...jsonRefs]
    .map((v) => extractDomain(String(v)))
    .filter((d) => d && d !== "example.com");

  return Array.from(new Set(merged));
}

function normalizeQuestionMix(value?: Partial<QuestionMix> | null): QuestionMix {
  const source = value || {};
  const safe = (key: keyof QuestionMix) => {
    const raw = Number(source[key] ?? DEFAULT_QUESTION_MIX[key]);
    return Number.isFinite(raw) ? Math.max(0, Math.min(20, Math.round(raw))) : DEFAULT_QUESTION_MIX[key];
  };

  const normalized = {
    branded: safe("branded"),
    nonBranded: safe("nonBranded"),
    localSeo: safe("localSeo"),
    broadSeo: safe("broadSeo"),
  };
  const total = normalized.branded + normalized.nonBranded + normalized.localSeo + normalized.broadSeo;
  if (total <= 0) return DEFAULT_QUESTION_MIX;
  if (total > 20) {
    let overflow = total - 20;
    (["broadSeo", "localSeo", "nonBranded", "branded"] as Array<keyof QuestionMix>).forEach((key) => {
      if (overflow <= 0) return;
      const removed = Math.min(normalized[key], overflow);
      normalized[key] -= removed;
      overflow -= removed;
    });
  } else if (total < 20) return DEFAULT_QUESTION_MIX;
  return normalized;
}

function isLowQualityGeneratedQuestion(
  value: string,
  type: "branded" | "non-branded" | "local-seo" | "broad-seo" = "non-branded"
): boolean {
  const raw = String(value || "")
    .replace(/[“”]/g, "\"")
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^["']|["']$/g, "");

  if (!raw) return true;

  const wordCount = (raw.match(/\b[a-z0-9]+\b/g) || []).length;
  if (type === "branded") {
    return wordCount <= 2 || raw.includes("??");
  }

  if (wordCount <= 4) return true;
  if (raw.includes("??")) return true;
  const advicePatterns = [
    /^what should i look for\b/,
    /^how (do|can|should) i compare\b/,
    /^how (do|can|should) i check\b/,
    /^what is the best way to\b/,
    /^what's the best way to\b/,
    /^how (do|can|should) i choose\b/,
    /^how (do|can|should) i decide\b/,
  ];
  if (advicePatterns.some((pattern) => pattern.test(raw))) return true;
  if (/\b(business|company|place)\b/.test(raw)) return true;
  if (raw.includes(" options for ") && wordCount <= 8) return true;

  const thinBestPatterns = [
    /^best\s+[a-z0-9 &'-]+\s+in\s+[a-z0-9 ,&'-]+\?$/,
    /^best\s+[a-z0-9 &'-]+\s+near\s+[a-z0-9 ,&'-]+\?$/,
    /^best\s+[a-z0-9 &'-]+\s+around\s+[a-z0-9 ,&'-]+\?$/,
    /^best\s+[a-z0-9 &'-]+\s+options\s+for\s+[a-z0-9 ,&'-]+\?$/,
  ];

  return wordCount <= 8 && thinBestPatterns.some((pattern) => pattern.test(raw));
}

function QueryGenerationLoader({
  businessName,
  targets,
  counts,
  isGenerating,
  onGenerate,
}: {
  businessName: string;
  targets: QuestionMix;
  counts: QuestionMix;
  isGenerating: boolean;
  onGenerate: () => void;
}) {
  const totalTarget = QUESTION_CATEGORIES.reduce((sum, item) => sum + targets[item.key], 0);
  const totalFound = QUESTION_CATEGORIES.reduce((sum, item) => sum + Math.min(counts[item.key], targets[item.key]), 0);
  const progress = totalTarget > 0 ? Math.round((totalFound / totalTarget) * 100) : 0;
  const circumference = 2 * Math.PI * 34;
  const dashOffset = circumference - (circumference * Math.min(progress, 100)) / 100;

  return (
    <div className="w-full max-w-[760px] mx-auto">
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-5">
          <div className="relative w-[96px] h-[96px] shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="34" fill="none" stroke="#eee8dc" strokeWidth="8" />
            <circle
              cx="50"
              cy="50"
              r="34"
              fill="none"
              stroke="#15463b"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className={`transition-all duration-700 ease-out ${isGenerating ? "animate-pulse" : ""}`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[24px] font-medium text-[#15463b] leading-none">{totalFound}</span>
            <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#9b927f]">of {totalTarget}</span>
          </div>
        </div>

          <div className="text-left">
            <p className="text-[15px] font-medium text-[#15463b]">
              {isGenerating ? "Generating questions" : "No generated questions yet"}
            </p>
            <p className="mt-1 text-[12.5px] text-[#8a8273]">
              {isGenerating ? "This can take 1-5 minutes." : `Ready for ${businessName}.`}
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 lg:grid-cols-4 gap-3">
            {QUESTION_CATEGORIES.map((item) => {
              const target = targets[item.key];
              const found = Math.min(counts[item.key], target);
              const categoryPct = target > 0 ? Math.round((found / target) * 100) : 100;
              const smallCircumference = 2 * Math.PI * 18;
              const smallDashOffset = smallCircumference - (smallCircumference * Math.min(categoryPct, 100)) / 100;

              return (
                <div key={item.key} className="rounded-xl border border-[#ece3d1] bg-[#fdfcf8] px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 shrink-0">
                      <svg className="h-full w-full -rotate-90" viewBox="0 0 48 48" aria-hidden="true">
                        <circle cx="24" cy="24" r="18" fill="none" stroke="#eee8dc" strokeWidth="5" />
                        <circle
                          cx="24"
                          cy="24"
                          r="18"
                          fill="none"
                          stroke="#15463b"
                          strokeWidth="5"
                          strokeLinecap="round"
                          strokeDasharray={smallCircumference}
                          strokeDashoffset={smallDashOffset}
                          className={`transition-all duration-700 ease-out ${isGenerating ? "animate-pulse" : ""}`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center text-[10.5px] font-medium text-[#15463b]">
                        {found}/{target}
                      </div>
                    </div>
                    <div>
                      <div className="text-[12.5px] font-medium text-[#2c2821]">{item.label}</div>
                      <div className="mt-0.5 text-[10.5px] text-[#9b927f]">{item.hint}</div>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default function QueryPage() {
  const { activeBusiness, liveDeepCompetitors, setLiveDeepCompetitors } = useBusiness();
  const { showToast } = useToast();

  const [selectedModel, setSelectedModel] = useState("ChatGPT");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");
  
  const [queriesList, setQueriesList] = useState<SearchQueryItem[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionGenerationTargets, setQuestionGenerationTargets] = useState<QuestionMix>(DEFAULT_QUESTION_MIX);
  const [questionGenerationCounts, setQuestionGenerationCounts] = useState<QuestionMix>({
    branded: 0,
    nonBranded: 0,
    localSeo: 0,
    broadSeo: 0,
  });

  const [selectedQuery, setSelectedQuery] = useState<SearchQueryItem | null>(null);
  const [sourcesQuery, setSourcesQuery] = useState<SearchQueryItem | null>(null);
  const [isSourcesSidebarOpen, setIsSourcesSidebarOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isScanComplete, setIsScanComplete] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const questionProgressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const domain = activeBusiness?.url || "";
  const rawBusinessName = activeBusiness?.name || "";
  const businessName = isGenericName(rawBusinessName) ? cleanBrandNameFromDomain(domain) : rawBusinessName;
  const category = activeBusiness?.category || "";
  const location = activeBusiness?.location || "";
  const savedQuestionMix = useMemo(
    () => normalizeQuestionMix(activeBusiness?.questionGeneration as Partial<QuestionMix> | undefined),
    [activeBusiness?.questionGeneration],
  );

  // Competitor ranking comes straight from THIS BROWSING SESSION's
  // running/completed job's own deep_competitors field (captured in the
  // job-status/job-stream handlers below) — no separate fetch, no extra AI
  // cost. Held in BusinessContext (not local state) so it survives
  // navigating away to Overview and back to Query without vanishing, while
  // still resetting correctly on business switch / logout (handled there).
  // Deliberately never falls back to old persisted data here — Query only
  // shows competitors for a run you actually watched complete this
  // session; the last-known list belongs on Overview, not here.
  const competitorRows = useMemo(() => buildRankedCompetitors(liveDeepCompetitors), [liveDeepCompetitors]);

  const allSourcesThisRun = useMemo(() => getAllSourcesForQueries(queriesList), [queriesList]);

  // Calculate live dynamic Model Scores strictly for each specific model
  const modelScores = useMemo(() => {
    const models = ["ChatGPT", "Claude", "Perplexity", "Gemini"];
    const total = queriesList.length || 20;
    const scores: Record<string, { mentioned: number; total: number; pct: number }> = {};

    models.forEach((mName) => {
      let count = 0;
      queriesList.forEach((q) => {
        const mRes = q.resultsByModel?.[mName];
        if (mRes && mRes.status === "Mentioned") {
          count++;
        }
      });
      scores[mName] = {
        mentioned: count,
        total,
        pct: Math.round((count / total) * 100),
      };
    });

    return scores;
  }, [queriesList]);

  const getCacheKey = useCallback((targetUrl: string) => {
    const clean = targetUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    return `wonder_query_cache_${QUERY_CACHE_VERSION}_${clean}`;
  }, []);

  const getActiveJobKey = useCallback((targetUrl: string) => {
    const clean = targetUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    return `wonder_query_active_job_${clean}`;
  }, []);

  const saveActiveJob = useCallback((jobId: string, processed = 0, total = queriesList.length) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(getActiveJobKey(domain), JSON.stringify({
        jobId,
        url: domain,
        processed,
        total,
        startedAt: Date.now(),
      }));
    } catch {}
  }, [domain, getActiveJobKey, queriesList.length]);

  const clearActiveJob = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(getActiveJobKey(domain));
    } catch {}
  }, [domain, getActiveJobKey]);

  const stopQuestionProgressTimer = useCallback(() => {
    if (questionProgressTimerRef.current) {
      clearInterval(questionProgressTimerRef.current);
      questionProgressTimerRef.current = null;
    }
  }, []);

  const startQuestionProgressTimer = useCallback((targets: QuestionMix) => {
    stopQuestionProgressTimer();
    setQuestionGenerationTargets(targets);
    setQuestionGenerationCounts({ branded: 0, nonBranded: 0, localSeo: 0, broadSeo: 0 });

    const keys: Array<keyof QuestionMix> = ["branded", "nonBranded", "localSeo", "broadSeo"];
    const totalTarget = keys.reduce((sum, key) => sum + Math.max(0, targets[key] || 0), 0);
    let visibleStep = 0;

    const makeDisplayCounts = (step: number) => {
      let remaining = Math.min(step, totalTarget);
      return keys.reduce<QuestionMix>((acc, key) => {
        const target = Math.max(0, targets[key] || 0);
        const value = Math.min(target, remaining);
        acc[key] = value;
        remaining = Math.max(0, remaining - value);
        return acc;
      }, { branded: 0, nonBranded: 0, localSeo: 0, broadSeo: 0 });
    };

    setQuestionGenerationCounts(makeDisplayCounts(visibleStep));
    questionProgressTimerRef.current = setInterval(() => {
      visibleStep = totalTarget > 0 ? Math.min(totalTarget, visibleStep + 1) : 0;
      setQuestionGenerationCounts(makeDisplayCounts(visibleStep));
    }, 900);
  }, [stopQuestionProgressTimer]);

  // 1. Check 2-Hour TTL Cache
  const loadCachedQueries = useCallback((targetUrl: string) => {
    if (typeof window === "undefined") return null;
    try {
      const cacheKey = getCacheKey(targetUrl);
      const raw = localStorage.getItem(cacheKey) || sessionStorage.getItem(cacheKey);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (parsed && parsed.timestamp && (Date.now() - parsed.timestamp < TWO_HOURS_MS)) {
        const queries = Array.isArray(parsed.queries) ? parsed.queries : null;
        if (!queries) return null;
        return queries.filter((item: SearchQueryItem) => !isLowQualityGeneratedQuestion(item.query));
      }
    } catch {
      return null;
    }
    return null;
  }, [getCacheKey]);

  const clearCachedQueries = useCallback((targetUrl: string) => {
    if (typeof window === "undefined") return;
    try {
      const cacheKey = getCacheKey(targetUrl);
      sessionStorage.removeItem(cacheKey);
      localStorage.removeItem(cacheKey);
    } catch {}
  }, [getCacheKey]);

  // Save to 2-Hour Cache
  const saveCachedQueries = useCallback((targetUrl: string, items: SearchQueryItem[]) => {
    if (typeof window === "undefined") return;
    try {
      const cacheKey = getCacheKey(targetUrl);
      const cacheData = { timestamp: Date.now(), queries: items };
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch {}
  }, [getCacheKey]);

  // 2. Generate Questions (Using activeBusiness.questionGeneration Ratios)
  const loadOrGenerateQuestions = useCallback(async (forceRefresh = false) => {
    if (!domain) return;

    if (!forceRefresh) {
      const cached = loadCachedQueries(domain);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        setQueriesList(cached);
        setIsLoadingQuestions(false);
        return;
      }
    }

    try {
      setIsLoadingQuestions(true);
      const avoidQuestions = forceRefresh
        ? queriesList.map((item) => item.query).filter(Boolean)
        : [];
      if (forceRefresh) {
        clearCachedQueries(domain);
        setQueriesList([]);
      }
      const qgMix = savedQuestionMix;
      startQuestionProgressTimer(qgMix);
      if (forceRefresh) {
        showToast(`Generating fresh AI search prompts for ${businessName}. This can take 1-5 minutes.`, "info");
      }

      const cleanUrl = domain.startsWith("http") ? domain : `https://${domain}`;
      const serviceList = Array.isArray(activeBusiness?.services)
        ? activeBusiness.services
        : String(activeBusiness?.services || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);

      let generationError = "";
      const res = await fetchApi<any>("/api/phase5/generate-questions", {
        method: "POST",
        body: JSON.stringify({
          url: cleanUrl,
          business_id: activeBusiness?.id,
          businessName,
          category,
          location,
          description: activeBusiness?.description || activeBusiness?.aiDescription,
          services: serviceList,
          questionGeneration: qgMix,
          avoidQuestions,
        }),
      }).catch((err) => {
        generationError = err?.message || "Backend question generation failed.";
        return null;
      });

      if (res && Array.isArray(res.questions) && res.questions.length > 0) {
        const b = qgMix.branded ?? 5;
        const nb = qgMix.nonBranded ?? 5;
        const l = qgMix.localSeo ?? 5;

        type GeneratedQuestionRow = {
          query: string;
          type: "branded" | "non-branded" | "local-seo" | "broad-seo";
          label: string;
        };

        const questionGroups = res.questionGroups && typeof res.questionGroups === "object" ? res.questionGroups : null;
        const groupedQuestions = questionGroups
          ? [
              ...((questionGroups.branded || []) as string[]).map((query) => ({ query, type: "branded" as const, label: "Branded" })),
              ...((questionGroups.nonBranded || []) as string[]).map((query) => ({ query, type: "non-branded" as const, label: "Non-Branded" })),
              ...((questionGroups.localSeo || []) as string[]).map((query) => ({ query, type: "local-seo" as const, label: "Local SEO" })),
              ...((questionGroups.broadSeo || []) as string[]).map((query) => ({ query, type: "broad-seo" as const, label: "Broad SEO" })),
            ].filter((item) => String(item.query || "").trim()) as GeneratedQuestionRow[]
          : null;

        const fallbackQuestions: GeneratedQuestionRow[] = res.questions.map((qStr: string, idx: number) => {
          let type: "branded" | "non-branded" | "local-seo" | "broad-seo" = "broad-seo";
          let label = "Broad SEO";

          if (idx < b) {
            type = "branded";
            label = "Branded";
          } else if (idx < b + nb) {
            type = "non-branded";
            label = "Non-Branded";
          } else if (idx < b + nb + l) {
            type = "local-seo";
            label = "Local SEO";
          } else {
            type = "broad-seo";
            label = "Broad SEO";
          }

          return { query: qStr, type, label };
        });

        const validQuestions = (groupedQuestions || fallbackQuestions).filter((item) => !isLowQualityGeneratedQuestion(item.query, item.type));

        const mapped: SearchQueryItem[] = validQuestions.map((item: GeneratedQuestionRow, idx: number) => {
          // Initial un-audited state (Pending Run until user clicks "Run")
          return {
            id: idx + 1,
            type: item.type,
            label: item.label,
            query: item.query,
            status: "Pending" as any,
            rank: null,
            sources: [],
            score: "-",
            answerSnippet: `Prompt generated. Click "Run" to execute live AI search engine audit.`,
            resultsByModel: undefined,
          };
        });

        const exactCounts = validQuestions.reduce<QuestionMix>((acc, item) => {
          if (item.type === "branded") acc.branded += 1;
          if (item.type === "non-branded") acc.nonBranded += 1;
          if (item.type === "local-seo") acc.localSeo += 1;
          if (item.type === "broad-seo") acc.broadSeo += 1;
          return acc;
        }, { branded: 0, nonBranded: 0, localSeo: 0, broadSeo: 0 });

        stopQuestionProgressTimer();
        setQuestionGenerationCounts(exactCounts);

        setQueriesList(mapped);
        saveCachedQueries(domain, mapped);

        if (forceRefresh) {
          showToast(`Generated ${mapped.length} new AI search prompts matching ratio settings! Click "Run" to analyze.`, "success");
        }
        await new Promise((resolve) => setTimeout(resolve, 850));
      } else {
        stopQuestionProgressTimer();
        setQueriesList([]);
        showToast(generationError || "Could not generate live questions. Please check business profile details.", "error");
      }
    } catch (err) {
      stopQuestionProgressTimer();
      console.error("Failed to generate questions:", err);
      showToast("Error generating questions from backend", "error");
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [domain, businessName, category, location, activeBusiness, savedQuestionMix, queriesList, showToast, loadCachedQueries, clearCachedQueries, saveCachedQueries, startQuestionProgressTimer, stopQuestionProgressTimer]);

  useEffect(() => {
    const cached = loadCachedQueries(domain);
    setQuestionGenerationTargets(savedQuestionMix);

    if (cached && Array.isArray(cached) && cached.length > 0) {
      setQueriesList(cached);
      const cachedCounts = cached.reduce<QuestionMix>((acc: QuestionMix, item: SearchQueryItem) => {
        if (item.type === "branded") acc.branded += 1;
        if (item.type === "non-branded") acc.nonBranded += 1;
        if (item.type === "local-seo") acc.localSeo += 1;
        if (item.type === "broad-seo") acc.broadSeo += 1;
        return acc;
      }, { branded: 0, nonBranded: 0, localSeo: 0, broadSeo: 0 });
      setQuestionGenerationCounts(cachedCounts);
    } else {
      setQueriesList([]);
      setQuestionGenerationCounts({ branded: 0, nonBranded: 0, localSeo: 0, broadSeo: 0 });
    }

    // Scan-status state belongs to whichever business was active when it
    // was set — reset it here so a completed/in-progress state from the
    // PREVIOUS business doesn't linger and misrepresent the new one. If
    // this new business genuinely has its own active job, the resume-on-
    // mount effect below (also keyed on `domain`) re-derives this
    // correctly right after — this only clears the stale carry-over.
    setIsScanning(false);
    setIsScanComplete(false);
    setProcessedCount(0);
    setSelectedQuery(null);
    setSourcesQuery(null);

    setIsLoadingQuestions(false);
  }, [domain, savedQuestionMix, loadCachedQueries]);

  // Tear down any in-flight polling/SSE whenever the active business
  // changes — not just on true unmount. Switching business via the header
  // switcher does NOT unmount this page, so without `domain` in the deps
  // here, a scan still running for the PREVIOUS business kept polling and
  // writing its results (queriesList, competitors, scan-complete state)
  // into whatever business is now on screen. The backend job itself is
  // unaffected — it keeps running server-side either way — this only
  // stops the frontend from misapplying its updates to the wrong business.
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (questionProgressTimerRef.current) {
        clearInterval(questionProgressTimerRef.current);
        questionProgressTimerRef.current = null;
      }
    };
  }, [domain]);

  // 3. Multi-dimensional filtering logic strictly matching selected model
  const filteredQueries = queriesList.filter((q) => {
    const matchesCategory = activeCategory === "all" || q.type === activeCategory;
    
    const modelRes = q.resultsByModel?.[selectedModel];
    const hasModelRes = modelRes !== undefined;

    const isAudited = hasModelRes
      ? (modelRes.status as string) !== "Pending"
      : Boolean(q.status) && (q.status as string) !== "Pending";

    const statusVal = hasModelRes ? modelRes.status : q.status;
    const isMentioned = statusVal === "Mentioned";

    let matchesStatus = true;
    if (activeStatus === "mentioned") {
      matchesStatus = isAudited && isMentioned;
    } else if (activeStatus === "not-mentioned") {
      matchesStatus = isAudited && !isMentioned;
    } else if (activeStatus === "pending") {
      matchesStatus = !isAudited || (statusVal as string) === "Pending";
    }

    return matchesCategory && matchesStatus;
  });

  const handleOpenQuerySources = useCallback((q: SearchQueryItem) => {
    setSourcesQuery(q);
    setIsSourcesSidebarOpen(true);
  }, []);

  const handleOpenAllSources = useCallback(() => {
    setSourcesQuery(null);
    setIsSourcesSidebarOpen(true);
  }, []);

  const handleCopyAll = () => {
    const textList = queriesList
      .map((q, idx) => `${idx + 1}. [${q.label}] "${q.query}"`)
      .join("\n");
    navigator.clipboard.writeText(textList).then(() => {
      showToast("All AI search prompts copied to clipboard!", "success");
    });
  };

  const handleAddPrompt = (
    queryText: string,
    category: "branded" | "non-branded" | "local-seo" | "broad-seo"
  ) => {
    let label = "Non-Branded";
    if (category === "branded") label = "Branded";
    else if (category === "local-seo") label = "Local SEO";
    else if (category === "broad-seo") label = "Broad SEO";

    const newQuery: SearchQueryItem = {
      id: queriesList.length + 1,
      type: category,
      label,
      query: queryText,
      status: "Pending" as any,
      rank: null,
      sources: [],
      score: "-",
      answerSnippet: `User-added prompt: "${queryText}". Click "Run" to perform AI analysis.`,
      resultsByModel: undefined,
    };

    const updated = [...queriesList, newQuery];
    setQueriesList(updated);
    saveCachedQueries(domain, updated);
    showToast("New prompt added to list! Click 'Run' to analyze.");
  };

  // Helper to map backend provider key to model label
  const mapModelName = (raw: string) => {
    const lower = raw.toLowerCase();
    if (lower.includes("chatgpt") || lower.includes("openai")) return "ChatGPT";
    if (lower.includes("perplexity")) return "Perplexity";
    if (lower.includes("claude") || lower.includes("anthropic")) return "Claude";
    if (lower.includes("gemini") || lower.includes("google")) return "Gemini";
    return raw;
  };

  // Helper to process job results into queriesList with target site match resolution
  const applyJobResultsToQueries = useCallback((resultsObj: Record<string, any>) => {
    setQueriesList((prevList) => {
      const updated: SearchQueryItem[] = prevList.map((q, idx) => {
        const idStr = String(q.id);
        const idxStr = String(idx + 1);

        // Robust key resolution across all backend format conventions (q1, q_1, 1, etc.)
        const qDoc =
          resultsObj[`q${q.id}`] ||
          resultsObj[`q_${q.id}`] ||
          resultsObj[idStr] ||
          resultsObj[`q${idx + 1}`] ||
          resultsObj[`q_${idx + 1}`] ||
          resultsObj[idxStr];

        if (!qDoc || !qDoc.providers) return q;

        const providers = qDoc.providers;
        const resultsByModel: Record<string, any> = {};

        let overallMentioned = false;
        let overallMatchType: "site_matched" | "partial" | "no_match" = "no_match";
        let bestRank: number | null = null;
        let allSources: string[] = [];

        Object.keys(providers).forEach((pKey) => {
          const pData = providers[pKey];
          const modelName = mapModelName(pKey);
          const targetSite = pData.target_site || pData.targetSite || null;

          const isTargetMatched = targetSite?.status === "matched";
          const isTargetPartial = targetSite?.status === "partial";
          const isM = Boolean(pData.mentioned) || isTargetMatched;

          const matchType: "site_matched" | "partial" | "no_match" =
            isTargetMatched ? "site_matched" : isTargetPartial ? "partial" : "no_match";

          const pos = typeof pData.position === "number" ? pData.position : null;
          
          // Extract sources from sources, references, source_urls, and JSON-parsed reply text
          const src = extractSourcesFromProviderData(pData);

          if (isM) overallMentioned = true;
          if (matchType === "site_matched" || (matchType === "partial" && overallMatchType !== "site_matched")) {
            overallMatchType = matchType;
          }

          if (pos !== null && (bestRank === null || pos < bestRank)) bestRank = pos;
          src.forEach((sItem: string) => { if (!allSources.includes(sItem)) allSources.push(sItem); });

          const statusString: "Mentioned" | "Not Mentioned" = isM ? "Mentioned" : "Not Mentioned";

          resultsByModel[modelName] = {
            status: statusString,
            rank: pos,
            sources: src,
            matchType,
            sourceUrls: pData.source_urls || pData.sourceUrls || [],
            references: pData.references || [],
            answerSnippet: pData.reasoning || pData.llm_response || pData.llmResponse || "",
            evidence: pData.reasoning || "",
            reasoning: pData.reasoning || "",
            llmResponse: pData.llm_response || pData.llmResponse || "",
            targetSite,
            competitorScores: pData.competitor_scores || pData.competitorScores || [],
          };
        });

        const finalStatus: "Mentioned" | "Not Mentioned" = overallMentioned ? "Mentioned" : "Not Mentioned";

        return {
          ...q,
          status: finalStatus,
          rank: bestRank,
          matchType: overallMatchType,
          sources: allSources,
          answerSnippet: resultsByModel["ChatGPT"]?.answerSnippet || resultsByModel["Perplexity"]?.answerSnippet || q.answerSnippet,
          resultsByModel,
        };
      });

      saveCachedQueries(domain, updated);
      return updated;
    });
  }, [domain, saveCachedQueries]);

  useEffect(() => {
    if (typeof window === "undefined" || queriesList.length === 0) return;
    if (pollIntervalRef.current) return;

    let parsed: any = null;
    try {
      const raw = localStorage.getItem(getActiveJobKey(domain));
      parsed = raw ? JSON.parse(raw) : null;
    } catch {}

    if (!parsed?.jobId || Date.now() - Number(parsed.startedAt || 0) > ACTIVE_QUERY_JOB_MAX_AGE_MS) {
      clearActiveJob();
      return;
    }

    setIsScanning(true);
    setIsScanComplete(false);
    setProcessedCount(Number(parsed.processed || 0));
    showToast("AI prompt analysis is still running. This can take 1-5 minutes, and progress will continue here.", "info");

    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusRes = await fetchApi<any>(`/api/phase5/job-status/${parsed.jobId}`);
        if (statusRes && typeof statusRes.processed === "number") {
          setProcessedCount(statusRes.processed);
          saveActiveJob(parsed.jobId, statusRes.processed, statusRes.total || queriesList.length);
        }
        if (statusRes?.results) {
          applyJobResultsToQueries(statusRes.results);
        }
        if (Array.isArray(statusRes?.deep_competitors) && statusRes.deep_competitors.length > 0) {
          setLiveDeepCompetitors(statusRes.deep_competitors);
        }
        if (statusRes && (statusRes.status === "completed" || statusRes.status === "failed" || statusRes.status === "cancelled")) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          clearActiveJob();
          setProcessedCount(statusRes.total || queriesList.length);
          setIsScanComplete(true);
        }
      } catch {}
    }, 1500);
  }, [queriesList.length, domain, getActiveJobKey, clearActiveJob, showToast, saveActiveJob, applyJobResultsToQueries]);

  // 4. Live Audit Execution when user clicks "Run"
  const handleStartScan = useCallback(async () => {
    if (queriesList.length === 0) {
      showToast("No questions available to analyze. Please click Regenerate first.", "info");
      return;
    }

    setIsScanning(true);
    setIsScanComplete(false);
    setProcessedCount(0);
    showToast(`Starting AI prompt analysis for ${businessName}. This can take 1-5 minutes.`, "info");

    const cleanFullUrl = domain.startsWith("http") ? domain : `https://${domain}`;

    // Properly formatted QuestionItem list for FastAPI Pydantic schema
    const formattedQuestions = queriesList.map((q, idx) => ({
      id: `q${q.id || idx + 1}`,
      text: q.query,
      category: q.type || "non-branded",
    }));

    try {
      const res = await fetchApi<any>("/api/phase5/start-job", {
        method: "POST",
        body: JSON.stringify({
          url: cleanFullUrl,
          questions: formattedQuestions,
          model: "multi",
        }),
      });

      if (res && res.job_id) {
        const jobId = res.job_id;
        saveActiveJob(jobId, 0, queriesList.length);

        // 1. Primary SSE Stream for live progress updates
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        if (eventSourceRef.current) eventSourceRef.current.close();

        const es = new EventSource(`${apiUrl}/api/phase5/job-stream/${jobId}`);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
          try {
            const statusData = JSON.parse(event.data || "{}");
            if (typeof statusData.processed === "number") {
              setProcessedCount(statusData.processed);
              saveActiveJob(jobId, statusData.processed, queriesList.length);
            }
            if (statusData.results) {
              applyJobResultsToQueries(statusData.results);
            }
            if (Array.isArray(statusData.deep_competitors) && statusData.deep_competitors.length > 0) {
              setLiveDeepCompetitors(statusData.deep_competitors);
            }
            // ONLY stop when backend returns terminal job status ("completed", "failed", "cancelled")
            if (statusData.status === "completed" || statusData.status === "failed" || statusData.status === "cancelled") {
              es.close();
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
              clearActiveJob();
              setProcessedCount(queriesList.length);
              setIsScanComplete(true);
            }
          } catch {}
        };

        // 2. High-frequency Polling fallback every 1000ms (1s) to ensure immediate row-by-row live updates
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = setInterval(async () => {
          try {
            const statusRes = await fetchApi<any>(`/api/phase5/job-status/${jobId}`);
            if (statusRes && typeof statusRes.processed === "number") {
              setProcessedCount(statusRes.processed);
              saveActiveJob(jobId, statusRes.processed, statusRes.total || queriesList.length);
            }
            if (statusRes && statusRes.results) {
              applyJobResultsToQueries(statusRes.results);
            }
            if (Array.isArray(statusRes?.deep_competitors) && statusRes.deep_competitors.length > 0) {
              setLiveDeepCompetitors(statusRes.deep_competitors);
            }

            // ONLY stop when backend job status is terminal ("completed", "failed", "cancelled")
            if (statusRes && (statusRes.status === "completed" || statusRes.status === "failed" || statusRes.status === "cancelled")) {
              if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
              if (eventSourceRef.current) eventSourceRef.current.close();
              clearActiveJob();
              setProcessedCount(queriesList.length);
              setIsScanComplete(true);
            }
          } catch {}
        }, 1000);
      } else {
        showToast("Backend job start failed", "error");
        setIsScanning(false);
      }
    } catch (err: any) {
      console.error("Start job error:", err);
      showToast(`Audit execution error: ${err.message || "Schema Error"}`, "error");
      setIsScanning(false);
    }
  }, [queriesList, domain, businessName, showToast, applyJobResultsToQueries]);

  const handleScanComplete = useCallback(() => {
    setIsScanning(false);
    setIsScanComplete(false);
    showToast(`AI audit completed! All prompts now show live statuses, ranks, and citations.`, "success");
  }, [showToast]);

  if (!activeBusiness?.id) {
    return (
      <div className="bg-white border border-[#ece3d1] rounded-[22px] p-12 text-center shadow-xs my-8 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-[#f6f3ec] border border-[#ece3d1] flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6 text-[#9b927f]" />
        </div>
        <div className="font-spectral text-[19px] font-semibold text-[#23211b]">No business added yet</div>
        <p className="text-[13px] text-[#8a8273] mt-1.5 max-w-[360px]">
          Add a business profile to generate AI visibility prompts and track mentions.
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

  return (
    <div className="space-y-5 relative pb-12">
      {/* Scan Progress Modal for Query AI Audit */}
      <ScanProgressModal
        isOpen={isScanning}
        isComplete={isScanComplete}
        onClose={() => setIsScanning(false)}
        onComplete={handleScanComplete}
        title="AI Prompt Analysis"
        processed={processedCount}
        total={queriesList.length}
      />

      <ModelSwitcher
        selectedModel={selectedModel}
        onSelectModel={setSelectedModel}
        modelScores={modelScores}
      />

      {/* Main Table Card */}
      <div className="bg-white border border-[#ece3d1] rounded-xl p-5 md:p-6 shadow-xs transition-all duration-300">
        <QueryFilterBar
          selectedModel={selectedModel}
          activeCategory={activeCategory}
          activeStatus={activeStatus}
          isGenerating={isLoadingQuestions}
          onCategoryChange={setActiveCategory}
          onStatusChange={setActiveStatus}
          onCopyAll={handleCopyAll}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onRunAudit={handleStartScan}
          onRegeneratePrompts={() => loadOrGenerateQuestions(true)}
          showActions={queriesList.length > 0}
        />

        {/* Question generation state or Query Table */}
        {isLoadingQuestions || queriesList.length === 0 ? (
          <div className="py-9 md:py-10 px-4 border border-dashed border-[#ece3d1] rounded-xl bg-[#fcfaf5] my-3">
            <QueryGenerationLoader
              businessName={businessName}
              targets={questionGenerationTargets}
              counts={questionGenerationCounts}
              isGenerating={isLoadingQuestions}
              onGenerate={() => loadOrGenerateQuestions(true)}
            />
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-[40px_86px_minmax(0,1fr)_118px_54px_200px] items-center gap-2 px-4 pb-2.5 font-mono-spline text-[10px] font-medium uppercase text-[#9b927f] border-b border-[#efe7d6]">
              <div>No.</div>
              <div>Type</div>
              <div>Generated Search Query</div>
              <div className="text-center">Status</div>
              <div className="text-center">Rank</div>
              <button
                type="button"
                onClick={handleOpenAllSources}
                className="bg-transparent border-none p-0 m-0 font-mono-spline text-[10px] font-medium uppercase text-[#9b927f] text-right hover:text-[#15463b] hover:underline cursor-pointer transition-colors"
                title="View every source cited across all queries in this run"
              >
                Sources
              </button>
            </div>

            <QueryTable
              queries={filteredQueries}
              selectedModel={selectedModel}
              onSelectQuery={setSelectedQuery}
              onOpenSources={handleOpenQuerySources}
            />
          </>
        )}
      </div>

      {/* Competitor Score Comparison — read directly from this job's own
          deep_competitors, already computed as a side effect of the run
          above. No separate fetch, no extra AI call. */}
      {!isLoadingQuestions && competitorRows.length > 0 && (
        <div className="bg-[#faf3e2] border border-[#efe3c8] rounded-[18px] p-5 md:p-[22px_26px] shadow-xs">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <span className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9a8a5e]">
              Competitor Score Comparison
            </span>
            <span className="text-[12.5px] text-[#8a8273]">
              {competitorRows[0]?.isUser
                ? `🏆 #1 Market Leader · ${competitorRows[0].name}`
                : `#${competitorRows.find((c) => c.isUser)?.rank ?? ""} Position in ${location}`}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {competitorRows.map((comp) => (
              <a
                key={comp.domain}
                href={comp.url || `https://${comp.domain}/`}
                target="_blank"
                rel="noreferrer"
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-colors cursor-pointer ${
                  comp.isUser
                    ? "bg-white shadow-[0_1px_4px_rgba(60,48,28,0.08)] border border-[#ece3d1]"
                    : "hover:bg-[#f6eee0]"
                }`}
              >
                <span className={`num text-[12px] w-5 text-center shrink-0 ${comp.isUser ? "text-[#1a5c44] font-bold" : "text-[#9b927f]"}`}>
                  #{comp.rank}
                </span>

                <div className="w-7 h-7 rounded-lg bg-white border border-[#efe7d6] flex items-center justify-center shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={comp.favicon}
                    alt={comp.name}
                    className="w-4 h-4 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`text-[13.5px] truncate ${comp.isUser ? "text-[#1a5c44] font-bold" : "text-[#23211b] font-medium"}`}>
                    {comp.name}
                    {comp.isUser && (
                      <span className="font-mono-spline text-[9px] font-bold tracking-wider text-[#1e7d4f] bg-[#dcefe2] px-2 py-0.5 rounded ml-2 align-middle">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#9b927f] truncate">{comp.domain}</div>
                </div>

                <div className="w-[140px] h-[6px] bg-[#ece0c4] rounded-full overflow-hidden shrink-0 hidden sm:block">
                  <div
                    className={`h-full rounded-full ${comp.isUser ? "bg-[#1e7d4f]" : "bg-[#c2b69c]"}`}
                    style={{ width: `${comp.score}%` }}
                  />
                </div>

                <span className={`num text-[15px] font-bold w-12 text-right shrink-0 ${comp.isUser ? "text-[#1a5c44]" : "text-[#23211b]"}`}>
                  {comp.score}<span className="text-[11px] font-normal text-[#8a8273]">/100</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      )}

      {!isLoadingQuestions && competitorRows.length === 0 && (isScanning || processedCount > 0) && (
        <div className="bg-[#faf3e2] border border-[#efe3c8] rounded-[18px] p-5 md:p-[22px_26px] shadow-xs">
          <span className="text-[12.5px] text-[#8a8273]">
            {isScanning ? "Competitor ranking will appear here once the analysis finishes." : "No competitor data was found in the latest run."}
          </span>
        </div>
      )}

      <QueryChatModal
        query={selectedQuery}
        selectedModel={selectedModel}
        onClose={() => setSelectedQuery(null)}
      />

      <SourcesSidebar
        isOpen={isSourcesSidebarOpen}
        query={sourcesQuery}
        allSources={allSourcesThisRun}
        allSourcesSubtitle={`across ${queriesList.length} quer${queriesList.length === 1 ? "y" : "ies"} in this run`}
        onClose={() => setIsSourcesSidebarOpen(false)}
      />

      <AddPromptModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPrompt={handleAddPrompt}
      />
    </div>
  );
}
