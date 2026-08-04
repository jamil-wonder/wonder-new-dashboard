"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText, MessageCircle, SearchCheck, X } from "lucide-react";
import { OverviewData } from "../../hooks/useOverviewData";

const MODEL_ICONS: Record<string, string> = {
  ChatGPT: "/icons/chatgpt.svg",
  Claude: "/icons/claude.svg",
  Perplexity: "/icons/perplexity.svg",
  Gemini: "/icons/gemini.svg",
};

type SprintCard = {
  kind: "blog" | "query" | "audit";
  tag: string;
  badge: string;
  title: string;
  desc: string;
  note: string;
  link: string;
  btn: string;
  primary?: boolean;
  blog?: {
    title: string;
    excerpt?: string;
    metaDescription?: string;
    sections?: any[];
    keywords?: string[];
    humanizedScore?: number;
    score?: number;
    wordCount?: number;
  };
};

export default function SprintSection({ data }: { data: OverviewData; businessName?: string }) {
  const { blogDrafts, auditAreas, totalQueries, queryEvidence, queryModelEvidence, missingCount } = data;
  const [selectedCard, setSelectedCard] = useState<SprintCard | null>(null);

  const weakArea = [...auditAreas].sort((a, b) => a.score - b.score)[0];
  const topQuery = queryEvidence[0];
  const modelSummary = useMemo(() => {
    return queryModelEvidence.map((group) => ({
      ...group,
      uniqueMissing: Array.from(new Set(group.items.flatMap((item) => item.missing).map((v) => v.trim()).filter(Boolean))),
      uniqueFound: Array.from(new Set(group.items.flatMap((item) => item.found).map((v) => v.trim()).filter(Boolean))),
    }));
  }, [queryModelEvidence]);
  const totalUniqueMissing = modelSummary.reduce((sum, group) => sum + group.uniqueMissing.length, 0);
  const topModelGap = [...modelSummary].sort((a, b) => b.uniqueMissing.length - a.uniqueMissing.length)[0];

  const cards: SprintCard[] = [
    {
      kind: "blog",
      tag: "Publish",
      badge: blogDrafts[0] ? "Ready" : "Weekly",
      title: blogDrafts[0]?.title || "Generate blog article 1",
      desc: blogDrafts[0]?.excerpt || "Create the first weekly article from your saved voice and keywords.",
      note: blogDrafts[0] ? "Blog draft ready" : "Not generated yet",
      link: "/blogs",
      btn: blogDrafts[0] ? "Read blog" : "Go to Blogs",
      primary: true,
      blog: blogDrafts[0],
    },
    {
      kind: "blog",
      tag: "Publish",
      badge: blogDrafts[1] ? "Ready" : "Weekly",
      title: blogDrafts[1]?.title || "Generate blog article 2",
      desc: blogDrafts[1]?.excerpt || "Create the second weekly article for another search opportunity.",
      note: blogDrafts[1] ? "Blog draft ready" : "Not generated yet",
      link: "/blogs",
      btn: blogDrafts[1] ? "Read blog" : "Go to Blogs",
      primary: true,
      blog: blogDrafts[1],
    },
    {
      kind: "query",
      tag: "Answer gaps",
      badge: totalQueries > 0 ? "Important" : "Run",
      title: totalQueries > 0 ? "Improve the missing AI answers" : "Run AI query analysis",
      desc: totalQueries > 0
        ? topQuery?.query || `${missingCount} prompts need stronger evidence.`
        : "Check whether AI models mention this business in search-style prompts.",
      note: totalQueries > 0
        ? `${totalUniqueMissing || missingCount} missing signals across AI models`
        : "Not yet run",
      link: "/query",
      btn: totalQueries > 0 ? "View gaps" : "Open Query",
    },
    {
      kind: "audit",
      tag: "Add to website",
      badge: "Big win",
      title: weakArea ? `Fix: ${weakArea.label}` : "Review website scan",
      desc: weakArea
        ? `This area scored ${weakArea.score}/100. Improve it to strengthen AI visibility.`
        : "Open the analyser to review score balance, content, schema, and trust signals.",
      note: weakArea ? "Code and fixes ready" : "Open analyser",
      link: "/analyser",
      btn: "View Analyser",
    },
  ];

  const readyCount = [
    Boolean(blogDrafts[0]),
    Boolean(blogDrafts[1]),
    totalQueries > 0,
    Boolean(weakArea),
  ].filter(Boolean).length;
  const pct = Math.round((readyCount / cards.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mt-[26px] bg-[#efe9fb] border border-[#e2d8f5] rounded-[18px] p-6 md:p-[30px_32px]"
    >
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <div className="font-mono-spline text-[11px] tracking-[0.16em] uppercase text-[#5b4f86]">
            Your plan for this week
          </div>
          <h2 className="font-spectral text-[28px] font-semibold text-[#1b1733] leading-tight mt-1.5">
            Exactly what to do to lift your visibility this week
          </h2>
        </div>
        <div className="w-[230px] pt-0.5 shrink-0">
          <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#5b4f86]">
            Visibility sprint
          </div>
          <div className="text-[13px] text-[#4a4368] font-semibold mt-1.5">{readyCount} of 4 ready</div>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="flex-1 h-[7px] bg-[#ddd2f0] rounded-full overflow-hidden">
              <div className="h-full bg-[#2d2a6e] transition-all duration-500" style={{ width: `${pct || 15}%` }} />
            </div>
            <span className="num text-[12px] font-bold text-[#2d2a6e]">{pct || 15}%</span>
          </div>
        </div>
      </div>

      <div className="plan-cards grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 items-stretch mt-4">
        {cards.map((card, i) => {
          const opensModal = card.kind === "query" && totalQueries > 0;
          return (
          <div
            key={`${card.kind}-${i}`}
            role={opensModal ? "button" : undefined}
            tabIndex={opensModal ? 0 : undefined}
            onClick={() => {
              if (opensModal) setSelectedCard(card);
            }}
            onKeyDown={(event) => {
              if (opensModal && (event.key === "Enter" || event.key === " ")) setSelectedCard(card);
            }}
            className={`card lift bg-white border border-[#ece3d1] rounded-[14px] p-4 md:p-[18px] flex min-h-[250px] flex-col text-left shadow-[0_1px_2px_rgba(60,48,28,0.05)] ${
              opensModal ? "cursor-pointer" : ""
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 font-mono-spline text-[9px] tracking-wider uppercase text-[#1b1733]">
                {card.kind === "query" ? <SearchCheck className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                {card.tag}
              </span>
              <span className={`text-[9px] font-bold tracking-wider uppercase px-2 py-1 rounded-full whitespace-nowrap ${
                card.kind === "query" ? "text-[#9a6a12] bg-[#f7e7c4]" : "text-[#1e7d4f] bg-[#dcefe2]"
              }`}>
                {card.badge}
              </span>
            </div>

            <div className="font-spectral text-[15px] leading-snug text-[#1b1733] line-clamp-2">{card.title}</div>
            <div className="text-[12px] text-[#6f6757] mt-2 leading-relaxed line-clamp-4">{card.desc}</div>

            {card.kind === "query" && totalQueries > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[#fff8f6] border border-[#f0d4ce] px-2.5 py-2">
                  <div className="num text-[17px] font-semibold text-[#8f2f22]">{totalUniqueMissing || missingCount}</div>
                  <div className="text-[10.5px] text-[#8a8273]">missing</div>
                </div>
                <div className="rounded-lg bg-[#f6fbf8] border border-[#d0e4d6] px-2.5 py-2">
                  <div className="num text-[17px] font-semibold text-[#1e7d4f]">{topModelGap?.model || "AI"}</div>
                  <div className="text-[10.5px] text-[#8a8273]">top gap</div>
                </div>
              </div>
            )}

            <div className="num text-[11px] font-semibold text-[#1e7d4f] my-3">{card.note}</div>
            {opensModal ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedCard(card);
                }}
                className="mt-auto inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold py-2.5 px-3.5 rounded-[9px] text-center transition-colors bg-white border border-[#d8cfbd] text-[#23211b] hover:bg-[#f5f0e6]"
              >
                {card.btn}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <Link
                href={card.link}
                onClick={(event) => event.stopPropagation()}
                className={`mt-auto inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold py-2.5 px-3.5 rounded-[9px] text-center transition-colors ${
                  card.primary
                    ? "bg-[#1a5c44] text-white hover:bg-[#15463b]"
                    : "bg-white border border-[#d8cfbd] text-[#23211b] hover:bg-[#f5f0e6]"
                }`}
              >
                {card.btn}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )})}
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap mt-5">
        <p className="text-[13.5px] text-[#5f5780] max-w-[560px] leading-relaxed">
          Four focused actions from blogs, query evidence, and the website scan.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-1.5 shrink-0 text-[12.5px] font-semibold text-white bg-[#2d2a6e] px-4 py-2.5 rounded-lg hover:bg-[#231f57] transition-colors shadow-xs"
        >
          Talk to team
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {selectedCard?.kind === "query" && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-[#0f1c18]/55 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setSelectedCard(null);
          }}
        >
          <div className="w-full max-w-[980px] max-h-[86vh] overflow-hidden rounded-[18px] border border-[#ece3d1] bg-white shadow-[0_24px_60px_rgba(21,70,59,0.24)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#efe7d6] bg-[#fdfcf8] px-6 py-4">
              <div>
                <div className="font-mono-spline text-[10px] uppercase tracking-[0.16em] text-[#8a8273]">{selectedCard.tag}</div>
                <h3 className="mt-1 font-spectral text-[23px] font-semibold leading-tight text-[#15463b]">{selectedCard.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="rounded-lg p-1.5 text-[#8a8273] transition-colors hover:bg-[#f5f0e6] hover:text-[#23211b]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(86vh-96px)] overflow-y-auto">
              {modelSummary.length > 0 ? (
                <div className="divide-y divide-[#efe7d6]">
                  {modelSummary.map((group) => {
                    return (
                      <div key={group.model} className="px-6 py-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ece3d1] bg-white">
                              {MODEL_ICONS[group.model] ? (
                                <img src={MODEL_ICONS[group.model]} alt="" className="h-5 w-5 object-contain" />
                              ) : (
                                <span className="text-[12px] font-semibold text-[#15463b]">{group.model.slice(0, 2)}</span>
                              )}
                            </span>
                            <div className="font-spectral text-[18px] font-semibold text-[#15463b]">{group.model}</div>
                          </div>
                          <div className="flex items-center gap-2 text-[12px] font-semibold">
                            <span className="rounded-full border border-[#f0d4ce] px-2.5 py-1 text-[#8f2f22]">{group.uniqueMissing.length} missing</span>
                            <span className="rounded-full border border-[#d0e4d6] px-2.5 py-1 text-[#1e7d4f]">{group.uniqueFound.length} found</span>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                          <div className="overflow-hidden rounded-[12px] border border-[#ece3d1]">
                            <div className="grid grid-cols-[38px_minmax(0,1fr)] border-b border-[#ece3d1] bg-[#fdfcf8] text-[10px] font-semibold uppercase tracking-[0.12em]">
                              <div className="border-r border-[#ece3d1] px-2 py-2 text-[#8a8273]">SL</div>
                              <div className="px-3 py-2 text-[#8f2f22]">Missing</div>
                            </div>
                            <div className="max-h-[220px] overflow-y-auto">
                              {group.uniqueMissing.length > 0 ? (
                                group.uniqueMissing.map((text, index) => (
                                  <div key={`${group.model}-missing-${index}`} className="grid grid-cols-[38px_minmax(0,1fr)] border-b border-[#f1eadf] last:border-b-0 text-[12.5px] leading-relaxed">
                                    <div className="border-r border-[#f1eadf] px-2 py-2 font-mono-spline text-[10.5px] text-[#9b927f]">{index + 1}</div>
                                    <div className="px-3 py-2 text-[#8f2f22]">{text}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-4 text-[12.5px] text-[#8a8273]">No missing facts captured.</div>
                              )}
                            </div>
                          </div>

                          <div className="overflow-hidden rounded-[12px] border border-[#ece3d1]">
                            <div className="grid grid-cols-[38px_minmax(0,1fr)] border-b border-[#ece3d1] bg-[#fdfcf8] text-[10px] font-semibold uppercase tracking-[0.12em]">
                              <div className="border-r border-[#ece3d1] px-2 py-2 text-[#8a8273]">SL</div>
                              <div className="px-3 py-2 text-[#1e7d4f]">Found</div>
                            </div>
                            <div className="max-h-[220px] overflow-y-auto">
                              {group.uniqueFound.length > 0 ? (
                                group.uniqueFound.map((text, index) => (
                                  <div key={`${group.model}-found-${index}`} className="grid grid-cols-[38px_minmax(0,1fr)] border-b border-[#f1eadf] last:border-b-0 text-[12.5px] leading-relaxed">
                                    <div className="border-r border-[#f1eadf] px-2 py-2 font-mono-spline text-[10.5px] text-[#9b927f]">{index + 1}</div>
                                    <div className="px-3 py-2 text-[#1e7d4f]">{text}</div>
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-4 text-[12.5px] text-[#8a8273]">No found facts captured.</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="px-6 py-8 text-[13px] text-[#6f6757]">
                  Run Query to collect model-by-model missing evidence.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
