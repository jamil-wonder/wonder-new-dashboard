"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import ModelSwitcher from "../../components/query/ModelSwitcher";
import QueryFilterBar from "../../components/query/QueryFilterBar";
import QueryTable from "../../components/query/QueryTable";
import QueryChatModal from "../../components/query/QueryChatModal";
import AddPromptModal from "../../components/query/AddPromptModal";
import SourcesModal from "../../components/query/SourcesModal";
import ScanProgressModal from "../../components/analyser/ScanProgressModal";
import { WonderscoreSpinner } from "../../components/ui/WonderscoreSpinner";
import { SearchQueryItem } from "../../types/dashboard";
import { useBusiness, isGenericName, cleanBrandNameFromDomain } from "../../context/BusinessContext";
import { useToast } from "../../context/ToastContext";
import { fetchApi } from "../../lib/api";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const ACTIVE_QUERY_JOB_MAX_AGE_MS = 6 * 60 * 60 * 1000;

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

export default function QueryPage() {
  const { activeBusiness } = useBusiness();
  const { showToast } = useToast();

  const [selectedModel, setSelectedModel] = useState("ChatGPT");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeStatus, setActiveStatus] = useState("all");
  
  const [queriesList, setQueriesList] = useState<SearchQueryItem[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);

  const [selectedQuery, setSelectedQuery] = useState<SearchQueryItem | null>(null);
  const [sourcesQuery, setSourcesQuery] = useState<SearchQueryItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isScanComplete, setIsScanComplete] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const domain = activeBusiness?.url || "https://thegallivant.co.uk/";
  const rawBusinessName = activeBusiness?.name || "The Gallivant";
  const businessName = isGenericName(rawBusinessName) ? cleanBrandNameFromDomain(domain) : rawBusinessName;
  const category = activeBusiness?.category || "Restaurant & Hotel";
  const location = activeBusiness?.location || "Camber, Rye, UK";

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
    return `wonder_query_cache_${clean}`;
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

  // 1. Check 2-Hour TTL Cache
  const loadCachedQueries = useCallback((targetUrl: string) => {
    if (typeof window === "undefined") return null;
    try {
      const cacheKey = getCacheKey(targetUrl);
      const raw = localStorage.getItem(cacheKey) || sessionStorage.getItem(cacheKey);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (parsed && parsed.timestamp && (Date.now() - parsed.timestamp < TWO_HOURS_MS)) {
        return parsed.queries || null;
      }
    } catch {
      return null;
    }
    return null;
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
      if (forceRefresh) {
        showToast(`Generating fresh AI search prompts for ${businessName}. This can take 1-5 minutes.`, "info");
      }

      const cleanUrl = domain.startsWith("http") ? domain : `https://${domain}`;
      const qgMix = activeBusiness?.questionGeneration || { branded: 5, nonBranded: 5, localSeo: 5, broadSeo: 5 };
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
        }),
      }).catch((err) => {
        generationError = err?.message || "Backend question generation failed.";
        return null;
      });

      if (res && Array.isArray(res.questions) && res.questions.length > 0) {
        const b = qgMix.branded ?? 5;
        const nb = qgMix.nonBranded ?? 5;
        const l = qgMix.localSeo ?? 5;

        const mapped: SearchQueryItem[] = res.questions.map((qStr: string, idx: number) => {
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

          // Initial un-audited state (Pending Run until user clicks "Run")
          return {
            id: idx + 1,
            type,
            label,
            query: qStr,
            status: "Pending" as any,
            rank: null,
            sources: [],
            score: "-",
            answerSnippet: `Prompt generated. Click "Run" to execute live AI search engine audit.`,
            resultsByModel: undefined,
          };
        });

        setQueriesList(mapped);
        saveCachedQueries(domain, mapped);

        if (forceRefresh) {
          showToast(`Generated ${mapped.length} new AI search prompts matching ratio settings! Click "Run" to analyze.`, "success");
        }
      } else {
        setQueriesList([]);
        showToast(generationError || "Could not generate live questions. Please check business profile details.", "error");
      }
    } catch (err) {
      console.error("Failed to generate questions:", err);
      showToast("Error generating questions from backend", "error");
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [domain, businessName, category, location, activeBusiness, showToast, loadCachedQueries, saveCachedQueries]);

  useEffect(() => {
    loadOrGenerateQuestions(false);
  }, [loadOrGenerateQuestions]);

  // Clean up timers & eventSource on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (eventSourceRef.current) eventSourceRef.current.close();
    };
  }, []);

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
        />

        {/* Dynamic Loading Spinner or Query Table */}
        {isLoadingQuestions ? (
          <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-[#ece3d1] rounded-xl bg-[#fdfcf8] my-3">
            <WonderscoreSpinner
              size={48}
              label={`Generating AI search prompts for ${businessName}`}
              note="This can take 1-5 minutes. You can move around the dashboard and come back."
            />
            <p className="text-[13px] text-[#8a8273] max-w-[420px] mx-auto mt-2 font-normal">
              Building 20 search questions from the saved business profile.
            </p>
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
              <div className="text-right">Sources</div>
            </div>

            <QueryTable
              queries={filteredQueries}
              selectedModel={selectedModel}
              onSelectQuery={setSelectedQuery}
              onOpenSourcesModal={setSourcesQuery}
            />
          </>
        )}
      </div>

      <QueryChatModal
        query={selectedQuery}
        selectedModel={selectedModel}
        onClose={() => setSelectedQuery(null)}
      />

      <SourcesModal
        query={sourcesQuery}
        onClose={() => setSourcesQuery(null)}
      />

      <AddPromptModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddPrompt={handleAddPrompt}
      />
    </div>
  );
}
