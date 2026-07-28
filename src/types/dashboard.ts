export interface SearchQueryItem {
  id: number;
  type: "branded" | "non-branded" | "local-seo" | "broad-seo";
  label: string;
  query: string;
  status: "Mentioned" | "Not Mentioned";
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
    status: "Mentioned" | "Not Mentioned";
    rank: number | null;
    sources: string[];
    answerSnippet?: string;
    evidence?: string;
    reasoning?: string;
    llmResponse?: string;
    targetSite?: any;
    matchType?: "site_matched" | "partial" | "no_match";
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
