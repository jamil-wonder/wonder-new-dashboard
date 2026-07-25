"use client";

import React, { useState, useEffect } from "react";
import { Minimize2, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScanProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function ScanProgressModal({ isOpen, onClose, onComplete }: ScanProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setIsDismissed(false);
    }
  }, [isOpen]);

  // Simulate scanning progress
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Increment scanning progress
        const increment = prev < 40 ? 4 + Math.random() * 4 : 1.5 + Math.random() * 2;
        return Math.min(100, prev + increment);
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isOpen]);

  const hasCompletedRef = React.useRef(false);

  // Reset completion ref when modal opens
  useEffect(() => {
    if (isOpen) {
      hasCompletedRef.current = false;
    }
  }, [isOpen]);

  // Trigger completion callback when hitting 100%
  useEffect(() => {
    if (progress >= 100 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      const timer = setTimeout(() => {
        onComplete();
        onClose();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete, onClose]);

  if (!isOpen) return null;

  const getLoadingText = () => {
    if (progress >= 100) return "Crawl completed successfully!";
    if (progress >= 90) return "Compiling final score report...";
    if (progress >= 80) return "Analyzing competitor rankings...";
    if (progress >= 70) return "Scraping LocalBusiness schemas...";
    if (progress >= 55) return "Verifying NAP details consistency...";
    if (progress >= 40) return "Crawling sitemap & robots.txt rules...";
    if (progress >= 25) return "Reading canonical tags & meta headers...";
    if (progress >= 10) return "Connecting secure crawler bot...";
    return "Initializing sitemap audit crawl...";
  };

  const loadingText = getLoadingText();

  // Minimized pill layout in the bottom right corner
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
              Scanning Sitemap: {Math.round(progress)}%
            </div>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#a8d860]" />
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
        {/* Subtle Decorative forest glow */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#15463b]/5 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#a8d860]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between w-full mb-6">
            <h3 className="text-[19px] font-semibold text-[#15463b] font-spectral leading-tight">
              Sitemap Audit Crawl
            </h3>
            <button
              onClick={() => setIsDismissed(true)}
              className="flex items-center gap-1 text-[11.5px] font-bold text-[#6f6757] hover:text-[#15463b] bg-[#f5f0e6] hover:bg-[#ebdcc5]/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Minimize2 className="w-3 h-3" />
              <span>Minimize</span>
            </button>
          </div>

          {/* Label + Progress % */}
          <div className="flex items-start justify-between mb-3.5 min-h-[44px] gap-3">
            <span className="text-[#6f6757] text-[13.5px] font-medium leading-relaxed">
              {loadingText}
            </span>
            <span className="text-[28px] font-spectral font-bold text-[#15463b] leading-none shrink-0">
              {Math.round(progress)}%
            </span>
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
            <span>Crawl Progress</span>
            <span className="text-[#15463b]">
              {progress >= 100 ? "Complete" : "Crawling"}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
