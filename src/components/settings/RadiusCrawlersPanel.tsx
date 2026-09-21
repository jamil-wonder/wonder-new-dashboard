"use client";

import { Clock } from "lucide-react";

// This used to be a fully decorative form: uncontrolled checkboxes
// (`defaultChecked`, never read from or written to anywhere), and "Save
// preferences" just fired a fake success toast with zero backend call —
// the exact same class of issue as the old Geo Radius panel. It's also
// worth being honest about what this control could even mean: WonderScore
// analyzes a business's website, it doesn't host or manage it, so it has
// no way to actually enforce a robots.txt-style crawler permission on a
// site it doesn't control. Replaced with an honest not-built-yet state
// rather than a toggle that silently did nothing either way.
export default function RadiusCrawlersPanel() {
  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-4 sm:p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">AI Bot Crawler Recommendations</h3>
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9a6a12] bg-[#faf1da] px-3 py-1 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          Coming soon
        </span>
      </div>
      <p className="text-[13px] text-[#6f6757] leading-relaxed">
        We'll show whether GPTBot, ClaudeBot, and PerplexityBot can currently reach your site, and the exact
        robots.txt lines to add if any of them are blocked — WonderScore analyzes your site, it doesn't host it, so
        this will always be a recommendation you apply yourself, not a switch we flip for you.
      </p>
    </div>
  );
}
