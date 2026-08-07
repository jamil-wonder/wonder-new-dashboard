"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchApi, getScanHistory, type ScanPoint } from "../lib/api";
import { getAllSourcesForQueries } from "../lib/querySources";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const QUERY_CACHE_VERSION = "v3";

function cleanUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

function loadAnalyserCache(url: string) {
  if (typeof window === "undefined" || !url) return null;
  const clean = cleanUrl(url);
  const key = `wonder_analyser_cache_${clean}`;
  try {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.timestamp && Date.now() - parsed.timestamp < TWO_HOURS_MS) return parsed;
  } catch {}
  return null;
}

function loadQueryCache(url: string) {
  if (typeof window === "undefined" || !url) return null;
  const clean = cleanUrl(url);
  const keys = [
    `wonder_query_cache_${QUERY_CACHE_VERSION}_${clean}`,
    `wonder_query_cache_${clean}`,
  ];
  try {
    for (const key of keys) {
      const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed?.timestamp && Date.now() - parsed.timestamp < TWO_HOURS_MS) {
        return Array.isArray(parsed.queries) ? parsed.queries : null;
      }
    }
  } catch {}
  return null;
}

function isMentionedResult(result: any) {
  if (!result) return false;
  return (
    result.status === "Mentioned" ||
    result.matchType === "site_matched" ||
    result.targetSite?.status === "matched" ||
    Boolean(result.mentioned)
  );
}

function parseJsonResponse(rawValue: unknown) {
  const raw = String(rawValue || "").trim();
  if (!raw) return null;
  const unfenced = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(unfenced);
  } catch {
    return null;
  }
}

function collectFactLines(rawValue: unknown) {
  const raw = String(rawValue || "");
  const found: string[] = [];
  const missing: string[] = [];

  raw.split(/\r?\n/).forEach((line) => {
    const clean = line.replace(/^[\s\-*•✓✕×]+/, "").trim();
    const foundMatch = clean.match(/^Found:\s*(.+)$/i);
    const missingMatch = clean.match(/^Missing:\s*(.+)$/i);
    if (foundMatch?.[1]) found.push(foundMatch[1].trim());
    if (missingMatch?.[1]) missing.push(missingMatch[1].trim());
  });

  return { found, missing };
}

function uniqueStrings(values: unknown[], limit = 4) {
  const seen = new Set<string>();
  const result: string[] = [];
  values.forEach((value) => {
    const clean = String(value || "").replace(/\s+/g, " ").trim();
    if (!clean || seen.has(clean.toLowerCase())) return;
    seen.add(clean.toLowerCase());
    result.push(clean);
  });
  return result.slice(0, limit);
}

function getQueryEvidence(query: any, models: string[]) {
  const modelResults = query?.resultsByModel && typeof query.resultsByModel === "object"
    ? Object.entries(query.resultsByModel)
    : [];
  const resultsToCheck: Array<[string, any]> = modelResults.length > 0
    ? (modelResults as Array<[string, any]>)
    : [["Result", query]];

  const foundFacts: string[] = [];
  const missingFacts: string[] = [];
  const matchedModels: string[] = [];

  resultsToCheck.forEach(([modelName, result]) => {
    const parsed = parseJsonResponse(result?.llmResponse || result?.answerSnippet);
    const targetSite = result?.targetSite || parsed?.target || null;

    if (isMentionedResult(result) || targetSite?.status === "matched") {
      matchedModels.push(modelName);
    }

    const targetFound = targetSite?.matchedFacts || targetSite?.matched_facts || [];
    const targetMissing = targetSite?.missingFacts || targetSite?.missing_facts || [];
    foundFacts.push(...(Array.isArray(targetFound) ? targetFound : []));
    missingFacts.push(...(Array.isArray(targetMissing) ? targetMissing : []));

    const lineFacts = collectFactLines([
      result?.llmResponse,
      result?.answerSnippet,
      result?.reasoning,
      result?.evidence,
    ].filter(Boolean).join("\n"));
    foundFacts.push(...lineFacts.found);
    missingFacts.push(...lineFacts.missing);
  });

  const anyMentioned = models.some((model) => isMentionedResult(query?.resultsByModel?.[model]));

  return {
    query: String(query?.query || ""),
    type: String(query?.label || query?.type || "Query"),
    matchedModels: uniqueStrings(matchedModels, 4),
    found: uniqueStrings(foundFacts, 3),
    missing: uniqueStrings(missingFacts, 5),
    isMissingMention: !anyMentioned,
  };
}

function getModelEvidence(query: any, model: string) {
  const result = query?.resultsByModel?.[model];
  if (!result) return null;

  const parsed = parseJsonResponse(result?.llmResponse || result?.answerSnippet);
  const targetSite = result?.targetSite || parsed?.target || null;
  const targetFound = targetSite?.matchedFacts || targetSite?.matched_facts || [];
  const targetMissing = targetSite?.missingFacts || targetSite?.missing_facts || [];
  const lineFacts = collectFactLines([
    result?.llmResponse,
    result?.answerSnippet,
    result?.reasoning,
    result?.evidence,
  ].filter(Boolean).join("\n"));

  const found = uniqueStrings([
    ...(Array.isArray(targetFound) ? targetFound : []),
    ...lineFacts.found,
  ], 8);
  const missing = uniqueStrings([
    ...(Array.isArray(targetMissing) ? targetMissing : []),
    ...lineFacts.missing,
  ], 12);

  if (found.length === 0 && missing.length === 0 && isMentionedResult(result)) return null;

  return {
    query: String(query?.query || ""),
    model,
    found,
    missing,
    mentioned: isMentionedResult(result),
  };
}

export interface OverviewData {
  // Score
  score: number;
  grade: string;
  visibilityText: string;

  // Scan trend
  previousScore: number | null;
  scanPoints: { score: number; timestamp: string }[];

  // Competitors — sourced from buildRankedCompetitors() and merged in at
  // the page level; only { name, score, isUser } are read by these components.
  competitors: { name: string; score: number; isUser: boolean }[];
  userRank: number;
  userRankOrdinal: string;
  nearestAboveName: string | null;
  nearestAboveGap: number | null;
  location?: string;

  // Audit areas
  auditAreas: { id: string; label: string; score: number; iconName: string; barColor: string; statusText: string; statusColor: string; statusBg: string }[];

  // AI insights from analyser
  aiInsights: string[];

  // Query model stats
  modelMentions: { model: string; mentioned: number; total: number }[];
  totalQueries: number;

  // Cited sources from queries
  citedSources: string[];
  missingCount: number;
  queryEvidence: {
    query: string;
    type: string;
    matchedModels: string[];
    found: string[];
    missing: string[];
    isMissingMention: boolean;
  }[];
  queryModelEvidence: {
    model: string;
    items: {
      query: string;
      found: string[];
      missing: string[];
      mentioned: boolean;
    }[];
    missingCount: number;
    foundCount: number;
  }[];

  // Blog drafts from weekly cache
  blogDrafts: { title: string; excerpt?: string }[];

  // Quick wins
  quickWins: { text: string; type: "boost" | "warn" | "info" }[];

  hasAnalyserData: boolean;
  hasQueryData: boolean;
}

function getGrade(score: number) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 55) return "B";
  if (score >= 40) return "C";
  return "F";
}

function getVisibility(score: number) {
  if (score >= 80) return "High Visibility";
  if (score >= 65) return "Good Visibility";
  if (score >= 50) return "Moderate Visibility";
  if (score >= 35) return "Low Visibility";
  return "Critical Visibility";
}

function ordinal(n: number) {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

export function useOverviewData(url: string, refreshSignal?: unknown, fallbackScore?: number): OverviewData {
  // The score/grade above normally come from a 2-hour, localStorage-only
  // scan cache — great for a live "just scanned" session, but it means the
  // score and trend chart go blank after 2 hours, after logout (which wipes
  // all wonder_-prefixed localStorage), or on a different device, even
  // though the score is genuinely still current. This is the durable
  // fallback: the same weekly_scores history persisted server-side by both
  // manual scans and the Sunday scheduler (see /api/user/history/site-trend
  // and DashboardHeader, which already does this same fallback for the
  // header's delta).
  const [dbTrend, setDbTrend] = useState<ScanPoint[]>([]);
  useEffect(() => {
    setDbTrend([]);
    if (!url) return;
    let cancelled = false;
    fetchApi<any>(`/api/user/history/site-trend?site=${encodeURIComponent(url)}`)
      .then((res) => {
        if (cancelled || !res || !Array.isArray(res.points)) return;
        const points: ScanPoint[] = res.points
          .filter((p: any) => typeof p.score === "number")
          .map((p: any) => ({ score: p.score, timestamp: p.created_at || p.week_id || "" }));
        setDbTrend(points);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [url]);

  return useMemo(() => {
    const analyserCache = loadAnalyserCache(url);
    const queryQueries: any[] | null = loadQueryCache(url);
    const localScanPoints = getScanHistory(url);
    const scanPoints = localScanPoints.length > 0 ? localScanPoints : dbTrend;

    const scanData = analyserCache?.scanData;
    const score = scanData?.scores?.total
      ?? (scanPoints.length > 0 ? Math.round(scanPoints[scanPoints.length - 1].score) : null)
      ?? fallbackScore
      ?? 0;
    const grade = getGrade(score);
    const visibilityText = getVisibility(score);

    const previousScore = scanPoints.length >= 2 ? scanPoints[scanPoints.length - 2].score : null;

    // Competitors are no longer derived here from cached query "sources" —
    // that produced a different, inconsistent list from page to page. The
    // single source of truth is now BusinessContext.liveDeepCompetitors
    // (buildRankedCompetitors(), see overview/page.tsx), the same value
    // Query reads, merged into this data at the page level. These fields
    // are neutral placeholders until that merge happens.
    const competitors: OverviewData["competitors"] = [];
    const userRank = 1;
    const userRankOrdinal = ordinal(userRank);
    const nearestAboveName: string | null = null;
    const nearestAboveGap: number | null = null;

    // Audit areas
    const auditAreas = analyserCache?.auditAreas || [];

    // AI insights — cached as objects { model, summary, ... } or plain strings
    const rawInsights: any[] = analyserCache?.aiInsights || [];
    const aiInsights: string[] = rawInsights
      .map((item: any) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          // Extract meaningful text from object format
          return item.summary || item.text || item.description || `${item.model || ""} has indexed your business entity.`;
        }
        return "";
      })
      .filter(Boolean)
      .slice(0, 3);

    // Query model stats
    const models = ["ChatGPT", "Claude", "Perplexity", "Gemini"];
    const totalQueries = queryQueries?.length || 0;
    const modelMentions = models.map(model => {
      const mentioned = queryQueries?.filter(q => isMentionedResult(q.resultsByModel?.[model])).length || 0;
      return { model, mentioned, total: totalQueries };
    });

    // Cited sources from query results — same shared, validated logic the
    // Query table/sidebar use, so this can never show junk (stray
    // version-like strings, IPs) that isn't actually a real domain, and
    // can never disagree with what those pages show for the same run.
    // Kept as the FULL list (not capped) so the "All Sources" sidebar shows
    // the same true count as the Query page; components that only want a
    // short preview (band pills, "cited alongside" list) slice it down
    // themselves at render time.
    const citedSources = getAllSourcesForQueries(queryQueries || []);
    const missingCount = queryQueries?.filter(q => {
      const anyMentioned = models.some(m => isMentionedResult(q.resultsByModel?.[m]));
      return !anyMentioned;
    }).length || 0;
    const queryEvidence = (queryQueries || [])
      .map((query) => getQueryEvidence(query, models))
      .filter((item) => item.query && (item.missing.length > 0 || item.found.length > 0 || item.isMissingMention))
      .sort((a, b) => {
        if (a.isMissingMention !== b.isMissingMention) return a.isMissingMention ? -1 : 1;
        return b.missing.length - a.missing.length;
      });
    const queryModelEvidence = models.map((model) => {
      const items = (queryQueries || [])
        .map((query) => getModelEvidence(query, model))
        .filter(Boolean) as {
          query: string;
          model: string;
          found: string[];
          missing: string[];
          mentioned: boolean;
        }[];

      return {
        model,
        items,
        missingCount: items.reduce((sum, item) => sum + item.missing.length, 0),
        foundCount: items.reduce((sum, item) => sum + item.found.length, 0),
      };
    }).filter((group) => group.items.length > 0);

    // Blog drafts
    let blogDrafts: { title: string; excerpt?: string }[] = [];
    if (typeof window !== "undefined" && url) {
      try {
        const blogKey = `wonder_blogs_${cleanUrl(url)}`;
        const raw = localStorage.getItem(blogKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          blogDrafts = (parsed?.drafts || []).slice(0, 2);
        }
      } catch {}
    }

    // Quick wins from AI insights + score gaps
    const quickWins: { text: string; type: "boost" | "warn" | "info" }[] = [];
    if (aiInsights.length > 0) {
      aiInsights.slice(0, 2).forEach(t => quickWins.push({ text: t, type: "boost" }));
    }
    // The "points behind" quick win now lives in overview/page.tsx, computed
    // from useCompetitorRanking() once real nearestAbove data is merged in.
    const weakestModel = [...modelMentions].sort((a, b) => a.mentioned - b.mentioned)[0];
    if (weakestModel && totalQueries > 0 && weakestModel.mentioned < totalQueries * 0.3) {
      quickWins.push({ text: `${weakestModel.model} mentions you in only ${weakestModel.mentioned}/${totalQueries} queries — a priority to fix.`, type: "warn" });
    }

    return {
      score,
      grade,
      visibilityText,
      previousScore,
      scanPoints,
      competitors,
      userRank,
      userRankOrdinal,
      nearestAboveName,
      nearestAboveGap,
      location: scanData?.location || undefined,
      auditAreas,
      aiInsights,
      modelMentions,
      totalQueries,
      citedSources,
      missingCount,
      queryEvidence,
      queryModelEvidence,
      blogDrafts,
      quickWins,
      hasAnalyserData: Boolean(scanData) || score > 0,
      hasQueryData: Boolean(queryQueries && queryQueries.length > 0),
    };
    // refreshSignal isn't read above — it's a proxy for "a Query run just
    // completed for this business" (BusinessContext.liveDeepCompetitors
    // updates the instant new results are saved to the session/localStorage
    // cache this hook reads from). Without it in the deps, this memo would
    // never see that the underlying cache changed and every figure here
    // (missingCount, citedSources, modelMentions, ...) would stay frozen at
    // whatever it was the first time this hook ran for this url.
  }, [url, refreshSignal, fallbackScore, dbTrend]);
}
