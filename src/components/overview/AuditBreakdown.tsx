"use client";

import Link from "next/link";
import { MOCK_AUDIT_AREAS } from "../../constants/mockData";
import { MessageSquare, BookOpen, FileText, Layout, Search, Wrench, Lightbulb, TrendingUp, Shield, ArrowRight } from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  MessageSquare, BookOpen, FileText, Layout, Search, Wrench,
};

const QUICK_WINS = [
  { icon: Lightbulb, color: "#d6a23a", bg: "#f7e7c4", text: "Add FAQ schema to your /services page to boost AI extractability." },
  { icon: TrendingUp, color: "#1e7d4f", bg: "#dcefe2", text: "You're 3 points from overtaking Castleford Group for the #1 spot." },
  { icon: Shield, color: "#5b4f86", bg: "#edeaf8", text: "ClaudeBot hasn't indexed your /about page — check crawler permissions." },
];

export default function AuditBreakdown() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr_0.92fr] gap-4 mt-4 mb-5">

      {/* ── Six Audit Areas Card ── */}
      <div className="bg-[#fdeef1] border border-[#f6d9e0] rounded-[14px] p-5 md:p-[22px_24px]">
        <div className="font-mono-spline text-[10px] tracking-[0.13em] uppercase text-[#a86d7e]">
          The full picture · six areas behind your score
        </div>
        <div className="flex flex-col gap-4 mt-[18px]">
          {MOCK_AUDIT_AREAS.map((item) => {
            const IconComponent = ICON_MAP[item.iconName] || FileText;
            return (
              <div key={item.id} className="flex items-center gap-3">
                <IconComponent className="w-4 h-4 text-[#7a7363] shrink-0" />
                <span className="w-[170px] text-[13.5px] text-[#23211b] truncate shrink-0">{item.label}</span>
                <div className="flex-1 h-[6px] bg-[#f6dde4] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.score}%`, backgroundColor: item.barColor }}
                  />
                </div>
                <span className="num text-[13px] font-bold text-[#23211b] w-12 text-right shrink-0">
                  {item.score}<span className="text-[#b3a98f] font-normal">/100</span>
                </span>
                <span
                  className="font-mono-spline text-[8.5px] font-medium tracking-wider px-1.5 py-1 rounded text-center w-[58px] shrink-0"
                  style={{ color: item.statusColor, backgroundColor: item.statusBg }}
                >
                  {item.statusText}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── The Plan Continues ── */}
      <div className="bg-[#f6f1e8] border border-[#e8e1d0] rounded-[14px] p-5 md:p-[22px_24px] flex flex-col justify-between">
        <div>
          <div className="font-mono-spline text-[10px] tracking-[0.13em] uppercase text-[#9a8a5e]">The plan continues</div>
          <div className="font-spectral text-[21px] font-semibold text-[#23211b] mt-1">Coming up</div>
          <div className="flex flex-col mt-2.5">
            {[
              { week: "NEXT WEEK", color: "#1e7d4f", task: "Build your services feature page" },
              { week: "WEEK 3",    color: "#9b927f", task: "Close the Gemini gap" },
              { week: "WEEK 4",    color: "#9b927f", task: "Strengthen your top review sources" },
              { week: "WEEK 5",    color: "#9b927f", task: "Press & directory citations" },
            ].map(({ week, color, task }, i, arr) => (
              <div key={week} className={`flex gap-4 items-baseline py-3 ${i < arr.length - 1 ? "border-b border-[#e8e1d0]" : ""}`}>
                <span className="font-mono-spline text-[10px] tracking-wider w-[66px] shrink-0" style={{ color }}>{week}</span>
                <span className="text-[14px] text-[#23211b]">{task}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 pt-3.5 border-t border-[#e8e1d0]">
          <Link href="/plan" className="ul inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#1e7d4f]">See the full plan <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
      </div>

      {/* ── Quick Wins & Insights (new card) ── */}
      <div className="bg-[#f4f6ff] border border-[#dde2f5] rounded-[14px] p-5 md:p-[22px_24px] flex flex-col justify-between">
        <div>
          <div className="font-mono-spline text-[10px] tracking-[0.13em] uppercase text-[#6470a8]">AI insights</div>
          <div className="font-spectral text-[21px] font-semibold text-[#23211b] mt-1">Quick wins</div>
          <div className="flex flex-col gap-4 mt-4">
            {QUICK_WINS.map(({ icon: Icon, color, bg, text }) => (
              <div key={text} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: bg }}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} />
                </div>
                <p className="text-[13px] text-[#3a352b] leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 pt-3.5 border-t border-[#dde2f5]">
          <Link href="/analyser" className="ul inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#6470a8]">View full analysis <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
      </div>

    </div>
  );
}
