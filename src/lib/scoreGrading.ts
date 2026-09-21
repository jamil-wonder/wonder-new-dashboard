// Single source of truth for the score → grade/visibility-band copy shown
// on the public free-scan preview (scan/page.tsx) and the logged-in
// dashboard (useOverviewData.ts). These two were previously separate,
// near-identical copies of the same thresholds and wording — which is
// exactly how the two once drifted out of sync (the free-scan preview said
// "Very Low Visibility" for a band the dashboard called "Critical
// Visibility," fixed 11 September 2026). Import from here instead of
// redefining locally, so a future wording or threshold change can't
// silently diverge between the two places again.
//
// Deliberately NOT used by the Analyzer's own technical-health labels
// (analyser/page.tsx) — that page only ever has the Phase 1 crawl score,
// with no AI-visibility data behind it, so it needs its own distinct
// "Technical Health" wording rather than borrowing "Visibility" language
// that would misrepresent what was actually measured.

export function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 55) return "B";
  if (score >= 40) return "C";
  return "F";
}

export function getVisibilityText(score: number): string {
  if (score >= 80) return "High Visibility";
  if (score >= 65) return "Good Visibility";
  if (score >= 50) return "Moderate Visibility";
  if (score >= 35) return "Low Visibility";
  return "Critical Visibility";
}
