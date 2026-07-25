"use client";

import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export default function SubscriptionCard() {
  return (
    <div className="bg-[#15463b] rounded-[18px] p-6 md:p-[28px_32px] text-[#eaf3ee] shadow-sm mb-6">
      <div className="flex justify-between items-start flex-wrap gap-4 border-b border-white/15 pb-5 mb-6">
        <div>
          <span className="font-mono-spline text-[10px] tracking-[0.16em] uppercase text-[#86b89f]">
            Current Subscription
          </span>
          <h1 className="font-spectral text-[30px] font-bold text-white leading-tight mt-1">
            Wonderscore Pro GEO Suite
          </h1>
          <p className="text-[14px] text-[#7fae97] mt-1">
            Complete Generative Engine Optimization for local business visibility.
          </p>
        </div>

        <div className="text-right">
          <div className="flex items-baseline gap-1">
            <span className="num font-spectral text-[36px] font-bold text-white">£99</span>
            <span className="text-[14px] text-[#7fae97]">/month</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15463b] bg-[#a8d860] px-3 py-1 rounded-full mt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Active Subscription
          </span>
        </div>
      </div>

      {/* Feature Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4.5 h-4.5 text-[#a8d860] shrink-0" />
          <span className="text-[13.5px]">20 Real-time AI Query Scans</span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4.5 h-4.5 text-[#a8d860] shrink-0" />
          <span className="text-[13.5px]">2 Weekly Humanized Blog Drafts</span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4.5 h-4.5 text-[#a8d860] shrink-0" />
          <span className="text-[13.5px]">Structured JSON-LD Schema Generator</span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4.5 h-4.5 text-[#a8d860] shrink-0" />
          <span className="text-[13.5px]">Robots.txt AI Crawlers Config</span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4.5 h-4.5 text-[#a8d860] shrink-0" />
          <span className="text-[13.5px]">NAP Consistency &amp; Citation Audit</span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4.5 h-4.5 text-[#a8d860] shrink-0" />
          <span className="text-[13.5px]">Priority Support &amp; Manual Team Help</span>
        </div>
      </div>
    </div>
  );
}
