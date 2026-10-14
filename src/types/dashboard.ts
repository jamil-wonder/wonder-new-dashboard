export interface SearchQueryItem {
  id: number;
  type: "branded" | "non-branded" | "local-seo" | "broad-seo";
  label: string;
  query: string;
  status: "Mentioned" | "Not Mentioned" | "Unavailable";
  rank: number | null;
  matchType?: "site_matched" | "partial" | "no_match";
  sources: string[];
  score: string;
  answerSnippet?: string;
  evidence?: string;
  reasoning?: string;
  llmResponse?: string;
  targetSite?: any;
  resultsByModel?: Record<string, {
    // "Unavailable" = the model failed or did not run: missing data, never a miss (A4)
    status: "Mentioned" | "Not Mentioned" | "Unavailable";
    // "failed" can be retried; "not_run" (e.g. a model switched off) cannot
    fetchStatus?: "ok" | "failed" | "not_run";
    rank: number | null;
    sources: string[];
    answerSnippet?: string;
    evidence?: string;
    reasoning?: string;
    llmResponse?: string;
    targetSite?: any;
    matchType?: "site_matched" | "partial" | "no_match";
    // B1: why it counts as a mention
    namedInAnswer?: boolean;
    citedAsSource?: boolean;
    namedEvidence?: string;
  }>;
}

export interface BlogArticleItem {
  id: number;
  title: string;
  score: number;
  meta: string;
  keyword: string;
  model: string;
  wordCount: number;
  sections: Array<{ heading: string; body: string }>;
}

export interface CompetitorRankItem {
  rank: number;
  name: string;
  domain: string;
  score: number;
  change: string;
  isUser?: boolean;
}

export interface AuditAreaItem {
  id: string;
  label: string;
  score: number;
  statusText: string;
  statusColor: string;
  statusBg: string;
  barColor: string;
  iconName: string;
}
