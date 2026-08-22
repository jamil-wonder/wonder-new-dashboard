"use client";

import { useRouter } from "next/navigation";
import { Lock, ArrowRight } from "lucide-react";
import { useBusiness } from "../../context/BusinessContext";

const TYPE_ORDER = ["branded", "non-branded", "local-seo", "broad-seo"];
const TYPE_LABELS: Record<string, string> = {
  branded: "Branded",
  "non-branded": "Non-Branded",
  "local-seo": "Local SEO",
  "broad-seo": "Broad SEO",
};

export default function SavedSearchTrackerPanel() {
  const router = useRouter();
  const { activeBusiness } = useBusiness();

  const trackedQuestions = activeBusiness?.trackedQuestions || [];
  const isLocked = Boolean(activeBusiness?.questionsLocked);
  const hasSaved = trackedQuestions.length > 0;

  const grouped = TYPE_ORDER.map((type) => ({
    type,
    label: TYPE_LABELS[type],
    items: trackedQuestions.filter((q) => q.type === type),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-4 sm:p-6 md:p-[24px_26px] shadow-[0_1px_2px_rgba(60,48,28,0.04)] mb-5.5">
      <div className="mb-4 pb-3 border-b border-[#efe7d6] flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">Saved Search Tracker</h3>
          <p className="text-[12.5px] text-[#8a8273] mt-0.5">
            The locked 20 questions Wonder Score tracks every week — shown here read-only, just for confirmation that what's saved is what you think is saved.
          </p>
        </div>
        {hasSaved && (
          <span className="shrink-0 inline-flex items-center gap-1.5 text-[12px] font-bold text-[#15463b] bg-[#eef3f0] border border-[#d0e4d6] px-3 py-1.5 rounded-full">
            {trackedQuestions.length}/20 slots saved
          </span>
        )}
      </div>

      {!hasSaved ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 rounded-full bg-[#f6f3ec] border border-[#ece3d1] flex items-center justify-center mx-auto mb-3">
            <Lock className="w-5 h-5 text-[#9b927f]" />
          </div>
          <p className="text-[14px] font-semibold text-[#23211b] mb-1">Nothing saved yet</p>
          <p className="text-[13px] text-[#8a8273] max-w-[380px] mx-auto mb-5">
            Head to Search Tracker, generate your 20 questions, and lock them in — they'll show up here automatically once saved.
          </p>
          <button
            onClick={() => router.push("/query")}
            className="inline-flex items-center gap-2 py-2.5 px-5 bg-[#15463b] text-white text-[13px] font-bold rounded-xl hover:bg-[#1a5c44] transition-colors cursor-pointer"
          >
            Go to Search Tracker <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-5 p-3 bg-[#f6f3ec] border border-[#ece3d1] rounded-xl">
            <Lock className="w-4 h-4 text-[#9b927f] shrink-0" />
            <p className="text-[12.5px] text-[#6f6757]">
              {isLocked
                ? "These are locked — read-only here. Edit them from Search Tracker, not here."
                : "Saved, but not yet locked — Search Tracker will still show them as editable until you lock them there."}
            </p>
          </div>

          <div className="space-y-5">
            {grouped.map((group) => (
              <div key={group.type}>
                <div className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] mb-2">
                  {group.label} &middot; {group.items.length}
                </div>
                <div className="space-y-1.5">
                  {group.items.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-center gap-2.5 py-2.5 px-3 bg-[#fdfcf8] border border-[#ece3d1] rounded-lg"
                    >
                      <Lock className="w-3 h-3 text-[#c7bda6] shrink-0" />
                      <span className="text-[13px] text-[#3a352b] leading-snug">{q.query}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
