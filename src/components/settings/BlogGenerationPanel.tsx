"use client";

import { useState, useEffect } from "react";
import { FileText } from "lucide-react";
import { fetchApi } from "../../lib/api";
import { useBusiness } from "../../context/BusinessContext";

export default function BlogGenerationPanel() {
  const { activeBusiness } = useBusiness();
  const [usageInfo, setUsageInfo] = useState<{ remaining: number; used: number; limit: number }>({
    remaining: 2,
    used: 0,
    limit: 2,
  });
  const [historyDrafts, setHistoryDrafts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Load real usage limit from /api/blogs/usage
    fetchApi<any>("/api/blogs/usage")
      .then((res) => {
        if (res) {
          setUsageInfo({
            remaining: typeof res.remaining === "number" ? res.remaining : 2,
            used: typeof res.used === "number" ? res.used : 0,
            limit: typeof res.limit === "number" ? res.limit : (res.total || 2),
          });
        }
      })
      .catch((err) => console.error("Failed to load blog usage:", err));

    // 2. Load weekly generated blog history for active business — clear
    // the previous business's drafts immediately rather than leaving them
    // on screen (mislabeled) while this fetch is in flight.
    setHistoryDrafts([]);
    if (activeBusiness?.id) {
      setIsLoading(true);
      fetchApi<any>(`/api/blogs/weekly?business_id=${encodeURIComponent(activeBusiness.id)}`)
        .then((res) => {
          if (res && res.weekly && Array.isArray(res.weekly.drafts)) {
            setHistoryDrafts(res.weekly.drafts);
          }
        })
        .catch((err) => console.error("Failed to load blog history:", err))
        .finally(() => setIsLoading(false));
    }
  }, [activeBusiness?.id]);

  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const displayUsed = Math.min(usageInfo.used, usageInfo.limit);
  const usedRatio = usageInfo.limit > 0 ? displayUsed / usageInfo.limit : 0;
  const strokeDashoffset = circumference - usedRatio * circumference;

  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-4 sm:p-6 shadow-sm space-y-6">
      
      {/* Blog Generation Limit Ring */}
      <div className="flex items-center justify-between border-b border-[#efe7d6] pb-5">
        <div>
          <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">Blog Generation</h3>
          <p className="text-[12.5px] text-[#6f6757] mt-0.5">Auto-generation schedule limits and active history.</p>
        </div>
      </div>

      <div className="bg-[#faf8f3] border border-[#ece3d1] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="absolute w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r={radius} className="stroke-[#ece3d1]" strokeWidth="4" fill="transparent" />
              <circle
                cx="32" cy="32" r={radius}
                className="stroke-[#15463b] transition-all duration-300"
                strokeWidth="4" fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <span className="text-sm font-bold text-[#15463b]">
              {displayUsed}/{usageInfo.limit}
            </span>
          </div>
          <div>
            <h4 className="font-bold text-[15.5px] text-[#23211b]">Blog Generations Limit</h4>
            <p className="text-[11px] font-mono-spline uppercase tracking-wider text-[#9b927f] mt-0.5">Reset weekly every Sunday</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[15px] font-bold text-[#1e7d4f]">
            {usageInfo.remaining} remaining
          </div>
          <div className="text-[12.5px] text-[#8a8273]">For this cycle</div>
        </div>
      </div>

      {/* Generated blog history list */}
      <div className="space-y-3.5">
        <h4 className="font-spectral text-[16px] font-semibold text-[#15463b]">Generated Blog History</h4>
        
        {historyDrafts.length > 0 ? (
          <div className="divide-y divide-[#efe7d6]">
            {historyDrafts.map((draft, idx) => (
              <div key={draft.id || idx} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded bg-[#f6f3ec] border border-[#ece3d1] flex items-center justify-center text-[#15463b] shrink-0 p-1">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-bold text-[#23211b] leading-tight line-clamp-1">
                      {draft.title}
                    </div>
                    <div className="text-[11px] text-[#8a8273] mt-0.5">
                      {Array.isArray(draft.keywords) ? draft.keywords.slice(0, 2).join(", ") : "AI SEO Blog"} · {draft.modelUsed || "Claude 3.5"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-[12.5px] text-[#8a8273] bg-[#fdfcf8] border border-dashed border-[#ece3d1] rounded-xl">
            No generated blogs for this business profile yet.
          </div>
        )}
      </div>

    </div>
  );
}
