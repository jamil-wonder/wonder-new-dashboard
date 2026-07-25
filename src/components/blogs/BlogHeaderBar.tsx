"use client";

import { Lock } from "lucide-react";

export default function BlogHeaderBar() {
  return (
    <div className="bg-white border border-[#ece3d1] rounded-2xl p-4.5 px-6 flex items-center justify-between mb-5.5 shadow-[0_1px_2px_rgba(60,48,28,0.04)] flex-wrap gap-3">
      <span className="font-spectral text-[18px] font-bold text-[#15463b]">
        Weekly Blog Suggestions
      </span>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-[#fdfcf8] border border-[#d8cfbd] px-3 py-1.5 rounded-lg cursor-pointer">
          <div className="w-5 h-5 rounded-full bg-[#15463b] text-white flex items-center justify-center font-spectral text-[11px]">
            M
          </div>
          <span className="text-[13px] font-semibold text-[#3a352b]">Meridian &amp; Co.</span>
        </div>
      </div>
    </div>
  );
}
