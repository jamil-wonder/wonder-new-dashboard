"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function PlatformVisSection() {
  return (
    <div className="bg-white border border-[#ece3d1] rounded-[14px] p-5 md:p-[22px_24px] flex flex-col justify-between">
      <div>
        <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f]">
          Where AI sees you
        </div>
        <div className="font-spectral text-[21px] font-semibold text-[#23211b] mt-1">
          Platform visibility
        </div>

        <div className="flex flex-col gap-3 mt-4">
          {/* ChatGPT */}
          <div className="flex items-center gap-2.5">
            <div className="w-[18px] h-[18px] shrink-0 flex items-center justify-center overflow-hidden">
              <Image src="/icons/chatgpt.svg" width={18} height={18} alt="ChatGPT" className="object-contain" />
            </div>
            <span className="w-[74px] text-[13.5px] text-[#23211b]">ChatGPT</span>
            <div className="flex-1 h-[6px] bg-[#f0ece2] rounded-full overflow-hidden">
              <div className="w-[55%] h-full bg-[#2e9e5b]" />
            </div>
            <span className="num text-[13.5px] font-bold text-[#2e9e5b] w-[38px] text-right">11/20</span>
          </div>

          {/* Claude */}
          <div className="flex items-center gap-2.5">
            <div className="w-[18px] h-[18px] shrink-0 flex items-center justify-center overflow-hidden">
              <Image src="/icons/claude.svg" width={18} height={18} alt="Claude" className="object-contain" />
            </div>
            <span className="w-[74px] text-[13.5px] text-[#23211b]">Claude</span>
            <div className="flex-1 h-[6px] bg-[#f0ece2] rounded-full overflow-hidden">
              <div className="w-[45%] h-full bg-[#d6a23a]" />
            </div>
            <span className="num text-[13.5px] font-bold text-[#9a6a12] w-[38px] text-right">9/20</span>
          </div>

          {/* Perplexity */}
          <div className="flex items-center gap-2.5">
            <div className="w-[18px] h-[18px] shrink-0 flex items-center justify-center overflow-hidden">
              <Image src="/icons/perplexity.svg" width={18} height={18} alt="Perplexity" className="object-contain" />
            </div>
            <span className="w-[74px] text-[13.5px] text-[#23211b]">Perplexity</span>
            <div className="flex-1 h-[6px] bg-[#f0ece2] rounded-full overflow-hidden">
              <div className="w-[35%] h-full bg-[#d6a23a]" />
            </div>
            <span className="num text-[13.5px] font-bold text-[#9a6a12] w-[38px] text-right">7/20</span>
          </div>

          {/* Gemini */}
          <div className="flex items-center gap-2.5">
            <div className="w-[18px] h-[18px] shrink-0 flex items-center justify-center overflow-hidden">
              <Image src="/icons/gemini.svg" width={18} height={18} alt="Gemini" className="object-contain" />
            </div>
            <span className="w-[74px] text-[13.5px] text-[#23211b]">Gemini</span>
            <div className="flex-1 h-[6px] bg-[#f0ece2] rounded-full overflow-hidden">
              <div className="w-[40%] h-full bg-[#d6a23a]" />
            </div>
            <span className="num text-[13.5px] font-bold text-[#9a6a12] w-[38px] text-right">8/20</span>
          </div>
        </div>

        {/* 3 Metric Pill Box */}
        <div className="grid grid-cols-3 gap-px bg-[#ece3d1] border border-[#ece3d1] rounded-lg overflow-hidden mt-4.5">
          <div className="bg-[#fbf7ee] p-3">
            <div className="font-mono-spline text-[8.5px] tracking-wider uppercase text-[#9b927f]">Strongest</div>
            <div className="text-[13px] font-semibold text-[#23211b] mt-1">ChatGPT</div>
            <div className="num text-[12px] font-bold text-[#2e9e5b]">11/20</div>
          </div>
          <div className="bg-[#fbf7ee] p-3">
            <div className="font-mono-spline text-[8.5px] tracking-wider uppercase text-[#b1442a]">Weakest</div>
            <div className="text-[13px] font-semibold text-[#23211b] mt-1">Perplexity</div>
            <div className="num text-[12px] font-bold text-[#9a6a12]">7/20</div>
          </div>
          <div className="bg-[#fbf7ee] p-3">
            <div className="font-mono-spline text-[8.5px] tracking-wider uppercase text-[#9b927f]">Potential</div>
            <div className="num text-[18px] font-bold text-[#1e7d4f] leading-tight">+4</div>
            <div className="text-[11px] text-[#8a8273]">mentions</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 mt-4 pt-3.5 border-t border-[#ece3d1]">
        <span className="text-[12px] text-[#8a8273] leading-snug">
          Missing from <strong className="text-[#23211b] font-semibold">7 questions</strong>
        </span>
        <Link href="/query" className="ul inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#1e7d4f] whitespace-nowrap">
          Open Queries <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
