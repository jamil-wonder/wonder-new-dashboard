"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import SegmentedControl from "../ui/SegmentedControl";

interface ModelSwitcherProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
  modelScores?: Record<string, { mentioned: number; total: number; pct: number; unavailable?: number; failed?: number }>;
  // Re-runs only the answers that failed (A4); omitted when nothing can be retried
  onRetryFailed?: () => void;
  isRetrying?: boolean;
}

const DEFAULT_MODELS_CFG: Record<string, { name: string; icon: string; color: string; track: string }> = {
  ChatGPT:    { name: "ChatGPT",    icon: "/icons/chatgpt.svg",    color: "#1e7d4f", track: "#dcefe2" },
  Claude:     { name: "Claude",     icon: "/icons/claude.svg",     color: "#9a6a12", track: "#f7e7c4" },
  Perplexity: { name: "Perplexity", icon: "/icons/perplexity.svg", color: "#1a4b9a", track: "#dce5f7" },
  Gemini:     { name: "Gemini",     icon: "/icons/gemini.svg",     color: "#b1442a", track: "#f6dcd5" },
};

export default function ModelSwitcher({ selectedModel, onSelectModel, modelScores, onRetryFailed, isRetrying }: ModelSwitcherProps) {
  const modelList = ["ChatGPT", "Claude", "Perplexity", "Gemini"];
  const cfg = DEFAULT_MODELS_CFG[selectedModel] || DEFAULT_MODELS_CFG.ChatGPT;

  const scoreData = modelScores?.[selectedModel] || { mentioned: 0, total: 20, pct: 0 };
  const unavailableCount = scoreData.unavailable || 0;
  const failedCount = scoreData.failed || 0;
  // No usable answer from this model at all: say so instead of showing 0 / 20 (A4)
  const modelUnavailable = unavailableCount > 0 && scoreData.total === 0;
  const scoreVal = scoreData.mentioned;
  const totalVal = scoreData.total || 20;
  const pctVal = scoreData.pct;

  const r = 18;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ - (pctVal / 100) * circ;

  return (
    <div className="bg-white border border-[#ece3d1] rounded-xl p-4 md:p-5 shadow-xs">
      <div className="flex items-center justify-between gap-4 flex-wrap">

        {/* ── Segmented glider tabs ──
            4 buttons (icon + label) never fit a 375px card on their own -
            outer flex-wrap only helps once this whole block doesn't fit
            next to the score card; it can't shrink the block itself. Below
            sm this scrolls horizontally instead of clipping the last tab. */}
        <SegmentedControl
          ariaLabel="AI model"
          options={modelList.map((m) => ({ id: m, label: m }))}
          value={selectedModel}
          onChange={onSelectModel}
          className="flex bg-[#f5f0e6] p-1 border border-[#e8dfc8] rounded-lg relative gap-0.5 max-w-full overflow-x-auto no-scrollbar"
          itemClassName={() =>
            "relative flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-md text-[12px] sm:text-[13px] font-medium cursor-pointer border-none bg-transparent z-10 transition-colors duration-150 shrink-0 whitespace-nowrap"
          }
          itemStyle={(isActive) => ({ color: isActive ? "#fff" : "#6f6757" })}
          gliderId="model-glider"
          renderOption={(opt, isActive) => (
            <>
              {/* Icon: invert to white when active */}
              <span className="w-4 h-4 shrink-0 flex items-center justify-center overflow-hidden relative z-10">
                <Image
                  src={DEFAULT_MODELS_CFG[opt.id].icon}
                  width={16}
                  height={16}
                  alt=""
                  className={`object-contain transition-all duration-200 ${isActive ? "brightness-0 invert" : ""}`}
                />
              </span>
              <span className="relative z-10">{opt.label}</span>
            </>
          )}
        />

        {/* ── Live Model Score Card ── */}
        {modelUnavailable ? (
          <div className="flex items-center gap-3.5 bg-[#fffbeb] border border-[#fde68a] px-4 py-2 rounded-lg min-w-[140px]">
            <div>
              <div className="font-mono-spline text-[9px] tracking-wider text-[#92400e] uppercase font-medium">Live Model Score</div>
              <div className="text-[15px] font-semibold text-[#92400e] mt-0.5">Unavailable</div>
              <div className="text-[11px] text-[#92400e]/80">
                {failedCount > 0 ? `${selectedModel} could not be reached` : `${selectedModel} was not run`}
              </div>
            </div>
            {failedCount > 0 && onRetryFailed && (
              <button
                onClick={onRetryFailed}
                disabled={isRetrying}
                className="text-[12px] font-semibold text-white bg-[#15463b] hover:bg-[#0f3a30] disabled:opacity-60 disabled:cursor-not-allowed px-3 py-1.5 rounded-md cursor-pointer border-none"
              >
                {isRetrying ? "Retrying…" : "Retry"}
              </button>
            )}
          </div>
        ) : (
        <div className="flex items-center gap-3.5 bg-[#fdfcf8] border border-[#efe7d6] px-4 py-2 rounded-lg min-w-[140px]">
          <div>
            <div className="font-mono-spline text-[9px] tracking-wider text-[#9b927f] uppercase font-medium">Live Model Score</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <AnimatePresence mode="wait">
                <motion.span
                  key={selectedModel + "-score-" + scoreVal}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="font-spectral text-[24px] font-semibold leading-none"
                  style={{ color: cfg.color }}
                >
                  {scoreVal}
                </motion.span>
              </AnimatePresence>
              <span className="text-[12px] text-[#9b927f] font-normal">/ {totalVal}</span>
            </div>
          </div>

          {/* Circular ring */}
          <div className="relative w-11 h-11 shrink-0">
            <svg width="44" height="44" viewBox="0 0 44 44" className="block" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="22" cy="22" r={r} fill="none" stroke={cfg.track} strokeWidth="4" />
              <motion.circle
                cx="22" cy="22" r={r}
                fill="none"
                stroke={cfg.color}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circ}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ type: "spring", stiffness: 280, damping: 30, duration: 0.4 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={selectedModel + "-pct-" + pctVal}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.12 }}
                  className="text-[10px] font-medium font-mono-spline"
                  style={{ color: cfg.color }}
                >
                  {pctVal}%
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
        )}

      </div>

      {/* Some (not all) of this model's answers failed: the score above only
          counts the ones that came back. Say so, and offer the retry. */}
      {!modelUnavailable && failedCount > 0 && (
        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap bg-[#fffbeb] border border-[#fde68a] rounded-lg px-3 py-2 text-[12px] text-[#92400e]">
          <span>
            {failedCount} of {scoreData.total + unavailableCount} {selectedModel} answers were unavailable and are not counted.
          </span>
          {onRetryFailed && (
            <button
              onClick={onRetryFailed}
              disabled={isRetrying}
              className="font-semibold text-[#15463b] underline disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer bg-transparent border-none"
            >
              {isRetrying ? "Retrying…" : "Retry unavailable"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
