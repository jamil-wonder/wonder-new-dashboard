// C1: one set of thresholds for every audit-area badge in the app.
//   Good        90 and above
//   Fair        70 to 89
//   Needs work  below 70
// Improve / plan items are only created for areas below 90 (a "Good" area has
// nothing to fix). Badges are derived from the score at render time, never read
// from a saved analysis, so old saved analyses can't show stale thresholds.

export const GOOD_AT = 90;
export const FAIR_AT = 70;

export type AreaBadge = {
  key: "good" | "fair" | "needs_work";
  label: "GOOD" | "FAIR" | "NEEDS WORK";
  color: string;
  bg: string;
  bar: string;
};

export function areaBadge(score: number): AreaBadge {
  if (score >= GOOD_AT) return { key: "good", label: "GOOD", color: "#1e7d4f", bg: "#dcefe2", bar: "#2e9e5b" };
  if (score >= FAIR_AT) return { key: "fair", label: "FAIR", color: "#9a6a12", bg: "#f7e7c4", bar: "#d6a23a" };
  return { key: "needs_work", label: "NEEDS WORK", color: "#b1442a", bg: "#f6dcd5", bar: "#dc6b6b" };
}

/** Only an area scoring below 90 has something to improve. */
export function needsImprovement(score: number): boolean {
  return score < GOOD_AT;
}

/** The areas that should produce improve / plan items, weakest first. */
export function areasToImprove<T extends { score: number }>(areas: T[]): T[] {
  return areas.filter((a) => needsImprovement(a.score)).sort((a, b) => a.score - b.score);
}
