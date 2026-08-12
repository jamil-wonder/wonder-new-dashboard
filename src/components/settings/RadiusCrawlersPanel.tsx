"use client";

import { useState } from "react";
import { useToast } from "../../context/ToastContext";

export default function RadiusCrawlersPanel() {
  const { showToast } = useToast();
  const [radius, setRadius] = useState("25");

  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-4 sm:p-6 shadow-sm space-y-6">
      
      {/* Geo Radius */}
      <div className="space-y-3.5">
        <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">Geo Radius Settings</h3>
        <div>
          <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">
            Geographic Scan Radius
          </label>
          <select
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            className="w-full text-[14px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none"
          >
            <option value="10">10 Miles Radius around Bristol</option>
            <option value="25">25 Miles Radius around Bristol (Recommended)</option>
            <option value="50">50 Miles Radius around Bristol</option>
          </select>
          <p className="text-[12px] text-[#8a8273] mt-2 leading-relaxed">
            One primary location is included in your current subscription. Local search results will prioritize listings within this radius.
          </p>
        </div>
      </div>

      {/* AI Bot Permitted Crawlers */}
      <div className="space-y-4 pt-4 border-t border-[#efe7d6]">
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
        onClick={() => showToast("Crawlers & radius settings saved!")}
        className="pb bg-[#15463b] text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg border-none"
      >
        Save settings
      </button>

    </div>
  );
}
