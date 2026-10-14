"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Business } from "../../context/BusinessContext";
import { computeProfileCompleteness } from "../../lib/profileCompleteness";

// One calculation shared with Settings (lib/profileCompleteness) - A6/L5.

export default function TrainProfileSection({ business }: { business: Business | null | undefined }) {
  const { done: doneCount, total, percent, missing } = computeProfileCompleteness(business);
  const nextItem = missing[0] || null;

  return (
    <div className="bg-white border border-[#ece3d1] rounded-[14px] p-5 md:p-[22px_24px] mt-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono-spline text-[10px] tracking-[0.13em] uppercase text-[#9b927f]">Train your Wonder Score</div>
          <div className="font-spectral text-[19px] font-semibold text-[#23211b] mt-0.5">
            {percent === 100 ? "Profile complete" : `${percent}% complete`}
          </div>
        </div>
        <div className="text-[12px] text-[#8a8273]">{doneCount}/{total} done</div>
      </div>

      <div className="mt-3 h-2 bg-[#f0ebe0] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#1e7d4f] rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {nextItem ? (
        <div className="mt-4 flex items-center justify-between gap-3 p-3.5 bg-[#fdfcf8] border border-[#ece3d1] rounded-xl">
          <div className="min-w-0">
            <div className="text-[13.5px] font-semibold text-[#23211b]">Next: {nextItem.label}</div>
            <p className="text-[12px] text-[#8a8273] mt-0.5 leading-snug">{nextItem.hint}</p>
          </div>
          <Link
            href={nextItem.href}
            className="shrink-0 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white bg-[#15463b] hover:bg-[#1a5c44] px-3.5 py-2 rounded-lg transition-colors"
          >
            Complete <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <p className="mt-4 text-[12.5px] text-[#8a8273]">
          Everything that sharpens your Wonder Score is filled in - nice work.
        </p>
      )}
    </div>
  );
}
