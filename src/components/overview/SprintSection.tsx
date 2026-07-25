"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

export default function SprintSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="mt-[26px] bg-[#efe9fb] border border-[#e2d8f5] rounded-[18px] p-6 md:p-[30px_32px]"
    >
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex-1 min-w-[280px]">
          <div className="font-mono-spline text-[11px] tracking-[0.16em] uppercase text-[#5b4f86]">
            Your plan for this week
          </div>
          <h2 className="font-spectral text-[28px] font-semibold text-[#1b1733] leading-tight mt-1.5">
            Exactly what to do to lift your visibility this week
          </h2>
        </div>
        <div className="w-[230px] pt-0.5 shrink-0">
          <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#5b4f86]">
            Visibility sprint
          </div>
          <div className="text-[13px] text-[#4a4368] font-semibold mt-1.5">1 of 5 completed</div>
          <div className="flex items-center gap-2.5 mt-2">
            <div className="flex-1 h-[7px] bg-[#ddd2f0] rounded-full overflow-hidden">
              <div className="w-[20%] h-full bg-[#2d2a6e]" />
            </div>
            <span className="num text-[12px] font-bold text-[#2d2a6e]">20%</span>
          </div>
        </div>
      </div>

      <p className="text-[14px] text-[#5f5780] my-4 md:mb-5 max-w-[760px] leading-relaxed">
        We've picked the actions with the biggest impact based on your market, and prepared everything for you — your content, code and answers are ready.
      </p>

      {/* 5-Card Action Grid */}
      <div className="plan-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-stretch">

        <div className="card lift bg-white border border-[#ece3d1] rounded-[14px] p-4 md:p-[18px] flex flex-col cursor-pointer shadow-[0_1px_2px_rgba(60,48,28,0.05)]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="font-mono-spline text-[9px] tracking-wider uppercase text-[#1b1733]">Publish</span>
            <span className="text-[9px] font-bold tracking-wider uppercase text-[#1e7d4f] bg-[#dcefe2] px-2 py-1 rounded-full whitespace-nowrap">Big win</span>
          </div>
          <div className="font-spectral text-[16px] leading-snug text-[#1b1733]">"A clear guide to choosing the right provider"</div>
          <div className="text-[12.5px] text-[#6f6757] mt-2 leading-relaxed flex-1">Everyday question your customers ask. Be the answer.</div>
          <div className="num text-[11px] font-semibold text-[#1e7d4f] my-3.5">∼ Ready to publish · 620 words</div>
          <Link href="/blogs" className="pb bg-[#1a5c44] text-white text-[12.5px] font-semibold py-2.5 px-3.5 rounded-[9px] text-center">Review &amp; publish</Link>
        </div>

        <div className="card lift bg-white border border-[#ece3d1] rounded-[14px] p-4 md:p-[18px] flex flex-col cursor-pointer shadow-[0_1px_2px_rgba(60,48,28,0.05)]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="font-mono-spline text-[9px] tracking-wider uppercase text-[#1b1733]">Publish</span>
            <span className="text-[9px] font-bold tracking-wider uppercase text-[#1e7d4f] bg-[#dcefe2] px-2 py-1 rounded-full whitespace-nowrap">Big win</span>
          </div>
          <div className="font-spectral text-[16px] leading-snug text-[#1b1733]">"Questions to ask before you hire Meridian"</div>
          <div className="text-[12.5px] text-[#6f6757] mt-2 leading-relaxed flex-1">Answer high-intent questions and get cited more often.</div>
          <div className="num text-[11px] font-semibold text-[#1e7d4f] my-3.5">∼ Ready to publish · 480 words</div>
          <Link href="/blogs" className="pb bg-[#1a5c44] text-white text-[12.5px] font-semibold py-2.5 px-3.5 rounded-[9px] text-center">Review &amp; publish</Link>
        </div>

        <div className="card lift bg-white border border-[#ece3d1] rounded-[14px] p-4 md:p-[18px] flex flex-col cursor-pointer shadow-[0_1px_2px_rgba(60,48,28,0.05)]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="font-mono-spline text-[9px] tracking-wider uppercase text-[#1b1733]">Answer questions</span>
            <span className="text-[9px] font-bold tracking-wider uppercase text-[#9a6a12] bg-[#f7e7c4] px-2 py-1 rounded-full whitespace-nowrap">Worth doing</span>
          </div>
          <div className="font-spectral text-[16px] leading-snug text-[#1b1733]">Pricing, timelines &amp; getting started</div>
          <div className="text-[12.5px] text-[#6f6757] mt-2 leading-relaxed flex-1">3 customers asked recently. No answer visible yet.</div>
          <div className="num text-[11px] font-semibold text-[#1e7d4f] my-3.5">∼ Drafted for you</div>
          <Link href="/query" className="ob bg-white border border-[#d8cfbd] text-[#23211b] text-[12.5px] font-semibold py-2.5 px-3.5 rounded-[9px] text-center">Review answers</Link>
        </div>

        <div className="card lift bg-white border border-[#ece3d1] rounded-[14px] p-4 md:p-[18px] flex flex-col cursor-pointer shadow-[0_1px_2px_rgba(60,48,28,0.05)]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="font-mono-spline text-[9px] tracking-wider uppercase text-[#1b1733]">Add to website</span>
            <span className="text-[9px] font-bold tracking-wider uppercase text-[#1e7d4f] bg-[#dcefe2] px-2 py-1 rounded-full whitespace-nowrap">Big win</span>
          </div>
          <div className="font-spectral text-[16px] leading-snug text-[#1b1733]">Help AI understand your services</div>
          <div className="text-[12.5px] text-[#6f6757] mt-2 leading-relaxed flex-1">Add a short FAQ + code snippet so AI can find you.</div>
          <div className="num text-[11px] font-semibold text-[#1e7d4f] my-3.5">∼ Code ready to copy</div>
          <Link href="/analyser" className="ob bg-white border border-[#d8cfbd] text-[#23211b] text-[12.5px] font-semibold py-2.5 px-3.5 rounded-[9px] text-center">Copy code</Link>
        </div>

        <div className="card lift bg-[#f6f1e6] border border-[#e6dcc6] rounded-[14px] p-4 md:p-[18px] flex flex-col cursor-pointer shadow-[0_1px_2px_rgba(60,48,28,0.05)]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="font-mono-spline text-[9px] tracking-wider uppercase text-[#1b1733]">We'll handle it</span>
            <span className="text-[9px] font-bold tracking-wider uppercase text-[#b1442a] bg-[#f6dcd5] px-2 py-1 rounded-full whitespace-nowrap">We do this</span>
          </div>
          <div className="font-spectral text-[16px] leading-snug text-[#1b1733]">Get listed on the sources AI trusts</div>
          <div className="text-[12.5px] text-[#6f6757] mt-2 leading-relaxed flex-1">We'll submit you to high-value directories and review sites.</div>
          <div className="num text-[11px] font-semibold text-[#8a6a3a] my-3.5">∼ We'll do it for you</div>
          <button className="ob bg-white border border-[#ddccb0] text-[#8a6a3a] text-[12.5px] font-semibold py-2.5 px-3.5 rounded-[9px] text-center">Ask our team</button>
        </div>

      </div>

      {/* Bottom bar — no "View full marketing plan", improved team button */}
      <div className="flex items-center justify-between gap-4 mt-5 pt-5 border-t border-[#e2d8f5] flex-wrap">
        <div className="text-[14px] text-[#5f5780] leading-relaxed">
          <span className="text-[#1b1733] font-semibold">Don't want to do it yourself?</span>{" "}
          Our team can implement any of these for you — just say the word.
        </div>
        <button className="pb inline-flex items-center gap-2 bg-[#1a5c44] text-white text-[13px] font-semibold py-2.5 px-5 rounded-xl whitespace-nowrap shrink-0 hover:bg-[#15463b] transition-colors">
          Talk to our team <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
