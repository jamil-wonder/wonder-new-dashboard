// Single source of truth for "what domains were cited for this query" —
// used by the table's inline preview, the sources sidebar, and Overview's
// citation sections, so none of them can disagree with each other or slip
// through junk that isn't actually a real cited domain (e.g. an AI answer
// occasionally includes a stray version-like string such as "4.0.0.5" in
// its reference list — that is NOT a domain and must never be displayed
// as one).

export function normalizeDomain(value: string): string {
  const raw = (value || "").trim().toLowerCase();
  if (!raw) return "";
  try {
    const host = new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname;
    return host.replace(/^www\./, "").replace(/[),.;:]+$/g, "");
  } catch {
    return raw
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .replace(/[),.;:]+$/g, "");
  }
}

const NON_DOMAIN_HOSTS = new Set(["localhost", "example.com"]);

/**
 * Rejects values that survive URL-hostname parsing but aren't real,
 * citable domains: bare IPv4 addresses, version-like numeric strings
 * ("4.0.0.5"), anything with no TLD at all, and known placeholder hosts.
 */
export function isValidSourceDomain(domain: string): boolean {
  const d = (domain || "").trim().toLowerCase();
  if (!d || d.length < 4) return false;
  if (NON_DOMAIN_HOSTS.has(d)) return false;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(d)) return false; // IPv4 address
  if (/^[\d.]+$/.test(d)) return false; // pure numeric / version-like string
  if (!d.includes(".")) return false; // no TLD at all
  if (!/[a-z]/.test(d)) return false; // must contain at least one letter
  return true;
}

interface QueryModelResultShape {
  sources?: string[];
  sourceUrls?: string[];
  references?: string[];
}

interface QuerySourceShape {
  sources?: string[];
  resultsByModel?: Record<string, QueryModelResultShape | undefined>;
}

/** The union of every valid source domain cited across ALL models for this query. */
export function getAllSourcesForQuery(query: QuerySourceShape | null | undefined): string[] {
  if (!query) return [];
  const set = new Set<string>();

  const add = (value: unknown) => {
    const normalized = normalizeDomain(String(value || ""));
    if (normalized && isValidSourceDomain(normalized)) set.add(normalized);
  };

  (query.sources || []).forEach(add);

  if (query.resultsByModel) {
    Object.values(query.resultsByModel).forEach((modelResult) => {
      (modelResult?.sources || []).forEach(add);
      (modelResult?.sourceUrls || []).forEach(add);
      (modelResult?.references || []).forEach(add);
    });
  }

  return Array.from(set);
}

/** The union of every valid source domain cited across ALL models AND ALL
 * queries in the current run — the "view all sources" list. */
export function getAllSourcesForQueries(queries: QuerySourceShape[] | null | undefined): string[] {
  if (!Array.isArray(queries) || queries.length === 0) return [];
  const set = new Set<string>();
  queries.forEach((q) => {
    getAllSourcesForQuery(q).forEach((d) => set.add(d));
  });
  return Array.from(set);
}
