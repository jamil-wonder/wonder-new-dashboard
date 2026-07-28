"use client";

import { useMemo } from "react";
import { getScanHistory } from "../lib/api";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

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
  const key = `wonder_query_cache_${clean}`;
  try {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.timestamp && Date.now() - parsed.timestamp < TWO_HOURS_MS) return parsed.queries || null;
  } catch {}
  return null;
}

export interface OverviewData {
  // Score
  score: number;
  grade: string;
  visibilityText: string;

  // Scan trend
  previousScore: number | null;
  scanPoints: { score: number; timestamp: string }[];

  // Competitors from analyser
  competitors: { name: string; score: number; isUser: boolean; change: string }[];
  userRank: number;
  userRankOrdinal: string;
  nearestAboveName: string | null;
  nearestAboveGap: number | null;

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

export function useOverviewData(url: string): OverviewData {
  return useMemo(() => {
    const analyserCache = loadAnalyserCache(url);
    const queryQueries: any[] | null = loadQueryCache(url);
    const scanPoints = getScanHistory(url);

    const scanData = analyserCache?.scanData;
    const score = scanData?.scores?.total ?? 0;
    const grade = getGrade(score);
    const visibilityText = getVisibility(score);

    const previousScore = scanPoints.length >= 2 ? scanPoints[scanPoints.length - 2].score : null;

    // Competitors
    const rawComps: any[] = analyserCache?.competitors || [];
    const competitors = rawComps.length > 0
      ? rawComps.map((c: any, i: number) => ({
          name: c.name || c.domain || "Unknown",
          score: typeof c.score === "number" ? c.score : (typeof c.visibility_score === "number" ? c.visibility_score : 0),
          isUser: Boolean(c.isUser || c.is_user),
          change: c.change || "→",
        }))
      : [];

    const userRankIndex = competitors.findIndex(c => c.isUser);
    const userRank = userRankIndex >= 0 ? userRankIndex + 1 : 1;
    const userRankOrdinal = ordinal(userRank);

    const nearestAbove = userRank > 1 ? competitors[userRankIndex - 1] : null;
    const nearestAboveName = nearestAbove?.name || null;
    const nearestAboveGap = nearestAbove ? nearestAbove.score - score : null;

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
      const mentioned = queryQueries?.filter(q => q.resultsByModel?.[model]?.status === "Mentioned").length || 0;
      return { model, mentioned, total: totalQueries };
    });

    // Cited sources from query results
    const sourcesSet = new Set<string>();
    if (queryQueries) {
      queryQueries.forEach(q => {
        (q.sources || []).forEach((s: string) => sourcesSet.add(s));
      });
    }
    const citedSources = Array.from(sourcesSet).slice(0, 6);
    const missingCount = queryQueries?.filter(q => {
      const anyMentioned = models.some(m => q.resultsByModel?.[m]?.status === "Mentioned");
      return !anyMentioned;
    }).length || 0;

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
    if (nearestAboveName && nearestAboveGap !== null && nearestAboveGap <= 10) {
      quickWins.push({ text: `You're only ${nearestAboveGap} points behind ${nearestAboveName}. One good week can close the gap.`, type: "info" });
    }
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
      auditAreas,
      aiInsights,
      modelMentions,
      totalQueries,
      citedSources,
      missingCount,
      blogDrafts,
      quickWins,
      hasAnalyserData: Boolean(scanData),
      hasQueryData: Boolean(queryQueries && queryQueries.length > 0),
    };
  }, [url]);
}
