"use client";

import SiteIcon from "../ui/SiteIcon";
import EmptyState from "../ui/EmptyState";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CompetitorRankRow } from "../../lib/competitorRanking";

interface Props {
  rows: CompetitorRankRow[];
}

// Purely a display of BusinessContext.liveDeepCompetitors - the exact same
// value Query reads, so this can never disagree with what Query just
// showed. No fetch, no loading state, no AI cost here; empty until a Query
// run has actually completed this session.
export default function MarketRankSection({ rows }: Props) {
  const userEntry = rows.find((c) => c.isUser);
  const leader = rows[0];
  const gapToLeader = leader && !leader.isUser && userEntry ? leader.score - userEntry.score : null;

  return (
    <div className="bg-[#faf3e2] border border-[#efe3c8] rounded-[14px] p-5 md:p-[22px_24px] flex flex-col">
      <div className="flex flex-col flex-1">
        <div className="font-mono-spline text-[11px] tracking-[0.14em] uppercase text-[#9a8a5e]">
          Your position in the market
        </div>
        <div className="font-spectral text-[21px] font-semibold text-[#23211b] mt-1">
          Where you rank
        </div>

        {rows.length === 0 ? (
          <EmptyState variant="warm" message="Market rankings appear once a Search Tracker run has found your competitors." href="/query" actionLabel="Open Query" />
        ) : (
          <div className="flex flex-col flex-1 justify-between mt-3.5">
            {rows.map((comp) => (
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
                  <SiteIcon domain={comp.domain} size={14} />
                </div>
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span className={`truncate text-[13px] ${comp.isUser ? "text-[#1a5c44] font-bold" : "text-[#23211b]"}`}>{comp.name}</span>
                  {comp.isUser && <span className="shrink-0 rounded bg-[#dcefe2] px-1.5 py-0.5 font-mono-spline text-[11px] font-bold uppercase tracking-wider text-[#1e7d4f]">You</span>}
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

      {rows.length > 0 && (
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
      )}
    </div>
  );
}
