"use client";

import { useToast } from "../../context/ToastContext";

export default function RadiusCrawlersPanel() {
  const { showToast } = useToast();

  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-4 sm:p-6 shadow-sm space-y-6">
      
      {/* AI Bot Permitted Crawlers */}
      <div className="space-y-4">
        <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">AI Bot Permitted Crawlers</h3>
        <p className="text-[13px] text-[#6f6757] leading-relaxed">
          Select which generative AI crawler agents are permitted to index your structured schema metadata and sitemap pages.
        </p>

        <div className="space-y-2.5">
          <label className="flex items-center gap-2.5 text-[13.5px] cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded accent-[#15463b] w-4 h-4" />
            <span>GPTBot (OpenAI / ChatGPT)</span>
          </label>
          <label className="flex items-center gap-2.5 text-[13.5px] cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded accent-[#15463b] w-4 h-4" />
            <span>ClaudeBot (Anthropic / Claude)</span>
          </label>
          <label className="flex items-center gap-2.5 text-[13.5px] cursor-pointer">
            <input type="checkbox" defaultChecked className="rounded accent-[#15463b] w-4 h-4" />
            <span>PerplexityBot (Perplexity Search)</span>
          </label>
        </div>
      </div>

      <button
        onClick={() => showToast("Crawler preferences saved!", "success")}
        className="pb bg-[#15463b] text-white text-[13px] font-semibold px-5.5 py-2.5 rounded-lg border-none hover:bg-[#1a5c44] transition-colors cursor-pointer"
      >
        Save preferences
      </button>

    </div>
  );
}
