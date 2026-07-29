"use client";

import React, { useState, useEffect, useRef } from "react";
import { Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { WonderscoreLogo } from "../ui/WonderscoreSpinner";

interface ScanProgressModalProps {
  isOpen: boolean;
  isComplete?: boolean;
  onClose: () => void;
  onComplete?: () => void;
  title?: string;
  loadingTextOverride?: string;
  processed?: number;
  total?: number;
}

export default function ScanProgressModal({
  isOpen,
  isComplete,
  onClose,
  onComplete,
  title = "Live Sitemap Audit Crawl",
  loadingTextOverride,
  processed,
  total,
}: ScanProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setProgress(5);
      setIsDismissed(false);
    } else {
      setProgress(0);
    }
  }, [isOpen]);

  // Smoothly increment progress or sync with processed / total ratio (capped at 95% until isComplete)
  useEffect(() => {
    if (!isOpen) return;

    if (typeof processed === "number" && typeof total === "number" && total > 0) {
      const realPct = Math.round((processed / total) * 100);
      const targetPct = isComplete ? 100 : Math.min(95, Math.max(5, realPct));
      setProgress(targetPct);
      return;
    }

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (isComplete) {
          return 100;
        }
        if (prev >= 92) {
          return 92;
        }
        const increment = prev < 40 ? 3 + Math.random() * 3 : 1 + Math.random() * 1.5;
        return Math.min(92, prev + increment);
      });
    }, 250);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [isOpen, isComplete, processed, total]);

  // When API explicitly marks isComplete = true, fill bar to 100% and auto-close after 1000ms
  useEffect(() => {
    if (isComplete && isOpen) {
      setProgress(100);
      const closeTimer = setTimeout(() => {
        if (onComplete) onComplete();
        onClose();
      }, 1000);
      return () => clearTimeout(closeTimer);
    }
  }, [isComplete, isOpen, onClose, onComplete]);

  if (!isOpen) return null;

  const getLoadingText = () => {
    if (loadingTextOverride) return loadingTextOverride;
    if (isComplete || progress >= 100) return "Finished. Preparing your results.";
    if (progress >= 90) return "Final checks are running.";
    if (progress >= 70) return "Reviewing AI answers and sources.";
    if (progress >= 45) return "Checking the business details.";
    if (progress >= 20) return "Running the scan.";
    return "Starting the analysis.";
  };

  const loadingText = getLoadingText();

  // Minimized pill layout in bottom right
  if (isDismissed) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 50 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 50 }}
          className="fixed bottom-6 right-6 z-[999] cursor-pointer"
          onClick={() => setIsDismissed(false)}
        >
          <div className="flex items-center gap-3 bg-[#15463b] text-white border border-[#235848] px-5 py-3 rounded-full shadow-[0_12px_32px_rgba(21,70,59,0.25)] hover:bg-[#1a5c44] transition-colors">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a8d860] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#a8d860]"></span>
            </span>
            <div className="text-[12.5px] font-semibold tracking-wide">
              {typeof processed === "number" && typeof total === "number"
                ? `Analyzing prompts: ${processed}/${total}`
                : `Progress: ${Math.round(progress)}%`}
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              className="shrink-0"
            >
              <WonderscoreLogo size={18} color="#a8d860" />
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[#23211b]/40 backdrop-blur-[3px]"
        onClick={() => setIsDismissed(true)}
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", damping: 26, stiffness: 190 }}
        className="relative w-full max-w-md bg-[#fdfcf8] border border-[#ece3d1] rounded-2xl p-6 md:p-8 shadow-[0_16px_48px_rgba(60,48,28,0.12)] overflow-hidden z-10"
      >
        <div className="flex flex-col relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between w-full mb-6">
            <div className="flex items-center gap-2.5">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="shrink-0"
              >
                <WonderscoreLogo size={22} color="#15463b" />
              </motion.div>
              <h3 className="text-[19px] font-semibold text-[#15463b] font-spectral leading-tight">
                {title}
              </h3>
            </div>
            <button
              onClick={() => setIsDismissed(true)}
              className="flex items-center gap-1 text-[11.5px] font-bold text-[#6f6757] hover:text-[#15463b] bg-[#f5f0e6] hover:bg-[#ebdcc5]/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border-none"
            >
              <Minimize2 className="w-3 h-3" />
              <span>Minimize</span>
            </button>
          </div>

          {/* Label + Progress % / Counter */}
          <div className="flex items-start justify-between mb-3.5 min-h-[44px] gap-3">
            <span className="text-[#6f6757] text-[13.5px] font-medium leading-relaxed">
              {loadingText}
            </span>
            <div className="flex flex-col items-end shrink-0">
              <span className="text-[28px] font-spectral font-bold text-[#15463b] leading-none">
                {Math.round(progress)}%
              </span>
              {typeof processed === "number" && typeof total === "number" && (
                <span className="text-[11px] font-mono font-bold text-[#8a8273] mt-1">
                  {processed}/{total} prompts
                </span>
              )}
            </div>
          </div>

          {/* Bar track */}
          <div className="w-full h-2.5 bg-[#eee9de] rounded-full overflow-hidden relative">
            <motion.div
              className="h-full bg-[#15463b] rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            />
          </div>

          <div className="flex justify-between w-full mt-2.5 text-[9px] font-bold text-[#9b927f] uppercase tracking-wider font-mono-spline">
            <span>Usually 1-5 min</span>
            <span className="text-[#15463b]">
              {isComplete ? "Complete" : "Keep this open or browse other pages"}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
