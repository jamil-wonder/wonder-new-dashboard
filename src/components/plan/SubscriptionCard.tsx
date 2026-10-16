"use client";

import { CheckCircle2, Clock } from "lucide-react";

export default function SubscriptionCard() {
  return (
    <div className="bg-[#15463b] rounded-[18px] p-6 md:p-[28px_32px] text-[#eaf3ee] shadow-sm mb-6">
      <div className="flex justify-between items-start flex-wrap gap-4 border-b border-white/15 pb-5 mb-6">
        <div>
          <span className="font-mono-spline text-[11px] tracking-[0.16em] uppercase text-[#a9cdb9]">
            Wonderscore Pro GEO Suite
          </span>
          <h1 className="font-spectral text-[30px] font-bold text-white leading-tight mt-1">
            Free during early access
          </h1>
          <p className="text-[14px] text-[#7fae97] mt-1">
            Paid plans aren&apos;t live yet - billing will open here once available. Nothing is
            being charged to your account.
          </p>
        </div>

        <div className="text-right">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#15463b] bg-[#e8c96a] px-3 py-1 rounded-full mt-1">
            <Clock className="w-3.5 h-3.5" />
            Billing coming soon
          </span>
        </div>
      </div>

      {/* Feature Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4.5 h-4.5 text-[#a8d860] shrink-0" />
          <span className="text-[13.5px]">3 businesses included</span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4.5 h-4.5 text-[#a8d860] shrink-0" />
          <span className="text-[13.5px]">20 AI questions tracked on 4 models</span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4.5 h-4.5 text-[#a8d860] shrink-0" />
          <span className="text-[13.5px]">2 weekly blog drafts, written on request</span>
        </div>
        <div className="flex items-center gap-2.5">
          <Clock className="w-4.5 h-4.5 text-[#e8c96a] shrink-0" />
          <span className="text-[13.5px]">Structured JSON-LD schema generator <em className="not-italic text-[#e8c96a]">- coming soon</em></span>
        </div>
        <div className="flex items-center gap-2.5">
          <Clock className="w-4.5 h-4.5 text-[#e8c96a] shrink-0" />
          <span className="text-[13.5px]">Robots.txt AI crawler config <em className="not-italic text-[#e8c96a]">- coming soon</em></span>
        </div>
        <div className="flex items-center gap-2.5">
          <Clock className="w-4.5 h-4.5 text-[#e8c96a] shrink-0" />
          <span className="text-[13.5px]">NAP consistency &amp; citation audit <em className="not-italic text-[#e8c96a]">- coming soon</em></span>
        </div>
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-4.5 h-4.5 text-[#a8d860] shrink-0" />
          <span className="text-[13.5px]">Priority Support &amp; Manual Team Help</span>
        </div>
      </div>
    </div>
  );
}
