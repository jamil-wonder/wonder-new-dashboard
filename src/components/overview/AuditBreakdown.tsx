"use client";

import React from "react";

import Link from "next/link";
import { MessageSquare, BookOpen, FileCode2, Building2, FileSearch, Cpu, FileText, Lightbulb, TrendingUp, Shield, ArrowRight } from "lucide-react";
import { OverviewData } from "../../hooks/useOverviewData";
import EmptyState from "../ui/EmptyState";
import { areaBadge } from "../../lib/areaBadge";

const ICON_MAP: Record<string, React.ElementType> = {
  MessageSquare, BookOpen, FileCode2, Building2, FileSearch, Cpu, FileText,
};

// C1: the same Good / Fair / Needs work thresholds as the Analyzer (derived from the score)
function getBarColor(score: number) {
  return areaBadge(score).bar;
}

function getStatus(score: number) {
  const b = areaBadge(score);
  return { text: b.label, color: b.color, bg: b.bg };
}

const QUICK_WIN_ICONS = [Lightbulb, TrendingUp, Shield];
const QUICK_WIN_COLORS = [
  { color: "#d6a23a", bg: "#f7e7c4" },
  { color: "#1e7d4f", bg: "#dcefe2" },
  { color: "#5b4f86", bg: "#edeaf8" },
];

export default function AuditBreakdown({ data }: { data: OverviewData }) {
  const { auditAreas, quickWins, aiInsights, hasAnalyserData } = data;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_0.92fr] gap-4 mt-4 mb-5">

      {/* ── Six Audit Areas Card ── */}
      <div className="bg-[#fdeef1] border border-[#f6d9e0] rounded-[14px] p-3 sm:p-5 md:p-[22px_24px] flex flex-col">
        <div className="font-mono-spline text-[11px] tracking-[0.13em] uppercase text-[#a86d7e]">
          The full picture · six areas behind your score
        </div>

        {!hasAnalyserData || auditAreas.length === 0 ? (
          <EmptyState message="No website scan yet - run the Analyzer to see all six scored areas." href="/analyser" actionLabel="Open Analyzer" />
        ) : (
          <div className="flex flex-col flex-1 justify-between mt-[18px]">
            {auditAreas.slice(0, 6).map((item) => {
              const IconComponent = ICON_MAP[item.iconName] || FileText;
              const barColor = getBarColor(item.score);
              const status = getStatus(item.score);
              return (
                <div key={item.id} className="flex items-center gap-1.5 sm:gap-3">
                  <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#7a7363] shrink-0" />
                  <span className="w-[92px] sm:w-[170px] text-[11px] sm:text-[13.5px] text-[#23211b] truncate shrink-0">{item.label}</span>
                  <div className="flex-1 h-[6px] bg-[#f6dde4] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.score}%`, backgroundColor: barColor }} />
                  </div>
                  <span className="num text-[11px] sm:text-[13px] font-bold text-[#23211b] w-9 sm:w-12 text-right shrink-0">
                    {item.score}<span className="text-[#b3a98f] font-normal">/100</span>
                  </span>
                  <span
                    className="font-mono-spline text-[7.5px] sm:text-[11px] font-medium tracking-wider px-1 sm:px-1.5 py-1 rounded text-center w-[42px] sm:w-[58px] shrink-0"
                    style={{ color: status.color, backgroundColor: status.bg }}
                  >
                    {status.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── The Plan Continues - derived from this business's actual
          weakest audit areas, not a fixed generic roadmap ── */}
      <div className="bg-[#f6f1e8] border border-[#e8e1d0] rounded-[14px] p-5 md:p-[22px_24px] flex flex-col justify-between">
        <div>
          <div className="font-mono-spline text-[11px] tracking-[0.13em] uppercase text-[#9a8a5e]">The plan continues</div>
          <div className="font-spectral text-[21px] font-semibold text-[#23211b] mt-1">Coming up</div>
          {!hasAnalyserData || auditAreas.length === 0 ? (
            <div className="mt-4 p-4 rounded-lg bg-[#f2ebdb] text-center">
              <p className="text-[12.5px] text-[#9a8a5e]">Run the Analyzer to build your improvement plan.</p>
              <Link href="/analyser" className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1e7d4f]">
                Open Analyzer <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col mt-2.5">
              {[...auditAreas].sort((a, b) => a.score - b.score).slice(0, 4).map((area, i, arr) => (
                <div key={area.id} className={`flex gap-4 items-baseline py-3 ${i < arr.length - 1 ? "border-b border-[#e8e1d0]" : ""}`}>
                  <span className="num font-mono-spline text-[11px] tracking-wider w-[52px] shrink-0" style={{ color: i === 0 ? "#1e7d4f" : "#9b927f" }}>
                    {area.score}/100
                  </span>
                  <span className="text-[14px] text-[#23211b]">Improve: {area.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mt-2 pt-3.5 border-t border-[#e8e1d0]">
          <Link href="/plan" className="ul inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#1e7d4f]">
            See the full plan <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* ── Quick Wins & AI Insights ── */}
      <div className="bg-[#f4f6ff] border border-[#dde2f5] rounded-[14px] p-4 md:p-5 flex flex-col justify-between">
        <div>
          <div className="font-mono-spline text-[11px] tracking-[0.13em] uppercase text-[#6470a8]">AI insights</div>
          <div className="font-spectral text-[17px] font-semibold text-[#23211b] mt-0.5">Quick wins</div>
          <div className="flex flex-col gap-2.5 mt-3">
            {quickWins.slice(0, 3).map(({ text, type, href }, i) => {
              const Icon = QUICK_WIN_ICONS[i % QUICK_WIN_ICONS.length];
              const { color, bg } = QUICK_WIN_COLORS[type === "warn" ? 2 : type === "info" ? 1 : 0] || QUICK_WIN_COLORS[i % QUICK_WIN_COLORS.length];
              return (
                <Link key={i} href={href || "/plan"} className="group flex items-start gap-2.5 rounded-lg -mx-1.5 px-1.5 py-1 transition-colors hover:bg-white/70">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: bg }}>
                    <Icon className="w-3 h-3" style={{ color }} />
                  </div>
                  <p className="flex-1 text-[12px] text-[#3a352b] leading-snug">{text}</p>
                  <ArrowRight className="mt-1 h-3 w-3 shrink-0 text-[#6470a8] opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              );
            })}
            {quickWins.length === 0 && (
              <p className="text-[11.5px] text-[#8a8273]">Run the Analyzer to generate personalised quick wins.</p>
            )}
          </div>
        </div>
        <div className="mt-2 pt-3 border-t border-[#dde2f5]">
          <Link href="/analyser" className="ul inline-flex items-center gap-1 text-[12px] font-semibold text-[#6470a8]">
            View full analysis <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

    </div>
  );
}
