"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Globe } from "lucide-react";
import { SearchQueryItem } from "../../types/dashboard";
import QueryAnswerPanel from "./QueryAnswerPanel";
import QuestionCell from "./QuestionCell";
import { getSourcesForModel } from "../../lib/querySources";

interface QueryTableProps {
  queries: SearchQueryItem[];
  selectedModel?: string;
  onSelectQuery: (query: SearchQueryItem) => void;
  // B10: the question whose answer is open right under its row
  expandedId?: string | number | null;
  onCloseAnswer?: () => void;
  // G4: every place the business is tracked in (main + extra); with 2+, local questions show which place they are about
  locations?: string[];
  onOpenSources?: (query: SearchQueryItem) => void;
  // J8: change, remove, or reword a question
  onEditQuery?: (query: SearchQueryItem, text: string) => void;
  onRemoveQuery?: (query: SearchQueryItem) => void;
  onRewriteQuery?: (query: SearchQueryItem) => Promise<string | null>;
  // I6: the Rank column is only there once some answer has a rank
  showRank?: boolean;
}

export default function QueryTable({
  queries,
  selectedModel = "ChatGPT",
  onSelectQuery,
  expandedId = null,
  onCloseAnswer,
  locations = [],
  onOpenSources,
  onEditQuery,
  onRemoveQuery,
  onRewriteQuery,
  showRank = true,
}: QueryTableProps) {
  if (queries.length === 0) {
    return (
      <div className="text-center py-10 text-[#8a8273] text-[13.5px]">
        No matching AI search prompts found.
      </div>
    );
  }

  return (
    // The row's 5 fixed-width columns (40+86+118+54+200 = 498px) alone are
    // already wider than a phone screen - the flexible query-text column
    // has nowhere left to shrink to and the browser was wrapping it one
    // character per line to fit. Rather than trying to cram a 6-column
    // dense data table into ~340px (not attempting a mobile redesign of
    // Query per earlier direction), each row keeps its natural width via
    // min-w-[720px] below and scrolls horizontally instead - the actual
    // scroll container is in query/page.tsx, wrapping this together with
    // the column-header row so both move in sync instead of scrolling
    // independently and drifting out of alignment.
    <div className="flex flex-col gap-2.5 mt-2.5 relative">
      <AnimatePresence mode="popLayout">
        {queries.map((q) => {
          let typeColor = "#5b4f86";
          let typeBg = "#efe9fb";
          if (q.type === "non-branded") { typeColor = "#9a6a12"; typeBg = "#f7e7c4"; }
          else if (q.type === "local-seo") { typeColor = "#1e7d4f"; typeBg = "#dcefe2"; }
          else if (q.type === "broad-seo") { typeColor = "#a86d7e"; typeBg = "#fdeef1"; }

          // Resolve model specific status strictly for the selected model
          // tab - NO fallback to the aggregate q.status/q.rank/q.matchType
          // (an "any model mentioned it" summary across ALL models). That
          // fallback used to leak through here: a query run before this
          // model was ever added to the rotation has no entry in
          // resultsByModel for it at all, and borrowing the aggregate
          // status made the table claim a model answered a question it was
          // literally never asked. If this model has no recorded result,
          // that's "Pending Run" for it, full stop - not whatever another
          // model happened to say.
          const modelRes = q.resultsByModel?.[selectedModel];
          const hasModelRes = modelRes !== undefined;

          // A model that failed / did not run is "Unavailable" (missing data),
          // never "Not mentioned" - and has no answer to open (A4).
          const isUnavailable = hasModelRes && modelRes.status === "Unavailable";
          const isAudited = hasModelRes && (modelRes.status as string) !== "Pending" && !isUnavailable;
          const statusVal = hasModelRes ? modelRes.status : "Pending";
          const isMentioned = statusVal === "Mentioned";

          // STRICT RULE: Rank is ONLY displayed if the entity is Mentioned for THIS specific model
          const rankVal = isMentioned ? (modelRes?.rank ?? null) : null;

          // B4: the sources THIS model cited (the tab selected above), not the union of all four
          const sourcesVal = getSourcesForModel(q, selectedModel);

          // Target Site Match Status Badge (Site matched, Partial match, Not matched)
          const targetSiteData = modelRes?.targetSite;
          const targetSiteStatus = hasModelRes ? (targetSiteData?.status || (isAudited ? "no_match" : null)) : null;

          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              key={q.id}
              className="flex flex-col gap-2"
            >
            <div
              role={isAudited ? "button" : undefined}
              tabIndex={isAudited ? 0 : undefined}
              aria-expanded={isAudited ? expandedId === q.id : undefined}
              aria-label={isAudited ? `${expandedId === q.id ? "Hide" : "Show"} ${selectedModel}'s answer to: ${q.query}` : undefined}
              onKeyDown={(e) => {
                if (isAudited && e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onSelectQuery(q);
                }
              }}
              onClick={() => {
                // Cannot see response log modal until query has been run (not Pending)
                if (isAudited) {
                  onSelectQuery(q);
                }
              }}
              className={`row-hover grid ${showRank ? "grid-cols-[40px_86px_minmax(0,1fr)_118px_54px_200px]" : "grid-cols-[40px_86px_minmax(0,1fr)_118px_200px]"} min-w-[720px] items-center gap-2 border border-[#efe7d6] rounded-xl px-4 py-3.5 bg-[#fdfcf8] transition-all ${
                isAudited ? "hover:border-[#d9cbaf] hover:shadow-xs cursor-pointer" : "cursor-default opacity-90"
              }`}
            >
              <div className="text-[12.5px] font-semibold text-[#c2b69c]">
                #{q.id}
              </div>
              
              <span className="flex flex-col items-start gap-0.5 justify-self-start">
                <span
                  className="text-[9px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded shrink-0 max-w-[86px] truncate"
                  style={{ color: typeColor, backgroundColor: typeBg }}
                  title={q.label}
                >
                  {q.label}
                </span>
                {q.type === "local-seo" && locations.length > 1 && (() => {
                  const place = locations.find((l) => q.query.toLowerCase().includes(l.split(",")[0].trim().toLowerCase()));
                  return place ? <span className="max-w-[86px] truncate text-[10px] text-[#6f6757]" title={place}>{place.split(",")[0]}</span> : null;
                })()}
              </span>

              <div className="min-w-0 pr-2">
                <QuestionCell query={q} onEdit={onEditQuery} onRemove={onRemoveQuery} onRewrite={onRewriteQuery} />
              </div>

              {/* Light & Crisp Distinct Status Pills */}
              <div className="text-center">
                {isAudited ? (
                  isMentioned ? (
                    <span className="inline-flex flex-col items-center gap-0.5">
                      <span className="text-[11px] font-bold text-[#15803d] bg-[#dcfce7] border border-[#bbf7d0] px-2 py-1 rounded-lg inline-flex items-center gap-1 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3 text-[#15803d]" />
                        <span>Mentioned</span>
                      </span>
                      {/* I6: why it counts - named in the answer text, cited as a source, or both */}
                      <span className="text-[10px] text-[#8a8273] leading-none">
                        {modelRes?.namedInAnswer && modelRes?.citedAsSource ? "named + cited" : modelRes?.namedInAnswer ? "named in answer" : modelRes?.citedAsSource ? "cited as source" : ""}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-[#b91c1c] bg-[#fee2e2] border border-[#fca5a5] px-2 py-1 rounded-lg inline-flex items-center gap-1 shadow-2xs">
                      <XCircle className="w-3 h-3 text-[#b91c1c]" />
                      <span>Not mentioned</span>
                    </span>
                  )
                ) : isUnavailable ? (
                  <span
                    className="text-[11px] font-bold text-[#92400e] bg-[#fef3c7] border border-[#fde68a] px-2 py-1 rounded-lg inline-flex items-center gap-1"
                    title={modelRes?.fetchStatus === "not_run" ? "This model was not run" : "This model could not be reached for this question - use Retry above"}
                  >
                    Unavailable
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-[#8a8273] bg-[#f5f0e6] border border-[#e2d8c4] px-2 py-1 rounded-md inline-flex items-center gap-1 animate-pulse">
                    Pending...
                  </span>
                )}
              </div>

              {/* Rank Column: only exists once some answer has a rank, and only filled if Mentioned */}
              {showRank && (
                <div className="text-center">
                  {isAudited && isMentioned && rankVal ? (
                    <span className="text-[12px] font-bold text-[#15463b] bg-[#eef3f0] border border-[#d0e4d6] px-2.5 py-0.5 rounded-md">
                      #{rankVal}
                    </span>
                  ) : (
                    <span className="text-[#c2b69c] font-bold text-[14px]">-</span>
                  )}
                </div>
              )}

              {/* Cited Sources Column with Target Site Match Badge & Domain Favicons */}
              <div className="text-right flex gap-1.5 justify-end items-center flex-wrap">
                {isAudited ? (
                  <>
                    {/* B4: one chip with the count; it opens the sidebar with the full list */}
                    {sourcesVal.length > 0 ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenSources) onOpenSources(q);
                        }}
                        className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#15463b] bg-[#eef3f0] border border-[#d0e4d6] px-2.5 py-1 rounded-md cursor-pointer hover:underline"
                        title={targetSiteStatus === "matched" ? "Includes your website - click to view the sources" : "Click to view the sources"}
                      >
                        <Globe className="w-3 h-3" />
                        {sourcesVal.length} {sourcesVal.length === 1 ? "source" : "sources"}
                      </button>
                    ) : (
                      <span className="text-[12px] text-[#8a8273]">No sources</span>
                    )}
                  </>
                ) : (
                  <span className="text-[13px] font-medium text-[#c2b69c]">-</span>
                )}
              </div>
            </div>
            {expandedId === q.id && isAudited && (
              <QueryAnswerPanel query={q} selectedModel={selectedModel} onClose={() => onCloseAnswer?.()} />
            )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
