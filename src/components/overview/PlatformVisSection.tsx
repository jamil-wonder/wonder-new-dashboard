"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { OverviewData } from "../../hooks/useOverviewData";

const MODEL_COLORS: Record<string, { bar: string; label: string }> = {
  ChatGPT:   { bar: "#2e9e5b", label: "#2e9e5b" },
  Claude:    { bar: "#d6a23a", label: "#9a6a12" },
  Perplexity:{ bar: "#d6a23a", label: "#9a6a12" },
  Gemini:    { bar: "#d6a23a", label: "#9a6a12" },
};

const MODEL_ICONS: Record<string, string> = {
  ChatGPT:   "/icons/chatgpt.svg",
  Claude:    "/icons/claude.svg",
  Perplexity:"/icons/perplexity.svg",
  Gemini:    "/icons/gemini.svg",
};

export default function PlatformVisSection({ data }: { data: OverviewData }) {
  const { modelMentions, totalQueries, missingCount, hasQueryData } = data;

  const sorted = [...modelMentions].sort((a, b) => b.mentioned - a.mentioned);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  const potentialGain = sorted.reduce((acc, m) => acc + (totalQueries - m.mentioned), 0);

  return (
    <div className="bg-white border border-[#ece3d1] rounded-[14px] p-5 md:p-[22px_24px] flex flex-col">
      <div className="flex flex-col flex-1">
        <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f]">
          Where AI sees you
        </div>
        <div className="font-spectral text-[21px] font-semibold text-[#23211b] mt-1">
          Platform visibility
        </div>

        {!hasQueryData ? (
          <div className="mt-4 p-4 rounded-lg bg-[#f8f5ee] text-center">
            <p className="text-[12.5px] text-[#9b927f]">Run AI Query analysis to see which models mention you.</p>
            <Link href="/query" className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-[#1e7d4f]">
              Open Queries <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col flex-1 mt-0">
            <div className="flex flex-col gap-3.5 mt-3.5 mb-4">
              {modelMentions.map(({ model, mentioned, total }) => {
                const pct = total > 0 ? Math.round((mentioned / total) * 100) : 0;
                const colors = MODEL_COLORS[model] || { bar: "#d6a23a", label: "#9a6a12" };
                return (
                  <div key={model} className="flex items-center gap-2.5">
                    <div className="w-[18px] h-[18px] shrink-0 flex items-center justify-center overflow-hidden">
                      {MODEL_ICONS[model] ? (
                        <Image src={MODEL_ICONS[model]} width={18} height={18} alt={model} className="object-contain" />
                      ) : (
                        <span className="text-[10px] font-bold text-[#9b927f]">{model[0]}</span>
                      )}
                    </div>
                    <span className="w-[74px] text-[13.5px] text-[#23211b]">{model}</span>
                    <div className="flex-1 h-[6px] bg-[#f0ece2] rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: colors.bar }} />
                    </div>
                    <span className="num text-[13.5px] font-bold w-[38px] text-right" style={{ color: colors.label }}>
                      {mentioned}/{total || 20}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-px bg-[#ece3d1] border border-[#ece3d1] rounded-lg overflow-hidden mt-auto pt-0">
              <div className="bg-[#fbf7ee] p-3">
                <div className="font-mono-spline text-[8.5px] tracking-wider uppercase text-[#9b927f]">Strongest</div>
                <div className="text-[13px] font-semibold text-[#23211b] mt-1">{strongest?.model || "—"}</div>
                <div className="num text-[12px] font-bold text-[#2e9e5b]">{strongest?.mentioned || 0}/{totalQueries || 20}</div>
              </div>
              <div className="bg-[#fbf7ee] p-3">
                <div className="font-mono-spline text-[8.5px] tracking-wider uppercase text-[#b1442a]">Weakest</div>
                <div className="text-[13px] font-semibold text-[#23211b] mt-1">{weakest?.model || "—"}</div>
                <div className="num text-[12px] font-bold text-[#9a6a12]">{weakest?.mentioned || 0}/{totalQueries || 20}</div>
              </div>
              <div className="bg-[#fbf7ee] p-3">
                <div className="font-mono-spline text-[8.5px] tracking-wider uppercase text-[#9b927f]">Potential</div>
                <div className="num text-[18px] font-bold text-[#1e7d4f] leading-tight">+{missingCount}</div>
                <div className="text-[11px] text-[#8a8273]">queries missing</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mt-4 pt-3.5 border-t border-[#ece3d1]">
        <span className="text-[12px] text-[#8a8273] leading-snug">
          {hasQueryData
            ? <>Missing from <strong className="text-[#23211b] font-semibold">{missingCount} questions</strong></>
            : "No query data yet"}
        </span>
        <Link href="/query" className="ul inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#1e7d4f] whitespace-nowrap">
          Open Queries <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
