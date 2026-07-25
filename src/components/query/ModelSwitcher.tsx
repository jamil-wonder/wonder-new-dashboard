"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ModelSwitcherProps {
  selectedModel: string;
  onSelectModel: (model: string) => void;
}

const MODELS = [
  { name: "ChatGPT",    icon: "/icons/chatgpt.svg",    score: 11, total: 20, pct: 55, color: "#1e7d4f", track: "#dcefe2" },
  { name: "Claude",     icon: "/icons/claude.svg",     score: 9,  total: 20, pct: 45, color: "#9a6a12", track: "#f7e7c4" },
  { name: "Perplexity", icon: "/icons/perplexity.svg", score: 7,  total: 20, pct: 35, color: "#1a4b9a", track: "#dce5f7" },
  { name: "Gemini",     icon: "/icons/gemini.svg",     score: 8,  total: 20, pct: 40, color: "#b1442a", track: "#f6dcd5" },
];

export default function ModelSwitcher({ selectedModel, onSelectModel }: ModelSwitcherProps) {
  const cfg = MODELS.find((m) => m.name === selectedModel) || MODELS[0];

  const r    = 18;
  const circ = 2 * Math.PI * r;
  const dashOffset = circ - (cfg.pct / 100) * circ;

  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-5 md:p-[22px_26px] shadow-sm">
      <div className="flex items-center justify-between gap-4 flex-wrap">

        {/* ── Segmented glider tabs ── */}
        <div className="flex bg-[#f5f0e6] p-1 border border-[#e8dfc8] rounded-xl relative gap-0.5">
          {MODELS.map((m) => {
            const isActive = selectedModel === m.name;
            return (
              <button
                key={m.name}
                onClick={() => onSelectModel(m.name)}
                className="relative flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold cursor-pointer border-none bg-transparent z-10 transition-colors duration-150"
                style={{ color: isActive ? "#fff" : "#6f6757" }}
              >
                {/* ── Sliding background pill (layoutId makes it animate between tabs) ── */}
                {isActive && (
                  <motion.span
                    layoutId="model-glider"
                    className="absolute inset-0 rounded-lg bg-[#15463b] shadow-sm"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    style={{ zIndex: -1 }}
                  />
                )}

                {/* Icon: invert to white when active */}
                <span className="w-[16px] h-[16px] shrink-0 flex items-center justify-center overflow-hidden relative z-10">
                  <Image
                    src={m.icon}
                    width={16}
                    height={16}
                    alt={m.name}
                    className={`object-contain transition-all duration-200 ${isActive ? "brightness-0 invert" : ""}`}
                  />
                </span>
                <span className="relative z-10">{m.name}</span>
              </button>
            );
          })}
        </div>

        {/* ── Model Score card ── */}
        <div className="flex items-center gap-3.5 bg-[#fdfcf8] border border-[#efe7d6] px-5 py-2.5 rounded-xl min-w-[148px]">
          <div>
            <div className="font-mono-spline text-[9px] tracking-wider text-[#9b927f] uppercase">Model Score</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <AnimatePresence mode="wait">
                <motion.span
                  key={cfg.name + "-score"}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18 }}
                  className="num font-spectral text-[26px] font-bold leading-none"
                  style={{ color: cfg.color }}
                >
                  {cfg.score}
                </motion.span>
              </AnimatePresence>
              <span className="text-[13px] text-[#9b927f] font-semibold">/ {cfg.total}</span>
            </div>
          </div>

          {/* Circular ring */}
          <div className="relative w-12 h-12 shrink-0">
            <svg width="48" height="48" viewBox="0 0 44 44" className="block" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="22" cy="22" r={r} fill="none" stroke={cfg.track} strokeWidth="4.5" />
              <motion.circle
                cx="22" cy="22" r={r}
                fill="none"
                stroke={cfg.color}
                strokeWidth="4.5"
                strokeLinecap="round"
                strokeDasharray={circ}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ type: "spring", stiffness: 280, damping: 30, duration: 0.5 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={cfg.name + "-pct"}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15 }}
                  className="text-[10px] font-bold font-mono-spline"
                  style={{ color: cfg.color }}
                >
                  {cfg.pct}%
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
