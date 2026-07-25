"use client";

import Image from "next/image";
import { X, CheckCircle2, XCircle } from "lucide-react";
import { SearchQueryItem } from "../../types/dashboard";

interface QueryChatModalProps {
  query: SearchQueryItem | null;
  selectedModel: string;
  onClose: () => void;
}

const MODEL_CONFIG: Record<string, { name: string; icon: string; accent: string; bgClass: string }> = {
  ChatGPT:    { name: "ChatGPT",    icon: "/icons/chatgpt.svg",    accent: "#1e7d4f", bgClass: "bg-[#f0faf4]" },
  Claude:     { name: "Claude",     icon: "/icons/claude.svg",     accent: "#9a6a12", bgClass: "bg-[#fef9ec]" },
  Perplexity: { name: "Perplexity", icon: "/icons/perplexity.svg", accent: "#1a4b9a", bgClass: "bg-[#f0f5ff]" },
  Gemini:     { name: "Gemini",     icon: "/icons/gemini.svg",     accent: "#b1442a", bgClass: "bg-[#fdf5f3]" },
};

export default function QueryChatModal({ query, selectedModel, onClose }: QueryChatModalProps) {
  if (!query) return null;

  const cfg = MODEL_CONFIG[selectedModel] || MODEL_CONFIG.ChatGPT;
  const isMentioned = query.status === "Mentioned";

  return (
    <div
      className="fixed inset-0 bg-[#0f1c18]/55 backdrop-blur-sm z-[999] flex items-center justify-center p-5"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-[#ece3d1] rounded-[20px] shadow-[0_20px_40px_rgba(21,70,59,0.2)] w-full max-w-[760px] max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#ece3d1] bg-[#fdfcf8]">
          <div className="flex items-center gap-2.5">
            {/* Actual model icon — clean, no background */}
            <div className="w-7 h-7 shrink-0 flex items-center justify-center">
              <Image src={cfg.icon} width={26} height={26} alt={cfg.name} className="object-contain" />
            </div>
            {/* Tight stacked title — no extra gap */}
            <div className="flex flex-col leading-tight">
              <span className="font-spectral text-[16px] font-semibold text-[#15463b]">
                {cfg.name} Response Log
              </span>
              <span className="text-[11px] text-[#9b927f] leading-tight">Generative AI Search Engine Log</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#9b927f] hover:text-[#23211b] transition-colors rounded-md hover:bg-[#f5f0e6]"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* ── Chat Body ── */}
        <div className="p-5 overflow-y-auto flex flex-col gap-4 bg-[#faf8f3] flex-1">

          {/* User Query bubble — no "User Search Intent" label */}
          <div className="flex justify-end">
            <div className="bg-[#15463b] text-white px-4.5 py-3 rounded-[16px_16px_4px_16px] max-w-[82%] text-[14px] leading-relaxed shadow-sm">
              &ldquo;{query.query}&rdquo;
            </div>
          </div>

          {/* AI Response bubble */}
          <div className="flex items-start gap-3">
            {/* Model icon avatar */}
            <div className="w-8 h-8 rounded-full bg-white border border-[#e5ddd0] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <Image src={cfg.icon} width={18} height={18} alt={cfg.name} className="object-contain" />
            </div>

            <div className="bg-white border border-[#ece3d1] px-4.5 py-4 rounded-[16px_16px_16px_4px] max-w-[88%] text-[13.5px] leading-relaxed text-[#23211b] shadow-sm flex-1">
              {isMentioned ? (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#1e7d4f] shrink-0" />
                    <span className="font-bold text-[#1e7d4f] text-[13px]">
                      Brand Mention Verified — Rank #{query.rank || 1}
                    </span>
                  </div>
                  <p>
                    Based on index scan of local advisory providers, <strong>Meridian &amp; Co.</strong> is listed as a top candidate for this request.
                  </p>
                  <div className={`mt-3 p-3 rounded-lg border border-[#d7edd9] ${cfg.bgClass}`}>
                    <p className="text-[10.5px] font-bold uppercase text-[#8a8273] mb-1.5 tracking-wider">
                      Key Extracted Insights
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[12.5px]">
                      <li>High NAP consistency matched across Google Business and UK Registry.</li>
                      <li>Entity consensus rating: <strong>80/100 Strong</strong>.</li>
                      <li>Cited domains: <code>{query.sources.join(", ") || "meridian.co"}</code>.</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <XCircle className="w-4 h-4 text-[#b1442a] shrink-0" />
                    <span className="font-bold text-[#b1442a] text-[13px]">
                      No Mention Found
                    </span>
                  </div>
                  <p>
                    <strong>Meridian &amp; Co.</strong> was not included in {cfg.name}&apos;s top recommendations for this query.
                  </p>
                  <div className="mt-3 p-3 bg-[#fdf5f3] rounded-lg border border-[#f6dcd5]">
                    <p className="text-[10.5px] font-bold uppercase text-[#b1442a] mb-1.5 tracking-wider">
                      Optimization Opportunity
                    </p>
                    <p className="text-[12.5px] text-[#6f6757]">
                      Competitor Castleford Group ranked higher due to structured JSON-LD schema. Add the LocalBusiness schema action to win this query slot.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
