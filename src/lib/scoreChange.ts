// A5: the same business scored twice moves a little just because the AI models answer
// differently each time (the score carries a +/- margin for that). A move inside the noise
// is not a change in how visible the business is, so it is not shown as one.

// A difference of two scores is noisier than one score: the margin is for a single run.
const DIFFERENCE_FACTOR = Math.SQRT2;

export type ScoreChange =
  | { kind: "none" }                                              // nothing to compare with
  | { kind: "up" | "down"; delta: number }                         // a real move
  | { kind: "noise"; delta: number; margin: number };              // inside the margin

export function classifyChange(delta: number | null, margin: number | null | undefined): ScoreChange {
  if (delta === null || !Number.isFinite(delta)) return { kind: "none" };
  if (typeof margin === "number" && margin > 0 && Math.abs(delta) <= margin * DIFFERENCE_FACTOR) {
    return { kind: "noise", delta, margin };
  }
  // no margin on record (older scores): a move is shown as before
  if (delta === 0) return { kind: "noise", delta, margin: typeof margin === "number" ? margin : 0 };
  return { kind: delta > 0 ? "up" : "down", delta };
}

export function noiseLabel(margin: number): string {
  return margin > 0 ? `No real change (within ±${margin.toFixed(1).replace(/\.0$/, "")})` : "No change";
}
