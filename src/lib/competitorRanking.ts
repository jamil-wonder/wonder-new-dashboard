// Shared, pure competitor-ranking logic - no network calls here. Both
// Query and Overview feed this the SAME BusinessContext.liveDeepCompetitors
// value (a completed Phase 5 job's own `deep_competitors` field, captured
// as a side effect of running Query - includes a confidence:"target" entry
// for the business itself). Using one shared value instead of two
// separately-fetched sources means the two pages can't disagree, and
// Overview correctly shows nothing until a run has actually happened this
// session rather than an old "last known" snapshot.

export interface CompetitorRankRow {
  domain: string;
  url?: string;
  name: string;
  score: number;
  position: number | null;
  evidence?: string;
  isUser: boolean;
  favicon: string;
  rank: number;
  // A2: how many of the answered questions named or cited this business
  appeared?: number;
  answered?: number;
}

export interface RawCompetitorCandidate {
  domain?: string;
  url?: string;
  name?: string;
  score?: number;
  position?: number | null;
  evidence?: string;
  confidence?: string;
  isUser?: boolean;
  is_user?: boolean;
  // A2: "measured" = scored from the same questions and answers as the business; anything else is an old estimate
  score_basis?: string;
  appeared?: number;
  answered?: number;
}

function normalizeDomain(value: string): string {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname
      .replace(/^www\./, "")
      .replace(/[),.;:]+$/g, "");
  } catch {
    return raw
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0]
      .replace(/[),.;:]+$/g, "");
  }
}

function toRow(raw: RawCompetitorCandidate, isUser: boolean): CompetitorRankRow | null {
  const domain = normalizeDomain(raw.domain || raw.url || "");
  if (!domain) return null;
  return {
    domain,
    url: raw.url || `https://${domain}/`,
    name: raw.name || domain,
    score: typeof raw.score === "number" ? raw.score : 0,
    position: typeof raw.position === "number" ? raw.position : null,
    evidence: raw.evidence,
    appeared: typeof raw.appeared === "number" ? raw.appeared : undefined,
    answered: typeof raw.answered === "number" ? raw.answered : undefined,
    isUser,
    favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    rank: 0,
  };
}

/**
 * Build the display list: top 4 external competitors by score + the
 * business itself, ranked 1-5. `candidates` may already contain a
 * confidence:"target" / isUser entry for the business (as deep_competitors
 * does) - if not, pass `targetRow` explicitly for an external-only list.
 */
export function buildRankedCompetitors(
  candidates: RawCompetitorCandidate[] | null | undefined,
  targetRow?: RawCompetitorCandidate | null,
  businessName?: string
): CompetitorRankRow[] {
  const list = Array.isArray(candidates) ? candidates : [];

  const embeddedTarget = list.find((c) => c.confidence === "target" || c.isUser || c.is_user) || null;
  const target = embeddedTarget || targetRow || null;

  const targetNormalized = target ? toRow(target, true) : null;
  // L8: the row marked YOU carries the business's own saved name, not a name guessed from the web
  if (targetNormalized && businessName && businessName.trim()) targetNormalized.name = businessName.trim();

  const seen = new Set<string>(targetNormalized ? [targetNormalized.domain] : []);
  const external = list
    .filter((c) => c.confidence !== "target" && !c.isUser && !c.is_user)
    // A2: a competitor is only ranked on a measured score - old estimated ones are not shown
    .filter((c) => c.score_basis === "measured")
    .map((c) => toRow(c, false))
    .filter((r): r is CompetitorRankRow => Boolean(r))
    // the business itself (or the same site twice) is never also a "competitor"
    .filter((r) => !seen.has(r.domain) && (seen.add(r.domain), true))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const combined = targetNormalized ? [...external, targetNormalized] : external;

  return combined
    .sort((a, b) => b.score - a.score)
    .map((row, idx) => ({ ...row, rank: idx + 1 }));
}
