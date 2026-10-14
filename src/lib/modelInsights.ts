// D2: the "strongest / weakest model" lines on the Overview.
// Rules: only models whose answers came back are compared; rates use each
// model's own answered count (not all 20 questions); a model that never
// mentioned you is never a strength; weakest needs at least two answering
// models and must actually be behind the strongest.

export type ModelMention = { model: string; mentioned: number; total: number };

export type ModelInsights = {
  strongest: ModelMention | null;
  weakest: ModelMention | null;
  /** models compared (answered at least one question) */
  compared: number;
  /** nobody who answered has mentioned the business */
  noneMention: boolean;
};

const rate = (m: ModelMention) => (m.total > 0 ? m.mentioned / m.total : 0);

export function modelInsights(modelMentions: ModelMention[]): ModelInsights {
  const answered = (modelMentions || []).filter((m) => m.total > 0);
  if (answered.length === 0) return { strongest: null, weakest: null, compared: 0, noneMention: false };

  const byRateDesc = [...answered].sort((a, b) => rate(b) - rate(a) || b.mentioned - a.mentioned);
  const top = byRateDesc[0];
  const strongest = top.mentioned > 0 ? top : null;

  const bottom = byRateDesc[byRateDesc.length - 1];
  const weakest = answered.length >= 2 && strongest && rate(bottom) < rate(strongest) ? bottom : null;

  return { strongest, weakest, compared: answered.length, noneMention: answered.every((m) => m.mentioned === 0) };
}
