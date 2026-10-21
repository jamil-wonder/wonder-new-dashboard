"use client";

import Dialog from "../ui/Dialog";

interface ReviewQuestion {
  id: string | number;
  query: string;
  label?: string;
}

// L2: the first run measures the business against these questions, so they are
// shown for a look - with the way to change them - before anything is sent to the AI models.
export default function FirstRunReviewDialog({
  questions,
  businessName,
  onKeepReviewing,
  onRun,
}: {
  questions: ReviewQuestion[];
  businessName: string;
  onKeepReviewing: () => void;
  onRun: () => void;
}) {
  return (
    <Dialog
      onClose={onKeepReviewing}
      labelledBy="first-run-review-title"
      overlayClassName="fixed inset-0 bg-[#0f1c18]/55 backdrop-blur-sm z-[999] flex items-center justify-center p-4"
      className="bg-white border border-[#ece3d1] rounded-[20px] shadow-[0_20px_48px_rgba(21,70,59,0.2)] w-full max-w-[640px] max-h-[88vh] flex flex-col overflow-hidden"
    >
      <div className="contents">
        <div className="px-6 pt-5 pb-3 border-b border-[#efe7d6]">
          <h3 id="first-run-review-title" className="font-spectral text-[19px] font-semibold text-[#15463b]">
            Review your questions before the first run
          </h3>
          <p className="text-[13px] text-[#6f6757] mt-1.5 leading-relaxed">
            These {questions.length} questions will be asked to ChatGPT, Claude, Perplexity and Gemini about {businessName || "your business"}.
            They are the baseline your score is measured against, so check they sound like what your customers would really ask.
            You can edit, remove or regenerate them from the table first.
          </p>
        </div>
        <ol className="px-6 py-3 overflow-y-auto space-y-2 list-decimal list-inside text-[13px] text-[#23211b]">
          {questions.map((q) => (
            <li key={q.id} className="leading-snug">
              {q.query}
              {q.label ? <span className="ml-2 text-[11px] font-semibold uppercase tracking-wide text-[#6f6757]">{q.label}</span> : null}
            </li>
          ))}
        </ol>
        <div className="flex items-center gap-3 px-6 py-4 border-t border-[#efe7d6] bg-[#fdfcf8]">
          <button
            type="button"
            onClick={onKeepReviewing}
            className="flex-1 h-10 rounded-xl border border-[#ece3d1] text-[13.5px] font-semibold text-[#6f6757] hover:bg-[#f6f3ec] transition-colors cursor-pointer"
          >
            Keep reviewing
          </button>
          <button
            type="button"
            onClick={onRun}
            className="flex-1 h-10 rounded-xl bg-[#15463b] text-white text-[13.5px] font-semibold hover:bg-[#1a5c44] transition-colors cursor-pointer"
          >
            Looks good - run
          </button>
        </div>
      </div>
    </Dialog>
  );
}
