"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, ArrowLeft, Layers } from "lucide-react";
import { SearchQueryItem } from "../../types/dashboard";
import { getAllSourcesForQuery } from "../../lib/querySources";

interface SourcesSidebarProps {
  isOpen: boolean;
  // The query that triggered opening (row click) — null when opened via a
  // page-level "view all sources" trigger, since there's no single query
  // context in that case.
  query: SearchQueryItem | null;
  // Pre-computed, deduplicated, already-validated domain list for "all"
  // mode — callers compute this themselves (getAllSourcesForQueries() for
  // Query's own run, or Overview's already-derived citedSources), so this
  // component stays a plain, reusable list view with no opinion on where
  // the data came from.
  allSources: string[];
  // Small subtitle detail shown next to the domain count in "all" mode,
  // e.g. "across 20 queries". Optional.
  allSourcesSubtitle?: string;
  onClose: () => void;
}

function DomainFavicon({ domain }: { domain: string }) {
  if (!domain) return null;
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
      alt={domain}
      className="w-4 h-4 rounded-sm object-contain shrink-0 border border-[#ece3d1] bg-white"
      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
    />
  );
}

// A single, reusable right-to-left slide-over — not a blocking modal.
// Shows the full, honest list of source domains cited: either for the one
// query you clicked, or across an entire run.
export default function SourcesSidebar({ isOpen, query, allSources, allSourcesSubtitle, onClose }: SourcesSidebarProps) {
  const [viewAll, setViewAll] = useState(!query);

  // Reset the view mode each time the sidebar is (re)opened — clicking a
  // row always starts on that row's sources; the page-level trigger (no
  // query) always starts on the all-sources view.
  useEffect(() => {
    if (isOpen) setViewAll(!query);
  }, [isOpen, query]);

  const singleSources = getAllSourcesForQuery(query);
  const sources = viewAll ? allSources : singleSources;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="sources-sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0f1c18]/10 z-[9998]"
            onClick={onClose}
          />
          <motion.div
            key="sources-sidebar-panel"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed top-0 right-0 h-screen w-[92vw] max-w-[380px] bg-white border-l border-[#ece3d1] shadow-[-12px_0_32px_rgba(21,70,59,0.14)] z-[9999] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#efe7d6] bg-[#fdfcf8] shrink-0">
              <div className="min-w-0">
                <h3 className="font-spectral text-[16px] font-semibold text-[#15463b]">
                  {viewAll ? "All Sources" : "Sources"}
                </h3>
                <p className="text-[11.5px] text-[#8a8273] mt-0.5">
                  {sources.length} domain{sources.length === 1 ? "" : "s"} cited
                  {viewAll ? (allSourcesSubtitle ? ` ${allSourcesSubtitle}` : "") : " across all models"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-[#8a8273] hover:text-[#23211b] hover:bg-[#f5f0e6] rounded-md transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Query context / mode toggle */}
            {query ? (
              <div className="px-5 py-3 bg-[#f6f3ec] border-b border-[#efe7d6] shrink-0">
                {viewAll ? (
                  <button
                    onClick={() => setViewAll(false)}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#15463b] hover:underline cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back to &ldquo;{query.query}&rdquo;
                  </button>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12.5px] font-medium text-[#2c2821] truncate">&ldquo;{query.query}&rdquo;</span>
                    <button
                      onClick={() => setViewAll(true)}
                      className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#15463b] hover:underline cursor-pointer shrink-0"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      View all
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-5 py-3 bg-[#f6f3ec] border-b border-[#efe7d6] text-[12px] text-[#6f6757] shrink-0">
                Every source AI cited{allSourcesSubtitle ? ` ${allSourcesSubtitle}` : ""}.
              </div>
            )}

            {/* Sources list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {sources.length > 0 ? (
                sources.map((domain) => (
                  <a
                    key={domain}
                    href={`https://${domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[#ece3d1] bg-[#fdfcf8] hover:border-[#15463b] hover:bg-white transition-all text-[13px] font-medium text-[#2c2821] group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <DomainFavicon domain={domain} />
                      <span className="truncate group-hover:underline">{domain}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8a8273] group-hover:text-[#15463b] shrink-0 ml-1" />
                  </a>
                ))
              ) : (
                <div className="py-8 text-center text-[12.5px] text-[#8a8273]">
                  {viewAll ? "No sources captured yet." : "No sources captured for this prompt yet."}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
