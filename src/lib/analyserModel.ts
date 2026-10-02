// Pure builders for the Analyzer page: turn one crawl result into the scorecard
// and audit areas it displays. Shared by a fresh run and by restoring the last
// saved analysis from the server, so both always show exactly the same thing.

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
  const coverageScore = schemasFound >= 3 ? 92 : schemasFound === 2 ? 82 : schemasFound === 1 ? 70 : 45;

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
    description: scrapeRes.description || ctx.fallbackDescription || `${detectedName} in ${ctx.location}.`,
    canonicalUrl: scrapeRes.canonicalUrl || ctx.cleanUrl,
    language: (scrapeRes.language || "EN-GB").toUpperCase(),
    hasSSL,
    hasMobileMeta: hasMobile,
    sitemapFound: hasSitemap,
    robotsTxtFound: hasRobots,
    emails: scrapeRes.emails?.length ? scrapeRes.emails : [userEmailFallback(ctx.domain)],
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


  const areas = [
    { id: "sentiment", label: "How AI describes you", score: sentimentScore, statusText: sentimentScore >= 75 ? "GOOD" : "OKAY", statusColor: sentimentScore >= 75 ? "#1e7d4f" : "#9a6a12", statusBg: sentimentScore >= 75 ? "#dcefe2" : "#f7e7c4", barColor: sentimentScore >= 75 ? "#2e9e5b" : "#d6a23a", iconName: "MessageSquare" },
    { id: "sources", label: "Where AI gets its information", score: sourcesScore, statusText: sourcesScore >= 75 ? "GOOD" : "OKAY", statusColor: sourcesScore >= 75 ? "#1e7d4f" : "#9a6a12", statusBg: sourcesScore >= 75 ? "#dcefe2" : "#f7e7c4", barColor: sourcesScore >= 75 ? "#2e9e5b" : "#d6a23a", iconName: "BookOpen" },
    { id: "content", label: "Content quality", score: contentScore, statusText: contentScore >= 75 ? "GOOD" : "RISING", statusColor: contentScore >= 75 ? "#1e7d4f" : "#9a6a12", statusBg: contentScore >= 75 ? "#dcefe2" : "#f7e7c4", barColor: contentScore >= 75 ? "#2e9e5b" : "#d6a23a", iconName: "FileCode2" },
    { id: "presence", label: "Presence across platforms", score: presenceScore, statusText: presenceScore >= 75 ? "GOOD" : "OKAY", statusColor: presenceScore >= 75 ? "#1e7d4f" : "#9a6a12", statusBg: presenceScore >= 75 ? "#dcefe2" : "#f7e7c4", barColor: presenceScore >= 75 ? "#2e9e5b" : "#d6a23a", iconName: "Building2" },
    { id: "coverage", label: "Topic coverage", score: coverageScore, statusText: coverageScore >= 75 ? "GOOD" : coverageScore >= 60 ? "RISING" : "NEEDS WORK", statusColor: coverageScore >= 75 ? "#1e7d4f" : coverageScore >= 60 ? "#9a6a12" : "#b1442a", statusBg: coverageScore >= 75 ? "#dcefe2" : coverageScore >= 60 ? "#f7e7c4" : "#f6dcd5", barColor: coverageScore >= 75 ? "#2e9e5b" : coverageScore >= 60 ? "#d6a23a" : "#dc6b6b", iconName: "FileSearch" },
    { id: "technical", label: "Technical health", score: techScore, statusText: techScore >= 75 ? "GOOD" : "NEEDS WORK", statusColor: techScore >= 75 ? "#1e7d4f" : "#b1442a", statusBg: techScore >= 75 ? "#dcefe2" : "#f6dcd5", barColor: techScore >= 75 ? "#2e9e5b" : "#dc6b6b", iconName: "Cpu" },
  ];

  return { scan, areas };
}
