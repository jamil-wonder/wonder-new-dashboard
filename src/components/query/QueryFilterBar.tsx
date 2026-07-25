"use client";

import { useState, useRef, useEffect } from "react";
import { Copy, Plus, Play, ChevronDown, Check } from "lucide-react";
import { motion } from "framer-motion";

interface QueryFilterBarProps {
  selectedModel: string;
  activeCategory: string;
  activeStatus: string;
  onCategoryChange: (category: string) => void;
  onStatusChange: (status: string) => void;
  onCopyAll: () => void;
  onOpenAddModal: () => void;
  onRunAudit?: () => void;
}

const CATEGORY_OPTIONS = [
  { id: "all",         label: "All" },
  { id: "branded",     label: "Branded" },
  { id: "non-branded", label: "Non-Branded" },
  { id: "local-seo",   label: "Local SEO" },
  { id: "broad-seo",   label: "Broad SEO" },
];

const STATUS_FILTERS = [
  { id: "all",           label: "All" },
  { id: "mentioned",     label: "Mentioned" },
  { id: "not-mentioned", label: "Not Mentioned" },
];

export default function QueryFilterBar({
  selectedModel,
  activeCategory,
  activeStatus,
  onCategoryChange,
  onStatusChange,
  onCopyAll,
  onOpenAddModal,
  onRunAudit,
}: QueryFilterBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeCategoryLabel =
    CATEGORY_OPTIONS.find((o) => o.id === activeCategory)?.label ?? "All";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="border-b border-[#ece3d1] pb-5 mb-5">

      {/* ── Single toolbar row ── */}
      <div className="flex items-center gap-3 flex-wrap">

        {/* LEFT: Title + subtitle stacked */}
        <div className="flex-1 min-w-[200px]">
          <h2 className="font-spectral text-[20px] font-semibold text-[#15463b] leading-tight">
            Generated AI Search Prompts
          </h2>
          <p className="text-[12px] text-[#9b927f] mt-0.5">
            <span className="font-semibold text-[#15463b]">{selectedModel}</span>
            {" "}· Click any row to view the AI response
          </p>
        </div>

        {/* CENTER + RIGHT: All controls in one pill-row */}
        <div className="flex items-center gap-2 flex-wrap">

          {/* Divider label */}
          <span className="font-mono-spline text-[9px] tracking-wider uppercase text-[#c2b69c] hidden sm:block">
            Filter
          </span>

          {/* ── Category dropdown ── */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-1.5 h-8 pl-3 pr-2.5 rounded-lg text-[12px] font-bold bg-[#f5f0e6] border border-[#e0d8c8] text-[#3a352b] hover:border-[#15463b] hover:bg-white transition-all cursor-pointer"
            >
              <span>{activeCategoryLabel}</span>
              <motion.span
                animate={{ rotate: dropdownOpen ? 180 : 0 }}
                transition={{ duration: 0.18 }}
                className="flex"
              >
                <ChevronDown className="w-3 h-3 text-[#9b927f]" />
              </motion.span>
            </button>

            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.14 }}
                className="absolute top-full mt-1.5 left-0 z-50 bg-white border border-[#e5ddd0] rounded-xl shadow-[0_8px_24px_rgba(21,70,59,0.14)] overflow-hidden w-[170px]"
              >
                {CATEGORY_OPTIONS.map((opt) => {
                  const isActive = activeCategory === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => { onCategoryChange(opt.id); setDropdownOpen(false); }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 text-[12.5px] font-semibold cursor-pointer border-none transition-colors text-left ${
                        isActive
                          ? "bg-[#15463b] text-white"
                          : "bg-transparent text-[#3a352b] hover:bg-[#f5f0e6]"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isActive && <Check className="w-3 h-3 shrink-0" />}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* ── Status glider pills ── */}
          <div className="flex bg-[#f5f0e6] p-[3px] border border-[#e0d8c8] rounded-lg relative gap-0.5 h-8 items-center">
            {STATUS_FILTERS.map((f) => {
              const isActive = activeStatus === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => onStatusChange(f.id)}
                  className="relative px-3 py-1 rounded-md text-[11.5px] font-bold border-none cursor-pointer bg-transparent z-10 transition-colors duration-100 h-full flex items-center"
                  style={{ color: isActive ? "#fff" : "#6f6757" }}
                >
                  {isActive && (
                    <motion.span
                      layoutId="status-glider"
                      className="absolute inset-0 rounded-md bg-[#15463b] shadow-sm"
                      transition={{ type: "spring", stiffness: 480, damping: 36 }}
                      style={{ zIndex: -1 }}
                    />
                  )}
                  <span className="relative z-10 whitespace-nowrap">{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── Thin separator ── */}
          <div className="w-px h-5 bg-[#e0d8c8] hidden sm:block" />

          {/* ── Copy icon ── */}
          <button
            onClick={onCopyAll}
            title="Copy all prompts"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#d8cfbd] bg-white text-[#8a8273] hover:text-[#23211b] hover:bg-[#fbf7ee] transition-colors shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* ── Add Prompt ── */}
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-bold bg-[#15463b] text-white border-none cursor-pointer hover:bg-[#0f3329] transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Prompt</span>
          </button>

          {/* ── Run ── */}
          <button
            onClick={onRunAudit}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-lg text-[12px] font-bold bg-[#1e7d4f] text-white border-none cursor-pointer hover:bg-[#166039] transition-colors shrink-0"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run</span>
          </button>
        </div>
      </div>
    </div>
  );
}
