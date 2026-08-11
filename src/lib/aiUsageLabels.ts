// Maps the raw values that actually land in ai_usage_col (feature/model_name
// strings written by _log_ai_usage_event across part_05–part_11.py — see
// backend/main_parts/*.py) to a clean label + a real icon from /public.
// These are internal identifiers, not display strings, so this file is the
// only place that translation happens — the API itself is left alone.

export interface LabelMeta {
  label: string;
  icon: string | null;
}

const FEATURE_LABELS: Record<string, LabelMeta> = {
  phase1_ai_insights: { label: "AI Insights", icon: "/icons/sidebar/ai.svg" },
  public_competitor_lookup: { label: "Competitor Lookup", icon: "/icons/sidebar/analytics.svg" },
  blog_seo_analyzer: { label: "Blog SEO Analysis", icon: "/icons/sidebar/blogs.svg" },
  blog_seo_generator: { label: "Blog Generation", icon: "/icons/sidebar/blogs.svg" },
  blog_section_rewrite: { label: "Blog Rewrite", icon: "/icons/sidebar/blogs.svg" },
  phase5_generate_questions: { label: "Question Generation", icon: "/icons/sidebar/ai.svg" },
  phase5_analyze_direct: { label: "Visibility Analysis", icon: "/icons/sidebar/analyse.svg" },
  phase5_analyze_single: { label: "Visibility Analysis", icon: "/icons/sidebar/analyse.svg" },
  phase5_job_completed: { label: "Visibility Scan Completed", icon: "/icons/sidebar/analyse.svg" },
  phase5_job_failed_rate_limit: { label: "Visibility Scan (Rate Limited)", icon: "/icons/sidebar/analyse.svg" },
  phase5_job_failed: { label: "Visibility Scan Failed", icon: "/icons/sidebar/analyse.svg" },
  phase5_job_started: { label: "Visibility Scan Started", icon: "/icons/sidebar/analyse.svg" },
  phase5_deep_job_started: { label: "Deep Competitor Scan", icon: "/icons/sidebar/analytics.svg" },
};

export function getFeatureMeta(raw: string): LabelMeta {
  if (!raw) return { label: "Unknown", icon: null };
  if (FEATURE_LABELS[raw]) return FEATURE_LABELS[raw];
  // phase1_scrape_{call_name} is an f-string with a dynamic suffix
  // (part_05.py) — every other prefix falls through to the generic
  // snake_case -> Title Case formatter below.
  if (raw.startsWith("phase1_scrape")) {
    return { label: "Website Scrape", icon: "/icons/sidebar/analyse.svg" };
  }
  const cleaned = raw.replace(/^phase\d+_/, "").replace(/_/g, " ").trim();
  const label = cleaned.replace(/\b\w/g, (c) => c.toUpperCase()) || raw;
  return { label, icon: "/icons/sidebar/ai.svg" };
}

export function getModelMeta(raw: string): LabelMeta {
  const key = (raw || "").toLowerCase();
  if (!key || key === "unknown") return { label: "Unknown", icon: null };
  // Phase5 "multi" jobs run every provider at once — not one specific
  // model, so it's labeled as its own real category (see
  // _log_ai_usage_event in backend/main_parts/part_01.py) rather than
  // falling into the same bucket as genuinely untracked events.
  if (key === "multi") {
    return { label: "Multi Provider", icon: "/icons/sidebar/ai.svg" };
  }
  if (key.includes("gpt") || key.includes("openai") || key.includes("chatgpt")) {
    return { label: raw, icon: "/icons/chatgpt.svg" };
  }
  if (key.includes("claude") || key.includes("anthropic")) {
    return { label: raw, icon: "/icons/claude.svg" };
  }
  if (key.includes("gemini") || key.includes("google")) {
    return { label: raw, icon: "/icons/gemini.svg" };
  }
  if (key.includes("sonar") || key.includes("perplexity")) {
    return { label: raw, icon: "/icons/perplexity.svg" };
  }
  return { label: raw, icon: null };
}
