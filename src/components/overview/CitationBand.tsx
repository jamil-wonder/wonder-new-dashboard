"use client";

import Link from "next/link";
import { Quote, Star, Building, MapPin, ArrowRight } from "lucide-react";
import { OverviewData } from "../../hooks/useOverviewData";

export default function CitationBand({ data }: { data: OverviewData }) {
  const { citedSources } = data;

  const isCited = (keywords: string[]) =>
    keywords.some(k => citedSources.some(s => s.toLowerCase().includes(k)));

  const bands = [
    { icon: Quote,    label: "Directories & best-of guides",    keywords: ["google", "bing", "yell", "yellowpages", "yelp", "bestof"] },
    { icon: Star,     label: "Trustpilot & major review sites", keywords: ["trustpilot", "tripadvisor", "google", "reviews"] },
    { icon: Building, label: "Industry association directories", keywords: ["association", "federation", "council", "guild"] },
    { icon: MapPin,   label: "Local & niche directories",        keywords: ["local", "niche", "chamber", "explore"] },
  ];

  return (
    <div className="mt-4 bg-[#15463b] rounded-[16px] p-6 md:p-[26px_28px] text-[#eaf3ee]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="font-mono-spline text-[10.5px] tracking-wider uppercase text-[#86b89f] max-w-[640px] leading-relaxed">
          AI keeps citing these places like you — and you're on one of them.
        </div>
        <Link href="/query" className="ul inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#bfeade] whitespace-nowrap">
          Open sources <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        {bands.map(({ icon: Icon, label, keywords }, i) => {
          const listed = isCited(keywords);
          return (
            <div key={i} className="bg-white/5 rounded-xl p-4">
              <div className={`mb-3 ${listed ? "text-[#a8d860]" : "text-[#7fae97]"}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-[13.5px] leading-snug text-[#eef5f2] min-h-[36px]">{label}</div>
              {listed ? (
                <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#a8d860] bg-[#a8d860]/15 px-2.5 py-1 rounded-full">
                  ✓ You're cited
                </div>
              ) : (
                <div className="mt-3 inline-block text-[11px] font-semibold text-white/60 bg-white/5 px-2.5 py-1 rounded-full">
                  Not yet
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
