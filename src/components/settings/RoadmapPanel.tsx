"use client";

import { Clock } from "lucide-react";
import IntegrationsPanel from "./IntegrationsPanel";

// Everything that is not built yet, in ONE place - instead of three tabs and cards that each say "coming soon".
export default function RoadmapPanel() {
  return (
    <div className="space-y-6">
      <p className="text-[13.5px] text-[#6f6757] leading-relaxed max-w-[640px]">
        These are on the way. None of them is live yet, so nothing here needs setting up - we&apos;ll switch them on in the app when they&apos;re ready.
      </p>

      <section className="space-y-3">
        <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">Integrations</h3>
        <IntegrationsPanel />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="bg-white border border-[#ece3d1] rounded-[18px] p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-spectral text-[17px] font-semibold text-[#15463b]">AI bot crawler recommendations</h3>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#9a6a12] bg-[#faf1da] px-2.5 py-0.5 rounded-full">
              <Clock className="w-3 h-3" /> Coming soon
            </span>
          </div>
          <p className="text-[12.5px] text-[#6f6757] leading-relaxed">
            We&apos;ll show whether GPTBot, ClaudeBot and PerplexityBot can reach your site, and the exact robots.txt lines to add if one is blocked.
            It will always be a recommendation you apply yourself.
          </p>
        </div>
        <div className="bg-white border border-[#ece3d1] rounded-[18px] p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-spectral text-[17px] font-semibold text-[#15463b]">Geo radius</h3>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#9a6a12] bg-[#faf1da] px-2.5 py-0.5 rounded-full">
              <Clock className="w-3 h-3" /> Coming soon
            </span>
          </div>
          <p className="text-[12.5px] text-[#6f6757] leading-relaxed">
            Tuning how far around your location local questions reach. Until then, your Local SEO questions already use each business&apos;s own saved location.
          </p>
        </div>
      </section>
    </div>
  );
}
