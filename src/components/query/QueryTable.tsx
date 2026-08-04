"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Globe } from "lucide-react";
import { SearchQueryItem } from "../../types/dashboard";
import { getAllSourcesForQuery, normalizeDomain } from "../../lib/querySources";

interface QueryTableProps {
  queries: SearchQueryItem[];
  selectedModel?: string;
  onSelectQuery: (query: SearchQueryItem) => void;
  onOpenSources?: (query: SearchQueryItem) => void;
}

const VISIBLE_SOURCE_COUNT = 3;

function Favicon({ domain }: { domain: string }) {
  const clean = normalizeDomain(domain);
  if (!clean) return null;
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${clean}&sz=64`}
      alt={clean}
      className="w-3.5 h-3.5 rounded-sm object-contain shrink-0 border border-[#ece3d1] bg-white"
      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
    />
  );
}

export default function QueryTable({
  queries,
  selectedModel = "ChatGPT",
  onSelectQuery,
  onOpenSources,
}: QueryTableProps) {
  if (queries.length === 0) {
    return (
      <div className="text-center py-10 text-[#8a8273] text-[13.5px]">
        No matching AI search prompts found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5 mt-2.5 relative overflow-hidden">
      <AnimatePresence mode="popLayout">
        {queries.map((q) => {
          let typeColor = "#5b4f86";
          let typeBg = "#efe9fb";
          if (q.type === "non-branded") { typeColor = "#9a6a12"; typeBg = "#f7e7c4"; }
          else if (q.type === "local-seo") { typeColor = "#1e7d4f"; typeBg = "#dcefe2"; }
          else if (q.type === "broad-seo") { typeColor = "#a86d7e"; typeBg = "#fdeef1"; }

          // Resolve model specific status strictly for the selected model tab (NO fallback to ChatGPT)
          const modelRes = q.resultsByModel?.[selectedModel];
          const hasModelRes = modelRes !== undefined;

          const isAudited = hasModelRes
            ? (modelRes.status as string) !== "Pending"
            : Boolean(q.status) && (q.status as string) !== "Pending";

          const statusVal = hasModelRes ? modelRes.status : q.status;
          const isMentioned = statusVal === "Mentioned";

          // STRICT RULE: Rank is ONLY displayed if the entity is Mentioned for THIS specific model
          const rankVal = isMentioned ? (modelRes?.rank ?? (hasModelRes ? null : q.rank)) : null;
          
          // Total truth: every source domain cited across ALL models for
          // this query, not just whichever model tab happens to be
          // selected — the same set the sidebar shows, so the two can
          // never disagree the way the column vs. old modal used to.
          const sourcesVal = getAllSourcesForQuery(q);
          const visibleSources = sourcesVal.slice(0, VISIBLE_SOURCE_COUNT);
          const extraSourceCount = Math.max(0, sourcesVal.length - VISIBLE_SOURCE_COUNT);

          // Target Site Match Status Badge (Site matched, Partial match, Not matched)
          const targetSiteData = modelRes?.targetSite || (q as any).targetSite;
          const targetSiteStatus = targetSiteData?.status || (q.matchType === "site_matched" ? "matched" : q.matchType === "partial" ? "partial" : (isAudited ? "no_match" : null));

          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              key={q.id}
              onClick={() => {
                // Cannot see response log modal until query has been run (not Pending)
                if (isAudited) {
                  onSelectQuery(q);
                }
              }}
              className={`row-hover grid grid-cols-[40px_86px_minmax(0,1fr)_118px_54px_200px] items-center gap-2 border border-[#efe7d6] rounded-xl px-4 py-3.5 bg-[#fdfcf8] transition-all ${
                isAudited ? "hover:border-[#d9cbaf] hover:shadow-xs cursor-pointer" : "cursor-default opacity-90"
              }`}
            >
              <div className="text-[12.5px] font-semibold text-[#c2b69c]">
                #{q.id}
              </div>
              
              <span
                className="justify-self-start text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded shrink-0 max-w-[86px] truncate"
                style={{ color: typeColor, backgroundColor: typeBg }}
                title={q.label}
              >
                {q.label}
              </span>

              <div className="min-w-0 pr-2">
                <span className="block text-[14px] font-medium text-[#1c1a16] tracking-tight leading-snug whitespace-normal break-words">
                  &ldquo;{q.query}&rdquo;
                </span>
              </div>

              {/* Light & Crisp Distinct Status Pills */}
              <div className="text-center">
                {isAudited ? (
                  isMentioned ? (
                    <span className="text-[11px] font-bold text-[#15803d] bg-[#dcfce7] border border-[#bbf7d0] px-2 py-1 rounded-lg inline-flex items-center gap-1 shadow-2xs">
                      <CheckCircle2 className="w-3 h-3 text-[#15803d]" />
                      <span>Mentioned</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-[#b91c1c] bg-[#fee2e2] border border-[#fca5a5] px-2 py-1 rounded-lg inline-flex items-center gap-1 shadow-2xs">
                      <XCircle className="w-3 h-3 text-[#b91c1c]" />
                      <span>Not mentioned</span>
                    </span>
                  )
                ) : (
                  <span className="text-[11px] font-medium text-[#8a8273] bg-[#f5f0e6] border border-[#e2d8c4] px-2 py-1 rounded-md inline-flex items-center gap-1 animate-pulse">
                    Pending...
                  </span>
                )}
              </div>

              {/* Rank Column: ONLY shown if Mentioned */}
              <div className="text-center">
                {isAudited && isMentioned && rankVal ? (
                  <span className="text-[12px] font-bold text-[#15463b] bg-[#eef3f0] border border-[#d0e4d6] px-2.5 py-0.5 rounded-md">
                    #{rankVal}
                  </span>
                ) : (
                  <span className="text-[#c2b69c] font-bold text-[14px]">-</span>
                )}
              </div>

              {/* Cited Sources Column with Target Site Match Badge & Domain Favicons */}
              <div className="text-right flex gap-1.5 justify-end items-center flex-wrap">
                {isAudited ? (
                  <>
                    {/* Target Site Match Status Badge */}
                    {targetSiteStatus === "matched" && (
                      <span
                        onClick={(e) => { e.stopPropagation(); if (onOpenSources) onOpenSources(q); }}
                        className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#15803d] bg-[#dcfce7] border border-[#bbf7d0] px-2 py-0.5 rounded-md cursor-pointer hover:underline"
                        title="Target website matched this query prompt"
                      >
                        <Globe className="w-3 h-3 text-[#15803d]" />
                        <span>Site matched</span>
                      </span>
                    )}

                    {targetSiteStatus === "partial" && (
                      <span
                        onClick={(e) => { e.stopPropagation(); if (onOpenSources) onOpenSources(q); }}
                        className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#92400e] bg-[#fef3c7] border border-[#fde68a] px-2 py-0.5 rounded-md cursor-pointer hover:underline"
                        title="Target website partially matched this query"
                      >
                        <Globe className="w-3 h-3 text-[#92400e]" />
                        <span>Partial match</span>
                      </span>
                    )}

                    {targetSiteStatus === "no_match" && (
                      <span
                        onClick={(e) => { e.stopPropagation(); if (onOpenSources) onOpenSources(q); }}
                        className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[#6b7280] bg-[#f3f4f6] border border-[#e5e7eb] px-2 py-0.5 rounded-md cursor-pointer hover:underline"
                        title="Target website did not rank directly in organic top results"
                      >
                        <span>Not matched</span>
                      </span>
                    )}

                    {/* Third-Party Domain Favicon Pills — top 3, then a +N
                        overflow badge, both opening the sidebar with the
                        FULL list so the count shown here is never a lie. */}
                    {visibleSources.map((sItem, idx) => (
                      <span
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenSources) onOpenSources(q);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-[#3a352b] bg-[#f6f3ec] border border-[#ece3d1] px-2 py-0.5 rounded hover:underline hover:border-[#15463b] transition-colors cursor-pointer"
                        title="Click to view all extracted sources"
                      >
                        <Favicon domain={sItem} />
                        <span>{sItem}</span>
                      </span>
                    ))}

                    {extraSourceCount > 0 && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenSources) onOpenSources(q);
                        }}
                        className="inline-flex items-center text-[11px] font-semibold text-[#15463b] bg-[#eef3f0] border border-[#d0e4d6] px-2 py-0.5 rounded cursor-pointer hover:underline"
                        title="Click to view all extracted sources"
                      >
                        +{extraSourceCount}
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-[13px] font-medium text-[#c2b69c]">-</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
