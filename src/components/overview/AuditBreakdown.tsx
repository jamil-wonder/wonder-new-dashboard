"use client";

import React from "react";

import Link from "next/link";
import { MessageSquare, BookOpen, FileCode2, Building2, FileSearch, Cpu, FileText, Lightbulb, TrendingUp, Shield, ArrowRight } from "lucide-react";
import { OverviewData } from "../../hooks/useOverviewData";

const ICON_MAP: Record<string, React.ElementType> = {
  MessageSquare, BookOpen, FileCode2, Building2, FileSearch, Cpu, FileText,
};

function getBarColor(score: number) {
  if (score >= 80) return "#1e7d4f";
  if (score >= 60) return "#d6a23a";
  return "#d9694a";
}

function getStatus(score: number) {
  if (score >= 80) return { text: "Strong", color: "#1e7d4f", bg: "#dcefe2" };
  if (score >= 60) return { text: "OK", color: "#9a6a12", bg: "#f7e7c4" };
  return { text: "Needs work", color: "#b1442a", bg: "#f6dcd5" };
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
      <div className="bg-[#fdeef1] border border-[#f6d9e0] rounded-[14px] p-5 md:p-[22px_24px] flex flex-col">
        <div className="font-mono-spline text-[10px] tracking-[0.13em] uppercase text-[#a86d7e]">
          The full picture · six areas behind your score
        </div>

        {!hasAnalyserData || auditAreas.length === 0 ? (
          <div className="mt-4 p-4 rounded-lg bg-[#f9e9ec] text-center">
            <p className="text-[12.5px] text-[#a86d7e]">Run the Analyzer to see all six scored areas.</p>
            <Link href="/analyser" className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1e7d4f]">
              Open Analyzer <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col flex-1 justify-between mt-[18px]">
            {auditAreas.slice(0, 6).map((item) => {
              const IconComponent = ICON_MAP[item.iconName] || FileText;
              const barColor = item.barColor || getBarColor(item.score);
              const status = item.statusText ? { text: item.statusText, color: item.statusColor, bg: item.statusBg } : getStatus(item.score);
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <IconComponent className="w-4 h-4 text-[#7a7363] shrink-0" />
                  <span className="w-[170px] text-[13.5px] text-[#23211b] truncate shrink-0">{item.label}</span>
                  <div className="flex-1 h-[6px] bg-[#f6dde4] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.score}%`, backgroundColor: barColor }} />
                  </div>
                  <span className="num text-[13px] font-bold text-[#23211b] w-12 text-right shrink-0">
                    {item.score}<span className="text-[#b3a98f] font-normal">/100</span>
                  </span>
                  <span
                    className="font-mono-spline text-[8.5px] font-medium tracking-wider px-1.5 py-1 rounded text-center w-[58px] shrink-0"
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

      {/* ── The Plan Continues — derived from this business's actual
          weakest audit areas, not a fixed generic roadmap ── */}
      <div className="bg-[#f6f1e8] border border-[#e8e1d0] rounded-[14px] p-5 md:p-[22px_24px] flex flex-col justify-between">
        <div>
          <div className="font-mono-spline text-[10px] tracking-[0.13em] uppercase text-[#9a8a5e]">The plan continues</div>
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
                  <span className="num font-mono-spline text-[10px] tracking-wider w-[52px] shrink-0" style={{ color: i === 0 ? "#1e7d4f" : "#9b927f" }}>
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
          <div className="font-mono-spline text-[10px] tracking-[0.13em] uppercase text-[#6470a8]">AI insights</div>
          <div className="font-spectral text-[17px] font-semibold text-[#23211b] mt-0.5">Quick wins</div>
          <div className="flex flex-col gap-2.5 mt-3">
            {(quickWins.length > 0 ? quickWins : aiInsights.slice(0, 3).map(t => ({ text: t, type: "boost" as const }))).slice(0, 3).map(({ text, type }, i) => {
              const Icon = QUICK_WIN_ICONS[i % QUICK_WIN_ICONS.length];
              const { color, bg } = QUICK_WIN_COLORS[type === "warn" ? 2 : type === "info" ? 1 : 0] || QUICK_WIN_COLORS[i % QUICK_WIN_COLORS.length];
              // Truncate long insight text to 90 chars max
              const truncated = typeof text === "string" && text.length > 90 ? text.slice(0, 87).trimEnd() + "…" : text;
              return (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5" style={{ background: bg }}>
                    <Icon className="w-3 h-3" style={{ color }} />
                  </div>
                  <p className="text-[12px] text-[#3a352b] leading-snug">{truncated}</p>
                </div>
              );
            })}
            {quickWins.length === 0 && aiInsights.length === 0 && (
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
