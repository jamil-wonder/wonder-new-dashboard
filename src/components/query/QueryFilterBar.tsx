"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Plus, Play, ChevronDown, Check } from "lucide-react";
import { motion } from "framer-motion";

interface QueryFilterBarProps {
  selectedModel: string;
  activeCategory: string;
  activeStatus: string;
  isGenerating?: boolean;
  onCategoryChange: (category: string) => void;
  onStatusChange: (status: string) => void;
  onCopyAll: () => void;
  onOpenAddModal: () => void;
  onRunAudit?: () => void;
  onRegeneratePrompts?: () => void;
}

const CATEGORY_OPTIONS = [
  { id: "all",         label: "All Categories" },
  { id: "branded",     label: "Branded" },
  { id: "non-branded", label: "Non-Branded" },
  { id: "local-seo",   label: "Local SEO" },
  { id: "broad-seo",   label: "Broad SEO" },
];

const STATUS_FILTERS = [
  { id: "all",           label: "All" },
  { id: "mentioned",     label: "Mentioned" },
  { id: "not-mentioned", label: "Not Mentioned" },
  { id: "pending",       label: "Pending Run" },
];

function WonderscoreLogoIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
    </svg>
  );
}

export default function QueryFilterBar({
  selectedModel,
  activeCategory,
  activeStatus,
  isGenerating = false,
  onCategoryChange,
  onStatusChange,
  onCopyAll,
  onOpenAddModal,
  onRunAudit,
  onRegeneratePrompts,
}: QueryFilterBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeCategoryLabel =
    CATEGORY_OPTIONS.find((o) => o.id === activeCategory)?.label ?? "All Categories";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="border-b border-[#ece3d1] pb-4 mb-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">

        {/* LEFT: Category & Status Filters + Copy */}
        <div className="flex items-center gap-2.5 flex-wrap">

          {/* ── Category dropdown ── */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 h-9 pl-3.5 pr-3 rounded-lg text-[13px] font-normal bg-[#fdfcf8] border border-[#e2d8c4] text-[#2c2821] hover:border-[#15463b] hover:bg-white transition-all cursor-pointer shadow-xs"
            >
              <span>{activeCategoryLabel}</span>
              <motion.span
                animate={{ rotate: dropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.15 }}
                className="flex"
              >
                <ChevronDown className="w-3.5 h-3.5 text-[#8a8273]" />
              </motion.span>
            </button>

            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full mt-1.5 left-0 z-50 bg-white border border-[#e5ddd0] rounded-lg shadow-[0_8px_20px_rgba(21,70,59,0.12)] overflow-hidden w-[180px]"
              >
                {CATEGORY_OPTIONS.map((opt) => {
                  const isActive = activeCategory === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => { onCategoryChange(opt.id); setDropdownOpen(false); }}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-[13px] font-medium cursor-pointer border-none transition-colors text-left ${
                        isActive
                          ? "bg-[#15463b] text-white"
                          : "bg-transparent text-[#2c2821] hover:bg-[#f5f0e6]"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* ── Status Glider Pills ── */}
          <div className="flex bg-[#f5f0e6] p-0.5 border border-[#e0d8c8] rounded-lg relative gap-0.5 h-9 items-center">
            {STATUS_FILTERS.map((f) => {
              const isActive = activeStatus === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => onStatusChange(f.id)}
                  className="relative px-3 py-1 rounded-md text-[12.5px] font-medium border-none cursor-pointer bg-transparent z-10 transition-colors duration-100 h-full flex items-center"
                  style={{ color: isActive ? "#fff" : "#6f6757" }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="status-glider"
                      className="absolute inset-0 rounded-md bg-[#15463b] shadow-xs"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                      style={{ zIndex: -1 }}
                    />
                  )}
                  <span className="relative z-10 whitespace-nowrap">{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── Copy Icon Button ── */}
          <button
            onClick={onCopyAll}
            title="Copy all search queries"
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#e2d8c4] bg-[#fdfcf8] text-[#6f6757] hover:text-[#15463b] hover:bg-white transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>

        {/* RIGHT: 3 Main Action Buttons (Regenerate, Add Prompt, Run) */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 1. Regenerate Button */}
          <button
            onClick={onRegeneratePrompts}
            disabled={isGenerating}
            title="Regenerate questions using Business Profile ratios"
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-lg text-[13px] font-medium bg-[#fdfcf8] text-[#15463b] border border-[#e2d8c4] hover:bg-white hover:border-[#15463b] transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-xs"
          >
            <WonderscoreLogoIcon className="w-4 h-4 text-[#15463b]" />
            <span>Regenerate</span>
          </button>

          {/* 2. Add Prompt Button */}
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg text-[13px] font-medium bg-[#15463b] text-white border-none cursor-pointer hover:bg-[#1a5c44] transition-colors shrink-0 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Prompt</span>
          </button>

          {/* 3. Run Button */}
          <button
            onClick={onRunAudit}
            className="inline-flex items-center gap-1.5 h-9 px-4.5 rounded-lg text-[13px] font-medium bg-[#1e7d4f] text-white border-none cursor-pointer hover:bg-[#166039] transition-colors shrink-0 shadow-xs"
          >
            <Play className="w-4 h-4" />
            <span>Run</span>
          </button>
        </div>

      </div>
    </div>
  );
}
