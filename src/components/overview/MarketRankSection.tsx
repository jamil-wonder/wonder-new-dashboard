"use client";

import Link from "next/link";
import { ArrowUp, ArrowDown, Minus, ArrowRight } from "lucide-react";
import { OverviewData } from "../../hooks/useOverviewData";

function ChangeIndicator({ change }: { change: string }) {
  if (change.includes("▲") || change === "up") return <ArrowUp className="w-3.5 h-3.5 text-[#1e7d4f]" />;
  if (change.includes("▼") || change === "down") return <ArrowDown className="w-3.5 h-3.5 text-[#d9694a]" />;
  return <Minus className="w-3.5 h-3.5 text-[#b3a98f]" />;
}

export default function MarketRankSection({ data }: { data: OverviewData }) {
  const { competitors, score, userRank, nearestAboveName, nearestAboveGap, hasAnalyserData } = data;

  const isEmpty = !hasAnalyserData || competitors.length === 0;

  // Gap to leader
  const leader = competitors[0];
  const gapToLeader = leader && !leader.isUser ? leader.score - score : null;

  return (
    <div className="bg-[#faf3e2] border border-[#efe3c8] rounded-[14px] p-5 md:p-[22px_24px] flex flex-col justify-between">
      <div>
        <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9a8a5e]">
          Your position in the market
        </div>
        <div className="font-spectral text-[21px] font-semibold text-[#23211b] mt-1">
          Where you rank
        </div>

        {isEmpty ? (
          <div className="mt-4 p-4 rounded-lg bg-[#f6efe0] text-center">
            <p className="text-[12.5px] text-[#9a8a5e]">Run the Analyser to see competitor rankings.</p>
            <Link href="/analyser" className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1e7d4f]">
              Open Analyser <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col mt-3.5 space-y-1">
            {competitors.slice(0, 5).map((comp, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                  comp.isUser
                    ? "bg-white shadow-[0_1px_4px_rgba(60,48,28,0.08)] border border-[#ece3d1]"
                    : "hover:bg-[#f6eee0]"
                }`}
              >
                <span className={`num text-[12px] w-3 text-center shrink-0 ${comp.isUser ? "text-[#1a5c44] font-bold" : "text-[#9b927f]"}`}>
                  {i + 1}
                </span>
                <span className={`flex-1 text-[13.5px] truncate ${comp.isUser ? "text-[#1a5c44] font-bold" : "text-[#23211b]"}`}>
                  {comp.name}
                  {comp.isUser && <span className="font-normal text-[#9b927f] text-[11px] ml-1.5">You</span>}
                </span>
                <div className="w-[48px] h-[5px] bg-[#ece0c4] rounded-full overflow-hidden shrink-0">
                  <div
                    className={`h-full ${comp.isUser ? "bg-[#1e7d4f]" : "bg-[#c2b69c]"}`}
                    style={{ width: `${comp.score}%` }}
                  />
                </div>
                <div className="w-4 flex justify-center shrink-0">
                  <ChangeIndicator change={comp.change} />
                </div>
                <span className={`num text-[15px] font-bold w-6 text-right shrink-0 ${comp.isUser ? "text-[#1a5c44]" : "text-[#23211b]"}`}>
                  {comp.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-[#efe3c8]">
        <span className="text-[12.5px] text-[#8a8273]">
          {gapToLeader !== null && gapToLeader > 0
            ? `${gapToLeader} points behind #1`
            : score > 0
            ? "You're leading the market"
            : "Run analyser to compare"}
        </span>
        <Link href="/analyser" className="ul inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#1e7d4f]">
          Compare all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
