// I4: what a blog card/reader shows about an article is measured from the article,
// or not shown. It never falls back to a made-up score or word count.

type BlogLike = {
  readability?: unknown;
  wordCount?: unknown;
  sections?: unknown;
};

const positive = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) && v > 0 ? v : null);

// F6: the real readability (Flesch reading ease, 0-100) the server worked out from the text, with its band
export function blogReadability(blog: BlogLike): { score: number; band: string } | null {
  const r = blog.readability as { score?: unknown; band?: unknown } | null | undefined;
  if (!r || typeof r !== "object") return null;
  const score = positive(r.score);
  return score === null ? null : { score, band: typeof r.band === "string" ? r.band : "" };
}

export function blogScore(blog: BlogLike): number | null {
  return blogReadability(blog)?.score ?? null;
}

export function blogWordCount(blog: BlogLike): number | null {
  const stored = positive(blog.wordCount);
  if (stored !== null) return stored;
  if (!Array.isArray(blog.sections)) return null;
  const words = blog.sections.reduce((total: number, s: { content?: string; body?: string }) => {
    const text = String(s?.content || s?.body || "").trim();
    return total + (text ? text.split(/\s+/).length : 0);
  }, 0);
  return words > 0 ? words : null;
}
