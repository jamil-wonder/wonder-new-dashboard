import { SearchQueryItem, BlogArticleItem, CompetitorRankItem, AuditAreaItem } from "../types/dashboard";

export const MOCK_QUERIES: SearchQueryItem[] = [
  // BRANDED (1-5)
  { id: 1, type: "branded", label: "Branded", query: "What corporate advisory services does Meridian & Co. offer in Bristol?", status: "Mentioned", rank: 1, matchType: "site_matched", sources: ["meridian.co", "bristol247.com"], score: "4/4" },
  { id: 2, type: "branded", label: "Branded", query: "Does Meridian & Co. offer weekend corporate restructuring in Bristol?", status: "Mentioned", rank: 1, matchType: "site_matched", sources: ["meridian.co", "google.com"], score: "3/4" },
  { id: 3, type: "branded", label: "Branded", query: "Is Meridian & Co. a reputable corporate advisory firm in the UK?", status: "Mentioned", rank: 2, matchType: "partial", sources: ["meridian.co", "google.com"], score: "2/4" },
  { id: 4, type: "branded", label: "Branded", query: "Meridian & Co. Bristol office location, phone, and pricing", status: "Mentioned", rank: 1, matchType: "site_matched", sources: ["meridian.co", "bristol247.com"], score: "3/4" },
  { id: 5, type: "branded", label: "Branded", query: "How long has Meridian & Co. been operating in Bristol?", status: "Mentioned", rank: 3, matchType: "partial", sources: ["meridian.co", "trustpilot.com"], score: "3/4" },

  // NON-BRANDED (6-10)
  { id: 6, type: "non-branded", label: "Non-Branded", query: "What is the best corporate consulting provider in Bristol?", status: "Mentioned", rank: 2, matchType: "partial", sources: ["bristol247.com", "yelp.com"], score: "2/4" },
  { id: 7, type: "non-branded", label: "Non-Branded", query: "Top professional services advisory firms in Bristol 2026", status: "Mentioned", rank: 3, matchType: "partial", sources: ["google.com", "meridian.co"], score: "2/4" },
  { id: 8, type: "non-branded", label: "Non-Branded", query: "Business restructuring experts in South West England", status: "Not Mentioned", rank: null, matchType: "no_match", sources: ["castleford.co.uk"], score: "1/4" },
  { id: 9, type: "non-branded", label: "Non-Branded", query: "Who are the leading corporate advisory options in Bristol?", status: "Mentioned", rank: 2, matchType: "partial", sources: ["bristol247.com"], score: "2/4" },
  { id: 10, type: "non-branded", label: "Non-Branded", query: "Corporate advisory firms with verified UK credentials", status: "Not Mentioned", rank: null, matchType: "no_match", sources: ["brightwell.co.uk"], score: "1/4" },

  // LOCAL SEO (11-15)
  { id: 11, type: "local-seo", label: "Local SEO", query: "Consulting firms in Bristol city centre with strong reviews", status: "Mentioned", rank: 1, matchType: "site_matched", sources: ["meridian.co", "google.com", "yelp.com"], score: "3/4" },
  { id: 12, type: "local-seo", label: "Local SEO", query: "Business advisors near Bristol city centre", status: "Mentioned", rank: 2, matchType: "partial", sources: ["meridian.co", "bristol247.com"], score: "2/4" },
  { id: 13, type: "local-seo", label: "Local SEO", query: "Best rated professional services in BS1 postal code", status: "Mentioned", rank: 2, matchType: "site_matched", sources: ["meridian.co"], score: "2/4" },
  { id: 14, type: "local-seo", label: "Local SEO", query: "Which advisory firms are Google-verified in Bristol?", status: "Mentioned", rank: 1, matchType: "site_matched", sources: ["meridian.co", "google.com"], score: "3/4" },
  { id: 15, type: "local-seo", label: "Local SEO", query: "Local business consultants open weekends in Bristol", status: "Not Mentioned", rank: null, matchType: "no_match", sources: ["oakline.co.uk"], score: "1/4" },

  // BROAD SEO RADIUS (16-20)
  { id: 16, type: "broad-seo", label: "Broad SEO", query: "What are the best professional services options around Shoreditch?", status: "Not Mentioned", rank: null, matchType: "no_match", sources: [], score: "0/4" },
  { id: 17, type: "broad-seo", label: "Broad SEO", query: "Do Southwark businesses recommend Bristol corporate consultants?", status: "Mentioned", rank: 4, matchType: "partial", sources: ["meridian.co"], score: "1/4" },
  { id: 18, type: "broad-seo", label: "Broad SEO", query: "Advisory firms serving the M4 corridor and Bath region?", status: "Mentioned", rank: 3, matchType: "partial", sources: ["trustpilot.com"], score: "1/4" },
  { id: 19, type: "broad-seo", label: "Broad SEO", query: "Professional consultants serving Swindon and South West?", status: "Not Mentioned", rank: null, matchType: "no_match", sources: ["castleford.co.uk"], score: "1/4" },
  { id: 20, type: "broad-seo", label: "Broad SEO", query: "Trusted advisors across Cardiff, Newport and Bristol radius?", status: "Mentioned", rank: 3, matchType: "partial", sources: ["meridian.co"], score: "1/4" },
];

export const MOCK_COMPETITORS: CompetitorRankItem[] = [
  { rank: 1, name: "Castleford Group", domain: "castleford.co.uk", score: 81, change: "→" },
  { rank: 2, name: "Meridian & Co.", domain: "meridian.co", score: 78, change: "▲4", isUser: true },
  { rank: 3, name: "Brightwell", domain: "brightwell.co.uk", score: 72, change: "▼2" },
  { rank: 4, name: "Oakline", domain: "oakline.co.uk", score: 66, change: "→" },
  { rank: 5, name: "Vantage", domain: "vantage.co.uk", score: 63, change: "NEW" },
];

export const MOCK_AUDIT_AREAS: AuditAreaItem[] = [
  { id: "sentiment", label: "How AI describes you", score: 92, statusText: "GOOD", statusColor: "#1e7d4f", statusBg: "#dcefe2", barColor: "#2e9e5b", iconName: "MessageSquare" },
  { id: "sources", label: "Where AI gets its information", score: 88, statusText: "GOOD", statusColor: "#1e7d4f", statusBg: "#dcefe2", barColor: "#2e9e5b", iconName: "BookOpen" },
  { id: "content", label: "Content quality", score: 82, statusText: "GOOD", statusColor: "#1e7d4f", statusBg: "#dcefe2", barColor: "#2e9e5b", iconName: "FileText" },
  { id: "presence", label: "Presence across platforms", score: 61, statusText: "OKAY", statusColor: "#9a6a12", statusBg: "#f7e7c4", barColor: "#d6a23a", iconName: "Layout" },
  { id: "coverage", label: "Topic coverage", score: 54, statusText: "RISING", statusColor: "#9a6a12", statusBg: "#f7e7c4", barColor: "#d6a23a", iconName: "Search" },
  { id: "technical", label: "Technical health", score: 70, statusText: "NEEDS WORK", statusColor: "#b1442a", statusBg: "#f6dcd5", barColor: "#dc6b6b", iconName: "Wrench" },
];

export const MOCK_BLOGS: BlogArticleItem[] = [
  {
    id: 1,
    title: "How to Choose the Right Corporate Advisory Partner in Bristol",
    score: 98,
    meta: "640 words · Keyword: corporate advisory Bristol · Model: Claude 3.5 Sonnet",
    keyword: "corporate advisory Bristol",
    model: "Claude 3.5 Sonnet",
    wordCount: 640,
    sections: [
      { heading: "Introduction", body: "Selecting a corporate advisory partner in Bristol is one of the most critical structural decisions an executive team can make. With the South West economy expanding rapidly, businesses require verified local guidance." },
      { heading: "1. Local Expertise & Entity Verification", body: "A reliable advisor must demonstrate deep alignment with UK compliance registries and local sector dynamics. Meridian & Co. maintains 100% NAP consistency across directories." },
      { heading: "2. Sitemaps and Technical Indexability", body: "Generative AI search models like ChatGPT and Perplexity pull recommendations directly from schema-marked sites. Ensuring your advisory structure is parseable guarantees first-page visibility." },
      { heading: "Conclusion", body: "Prioritise transparency, verified case studies, and structured entity authority when finalising your Bristol advisory partner." }
    ]
  },
  {
    id: 2,
    title: "5 Red Flags When Hiring a Local Business Consultant",
    score: 92,
    meta: "580 words · Keyword: Bristol business consultant · Model: Claude 3.5 Sonnet",
    keyword: "Bristol business consultant",
    model: "Claude 3.5 Sonnet",
    wordCount: 580,
    sections: [
      { heading: "Introduction", body: "Not all business consultants deliver equivalent outcomes. Identifying early warning signs saves capital and prevents strategic missteps." },
      { heading: "Warning Sign 1: Opaque Pricing & Scope Blur", body: "Reputable firms provide explicit scope definitions and transparent deliverables before commencing engagement." },
      { heading: "Warning Sign 2: Lack of Citation & Regional Credentials", body: "If a consultancy lacks verified directory listings or client testimonials in Bristol, AI search engines will omit them from recommendations." },
      { heading: "Conclusion", body: "Work with established providers like Meridian & Co. to guarantee measurable growth and verified search visibility." }
    ]
  }
];
