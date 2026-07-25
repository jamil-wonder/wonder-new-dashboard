"use client";

import Link from "next/link";
import { ArrowUp, ArrowDown, Minus, ArrowRight } from "lucide-react";
import { MOCK_COMPETITORS } from "../../constants/mockData";

function ChangeIndicator({ change }: { change: string }) {
  if (change.includes("▲") || change === "▲") {
    return <ArrowUp className="w-3.5 h-3.5 text-[#1e7d4f]" />;
  }
  if (change.includes("▼") || change === "▼") {
    return <ArrowDown className="w-3.5 h-3.5 text-[#d9694a]" />;
  }
  return <Minus className="w-3.5 h-3.5 text-[#b3a98f]" />;
}

export default function MarketRankSection() {
  return (
    <div className="bg-[#faf3e2] border border-[#efe3c8] rounded-[14px] p-5 md:p-[22px_24px] flex flex-col justify-between">
      <div>
        <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9a8a5e]">
          Your position in the market
        </div>
        <div className="font-spectral text-[21px] font-semibold text-[#23211b] mt-1">
          Where you rank
        </div>

        <div className="flex flex-col mt-3.5 space-y-1">
          {MOCK_COMPETITORS.map((comp) => (
            <div
              key={comp.rank}
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                comp.isUser
                  ? "bg-white shadow-[0_1px_4px_rgba(60,48,28,0.08)] border border-[#ece3d1]"
                  : "hover:bg-[#f6eee0]"
              }`}
            >
              <span className={`num text-[12px] w-3 text-center shrink-0 ${comp.isUser ? "text-[#1a5c44] font-bold" : "text-[#9b927f]"}`}>
                {comp.rank}
              </span>
              <span className={`flex-1 text-[13.5px] ${comp.isUser ? "text-[#1a5c44] font-bold" : "text-[#23211b]"}`}>
                {comp.name}
                {comp.isUser && <span className="font-normal text-[#9b927f] text-[11px] ml-1.5">You</span>}
                {comp.change === "NEW" && (
                  <span className="font-mono-spline text-[8.5px] tracking-wider text-[#9a6a12] bg-[#f7e7c4] px-1.5 py-0.5 rounded ml-1.5 align-middle">
                    NEW
                  </span>
                )}
              </span>
              <div className="w-[48px] h-[5px] bg-[#ece0c4] rounded-full overflow-hidden shrink-0">
                <div
                  className={`h-full ${comp.isUser ? "bg-[#1e7d4f]" : "bg-[#c2b69c]"}`}
                  style={{ width: `${comp.score}%` }}
                />
              </div>
              {/* Lucide arrow indicator */}
              <div className="w-4 flex justify-center shrink-0">
                {comp.change !== "NEW" && <ChangeIndicator change={comp.change} />}
              </div>
              <span className={`num text-[15px] font-bold w-6 text-right shrink-0 ${comp.isUser ? "text-[#1a5c44]" : "text-[#23211b]"}`}>
                {comp.score}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-[#efe3c8]">
        <span className="text-[12.5px] text-[#8a8273]">3 points behind #1</span>
        <Link href="/analyser" className="ul inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#1e7d4f]">
          Compare all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
