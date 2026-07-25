"use client";

import Link from "next/link";
import { Check, Plus, Star, ArrowRight } from "lucide-react";

export default function SourcesSection() {
  return (
    <div className="bg-[#faf3e2] border border-[#efe3c8] rounded-[14px] p-5 md:p-[22px_24px] flex flex-col justify-between">
      <div>
        <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9a8a5e]">
          Sources snapshot
        </div>
        <div className="font-spectral text-[21px] font-semibold text-[#23211b] mt-1">
          Where AI finds answers
        </div>

        <div className="font-mono-spline text-[9px] tracking-wider uppercase text-[#9a8a5e] mt-4">
          You're cited by
        </div>
        <div className="flex flex-col gap-2.5 mt-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-[26px] h-[26px] rounded-md bg-white border border-[#e6dcc6] flex items-center justify-center font-bold text-[13px] text-[#4285f4] shrink-0">
              G
            </div>
            <span className="flex-1 text-[14px] text-[#23211b]">Google Business</span>
            <Check className="w-4 h-4 text-[#1e7d4f]" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-[26px] h-[26px] rounded-md bg-[#d6322e] flex items-center justify-center font-bold text-[12px] text-white shrink-0">
              B
            </div>
            <span className="flex-1 text-[14px] text-[#23211b]">Bristol247</span>
            <Check className="w-4 h-4 text-[#1e7d4f]" />
          </div>
        </div>

        <div className="font-mono-spline text-[9px] tracking-wider uppercase text-[#9a8a5e] mt-4">
          Not yet cited by
        </div>
        <div className="flex flex-col gap-2.5 mt-2.5 flex-1">
          <div className="flex items-center gap-2.5">
            <div className="w-[26px] h-[26px] rounded-md bg-white border border-[#e6dcc6] flex items-center justify-center text-[#00b67a] shrink-0">
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
            <span className="flex-1 text-[14px] text-[#23211b]">Trustpilot</span>
            <Plus className="w-4 h-4 text-[#c2b69c]" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-[26px] h-[26px] rounded-md bg-[#d32323] flex items-center justify-center font-bold text-[12px] text-white shrink-0">
              Y
            </div>
            <span className="flex-1 text-[14px] text-[#23211b]">Yelp</span>
            <Plus className="w-4 h-4 text-[#c2b69c]" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-[26px] h-[26px] rounded-md bg-[#1b1733] flex items-center justify-center font-bold text-[11px] text-white shrink-0">
              BP
            </div>
            <span className="flex-1 text-[14px] text-[#23211b]">The Bristol Post</span>
            <Plus className="w-4 h-4 text-[#c2b69c]" />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3.5 border-t border-[#efe3c8]">
        <Link href="/analyser" className="ul inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#1e7d4f]">
          View all sources <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
