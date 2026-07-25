export interface SearchQueryItem {
  id: number;
  type: "branded" | "non-branded" | "local-seo" | "broad-seo";
  label: string;
  query: string;
  status: "Mentioned" | "Not Mentioned";
  rank: number | null;
  sources: string[];
  score: string;
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
