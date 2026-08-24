"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Business } from "../../context/BusinessContext";

type ProfileField = {
  label: string;
  done: boolean;
  href: string;
  hint: string;
};

// `services`/`targetAudience` are typed as `string` on Business, but in
// practice arrive as an array from some save paths (BusinessProfilesPanel
// saves them as a real string[]) and a comma-joined string from others —
// confirmed live: calling .trim() directly crashed the page the moment a
// business had services saved as an array. Treats either shape as "filled"
// only when it actually has real content, not just an empty [] or "".
function hasContent(value: unknown): boolean {
  if (Array.isArray(value)) return value.some((item) => String(item || "").trim().length > 0);
  return String(value || "").trim().length > 0;
}

function buildChecklist(business: Business | null | undefined): ProfileField[] {
  const b = business;
  return [
    { label: "Business category", done: hasContent(b?.category), href: "/settings?tab=entity", hint: "Helps AI models place you in the right search context." },
    { label: "Location", done: hasContent(b?.location), href: "/settings?tab=entity", hint: "Powers local-SEO question matching." },
    { label: "Business description", done: hasContent(b?.description), href: "/settings?tab=entity", hint: "What AI reads to describe you accurately." },
    { label: "AI description", done: hasContent(b?.aiDescription), href: "/settings?tab=entity", hint: "Extra context specifically for AI-generated answers." },
    { label: "Services", done: hasContent(b?.services), href: "/settings?tab=entity", hint: "What you actually offer, for sharper question matching." },
    { label: "Target audience", done: hasContent(b?.targetAudience), href: "/settings?tab=entity", hint: "Who your real customers are." },
    { label: "Logo", done: hasContent(b?.logoUrl), href: "/settings?tab=entity", hint: "Shown on your shared reports and dashboard header." },
    { label: "Locked 20 Search Tracker questions", done: Boolean(b?.questionsLocked), href: "/query", hint: "Your stable weekly baseline — nothing is tracked until this is locked." },
  ];
}

export default function TrainProfileSection({ business }: { business: Business | null | undefined }) {
  const checklist = buildChecklist(business);
  const doneCount = checklist.filter((item) => item.done).length;
  const percent = Math.round((doneCount / checklist.length) * 100);
  const nextItem = checklist.find((item) => !item.done) || null;

  return (
    <div className="bg-white border border-[#ece3d1] rounded-[14px] p-5 md:p-[22px_24px] mt-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="font-mono-spline text-[10px] tracking-[0.13em] uppercase text-[#9b927f]">Train your Wonder Score</div>
          <div className="font-spectral text-[19px] font-semibold text-[#23211b] mt-0.5">
            {percent === 100 ? "Profile complete" : `${percent}% complete`}
          </div>
        </div>
        <div className="text-[12px] text-[#8a8273]">{doneCount}/{checklist.length} done</div>
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
          Everything that sharpens your Wonder Score is filled in — nice work.
        </p>
      )}
    </div>
  );
}
