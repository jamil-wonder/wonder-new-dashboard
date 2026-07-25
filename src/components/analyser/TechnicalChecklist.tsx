"use client";

import { Check, X } from "lucide-react";
import { MOCK_COMPETITORS } from "../../constants/mockData";

export default function TechnicalChecklist() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-4.5">
      
      {/* Competitor Score Comparison */}
      <div className="bg-[#faf3e2] border border-[#efe3c8] rounded-[14px] p-5 md:p-[20px_24px]">
        <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9a8a5e] mb-3.5">
          Competitor Score Comparison
        </div>
        <div className="flex flex-col gap-2.5">
          {MOCK_COMPETITORS.slice(0, 4).map((comp) => (
            <div
              key={comp.rank}
              className={`flex items-center gap-2.5 p-1.5 rounded-lg ${
                comp.isUser ? "bg-[#fff6df] px-2" : ""
              }`}
            >
              <span className={`text-[11px] font-semibold w-3 ${comp.isUser ? "text-[#1a5c44] font-bold" : "text-[#9b927f]"}`}>
                {comp.rank}
              </span>
              <span className={`flex-1 text-[13px] ${comp.isUser ? "text-[#1a5c44] font-bold" : "text-[#23211b]"}`}>
                {comp.name} {comp.isUser && <span className="font-normal text-[#9b927f] text-[10px]">You</span>}
              </span>
              <div className="w-[88px] h-[6px] bg-[#ece0c4] rounded-full overflow-hidden shrink-0">
                <div
                  className={`h-full ${comp.isUser ? "bg-[#1e7d4f]" : "bg-[#c2b69c]"}`}
                  style={{ width: `${comp.score}%` }}
                />
              </div>
              <span className={`num text-[14px] font-bold w-5 text-right ${comp.isUser ? "text-[#1a5c44]" : "text-[#23211b]"}`}>
                {comp.score}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Readiness Checklist */}
      <div className="bg-white border border-[#ece3d1] rounded-[14px] p-5 md:p-[20px_24px]">
        <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f] mb-3.5">
          Technical Readiness Checklist
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] text-[#23211b]">Robots.txt · GPTBot permitted</span>
            <Check className="w-4 h-4 text-[#1e7d4f]" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] text-[#23211b]">Sitemap.xml indexed</span>
            <Check className="w-4 h-4 text-[#1e7d4f]" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] text-[#23211b]">LocalBusiness JSON-LD schema</span>
            <X className="w-4 h-4 text-[#d9694a]" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] text-[#23211b]">NAP consistency verified</span>
            <Check className="w-4 h-4 text-[#1e7d4f]" />
          </div>
        </div>
      </div>

    </div>
  );
}
