"use client";

import Link from "next/link";
import { Quote, Star, Building, MapPin, ArrowRight } from "lucide-react";

export default function CitationBand() {
  return (
    <div className="mt-4.5 bg-[#15463b] rounded-[16px] p-6 md:p-[26px_28px] text-[#eaf3ee]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="font-mono-spline text-[10.5px] tracking-wider uppercase text-[#86b89f] max-w-[640px] leading-relaxed">
          AI keeps citing these places like you — and you're on one of them.
        </div>
        <Link href="/analyser" className="ul inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#bfeade] whitespace-nowrap">
          Open sources <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        
        {/* Card 1 */}
        <div className="bg-white/5 rounded-xl p-4">
          <div className="text-[#a8d860] mb-3">
            <Quote className="w-5.5 h-5.5 fill-current" />
          </div>
          <div className="text-[13.5px] leading-snug text-[#eef5f2] min-h-[36px]">
            "Best providers in Bristol" guides
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#a8d860] bg-[#a8d860]/15 px-2.5 py-1 rounded-full">
            ✓ You're listed
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white/5 rounded-xl p-4">
          <div className="text-[#7fae97] mb-3">
            <Star className="w-5.5 h-5.5 fill-current" />
          </div>
          <div className="text-[13.5px] leading-snug text-[#eef5f2] min-h-[36px]">
            Trustpilot &amp; major review sites
          </div>
          <div className="mt-3 inline-block text-[11px] font-semibold text-white/60 bg-white/5 px-2.5 py-1 rounded-full">
            Not yet
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white/5 rounded-xl p-4">
          <div className="text-[#7fae97] mb-3">
            <Building className="w-5.5 h-5.5" />
          </div>
          <div className="text-[13.5px] leading-snug text-[#eef5f2] min-h-[36px]">
            Industry association directories
          </div>
          <div className="mt-3 inline-block text-[11px] font-semibold text-white/60 bg-white/5 px-2.5 py-1 rounded-full">
            Not yet
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white/5 rounded-xl p-4">
          <div className="text-[#7fae97] mb-3">
            <MapPin className="w-5.5 h-5.5" />
          </div>
          <div className="text-[13.5px] leading-snug text-[#eef5f2] min-h-[36px]">
            Local &amp; niche directories
          </div>
          <div className="mt-3 inline-block text-[11px] font-semibold text-white/60 bg-white/5 px-2.5 py-1 rounded-full">
            Not yet
          </div>
        </div>

      </div>
    </div>
  );
}
