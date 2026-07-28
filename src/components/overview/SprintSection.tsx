"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { OverviewData } from "../../hooks/useOverviewData";

export default function SprintSection({ data, businessName }: { data: OverviewData; businessName?: string }) {
  const { blogDrafts, auditAreas, missingCount, totalQueries, quickWins } = data;

  // Derive action cards from live data
  const cards: { tag: string; tagColor: string; tagBg: string; title: string; desc: string; note: string; link: string; btn: string; btnStyle: "primary" | "outline" }[] = [];

  // Blog cards from live weekly blogs
  if (blogDrafts.length > 0) {
    blogDrafts.slice(0, 2).forEach((draft, i) => {
      cards.push({
        tag: "Publish",
        tagColor: "#1e7d4f",
        tagBg: "#dcefe2",
        title: `"${draft.title}"`,
        desc: draft.excerpt || "AI-written article ready for your review and publishing.",
        note: "~ Ready to publish",
        link: "/blogs",
        btn: "Review & publish",
        btnStyle: "primary",
      });
    });
  } else {
    cards.push({
      tag: "Publish",
      tagColor: "#1e7d4f",
      tagBg: "#dcefe2",
      title: "Generate this week's AI blog articles",
      desc: "2 SEO-optimised articles written around your brand voice and top keywords.",
      note: "~ Weekly generation available",
      link: "/blogs",
      btn: "Go to Blogs",
      btnStyle: "primary",
    });
  }

  // Query/answer cards if there are missing mentions
  if (totalQueries > 0 && missingCount > 0) {
    cards.push({
      tag: "Answer questions",
      tagColor: "#9a6a12",
      tagBg: "#f7e7c4",
      title: `You're missing from ${missingCount} AI queries`,
      desc: "These prompts return answers that don't include you yet. Review and improve.",
      note: "~ Requires your attention",
      link: "/query",
      btn: "Review queries",
      btnStyle: "outline",
    });
  } else if (totalQueries === 0) {
    cards.push({
      tag: "Run analysis",
      tagColor: "#9a6a12",
      tagBg: "#f7e7c4",
      title: "Run AI query analysis to see where you're mentioned",
      desc: "Test 20 branded, non-branded, and local SEO prompts across ChatGPT, Claude, Perplexity & Gemini.",
      note: "~ Not yet run",
      link: "/query",
      btn: "Open Queries",
      btnStyle: "outline",
    });
  }

  // Audit / schema fix card if low-scoring area found
  const weakArea = [...auditAreas].sort((a, b) => a.score - b.score)[0];
  if (weakArea && weakArea.score < 70) {
    cards.push({
      tag: "Add to website",
      tagColor: "#1e7d4f",
      tagBg: "#dcefe2",
      title: `Fix: ${weakArea.label}`,
      desc: `This area scored ${weakArea.score}/100. Improving it will lift your Wonderscore and AI visibility.`,
      note: "~ Code ready to copy",
      link: "/analyser",
      btn: "View Analyser",
      btnStyle: "outline",
    });
  }

  // We-do-it card always last
  cards.push({
    tag: "We'll handle it",
    tagColor: "#b1442a",
    tagBg: "#f6dcd5",
    title: "Get listed on the sources AI trusts",
    desc: "We'll submit you to high-value directories and review sites AI models cite most.",
    note: "~ We'll do it for you",
    link: "#",
    btn: "Ask our team",
    btnStyle: "outline",
  });

  const completed = cards.filter(c => c.btn === "Review & publish" && blogDrafts.length > 0).length;
  const pct = Math.round((completed / Math.max(cards.length, 1)) * 100);

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
          <div className="text-[13px] text-[#4a4368] font-semibold mt-1.5">{completed} of {cards.length} ready</div>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="flex-1 h-[7px] bg-[#ddd2f0] rounded-full overflow-hidden">
              <div className="h-full bg-[#2d2a6e] transition-all duration-500" style={{ width: `${pct || 15}%` }} />
            </div>
            <span className="num text-[12px] font-bold text-[#2d2a6e]">{pct || 15}%</span>
          </div>
        </div>
      </div>

      <p className="text-[14px] text-[#5f5780] my-4 md:mb-5 max-w-[760px] leading-relaxed">
        We've picked the actions with the biggest impact based on your market, and prepared everything for you — your content, code and answers are ready.
      </p>

      {/* Action Cards */}
      <div className="plan-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-stretch">
        {cards.slice(0, 5).map((card, i) => (
          <div key={i} className="card lift bg-white border border-[#ece3d1] rounded-[14px] p-4 md:p-[18px] flex flex-col cursor-pointer shadow-[0_1px_2px_rgba(60,48,28,0.05)]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="font-mono-spline text-[9px] tracking-wider uppercase text-[#1b1733]">{card.tag}</span>
              <span className="text-[9px] font-bold tracking-wider uppercase px-2 py-1 rounded-full whitespace-nowrap"
                style={{ color: card.tagColor, backgroundColor: card.tagBg }}>{card.tag === "We'll handle it" ? "We do this" : card.tagColor === "#1e7d4f" ? "Big win" : "Worth doing"}</span>
            </div>
            <div className="font-spectral text-[15px] leading-snug text-[#1b1733] flex-1 line-clamp-3">{card.title}</div>
            <div className="text-[12px] text-[#6f6757] mt-2 leading-relaxed">{card.desc}</div>
            <div className="num text-[11px] font-semibold text-[#1e7d4f] my-3">{card.note}</div>
            {card.link !== "#" ? (
              <Link href={card.link} className={`text-[12.5px] font-semibold py-2.5 px-3.5 rounded-[9px] text-center transition-colors ${card.btnStyle === "primary" ? "bg-[#1a5c44] text-white hover:bg-[#15463b]" : "bg-white border border-[#d8cfbd] text-[#23211b] hover:bg-[#f5f0e6]"}`}>
                {card.btn}
              </Link>
            ) : (
              <button className="ob bg-white border border-[#ddccb0] text-[#8a6a3a] text-[12.5px] font-semibold py-2.5 px-3.5 rounded-[9px] text-center">
                {card.btn}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4 mt-5 pt-5 border-t border-[#e2d8f5] flex-wrap">
        <div className="text-[14px] text-[#5f5780] leading-relaxed">
          <span className="text-[#1b1733] font-semibold">Don't want to do it yourself?</span>{" "}
          Our team can implement any of these for you — just say the word.
        </div>
        <button className="pb inline-flex items-center gap-2 bg-[#1a5c44] text-white text-[13px] font-semibold py-2.5 px-5 rounded-xl whitespace-nowrap shrink-0 hover:bg-[#15463b] transition-colors">
          Talk to our team <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
