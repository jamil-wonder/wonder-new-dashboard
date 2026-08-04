"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Building, CheckCircle2, Compass, MapPin, SearchCheck, Star } from "lucide-react";
import { OverviewData } from "../../hooks/useOverviewData";
import SourcesSidebar from "../query/SourcesSidebar";

function cleanDomain(domain: string) {
  return String(domain || "")
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim();
}

export default function CitationBand({ data }: { data: OverviewData }) {
  const { citedSources, hasQueryData, totalQueries } = data;
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const sources = citedSources.map(cleanDomain).filter(Boolean);
  const usedSources = new Set<string>();

  const bands = [
    {
      icon: Star,
      label: "Review sites",
      keywords: ["trustpilot", "tripadvisor", "reviews", "review", "yelp", "opentable", "squaremeal", "thefork"],
    },
    {
      icon: Compass,
      label: "Best-of guides",
      keywords: ["timeout", "infatuation", "eater", "cntraveller", "condenast", "telegraph", "standard", "secretldn", "squaremeal"],
    },
    {
      icon: MapPin,
      label: "Local directories",
      keywords: ["google", "bing", "yell", "yellowpages", "visit", "local", "near", "maps", "directory"],
    },
    {
      icon: Building,
      label: "Industry sources",
      keywords: ["association", "federation", "council", "guild", "michelin", "aa", "guide"],
    },
  ].map((band) => {
    const matched = sources.filter((source) => {
      const lower = source.toLowerCase();
      return band.keywords.some((keyword) => lower.includes(keyword));
    });
    matched.forEach((source) => usedSources.add(source));
    return { ...band, sources: matched.slice(0, 3) };
  });

  const unmatched = sources.filter((source) => !usedSources.has(source)).slice(0, 4);

  return (
    <div className="mt-4 bg-[#15463b] rounded-[16px] p-6 md:p-[26px_28px] text-[#eaf3ee]">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono-spline text-[10.5px] tracking-wider uppercase text-[#86b89f] leading-relaxed">
            Trusted sources AI uses
          </div>
          <div className="font-spectral text-[22px] font-semibold text-white mt-1">
            Where AI finds market evidence
          </div>
        </div>
        <button
          onClick={() => setIsSourcesOpen(true)}
          disabled={sources.length === 0}
          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#bfeade] whitespace-nowrap bg-transparent border-none p-0 cursor-pointer hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:no-underline"
        >
          Open sources <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {!hasQueryData && (
        <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex items-center gap-3">
            <SearchCheck className="w-5 h-5 text-[#a8d860] shrink-0" />
            <p className="text-[13px] text-[#d9eee7]">
              Run Query to see which websites AI cites for this business.
            </p>
          </div>
          <Link href="/query" className="shrink-0 rounded-lg bg-white text-[#15463b] px-3 py-2 text-[12px] font-semibold">
            Run Query
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
        {bands.map(({ icon: Icon, label, sources: bandSources }, i) => {
          const listed = bandSources.length > 0;
          return (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 min-h-[138px]">
              <div className="flex items-start justify-between gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${listed ? "bg-[#a8d860]/15 text-[#a8d860]" : "bg-white/10 text-[#9ac0b2]"}`}>
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                {listed ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#a8d860]/15 px-2 py-1 text-[10px] font-semibold text-[#a8d860]">
                    <CheckCircle2 className="h-3 w-3" /> Found
                  </span>
                ) : (
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] font-semibold text-white/55">
                    Missing
                  </span>
                )}
              </div>

              <div className="mt-3 text-[13.5px] font-semibold leading-snug text-[#eef5f2]">
                {label}
              </div>
              {listed ? (
                <div className="mt-2 flex flex-col gap-1.5">
                  {bandSources.map((source) => (
                    <span key={source} className="truncate text-[12px] text-[#bfeade]">
                      {source}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-[12px] leading-relaxed text-white/55">
                  No matching cited source yet.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {unmatched.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
          <span className="font-mono-spline text-[9.5px] uppercase tracking-[0.14em] text-[#86b89f]">
            Other cited domains
          </span>
          {unmatched.map((source) => (
            <span key={source} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-[#d9eee7]">
              {source}
            </span>
          ))}
        </div>
      )}

      <SourcesSidebar
        isOpen={isSourcesOpen}
        query={null}
        allSources={sources}
        allSourcesSubtitle={totalQueries ? `across ${totalQueries} quer${totalQueries === 1 ? "y" : "ies"} in this run` : undefined}
        onClose={() => setIsSourcesOpen(false)}
      />
    </div>
  );
}
