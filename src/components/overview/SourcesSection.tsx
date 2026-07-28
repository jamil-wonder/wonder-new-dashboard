"use client";

import Link from "next/link";
import { Check, Plus, ArrowRight, Globe } from "lucide-react";
import { OverviewData } from "../../hooks/useOverviewData";

function domainInitials(domain: string) {
  return domain.replace(/^www\./, "").replace(/\.(com|co\.uk|org|net|io).*/, "").substring(0, 2).toUpperCase();
}

const KNOWN_SOURCES: Record<string, { label: string; bg: string; color: string; text: string }> = {
  "google":     { label: "Google", bg: "#e8f0fe", color: "#4285f4", text: "G" },
  "tripadvisor":{ label: "TripAdvisor", bg: "#00af87", color: "#fff", text: "T" },
  "trustpilot": { label: "Trustpilot", bg: "#00b67a", color: "#fff", text: "★" },
  "yelp":       { label: "Yelp", bg: "#d32323", color: "#fff", text: "Y" },
  "facebook":   { label: "Facebook", bg: "#1877f2", color: "#fff", text: "f" },
  "instagram":  { label: "Instagram", bg: "#e1306c", color: "#fff", text: "IG" },
};

function resolveSource(domain: string) {
  const lower = domain.toLowerCase();
  for (const [key, val] of Object.entries(KNOWN_SOURCES)) {
    if (lower.includes(key)) return val;
  }
  return { label: domain, bg: "#f0ece2", color: "#6f6757", text: domainInitials(domain) };
}

export default function SourcesSection({ data }: { data: OverviewData }) {
  const { citedSources, hasQueryData } = data;

  // Suggest likely missing sources if no data or to supplement
  const suggestedMissing = ["trustpilot", "yelp"].filter(s => !citedSources.some(c => c.includes(s)));

  return (
    <div className="bg-[#faf3e2] border border-[#efe3c8] rounded-[14px] p-5 md:p-[22px_24px] flex flex-col justify-between">
      <div>
        <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9a8a5e]">
          Sources snapshot
        </div>
        <div className="font-spectral text-[21px] font-semibold text-[#23211b] mt-1">
          Where AI finds answers
        </div>
        <p className="text-[12px] text-[#8a8273] mt-1 leading-snug">
          AI keeps citing these places like you — and you're on one of them.
        </p>

        {!hasQueryData && citedSources.length === 0 ? (
          <div className="mt-4 p-4 rounded-lg bg-[#f6efe0] text-center">
            <Globe className="w-5 h-5 text-[#b3a98f] mx-auto mb-1" />
            <p className="text-[12.5px] text-[#9a8a5e]">Run AI Queries to see which sources get cited alongside you.</p>
          </div>
        ) : (
          <>
            {citedSources.length > 0 && (
              <>
                <div className="font-mono-spline text-[9px] tracking-wider uppercase text-[#9a8a5e] mt-4">
                  You're cited alongside
                </div>
                <div className="flex flex-col gap-2.5 mt-2.5">
                  {citedSources.slice(0, 3).map((src, i) => {
                    const s = resolveSource(src);
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-[26px] h-[26px] rounded-md flex items-center justify-center font-bold text-[12px] shrink-0"
                          style={{ background: s.bg, color: s.color }}>
                          {s.text}
                        </div>
                        <span className="flex-1 text-[14px] text-[#23211b] truncate">{s.label}</span>
                        <Check className="w-4 h-4 text-[#1e7d4f]" />
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {suggestedMissing.length > 0 && (
              <>
                <div className="font-mono-spline text-[9px] tracking-wider uppercase text-[#9a8a5e] mt-4">
                  Not yet cited alongside
                </div>
                <div className="flex flex-col gap-2.5 mt-2.5">
                  {suggestedMissing.slice(0, 2).map((src, i) => {
                    const s = resolveSource(src);
                    return (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-[26px] h-[26px] rounded-md flex items-center justify-center font-bold text-[12px] shrink-0"
                          style={{ background: s.bg, color: s.color }}>
                          {s.text}
                        </div>
                        <span className="flex-1 text-[14px] text-[#23211b] truncate">{s.label}</span>
                        <Plus className="w-4 h-4 text-[#c2b69c]" />
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <div className="mt-4 pt-3.5 border-t border-[#efe3c8]">
        <Link href="/query" className="ul inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#1e7d4f]">
          View all sources <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
