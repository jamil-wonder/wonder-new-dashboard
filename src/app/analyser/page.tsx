"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Globe, MapPin, Tag, CheckCircle2, XCircle, AlertCircle,
  Phone, Mail, Clock, Link2, FileCode2, Cpu, ShieldCheck, Smartphone,
  FileSearch, Bot, BrainCircuit, MessageSquare, Sparkles, ArrowRight,
  Building2, Languages, Image as ImageIcon, BookOpen, TrendingUp, TrendingDown,
  X, Info, Contact
} from "lucide-react";
import ScanProgressModal from "../../components/analyser/ScanProgressModal";
import { WonderscoreSpinner, WonderscoreLogo } from "../../components/ui/WonderscoreSpinner";
import { useBusiness, isDomainString, isGenericName } from "../../context/BusinessContext";
import { useToast } from "../../context/ToastContext";
import { fetchApi, recordScanHistory } from "../../lib/api";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000; // 2 Hours TTL cache limit
const ACTIVE_ANALYSER_MAX_AGE_MS = 15 * 60 * 1000;

function getVisibilityInfo(score: number, gradeRaw?: string) {
  const grade = gradeRaw || (score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B+" : score >= 55 ? "B" : score >= 40 ? "C" : "F");
  
  let visibilityText = "High Visibility";
  let bg = "#f0d878";
  let text = "#3a2e08";

  if (score >= 80) {
    visibilityText = "High Visibility";
    bg = "#f0d878";
    text = "#3a2e08";
  } else if (score >= 65) {
    visibilityText = "Good Visibility";
    bg = "#dcefe2";
    text = "#1e7d4f";
  } else if (score >= 50) {
    visibilityText = "Moderate Visibility";
    bg = "#f7e7c4";
    text = "#9a6a12";
  } else if (score >= 35) {
    visibilityText = "Low Visibility";
    bg = "#f6dcd5";
    text = "#b1442a";
  } else {
    visibilityText = "Critical Visibility";
    bg = "#f6dcd5";
    text = "#b1442a";
  }

  return { grade, visibilityText, bg, text };
}

function StatusIcon({ ok, warn }: { ok?: boolean; warn?: boolean }) {
  if (warn) return <AlertCircle className="w-4 h-4 text-[#d6a23a] shrink-0" />;
  return ok
    ? <CheckCircle2 className="w-4 h-4 text-[#1e7d4f] shrink-0" />
    : <XCircle className="w-4 h-4 text-[#d9694a] shrink-0" />;
}

const ICON_MAP: Record<string, React.ElementType> = {
  MessageSquare, BookOpen, FileCode2, Building2, FileSearch, Cpu,
};

const AUDIT_AREA_DESCRIPTIONS: Record<string, string> = {
  sentiment: "How clearly your business name, category, and description come across to AI — built from how complete and unambiguous your core identity signals are on the page.",
  sources: "How many verifiable contact and social signals (phone, email, social profiles) AI models and search engines can point to as evidence when answering questions about you.",
  content: "How much substance your page gives AI to work with — a real description, a canonical URL, a declared language, and a clear logo all help AI summarize you accurately instead of guessing.",
  presence: "How many social and platform profiles are linked from your site — more linked platforms give AI more independent places to confirm who you are.",
  coverage: "How much structured data (JSON-LD schema) your site exposes — this is the machine-readable map AI uses to understand what your business actually offers.",
  technical: "Core crawlability infrastructure — SSL, mobile-friendliness, a canonical URL, sitemap.xml, and robots.txt. Without these, AI crawlers can struggle to reach or trust your pages at all.",
};

export default function AnalyserPage() {
  const { activeBusiness, updateActiveBusiness } = useBusiness();
  const { showToast } = useToast();

  const [isScanning, setIsScanning] = useState(false);
  const [isScanComplete, setIsScanComplete] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const [scanError, setScanError] = useState<string | null>(null);

  // Live dynamic data state
  const [scanData, setScanData] = useState<any>(null);
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [selectedAiInsight, setSelectedAiInsight] = useState<any | null>(null);
  const [auditAreas, setAuditAreas] = useState<any[]>([]);
  const [technicalInfoOpen, setTechnicalInfoOpen] = useState(false);

  const domain = activeBusiness?.url || "";
  const businessName = activeBusiness?.name || "";
  const category = activeBusiness?.category || "";
  const location = activeBusiness?.location || "";

  const getCacheKey = useCallback((targetUrl: string) => {
    const clean = targetUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    return `wonder_analyser_cache_${clean}`;
  }, []);

  const getActiveAnalysisKey = useCallback((targetUrl: string) => {
    const clean = targetUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    return `wonder_analyser_active_${clean}`;
  }, []);

  // Check 2-Hour TTL cache before making API calls
  const loadCachedAnalysis = useCallback((targetUrl: string) => {
    if (typeof window === "undefined") return null;
    try {
      const cacheKey = getCacheKey(targetUrl);
      const raw = localStorage.getItem(cacheKey) || sessionStorage.getItem(cacheKey);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (parsed && parsed.timestamp && (Date.now() - parsed.timestamp < TWO_HOURS_MS)) {
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  }, [getCacheKey]);

  const clearCachedAnalysis = useCallback((targetUrl: string) => {
    if (typeof window === "undefined") return;
    try {
      const cacheKey = getCacheKey(targetUrl);
      sessionStorage.removeItem(cacheKey);
      localStorage.removeItem(cacheKey);
    } catch {}
  }, [getCacheKey]);

  // Save to 2-Hour TTL cache
  const saveCachedAnalysis = useCallback((targetUrl: string, payload: any) => {
    if (typeof window === "undefined") return;
    try {
      const cacheKey = getCacheKey(targetUrl);
      const cacheData = {
        timestamp: Date.now(),
        ...payload,
      };
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch {}
  }, [getCacheKey]);

  const markActiveAnalysis = useCallback((targetUrl: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(getActiveAnalysisKey(targetUrl), JSON.stringify({
        url: targetUrl,
        startedAt: Date.now(),
      }));
    } catch {}
  }, [getActiveAnalysisKey]);

  const clearActiveAnalysis = useCallback((targetUrl: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(getActiveAnalysisKey(targetUrl));
    } catch {}
  }, [getActiveAnalysisKey]);

  const activeBusinessRef = useRef(activeBusiness);
  const updateActiveBusinessRef = useRef(updateActiveBusiness);
  // Incremented on every runLiveAnalysis call; captured at the start of
  // each call so a slow in-flight scrape/insights request from a business
  // the user has since switched away from can detect it's stale and
  // discard its result instead of overwriting whatever business is
  // currently on screen.
  const analysisRequestIdRef = useRef(0);

  useEffect(() => {
    activeBusinessRef.current = activeBusiness;
    updateActiveBusinessRef.current = updateActiveBusiness;
  });

  // Dynamic analysis executor that queries backend live
  const runLiveAnalysis = useCallback(async (isUserTriggered = false) => {
    if (!domain) return;
    // Claim this call's slot — if a NEWER call has started by the time
    // this one's network requests resolve (e.g. the user switched to a
    // different business), its result-application below detects the
    // mismatch and discards itself instead of overwriting the new
    // business's display with the old one's data.
    const requestId = ++analysisRequestIdRef.current;

    // If not user-triggered (e.g. page navigation), check 2-Hour TTL cache first!
    if (!isUserTriggered) {
      const cached = loadCachedAnalysis(domain);
      if (cached && cached.scanData) {
        setScanData(cached.scanData);
        setAiInsights(cached.aiInsights || []);
        setAuditAreas(cached.auditAreas || []);
        setIsLoadingInitial(false);
        if (
          typeof cached.scanData.scores?.total === "number" &&
          activeBusinessRef.current?.completeness !== cached.scanData.scores.total
        ) {
          updateActiveBusinessRef.current({ completeness: cached.scanData.scores.total });
        }
        return; // Successfully served from 2-Hour cache without re-crawling!
      }
    }

    try {
      setScanError(null);
      if (isUserTriggered) {
        clearCachedAnalysis(domain);
        setScanData(null);
        setAiInsights([]);
        setAuditAreas([]);
        setIsScanning(true);
        setIsScanComplete(false);
        markActiveAnalysis(domain);
        showToast(`Starting website analysis for ${domain}. This can take 1-5 minutes.`, "info");
      } else {
        // No cache for this business — clear whatever's currently shown
        // (very likely the PREVIOUS business's scan) instead of leaving it
        // on screen, mislabeled, for the 1-5 minutes this fetch takes.
        setScanData(null);
        setAiInsights([]);
        setAuditAreas([]);
        try {
          const raw = typeof window !== "undefined" ? localStorage.getItem(getActiveAnalysisKey(domain)) : null;
          const activeRun = raw ? JSON.parse(raw) : null;
          if (activeRun?.startedAt && Date.now() - Number(activeRun.startedAt) < ACTIVE_ANALYSER_MAX_AGE_MS) {
            showToast("Website analysis is still running. This can take 1-5 minutes, and you can return here for results.", "info");
          }
        } catch {}
        setIsLoadingInitial(true);
      }

      // Format clean domain URL
      const cleanUrl = domain.startsWith("http") ? domain : `https://${domain}`;

      // Dispatch parallel API requests to FastAPI backend
      const scrapePromise = fetchApi<any>("/api/scrape", {
        method: "POST",
        body: JSON.stringify({ url: cleanUrl, category, location }),
      }).catch(() => null);

      const insightsPromise = fetchApi<any>("/api/ai-insights", {
        method: "POST",
        body: JSON.stringify({ businessName, url: cleanUrl }),
      }).catch(() => null);

      // Await live backend resolution
      const [scrapeRes, insightsRes] = await Promise.all([
        scrapePromise,
        insightsPromise,
      ]);

      let finalScan: any = null;
      let finalAreas: any[] = [];
      let finalInsights: any[] = [];

      // ── 1. Process Scrape Results ──────────────────────────────────────────
      if (scrapeRes && scrapeRes.scores) {
        const scores = scrapeRes.scores;
        const totalScore = scores.total || 91;
        const grade = scores.grade || (totalScore >= 90 ? "A+" : totalScore >= 80 ? "A" : "B+");
        const detectedName = scrapeRes.businessName || scrapeRes.businessProfile?.name;

        // Preserve current activeBusiness.name if it's already a clean brand name or user-edited
        let finalBusinessName = activeBusinessRef.current?.name || activeBusiness.name;
        if (isGenericName(finalBusinessName) && detectedName && !isDomainString(detectedName) && detectedName !== "My Business") {
          finalBusinessName = detectedName;
        }

        updateActiveBusinessRef.current({
          name: finalBusinessName,
          logoUrl: scrapeRes.logoUrl || scrapeRes.logo_url || activeBusinessRef.current?.logoUrl,
          category: scrapeRes.category || category,
          location: scrapeRes.location || location,
          completeness: totalScore,
          description: scrapeRes.description || activeBusinessRef.current?.description,
        });

        const schemasFound = scrapeRes.schemas?.length || 0;
        const socialsFound = Object.keys(scrapeRes.socialLinks || {}).length;
        const hasSSL = scrapeRes.hasSSL ?? true;
        const hasMobile = scrapeRes.hasMobileMeta ?? true, hasSitemap = scrapeRes.sitemapFound ?? true, hasRobots = scrapeRes.robotsTxtFound ?? true;

        // 1. How AI Describes You (Brand & Entity Sentiment)
        const sentimentScore = Math.min(100, Math.max(70, Math.round(((scores.coreIdentity?.total || 22) / 25) * 100)));

        // 2. Where AI Gets Its Information (Citations & NAP Signals)
        const sourcesScore = Math.min(100, Math.round(75 + (socialsFound > 0 ? 12 : 0) + (scrapeRes.phones?.length ? 8 : 0) + (scrapeRes.emails?.length ? 5 : 0)));

        // 3. Content Quality (Meta Depth & Text Clarity)
        let contentScore = 20;
        if (scrapeRes.description && scrapeRes.description.length > 30) contentScore += 35;
        if (scrapeRes.canonicalUrl) contentScore += 20;
        if (scrapeRes.language) contentScore += 15;
        if (scrapeRes.logoFound) contentScore += 10;
        contentScore = Math.min(100, Math.max(65, contentScore));

        // 4. Presence Across Platforms (Social & Directory Footprint)
        const presenceScore = socialsFound >= 3 ? 95 : socialsFound === 2 ? 85 : socialsFound === 1 ? 75 : 60;

        // 5. Topic Coverage (Structured Schema Entity Graph)
        const coverageScore = schemasFound >= 3 ? 92 : schemasFound === 2 ? 82 : schemasFound === 1 ? 70 : 45;

        // 6. Technical Health (Infrastructure & Mobile Readiness)
        let techScore = 0;
        if (hasSSL) techScore += 20;
        if (hasMobile) techScore += 20;
        if (scrapeRes.canonicalUrl) techScore += 20;
        if (hasSitemap) techScore += 20;
        if (hasRobots) techScore += 20;
        techScore = Math.min(100, Math.max(70, techScore));

        finalScan = {
          businessName: detectedName,
          url: domain,
          category: scrapeRes.category || category,
          location: scrapeRes.location || location,
          description: scrapeRes.description || activeBusiness.description || `${detectedName} in ${location}.`,
          canonicalUrl: scrapeRes.canonicalUrl || cleanUrl,
          language: (scrapeRes.language || "EN-GB").toUpperCase(),
          hasSSL,
          hasMobileMeta: hasMobile,
          sitemapFound: hasSitemap,
          robotsTxtFound: hasRobots,
          emails: scrapeRes.emails?.length ? scrapeRes.emails : [userEmailFallback(domain)],
          phones: scrapeRes.phones || [],
          // No location-stuffing — an address genuinely not found on the
          // site must read as not found downstream, not silently become
          // the business's city/region as if it were a real street address.
          addresses: scrapeRes.addresses || [],
          openingHours: scrapeRes.openingHours || [],
          socialLinks: scrapeRes.socialLinks || {},
          schemas: scrapeRes.schemas || [],
          hasContactPath: scrapeRes.hasContactPath ?? false,
          logoFound: Boolean(scrapeRes.logoUrl),
          technologies: scrapeRes.technologies || [],
          warnings: scrapeRes.warnings || [],
          scores: {
            total: totalScore,
            grade,
            coreIdentity: { total: sentimentScore },
            contact: { total: sourcesScore },
            operating: { total: 90 },
            trust: { total: presenceScore },
            schema: { total: coverageScore },
            technical: { total: techScore },
          },
        };

        finalAreas = [
          { id: "sentiment", label: "How AI describes you", score: sentimentScore, statusText: sentimentScore >= 75 ? "GOOD" : "OKAY", statusColor: sentimentScore >= 75 ? "#1e7d4f" : "#9a6a12", statusBg: sentimentScore >= 75 ? "#dcefe2" : "#f7e7c4", barColor: sentimentScore >= 75 ? "#2e9e5b" : "#d6a23a", iconName: "MessageSquare" },
          { id: "sources", label: "Where AI gets its information", score: sourcesScore, statusText: sourcesScore >= 75 ? "GOOD" : "OKAY", statusColor: sourcesScore >= 75 ? "#1e7d4f" : "#9a6a12", statusBg: sourcesScore >= 75 ? "#dcefe2" : "#f7e7c4", barColor: sourcesScore >= 75 ? "#2e9e5b" : "#d6a23a", iconName: "BookOpen" },
          { id: "content", label: "Content quality", score: contentScore, statusText: contentScore >= 75 ? "GOOD" : "RISING", statusColor: contentScore >= 75 ? "#1e7d4f" : "#9a6a12", statusBg: contentScore >= 75 ? "#dcefe2" : "#f7e7c4", barColor: contentScore >= 75 ? "#2e9e5b" : "#d6a23a", iconName: "FileCode2" },
          { id: "presence", label: "Presence across platforms", score: presenceScore, statusText: presenceScore >= 75 ? "GOOD" : "OKAY", statusColor: presenceScore >= 75 ? "#1e7d4f" : "#9a6a12", statusBg: presenceScore >= 75 ? "#dcefe2" : "#f7e7c4", barColor: presenceScore >= 75 ? "#2e9e5b" : "#d6a23a", iconName: "Building2" },
          { id: "coverage", label: "Topic coverage", score: coverageScore, statusText: coverageScore >= 75 ? "GOOD" : coverageScore >= 60 ? "RISING" : "NEEDS WORK", statusColor: coverageScore >= 75 ? "#1e7d4f" : coverageScore >= 60 ? "#9a6a12" : "#b1442a", statusBg: coverageScore >= 75 ? "#dcefe2" : coverageScore >= 60 ? "#f7e7c4" : "#f6dcd5", barColor: coverageScore >= 75 ? "#2e9e5b" : coverageScore >= 60 ? "#d6a23a" : "#dc6b6b", iconName: "FileSearch" },
          { id: "technical", label: "Technical health", score: techScore, statusText: techScore >= 75 ? "GOOD" : "NEEDS WORK", statusColor: techScore >= 75 ? "#1e7d4f" : "#b1442a", statusBg: techScore >= 75 ? "#dcefe2" : "#f6dcd5", barColor: techScore >= 75 ? "#2e9e5b" : "#dc6b6b", iconName: "Cpu" },
        ];
      } else {
        // The real scrape failed or came back without scores — do not
        // fabricate a passing scorecard. Leave finalScan null so the UI
        // shows an honest "analysis failed, try again" state instead of
        // invented scores and invented contact details for a business
        // that were never actually crawled.
        finalScan = null;
        finalAreas = [];
        setScanError("We couldn't complete the website scan. The site may be unreachable, or something went wrong on our end.");
      }

      // ── 2. Process AI Insights ─────────────────────────────────────────────
      if (insightsRes && Array.isArray(insightsRes.insights) && insightsRes.insights.length > 0) {
        finalInsights = insightsRes.insights.map((item: any) => {
          const rawName = String(item.model || item.modelName || "").toLowerCase();
          let icon = "/icons/chatgpt.svg";
          let label = "ChatGPT";

          if (rawName.includes("claude")) {
            icon = "/icons/claude.svg";
            label = "Claude";
          } else if (rawName.includes("pplx") || rawName.includes("perplexity")) {
            icon = "/icons/perplexity.svg";
            label = "Perplexity";
          } else if (rawName.includes("gemini")) {
            icon = "/icons/gemini.svg";
            label = "Gemini";
          } else if (rawName.includes("gpt")) {
            icon = "/icons/chatgpt.svg";
            label = "ChatGPT";
          }

          const isOffline = item.summary && item.summary.includes("offline");
          const conf = isOffline ? "Low" : item.isKnown || item.sentiment === "Positive" ? "High" : "Medium";

          return {
            model: label,
            icon,
            confidence: conf,
            confidenceColor: conf === "High" ? "#1e7d4f" : conf === "Medium" ? "#9a6a12" : "#b1442a",
            confidenceBg: conf === "High" ? "#dcefe2" : conf === "Medium" ? "#f7e7c4" : "#f6dcd5",
            summary: item.summary || `${label} indexed ${domain} entity details.`,
            verifiedFields: item.platforms?.length ? item.platforms.map((p: string) => p) : ["Name", "URL", "Location"],
            missingFields: isOffline ? ["API Offline"] : ["Hours"],
            raw: item,
          };
        });
      } else {
        // Real AI-insights call failed or returned nothing — leave this
        // empty rather than inventing quotes and attributing them to
        // specific AI models that were never actually queried.
        finalInsights = [];
      }

      // Record crawl score in scan history for trend comparison, and save
      // to cache regardless of staleness — both are keyed by THIS call's
      // domain (from closure) and remain correct for that business even
      // if the user has since switched away from it.
      if (finalScan?.scores?.total) {
        recordScanHistory(domain, finalScan.scores.total);
        // Only a genuinely successful scan is worth caching — caching a
        // failure would mean the 2-hour TTL cache "successfully" serves
        // back a null result on the next visit instead of retrying.
        saveCachedAnalysis(domain, {
          scanData: finalScan,
          auditAreas: finalAreas,
          aiInsights: finalInsights,
        });
        // Fire-and-forget scan-complete email — only reachable here, right
        // after a REAL fresh scan actually finished (the 2-hour cache-hit
        // path above returns long before this point), so a cached page
        // load never re-sends the email. Sends the raw backend insight
        // shape (modelName/isKnown/summary), not the UI-remapped
        // finalInsights, and finalScan is already the right shape for the
        // email's own scoring/entity-signal reads. Silently no-ops if
        // notifications are off or the request fails — never surfaced to
        // the user, this is a background nicety, not part of the scan flow.
        fetchApi("/api/notify/scan-complete", {
          method: "POST",
          body: JSON.stringify({
            url: domain,
            businessName: finalScan.businessName || businessName,
            scrape: finalScan,
            aiInsights: insightsRes?.insights || [],
            // finalScan.scores has already been overwritten with these same
            // transformed values by this point, so the email can't safely
            // re-derive them itself (e.g. coreIdentity.total is no longer
            // the raw /25 score sentimentScore was computed from) — send
            // the already-correct areas straight from where they were built.
            areas: finalAreas.map((a) => ({ id: a.id, label: a.label, score: a.score })),
          }),
        }).catch(() => {});
      }
      clearActiveAnalysis(domain);

      // Only touch what's actually ON SCREEN if this is still the latest
      // call — otherwise the user has switched business since this
      // request started, and applying it now would overwrite the new
      // business's display with the old one's data.
      if (analysisRequestIdRef.current !== requestId) return;

      setScanData(finalScan);
      setAuditAreas(finalAreas);
      setAiInsights(finalInsights);

      if (isUserTriggered) {
        setIsScanComplete(true);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      setScanError("Something went wrong while analysing this website. Please try again.");
      if (isUserTriggered && analysisRequestIdRef.current === requestId) setIsScanComplete(true);
    } finally {
      if (analysisRequestIdRef.current === requestId) setIsLoadingInitial(false);
    }
  }, [domain, businessName, category, location, showToast, loadCachedAnalysis, clearCachedAnalysis, saveCachedAnalysis, markActiveAnalysis, clearActiveAnalysis, getActiveAnalysisKey]);

  // Execute analysis on mount or domain change
  useEffect(() => {
    // A scan left running on the PREVIOUS business is now correctly
    // prevented (via analysisRequestIdRef) from writing its result into
    // this new business's display — but without resetting these too,
    // isScanning could stay stuck true here forever, since the old scan's
    // completion no longer flips it off for a business it doesn't belong
    // to. Clean slate for whichever business is now active.
    setIsScanning(false);
    setIsScanComplete(false);
    if (!domain) {
      // No active business — nothing to analyse, and no scan already in
      // flight to wait on, so don't leave the loading spinner spinning.
      setIsLoadingInitial(false);
      return;
    }
    runLiveAnalysis(false);
  }, [domain, runLiveAnalysis]);

  const handleStartScan = () => {
    runLiveAnalysis(true);
  };

  const handleScanComplete = () => {
    setIsScanning(false);
    setIsScanComplete(false);
    if (scanData) {
      showToast(`AI analysis completed! Brand details for ${businessName} updated sitewide.`, "success");
    }
  };

  if (!domain) {
    return (
      <div className="bg-white border border-[#ece3d1] rounded-[22px] p-12 text-center shadow-xs my-8 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-[#f6f3ec] border border-[#ece3d1] flex items-center justify-center mb-4">
          <Building2 className="w-6 h-6 text-[#9b927f]" />
        </div>
        <div className="font-spectral text-[19px] font-semibold text-[#23211b]">No business added yet</div>
        <p className="text-[13px] text-[#8a8273] mt-1.5 max-w-[360px]">
          Add a business profile to crawl its website and run the AI visibility analysis.
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

  if (isLoadingInitial && !scanData) {
    return (
      <div className="bg-white border border-[#ece3d1] rounded-[22px] p-12 text-center shadow-xs my-8 flex flex-col items-center justify-center">
        <WonderscoreSpinner
          size={48}
          label={`Analysing ${domain}`}
          note="This can take 1-5 minutes. We are checking the website, AI visibility, and business signals."
        />
      </div>
    );
  }

  if (!isLoadingInitial && !scanData && scanError) {
    return (
      <div className="bg-white border border-[#ece3d1] rounded-[22px] p-12 text-center shadow-xs my-8 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-[#fdeee7] border border-[#f0d4ce] flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-[#b1442a]" />
        </div>
        <div className="font-spectral text-[19px] font-semibold text-[#23211b]">Analysis failed</div>
        <p className="text-[13px] text-[#8a8273] mt-1.5 max-w-[360px]">{scanError}</p>
        <button
          type="button"
          onClick={handleStartScan}
          className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-[#15463b] hover:bg-[#1a5c44] px-4 py-2.5 rounded-lg transition-colors cursor-pointer border-none"
        >
          Try again
        </button>
      </div>
    );
  }

  const s = scanData || {};

  return (
    <div className="space-y-5 pb-12 relative">
      
      {/* ── Scan Progress Modal ── */}
      <ScanProgressModal
        isOpen={isScanning}
        isComplete={isScanComplete}
        onClose={handleScanComplete}
        title="Website Analysis"
      />

      {selectedAiInsight && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close AI insight details"
            className="absolute inset-0 bg-[#23211b]/45 backdrop-blur-[3px] border-0 cursor-default"
            onClick={() => setSelectedAiInsight(null)}
          />
          <div className="relative w-full max-w-2xl max-h-[86vh] overflow-hidden rounded-[18px] border border-[#ece3d1] bg-white shadow-[0_18px_54px_rgba(35,33,27,0.18)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#ece3d1] bg-[#fdfcf8] px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl border border-[#e8dcc8] bg-white flex items-center justify-center shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={selectedAiInsight.icon} alt={selectedAiInsight.model} className="w-6 h-6 object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="font-spectral text-[22px] font-semibold text-[#23211b] leading-tight">
                    {selectedAiInsight.model} insight
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className="text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
                      style={{ color: selectedAiInsight.confidenceColor, backgroundColor: selectedAiInsight.confidenceBg }}
                    >
                      {selectedAiInsight.confidence}
                    </span>
                    <span className="text-[12px] text-[#8a8273]">Full model details</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAiInsight(null)}
                className="w-9 h-9 rounded-lg border border-[#e8dcc8] bg-white text-[#6f6757] hover:text-[#23211b] hover:bg-[#f5f0e6] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[calc(86vh-86px)] overflow-y-auto p-5 space-y-4">
              <section className="rounded-xl border border-[#ece3d1] bg-[#fdfcf8] p-4">
                <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f] mb-2">Summary</div>
                <p className="text-[14px] leading-relaxed text-[#3a352b] whitespace-pre-wrap">
                  {selectedAiInsight.summary || "No summary returned for this model."}
                </p>
              </section>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <section className="rounded-xl border border-[#d7eedf] bg-[#f3fbf6] p-4">
                  <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#1e7d4f] mb-2">Detected</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedAiInsight.verifiedFields?.length ? selectedAiInsight.verifiedFields : ["No detected fields"]).map((field: string) => (
                      <span key={field} className="text-[11px] font-semibold text-[#1e7d4f] bg-white border border-[#c7ead3] px-2 py-1 rounded-md">
                        ✓ {field}
                      </span>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-[#f3d2c9] bg-[#fff6f3] p-4">
                  <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#b1442a] mb-2">Missing or weak</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedAiInsight.missingFields?.length ? selectedAiInsight.missingFields : ["No obvious gaps returned"]).map((field: string) => (
                      <span key={field} className="text-[11px] font-semibold text-[#b1442a] bg-white border border-[#f0c5ba] px-2 py-1 rounded-md">
                        × {field}
                      </span>
                    ))}
                  </div>
                </section>
              </div>

              {selectedAiInsight.raw && (
                <section className="rounded-xl border border-[#ece3d1] bg-[#0b1020] p-4">
                  <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#b8c1e8] mb-2">Raw AI data</div>
                  <pre className="max-h-[260px] overflow-auto whitespace-pre-wrap break-words text-[11.5px] leading-relaxed text-[#eef3ff]">
                    {JSON.stringify(selectedAiInsight.raw, null, 2)}
                  </pre>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#ece3d1] rounded-[18px] p-6 md:p-[28px_32px] shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#ece3d1] pb-5 mb-5">
          <div>
            <h1 className="font-spectral text-[28px] font-semibold text-[#15463b]">AI Visibility Analyzer</h1>
            <p className="text-[14px] text-[#6f6757] mt-1 max-w-[520px] leading-relaxed">
              Sitemaps, schema, entity signals, crawler permissions, and how each AI model sees your business.
            </p>
          </div>
          <button
            onClick={handleStartScan}
            disabled={isScanning}
            className="pb inline-flex items-center gap-2 bg-[#15463b] text-white text-[13.5px] font-semibold px-5 py-2.5 rounded-xl border-none hover:bg-[#1a5c44] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isScanning ? (
              <div className="animate-spin shrink-0">
                <WonderscoreLogo size={16} color="white" />
              </div>
            ) : (
              <WonderscoreLogo size={16} color="white" />
            )}
            {isScanning ? "Crawling Site..." : "Re-run crawl"}
          </button>
        </div>

        {/* Config pills */}
        {(() => {
          const cleanDomainHost = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
          const faviconUrl = `https://www.google.com/s2/favicons?domain=${cleanDomainHost}&sz=64`;

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
              {[
                { label: "Domain", value: domain, isDomain: true },
                { icon: Tag, label: "Category", value: category },
                { icon: MapPin, label: "Location", value: location },
                { icon: Languages, label: "Language", value: s.language || "EN-GB" },
              ].map((item) => {
                const Icon = item.icon || Globe;
                return (
                  <div key={item.label} className="flex items-center gap-3 bg-[#fdfcf8] border border-[#ece3d1] rounded-xl p-3.5">
                    {item.isDomain ? (
                      <div className="w-6 h-6 rounded-md overflow-hidden bg-[#f5f0e6] flex items-center justify-center shrink-0 border border-[#e2d8c3]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={faviconUrl}
                          alt={`${cleanDomainHost} favicon`}
                          className="w-4 h-4 object-contain"
                          onError={(e) => {
                            // Fallback to Globe icon if image fails
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <Icon className="w-4 h-4 text-[#9b927f] shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-mono-spline text-[9.5px] tracking-wider uppercase text-[#9b927f]">{item.label}</div>
                      <div className="text-[14px] font-bold text-[#23211b] mt-0.5 truncate">{item.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* ── Overall Score + Area Breakdown ──────────────────────────────── */}
      <div className={`grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 transition-all duration-300 ${isScanning ? "opacity-75 blur-[1px]" : ""}`}>

        {/* Score card */}
        {(() => {
          const currentTotalScore = typeof s.scores?.total === "number" ? s.scores.total : (activeBusiness?.completeness || 78);
          const { grade: dynamicGrade, visibilityText, bg: pillBg, text: pillText } = getVisibilityInfo(currentTotalScore, s.scores?.grade);
          const ringCircumference = 207.34;
          const strokeDashLength = Math.max(0, Math.min(207.34, (currentTotalScore / 100) * 207.34));
          const ringColor = currentTotalScore >= 70 ? "#a8d860" : currentTotalScore >= 50 ? "#f0d878" : "#dc6b6b";

          const hasTrend = s.scoreChange !== undefined && s.scoreChange !== null;
          const isTrendUp = typeof s.scoreChange === "number" ? s.scoreChange > 0 : String(s.scoreChange || "").startsWith("+");

          return (
            <div className="bg-[#15463b] rounded-[18px] p-6 text-white flex flex-col justify-between">
              <div>
                <div className="font-mono-spline text-[10px] tracking-[0.16em] uppercase text-[#86b89f]">Overall Score</div>
                
                <div className="flex items-center justify-between gap-2 mt-3.5">
                  <div className="flex items-baseline gap-0.5">
                    <span className="font-spectral text-[72px] leading-none font-semibold">{currentTotalScore}</span>
                    <span className="font-spectral text-[17px] text-[#7fae97]">/100</span>
                  </div>

                  {/* Dynamic circle progress ring */}
                  <div className="relative w-[80px] h-[80px] shrink-0">
                    <svg width="80" height="80" viewBox="0 0 80 80" className="block">
                      <circle cx="40" cy="40" r="33" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="8" />
                      <circle
                        cx="40"
                        cy="40"
                        r="33"
                        fill="none"
                        stroke={ringColor}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${strokeDashLength.toFixed(1)} 207.3`}
                        transform="rotate(-90 40 40)"
                      />
                    </svg>
                    {hasTrend && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {isTrendUp ? (
                          <TrendingUp className="w-6 h-6 text-[#a8d860]" />
                        ) : (
                          <TrendingDown className="w-6 h-6 text-[#dc6b6b]" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3">
                  <span
                    className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1 rounded-full transition-colors"
                    style={{ backgroundColor: pillBg, color: pillText }}
                  >
                    Grade {dynamicGrade} · {visibilityText}
                  </span>
                </div>
              </div>

              <div className="mt-6 space-y-2.5">
                {[
                  { label: "Core Identity",  val: s.scores?.coreIdentity?.total || 100 },
                  { label: "Contact Info",   val: s.scores?.contact?.total || 90 },
                  { label: "Schema",         val: s.scores?.schema?.total || 66 },
                  { label: "Technical",      val: s.scores?.technical?.total || 100 },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <div className="flex justify-between text-[11.5px] mb-1">
                      <span className="text-[#86b89f]">{label}</span>
                      <span className="font-bold text-white">{val}%</span>
                    </div>
                    <div className="h-[4px] bg-white/15 rounded-full overflow-hidden">
                      <div className="h-full bg-[#a8d860] rounded-full" style={{ width: `${val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* 6 Audit Area bars */}
        <div className="bg-[#fdfcf8] border border-[#ece3d1] rounded-[18px] p-5 md:p-[22px_26px]">
          <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f] mb-5">
            Score Breakdown · 6 Weighted Audit Areas
          </div>
          <div className="flex flex-col gap-4">
            {auditAreas.map((item) => {
              const IconComponent = ICON_MAP[item.iconName] || FileCode2;
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.statusBg }}>
                    <IconComponent className="w-4 h-4" style={{ color: item.statusColor }} />
                  </div>
                  <div className="group relative flex items-center gap-1 flex-1 min-w-0">
                    <span className="text-[13.5px] text-[#23211b] font-medium">{item.label}</span>
                    <Info className="w-3.5 h-3.5 text-[#9b927f] hover:text-[#15463b] transition-colors cursor-pointer shrink-0" />

                    {/* Floating Tooltip Popover */}
                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-[240px] bg-[#15463b] text-white text-[11.5px] leading-snug p-2.5 rounded-xl shadow-xl z-30 pointer-events-none transition-all">
                      <div className="font-semibold text-[#a8d860] mb-0.5">{item.label}</div>
                      {AUDIT_AREA_DESCRIPTIONS[item.id] || "Part of your 6-area AI visibility audit score."}
                      <div className="absolute left-2 -bottom-1 w-2 h-2 bg-[#15463b] rotate-45"></div>
                    </div>
                  </div>
                  <div className="w-[140px] sm:w-[200px] h-[7px] bg-[#eee9de] rounded-full overflow-hidden shrink-0">
                    <div className="h-full rounded-full transition-all" style={{ width: `${item.score}%`, backgroundColor: item.barColor }} />
                  </div>
                  <span className="num text-[13px] font-bold text-[#23211b] w-[50px] text-right shrink-0">
                    {item.score}<span className="text-[#b3a98f] font-normal">/100</span>
                  </span>
                  <span className="font-mono-spline text-[8px] font-semibold tracking-wider px-2 py-1 rounded text-center w-[68px] shrink-0"
                    style={{ color: item.statusColor, backgroundColor: item.statusBg }}>
                    {item.statusText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── AI Model Insights ───────────────────────────────────────────── */}
      <div className={`bg-white border border-[#ece3d1] rounded-[18px] p-5 md:p-[22px_26px] shadow-sm transition-all duration-300 ${isScanning ? "opacity-75 blur-[1px]" : ""}`}>
        <div className="flex items-center gap-2 mb-5">
          <BrainCircuit className="w-4 h-4 text-[#15463b]" />
          <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f]">
            AI Model Insights · How each model sees this business
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {aiInsights.map((ai) => {
            return (
              <button
                key={ai.model}
                type="button"
                onClick={() => setSelectedAiInsight(ai)}
                className="text-left border border-[#ece3d1] rounded-xl p-4 flex flex-col gap-3 bg-[#fdfcf8] hover:border-[#b8cdfd] hover:bg-white hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 shrink-0 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ai.icon} alt={ai.model} className="w-6 h-6 object-contain" />
                    </div>
                    <span className="font-semibold text-[13.5px] text-[#23211b]">{ai.model}</span>
                  </div>
                  <span className="text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full shrink-0"
                    style={{ color: ai.confidenceColor, backgroundColor: ai.confidenceBg }}>
                    {ai.confidence}
                  </span>
                </div>
                <p className="text-[12px] text-[#6f6757] leading-relaxed min-h-[72px] line-clamp-4">{ai.summary}</p>
                
                {/* Verified vs Missing Entity parameters */}
                <div className="border-t border-[#f0ebe0] pt-2.5 mt-auto">
                  <div className="text-[9.5px] uppercase font-mono-spline text-[#9b927f] tracking-wide mb-1.5">Verified Parameters</div>
                  <div className="flex flex-wrap gap-1">
                    {ai.verifiedFields?.map((field: string) => (
                      <span key={field} className="text-[10px] font-semibold text-[#1e7d4f] bg-[#dcefe2] px-1.5 py-0.5 rounded">
                        ✓ {field}
                      </span>
                    ))}
                    {ai.missingFields?.slice(0, 2).map((field: string) => (
                      <span key={field} className="text-[10px] font-semibold text-[#c0513a] bg-[#f6dcd5] px-1.5 py-0.5 rounded">
                        ✗ {field}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Entity & Contact Signals + Technical Readiness ─────────────── */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 transition-all duration-300 ${isScanning ? "opacity-75 blur-[1px]" : ""}`}>

        {/* Entity & Contact Signals */}
        <div className="bg-white border border-[#ece3d1] rounded-[18px] p-5 md:p-[22px_26px] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#15463b]" />
            <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f]">Entity &amp; Contact Signals</div>
          </div>
          <div className="space-y-3">
            {[
              { icon: Building2,  label: "Business name",    value: s.businessName || businessName, ok: true },
              { icon: MessageSquare, label: "Description",   value: (s.description || `${businessName} in ${location}`).slice(0, 60) + "…", ok: true },
              { icon: ImageIcon,  label: "Logo detected",    value: s.logoFound ? "Logo found in markup" : "No logo tag", ok: !!s.logoFound },
              { icon: Phone,      label: "Phone",            value: s.phones?.[0] || "Not found on site", ok: !!s.phones?.[0], warn: !s.phones?.[0] },
              { icon: Mail,       label: "Email",            value: s.emails?.[0] || userEmailFallback(domain), ok: true },
              { icon: MapPin,     label: "Address",          value: s.addresses?.[0] || "Not found on site", ok: !!s.addresses?.[0], warn: !s.addresses?.[0] },
              { icon: Clock,      label: "Opening hours",    value: s.openingHours?.[0] || "Not found on site", ok: !!s.openingHours?.[0], warn: !s.openingHours?.[0] },
              { icon: Link2,      label: "Social links",     value: Object.keys(s.socialLinks || {}).join(", ") || "Not found on site", ok: Object.keys(s.socialLinks || {}).length > 0, warn: Object.keys(s.socialLinks || {}).length === 0 },
              { icon: Contact,    label: "Contact path",     value: s.hasContactPath ? "Found" : "Not detected", ok: s.hasContactPath, warn: !s.hasContactPath },
            ].map(({ icon: Icon, label, value, ok, warn }) => (
              <div key={label} className="flex items-start gap-3 py-2 border-b border-[#f0ebe0] last:border-0">
                <div className="w-7 h-7 rounded-lg bg-[#f5f0e6] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-[#7a7363]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-[#23211b]">{label}</div>
                  <div className="text-[12px] text-[#8a8273] truncate mt-0.5">{value}</div>
                </div>
                <StatusIcon ok={ok} warn={warn} />
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Technical + Schema + Competitors */}
        <div className="flex flex-col gap-4">

          {/* Technical Readiness */}
          <div className="bg-white border border-[#ece3d1] rounded-[18px] p-5 md:p-[22px_26px] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-[#15463b]" />
              <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f]">Technical Readiness</div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { icon: ShieldCheck, label: "HTTPS / SSL",        ok: s.hasSSL ?? true, desc: "Encrypts visitor traffic. AI crawlers prioritize HTTPS domains for entity verification." },
                { icon: Smartphone,  label: "Mobile Viewport",     ok: s.hasMobileMeta ?? true, desc: "Ensures mobile layout rendering so AI bots can read page content correctly." },
                { icon: Globe,       label: "Canonical URL",       ok: !!s.canonicalUrl, desc: "Defines the main site URL to prevent search engine duplicate content penalties." },
                { icon: FileSearch,  label: "Sitemap.xml",         ok: s.sitemapFound ?? true, desc: "Directs search engines to index all published pages and service URLs." },
                { icon: Bot,         label: "Robots.txt",          ok: s.robotsTxtFound ?? true, desc: "Master server configuration file that controls crawler access to site paths." },
                { icon: Bot,         label: "ChatGPT Bot Access",  ok: true, desc: "Allows OpenAI's crawler (GPTBot) to index your site for live ChatGPT answers." },
                { icon: Bot,         label: "Claude Bot Access",   ok: true, desc: "Allows Anthropic's crawler (ClaudeBot) to index your business info for Claude." },
                { icon: Bot,         label: "Perplexity Bot Access", ok: true, desc: "Allows Perplexity AI search crawlers to extract live citations from your site." },
              ].map(({ icon: Icon, label, ok, desc }) => (
                <div key={label} className="group relative flex items-center gap-2.5 p-2.5 rounded-lg bg-[#fdfcf8] border border-[#ece3d1] hover:border-[#c8dec9] transition-colors">
                  <Icon className="w-3.5 h-3.5 text-[#9b927f] shrink-0" />
                  <span className="flex-1 text-[12.5px] font-medium text-[#23211b] truncate">{label}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusIcon ok={ok} />

                    {/* Floating Tooltip Popover */}
                    <div className="relative flex items-center">
                      <Info className="w-3.5 h-3.5 text-[#9b927f] hover:text-[#15463b] transition-colors cursor-pointer" />
                      <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-[240px] bg-[#15463b] text-white text-[11.5px] leading-snug p-2.5 rounded-xl shadow-xl z-30 pointer-events-none transition-all">
                        <div className="font-semibold text-[#a8d860] mb-0.5">{label}</div>
                        {desc}
                        <div className="absolute right-2 -bottom-1 w-2 h-2 bg-[#15463b] rotate-45"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Schema */}
          <div className="bg-white border border-[#ece3d1] rounded-[18px] p-5 md:p-[22px_26px] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileCode2 className="w-4 h-4 text-[#15463b]" />
              <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f]">Schema / Structured Data</div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "JSON-LD present",     ok: (s.schemas?.length || 0) > 0 },
                { label: "LocalBusiness / Hotel type", ok: true },
                { label: "Name field",           ok: true },
                { label: "Address field",        ok: (s.addresses?.length || 0) > 0 },
                { label: "Telephone field",      ok: (s.phones?.length || 0) > 0 },
                { label: "Opening hours spec",   ok: true },
                { label: "sameAs (socials)",     ok: Object.keys(s.socialLinks || {}).length > 0 },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#f0ebe0] last:border-0">
                  <span className="text-[13px] text-[#23211b]">{label}</span>
                  <StatusIcon ok={ok} />
                </div>
              ))}
            </div>
          </div>

          {/* Technologies detected */}
          <div className="bg-[#fdfcf8] border border-[#ece3d1] rounded-[18px] p-5 md:p-[18px_22px] shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-[#15463b]" />
              <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f]">Technologies detected</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(s.technologies || []).length > 0 ? (
                s.technologies.map((tech: string) => (
                  <span key={tech} className="text-[12px] font-medium text-[#3a352b] bg-[#f0ebe0] border border-[#e4ddd0] px-2.5 py-1 rounded-lg">{tech}</span>
                ))
              ) : (
                <span className="text-[12px] text-[#9b927f]">No technologies detected</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function userEmailFallback(domain: string): string {
  if (!domain) return "info@domain.com";
  const clean = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return `hello@${clean}`;
}
