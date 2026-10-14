// One place that turns a stored Search Tracker run (the backend's per-question,
// per-model answers) into what the screens show. The Query page and the
// Overview both use this, so they can never read the same run two ways (D1).

export function extractDomain(urlOrDomain: string): string {
  const raw = (urlOrDomain || "").trim().toLowerCase();
  if (!raw) return "";
  try {
    const host = new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname;
    return host.replace(/^www\./, "").replace(/[),.;:]+$/g, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].replace(/[),.;:]+$/g, "");
  }
}

export function extractSourcesFromProviderData(pData: any): string[] {
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

// backend provider key -> model label
export function mapModelName(raw: string) {
  const lower = raw.toLowerCase();
  if (lower.includes("chatgpt") || lower.includes("openai")) return "ChatGPT";
  if (lower.includes("perplexity")) return "Perplexity";
  if (lower.includes("claude") || lower.includes("anthropic")) return "Claude";
  if (lower.includes("gemini") || lower.includes("google")) return "Gemini";
  return raw;
}

export type MappedQuestionResult = {
  status: "Mentioned" | "Not Mentioned" | "Unavailable";
  rank: number | null;
  matchType: "site_matched" | "partial" | "no_match";
  sources: string[];
  answerSnippet: string;
  resultsByModel: Record<string, any>;
};

/** One question's `providers` object from the backend -> what the screens show. */
export function mapProviderResults(providers: Record<string, any>): MappedQuestionResult {
  const resultsByModel: Record<string, any> = {};
  let overallMentioned = false;
  let overallMatchType: "site_matched" | "partial" | "no_match" = "no_match";
  let bestRank: number | null = null;
  const allSources: string[] = [];

  Object.keys(providers).forEach((pKey) => {
    const pData = providers[pKey] || {};
    const modelName = mapModelName(pKey);
    const targetSite = pData.target_site || pData.targetSite || null;

    const isTargetMatched = targetSite?.status === "matched";
    const isTargetPartial = targetSite?.status === "partial";
    // B1: mentioned = named in the answer or cited as a source. "Matches the
    // site facts" is shown separately and is not a mention.
    const isM = Boolean(pData.mentioned);

    const matchType: "site_matched" | "partial" | "no_match" =
      isTargetMatched ? "site_matched" : isTargetPartial ? "partial" : "no_match";

    const pos = typeof pData.position === "number" ? pData.position : null;
    const src = extractSourcesFromProviderData(pData);

    // fetch_status comes from the backend (A4): a model that failed or did not
    // run is missing data - never a "Not Mentioned".
    const fetchStatus: "ok" | "failed" | "not_run" =
      pData.fetch_status === "failed" || pData.fetch_status === "not_run"
        ? pData.fetch_status
        : pData.error && !pData.fetch_status ? "failed" : "ok";
    if (isM && fetchStatus === "ok") overallMentioned = true;
    if (matchType === "site_matched" || (matchType === "partial" && overallMatchType !== "site_matched")) {
      overallMatchType = matchType;
    }

    if (pos !== null && (bestRank === null || pos < bestRank)) bestRank = pos;
    src.forEach((s) => { if (!allSources.includes(s)) allSources.push(s); });

    const statusString: "Mentioned" | "Not Mentioned" | "Unavailable" =
      fetchStatus !== "ok" ? "Unavailable" : isM ? "Mentioned" : "Not Mentioned";

    resultsByModel[modelName] = {
      status: statusString,
      fetchStatus,
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
      namedInAnswer: Boolean(pData.named_in_answer),
      citedAsSource: Boolean(pData.cited_as_source),
      namedEvidence: pData.named_evidence || "",
      competitorScores: pData.competitor_scores || pData.competitorScores || [],
    };
  });

  const everyModelUnavailable =
    Object.keys(resultsByModel).length > 0 &&
    Object.values(resultsByModel).every((r: any) => r.status === "Unavailable");
  const status: "Mentioned" | "Not Mentioned" | "Unavailable" =
    everyModelUnavailable ? "Unavailable" : overallMentioned ? "Mentioned" : "Not Mentioned";

  return {
    status,
    rank: bestRank,
    matchType: overallMatchType,
    sources: allSources,
    answerSnippet: resultsByModel["ChatGPT"]?.answerSnippet || resultsByModel["Perplexity"]?.answerSnippet || "",
    resultsByModel,
  };
}

/** The question rows (with every model's answer) of a stored run, in question order.
 *  `job` is what GET /api/phase5/latest-job returns. */
export function queriesFromLatestJob(job: any): any[] {
  const questions: any[] = Array.isArray(job?.questions) ? job.questions : [];
  const results: Record<string, any> = job?.results && typeof job.results === "object" ? job.results : {};
  return questions.map((q, idx) => {
    const qid = String(q?.id ?? idx + 1);
    const doc = results[qid] || results[`q${qid}`] || results[`q_${qid}`];
    const mapped = doc?.providers ? mapProviderResults(doc.providers) : null;
    return {
      id: q?.id ?? idx + 1,
      type: q?.category || "non-branded",
      label: q?.category || "Query",
      query: String(q?.text || q?.query || ""),
      score: "-",
      ...(mapped
        ? { ...mapped }
        : { status: "Pending", rank: null, matchType: "no_match", sources: [], answerSnippet: "", resultsByModel: undefined }),
    };
  });
}
