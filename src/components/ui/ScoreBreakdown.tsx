"use client";

import { useEffect, useRef, useState } from "react";

// A1: the Wonder Score formula, shown. The weights are fixed from launch
// (decided 29 Sept) - every historical point must stay comparable.
export const WONDER_WEIGHTS = { mention: 0.6, website: 0.3, market: 0.1 } as const;

export type WonderInputs = {
  mention_rate?: number | null;
  technical_score?: number | null;
  market_position?: number | null;
  market_measured?: boolean;
  score_margin?: number | null;
} | null | undefined;

const fmt = (n: number) => (Math.round(n * 10) / 10).toString();

export function computeBreakdown(inputs: WonderInputs) {
  const mention = typeof inputs?.mention_rate === "number" ? inputs.mention_rate : null;
  const website = typeof inputs?.technical_score === "number" ? inputs.technical_score : null;
  const market = typeof inputs?.market_position === "number" ? inputs.market_position : 0;
  if (mention === null || website === null) return null;
  const rows = [
    { key: "mention", label: "Mentioned in AI answers", value: mention, weight: WONDER_WEIGHTS.mention, note: "" },
    { key: "website", label: "Website health", value: website, weight: WONDER_WEIGHTS.website, note: "" },
    {
      key: "market",
      label: "Market position",
      value: market,
      weight: WONDER_WEIGHTS.market,
      note: inputs?.market_measured ? "" : "not yet measured — counts as 0",
    },
  ].map((r) => ({ ...r, points: r.value * r.weight }));
  // Whole-number maths with round-half-up - identical to the backend's
  // compute_wonder_score, so this can never differ from the stored score by a
  // rounding tie (float rounding differs between languages on e.g. 26.55).
  const h = (v: number) => Math.round(Math.min(100, Math.max(0, v)) * 100);
  const totalUnits = h(mention) * 60 + h(website) * 30 + h(market) * 10; // 1/10000
  return { rows, total: Math.floor((totalUnits + 500) / 1000) / 10 };
}

// The three inputs, their weights and the result - used under the header
// score and on the shared report so both show the same names and numbers.
export function ScoreBreakdownTable({ inputs, score }: { inputs: WonderInputs; score: number | null | undefined }) {
  const b = computeBreakdown(inputs);
  if (!b) {
    return <p className="text-[12px] text-[#8a8273]">The breakdown appears after your first complete scan.</p>;
  }
  const shown = typeof score === "number" ? score : b.total;
  return (
    <div className="text-[12.5px] text-[#3a352b]">
      <div className="flex flex-col gap-1.5">
        {b.rows.map((r) => (
          <div key={r.key} className="flex items-baseline justify-between gap-3">
            <div className="min-w-0">
              <span className="font-medium">{r.label}</span>
              {r.note && <span className="block text-[11px] text-[#9b927f]">{r.note}</span>}
            </div>
            <div className="num shrink-0 text-[#6f6757]">
              {fmt(r.value)} × {Math.round(r.weight * 100)}% = <span className="font-semibold text-[#23211b]">{fmt(r.points)}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 pt-2 border-t border-[#efe7d6] flex items-baseline justify-between">
        <span className="font-semibold">Wonder Score</span>
        <span className="num font-semibold text-[#15463b]">
          {fmt(shown)}
          {Math.round(shown) !== shown && <span className="font-normal text-[#9b927f]"> → {Math.round(shown)}</span>}
        </span>
      </div>
      {typeof inputs?.score_margin === "number" && inputs.score_margin > 0 && (
        <p className="mt-2 text-[11px] leading-snug text-[#8a8273]">
          AI models answer differently each time, so this score can move by about ±{fmt(inputs.score_margin)} between
          two scans with nothing changed. Treat smaller changes as noise.
        </p>
      )}
    </div>
  );
}

// "How is this calculated?" - a small popover; Escape or an outside click closes it.
export default function ScoreBreakdownPopover({ inputs, score }: { inputs: WonderInputs; score: number | null | undefined }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="text-[11px] text-[#15463b] underline underline-offset-2 hover:text-[#1a5c44] cursor-pointer bg-transparent border-none p-0"
      >
        How is this calculated?
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="How your Wonder Score is calculated"
          className="absolute left-0 top-full mt-2 z-[60] w-[300px] bg-white border border-[#ece3d1] rounded-xl shadow-[0_8px_28px_rgba(60,48,28,0.14)] p-4"
        >
          <div className="font-mono-spline text-[11px] uppercase tracking-wider text-[#6f6757] mb-2">
            60% AI mentions · 30% website health · 10% market position
          </div>
          <ScoreBreakdownTable inputs={inputs} score={score} />
        </div>
      )}
    </div>
  );
}
