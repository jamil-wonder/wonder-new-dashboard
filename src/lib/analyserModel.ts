// Pure builders for the Analyzer page: turn one crawl result into the scorecard
// and audit areas it displays. Shared by a fresh run and by restoring the last
// saved analysis from the server, so both always show exactly the same thing.

import { areaBadge } from "./areaBadge";
import { hasLocalBusinessSchema } from "./schemaType";

export function userEmailFallback(domain: string): string {
  if (!domain) return "info@domain.com";
  const clean = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return `hello@${clean}`;
}

export type AnalysisContext = {
  domain: string;
  cleanUrl: string;
  category: string;
  location: string;
  fallbackDescription?: string;
};

export function buildAnalysis(scrapeRes: any, ctx: AnalysisContext): { scan: any; areas: any[] } | null {
  if (!scrapeRes || !scrapeRes.scores) return null;
  const scores = scrapeRes.scores;
  const totalScore = scores.total || 91;
  const grade = scores.grade || (totalScore >= 90 ? "A+" : totalScore >= 80 ? "A" : "B+");
  const detectedName = scrapeRes.businessName || scrapeRes.businessProfile?.name;

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
  // C3: without a LocalBusiness-family @type (Restaurant, Store, Hotel, ...) the
  // markup doesn't tell AI what kind of business this is or where, so this
  // area is capped at 50 however much other schema there is.
  const hasLocalType =
    typeof scores.schema?.hasLocalBusinessType === "boolean"
      ? scores.schema.hasLocalBusinessType
      : hasLocalBusinessSchema(scrapeRes.schemas);
  const rawCoverage = schemasFound >= 3 ? 92 : schemasFound === 2 ? 82 : schemasFound === 1 ? 70 : 45;
  const coverageScore = hasLocalType ? rawCoverage : Math.min(rawCoverage, 50);
  const coverageCapped = !hasLocalType && rawCoverage > 50;

  // 6. Technical Health (Infrastructure & Mobile Readiness)
  let techScore = 0;
  if (hasSSL) techScore += 20;
  if (hasMobile) techScore += 20;
  if (scrapeRes.canonicalUrl) techScore += 20;
  if (hasSitemap) techScore += 20;
  if (hasRobots) techScore += 20;
  techScore = Math.min(100, Math.max(70, techScore));


  const scan = {
    businessName: detectedName,
    url: ctx.domain,
    category: scrapeRes.category || ctx.category,
    location: scrapeRes.location || ctx.location,
    // C5: only what the website itself said - no made-up description or canonical address
    description: scrapeRes.description || "",
    canonicalUrl: scrapeRes.canonicalUrl || "",
    language: (scrapeRes.language || "EN-GB").toUpperCase(),
    hasSSL,
    hasMobileMeta: hasMobile,
    sitemapFound: hasSitemap,
    robotsTxtFound: hasRobots,
    emails: Array.isArray(scrapeRes.emails) ? scrapeRes.emails : [],
    phones: scrapeRes.phones || [],
    // No location-stuffing - an address genuinely not found on the
    // site must read as not found downstream, not silently become
    // the business's city/region as if it were a real street address.
    addresses: scrapeRes.addresses || [],
    openingHours: scrapeRes.openingHours || [],
    socialLinks: scrapeRes.socialLinks || {},
    schemas: scrapeRes.schemas || [],
    aiBotAccess: scrapeRes.aiBotAccess || {},
    hasContactPath: scrapeRes.hasContactPath ?? false,
    // C5: real pages found by the crawl, used to back the "verified" ticks
    homePageUrl: scrapeRes.canonicalUrl || ctx.cleanUrl || "",
    contactPageUrl: scrapeRes.contactPageUrl || "",
    aboutPageUrl: scrapeRes.aboutPageUrl || "",
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


  const area = (id: string, label: string, score: number, iconName: string, extra: Record<string, unknown> = {}) => {
    const b = areaBadge(score);
    return { id, label, score, statusText: b.label, statusColor: b.color, statusBg: b.bg, barColor: b.bar, iconName, ...extra };
  };
  const areas = [
    area("sentiment", "How AI describes you", sentimentScore, "MessageSquare"),
    area("sources", "Where AI gets its information", sourcesScore, "BookOpen"),
    area("content", "Content quality", contentScore, "FileCode2"),
    area("presence", "Presence across platforms", presenceScore, "Building2"),
    area("coverage", "Topic coverage", coverageScore, "FileSearch", coverageCapped
      ? { capped: true, cappedReason: "No LocalBusiness-type schema (e.g. Restaurant, Store, Hotel) on the site, so this area is capped at 50." }
      : {}),
    area("technical", "Technical health", techScore, "Cpu"),
  ];

  return { scan, areas };
}
