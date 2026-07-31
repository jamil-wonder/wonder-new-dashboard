"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { OverviewData } from "../../hooks/useOverviewData";

const QUERY_CACHE_VERSION = "v3";

// Exact same as QueryPage extractDomain
function extractDomain(urlOrDomain: string): string {
  const raw = (urlOrDomain || "").trim().toLowerCase();
  if (!raw) return "";
  try {
    const host = new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname;
    return host.replace(/^www\./, "").replace(/[),.;:]+$/g, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].replace(/[),.;:]+$/g, "");
  }
}

// Exact same as QueryPage getCacheKey (preserves www. to match stored key)
function getCacheKey(url: string): string {
  const clean = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return `wonder_query_cache_${QUERY_CACHE_VERSION}_${clean}`;
}

function cleanBrandName(d: string): string {
  return d.split(".")[0].replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

// Same guard as QueryPage — reject IPs, version strings, no-TLD domains
function isValidDomain(d: string): boolean {
  if (!d || d.length < 4) return false;
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(d)) return false; // IPv4 e.g. 9.0.0.8
  if (/^[\d.]+$/.test(d)) return false;                 // pure numeric
  if (!d.includes(".")) return false;                   // no TLD
  if (d === "localhost") return false;
  if (d.includes("example.com")) return false;
  return true;
}

const BLOCKED = ["google", "wikipedia", "tripadvisor", "facebook", "instagram", "youtube", "reddit"];

interface Props {
  data: OverviewData;
  url: string;
  businessName: string;
  location: string;
  competitors: any[];
}

export default function MarketRankSection({ url, businessName, competitors }: Props) {
  const competitorList = useMemo(() => {
    if (typeof window === "undefined" || !url) return [];

    const cacheKey = getCacheKey(url);
    let qItems: any[] = [];
    try {
      const raw = localStorage.getItem(cacheKey) || sessionStorage.getItem(cacheKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      qItems = Array.isArray(parsed?.queries) ? parsed.queries : [];
    } catch {
      return [];
    }
    if (qItems.length === 0) return [];

    const targetHost = extractDomain(url);
    const totalPrompts = qItems.length || 20;

    // 1. User mention count — same as QueryPage
    let userMentionCount = 0;
    qItems.forEach((q: any) => { if (q.status === "Mentioned") userMentionCount++; });
    const userPctScore = Math.min(100, Math.round((userMentionCount / Math.max(1, totalPrompts)) * 100));
    const targetScore = userPctScore > 0 ? userPctScore : 45;

    // 2. Seed compMap from activeBusiness.competitors — SAME as QueryPage step 2
    const compMap = new Map<string, { domain: string; name: string; mentions: number; score: number }>();
    if (Array.isArray(competitors)) {
      competitors.forEach((c: any, idx: number) => {
        const rawDomain = typeof c === "string" ? c : c.domain || c.url || "";
        const d = extractDomain(rawDomain);
        if (d && d !== targetHost && isValidDomain(d)) {
          const rawScore = typeof c === "object" && typeof c.score === "number" ? c.score : 90 - (idx * 4);
          compMap.set(d, {
            domain: d,
            name: typeof c === "object" && c.name ? c.name : cleanBrandName(d),
            mentions: 0,
            score: Math.max(45, Math.min(98, rawScore)),
          });
        }
      });
    }

    // 3. Count query source mentions — SAME as QueryPage step 3
    qItems.forEach((q: any) => {
      (q.sources || []).forEach((src: string) => {
        const d = extractDomain(src);
        if (!d || d === targetHost || BLOCKED.some(b => d.includes(b))) return;
        const existing = compMap.get(d) || { domain: d, name: cleanBrandName(d), mentions: 0, score: 75 };
        existing.mentions += 1;
        compMap.set(d, existing);
      });
    });

    // 4. Build items — insertion order .slice(0,5) SAME as QueryPage
    const targetItem = {
      domain: targetHost,
      name: businessName || cleanBrandName(targetHost),
      favicon: `https://www.google.com/s2/favicons?domain=${targetHost}&sz=64`,
      score: targetScore,
      isUser: true,
    };

    const competitorItems = Array.from(compMap.values())
      .slice(0, 5)
      .map((c) => ({
        domain: c.domain,
        name: c.name,
        favicon: `https://www.google.com/s2/favicons?domain=${c.domain}&sz=64`,
        score: c.mentions > 0 ? Math.min(95, Math.max(50, c.score + c.mentions * 5)) : c.score,
        isUser: false,
      }));

    // 5. Sort by score descending and assign rank — SAME as QueryPage
    return [targetItem, ...competitorItems]
      .sort((a, b) => b.score - a.score)
      .map((item, idx) => ({ ...item, rank: idx + 1 }));
  }, [url, businessName, competitors]);

  const userEntry = competitorList.find(c => c.isUser);
  const leader = competitorList[0];
  const gapToLeader = leader && !leader.isUser && userEntry ? leader.score - userEntry.score : null;

  // Show top 4 + user if user is outside top 4
  const displayList = (() => {
    if (competitorList.length === 0) return [];
    const userIdx = competitorList.findIndex(c => c.isUser);
    if (userIdx < 5) return competitorList.slice(0, 5);
    return [...competitorList.slice(0, 4), competitorList[userIdx]];
  })();

  return (
    <div className="bg-[#faf3e2] border border-[#efe3c8] rounded-[14px] p-5 md:p-[22px_24px] flex flex-col">
      <div className="flex flex-col flex-1">
        <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9a8a5e]">
          Your position in the market
        </div>
        <div className="font-spectral text-[21px] font-semibold text-[#23211b] mt-1">
          Where you rank
        </div>

        {displayList.length === 0 ? (
          <div className="mt-4 p-4 rounded-lg bg-[#f6efe0] text-center">
            <p className="text-[12.5px] text-[#9a8a5e]">Run the Query AI audit to see competitor rankings.</p>
            <Link href="/query" className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1e7d4f]">
              Open Query <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col flex-1 justify-between mt-3.5">
            {displayList.map((comp) => (
              <div
                key={comp.domain}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors ${
                  comp.isUser
                    ? "bg-white shadow-[0_1px_4px_rgba(60,48,28,0.08)] border border-[#ece3d1]"
                    : "hover:bg-[#f6eee0]"
                }`}
              >
                <span className={`num text-[11.5px] w-5 text-center shrink-0 ${comp.isUser ? "text-[#1a5c44] font-bold" : "text-[#9b927f]"}`}>
                  {comp.rank}
                </span>
                <div className="w-6 h-6 rounded-md bg-white border border-[#efe7d6] flex items-center justify-center shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={comp.favicon}
                    alt={comp.name}
                    className="w-3.5 h-3.5 object-contain"
                    onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                  />
                </div>
                <span className={`flex-1 text-[13px] truncate ${comp.isUser ? "text-[#1a5c44] font-bold" : "text-[#23211b]"}`}>
                  {comp.name}
                  {comp.isUser && <span className="font-normal text-[#9b927f] text-[10.5px] ml-1.5">You</span>}
                </span>
                <div className="w-[40px] h-[5px] bg-[#ece0c4] rounded-full overflow-hidden shrink-0">
                  <div
                    className={`h-full rounded-full ${comp.isUser ? "bg-[#1e7d4f]" : "bg-[#c2b69c]"}`}
                    style={{ width: `${comp.score}%` }}
                  />
                </div>
                <span className={`num text-[14px] font-bold w-6 text-right shrink-0 ${comp.isUser ? "text-[#1a5c44]" : "text-[#23211b]"}`}>
                  {comp.score}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-[#efe3c8]">
        <span className="text-[12.5px] text-[#8a8273]">
          {gapToLeader !== null && gapToLeader > 0
            ? `${gapToLeader} pts behind #1 · ${leader?.name}`
            : userEntry?.rank === 1
            ? "🏆 You're leading the market"
            : ""}
        </span>
        <Link href="/query" className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#1e7d4f]">
          Compare <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
