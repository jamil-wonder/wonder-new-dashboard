"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

export default function HeroSection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[248px_minmax(0,1fr)_400px] gap-[22px] items-stretch">

      {/* ── Score Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#15463b] rounded-[16px] p-[24px_24px_22px] text-[#eaf3ee] flex flex-col justify-between"
      >
        <div>
          <div className="font-mono-spline text-[10px] tracking-[0.16em] uppercase text-[#86b89f]">
            Your Wonder Score
          </div>

          {/* Score + ring */}
          <div className="flex items-center justify-between gap-2 mt-3.5">
            <div className="flex items-baseline gap-0.5">
              <span className="num font-spectral font-semibold text-[72px] leading-none text-white">78</span>
              <span className="num font-spectral text-[17px] text-[#7fae97]">/100</span>
            </div>

            {/* Ring with up arrow in center */}
            <div className="relative w-[80px] h-[80px] shrink-0">
              <svg width="80" height="80" viewBox="0 0 80 80" className="block">
                <circle cx="40" cy="40" r="33" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="8" />
                <circle cx="40" cy="40" r="33" fill="none" stroke="#a8d860" strokeWidth="8"
                  strokeLinecap="round" strokeDasharray="161.7 207.3" transform="rotate(-90 40 40)" />
              </svg>
              {/* Trend arrow in center of ring */}
              <div className="absolute inset-0 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[#a8d860]" />
              </div>
            </div>
          </div>

          <div className="mt-2">
            <span className="num inline-flex items-center gap-1 text-[12px] font-bold text-[#3a2e08] bg-[#f0d878] px-3 py-1 rounded-full">
              ▲ 4 points this week
            </span>
          </div>
        </div>

        <div className="border-t border-white/15 pt-3.5 mt-4">
          <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#86b89f]">Grade B+</div>
          <div className="font-spectral text-[22px] font-medium text-white mt-1">Good visibility</div>
        </div>
      </motion.div>

      {/* ── Changes Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col justify-center px-1 py-1"
      >
        <h1 className="font-spectral text-[32px] font-medium tracking-tight leading-tight text-[#23211b]">
          You're up to second.
        </h1>
        <p className="text-[14.5px] text-[#6f6757] mt-2.5 leading-relaxed max-w-[380px]">
          Great work! You've passed Brightwell and are just 3 points behind Castleford Group.
        </p>

        <div className="flex flex-col gap-3.5 mt-5">
          {[
            { icon: "▲", bg: "#e7f4ea", color: "#1e7d4f", title: "Passed Brightwell", sub: "Moved from 3rd to 2nd" },
            { icon: "▲", bg: "#e7f4ea", color: "#1e7d4f", title: "New ChatGPT mention", sub: "Now appearing in 11 questions" },
            { icon: "▼", bg: "#fbe9e3", color: "#d9694a", title: "Vantage entered rankings", sub: "New competitor in 5th" },
          ].map(({ icon, bg, color, title, sub }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 font-bold text-[14px]"
                style={{ background: bg, color }}>
                {icon}
              </div>
              <div>
                <div className="text-[14px] font-bold text-[#23211b]">{title}</div>
                <div className="text-[12.5px] text-[#8a8273]">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── 12-Week Trend Chart Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border border-[#ece3d1] rounded-[14px] p-[20px_22px_16px] flex flex-col"
      >
        <div className="flex items-start justify-between mb-1">
          <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f]">12 week trend</div>
          <div className="num font-spectral text-[30px] font-semibold text-[#1e7d4f] leading-none">78</div>
        </div>

        {/* Taller graph — fills the card */}
        <div className="flex-1">
          <svg viewBox="0 0 400 200" className="w-full h-full" preserveAspectRatio="none">
            <g stroke="#efe7d6" strokeWidth="1">
              <line x1="38" y1="20"  x2="394" y2="20"  />
              <line x1="38" y1="55"  x2="394" y2="55"  />
              <line x1="38" y1="90"  x2="394" y2="90"  />
              <line x1="38" y1="125" x2="394" y2="125" />
              <line x1="38" y1="158" x2="394" y2="158" />
            </g>
            <g className="font-mono-spline text-[9px] fill-[#b3a98f]">
              <text x="30" y="23"  textAnchor="end">100</text>
              <text x="30" y="58"  textAnchor="end">75</text>
              <text x="30" y="93"  textAnchor="end">50</text>
              <text x="30" y="128" textAnchor="end">25</text>
              <text x="30" y="161" textAnchor="end">0</text>
            </g>
            <polygon
              points="48,127 79,120 110,113 141,105 172,95 203,86 234,77 265,69 296,62 327,56 358,53 388,49 388,158 48,158"
              fill="rgba(30,125,79,0.08)"
            />
            <polyline
              points="48,127 79,120 110,113 141,105 172,95 203,86 234,77 265,69 296,62 327,56 358,53 388,49"
              fill="none" stroke="#1e7d4f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
            />
            <g fill="#ffffff" stroke="#1e7d4f" strokeWidth="2">
              <circle cx="48"  cy="127" r="3.2" /><circle cx="79"  cy="120" r="3.2" />
              <circle cx="110" cy="113" r="3.2" /><circle cx="141" cy="105" r="3.2" />
              <circle cx="172" cy="95"  r="3.2" /><circle cx="203" cy="86"  r="3.2" />
              <circle cx="234" cy="77"  r="3.2" /><circle cx="265" cy="69"  r="3.2" />
              <circle cx="296" cy="62"  r="3.2" /><circle cx="327" cy="56"  r="3.2" />
              <circle cx="358" cy="53"  r="3.2" />
            </g>
            <circle cx="388" cy="49" r="5" fill="#1e7d4f" />
            <g className="font-mono-spline text-[9px] fill-[#b3a98f]">
              <text x="48"  y="178" textAnchor="middle">31 Mar</text>
              <text x="141" y="178" textAnchor="middle">28 Apr</text>
              <text x="234" y="178" textAnchor="middle">26 May</text>
              <text x="327" y="178" textAnchor="middle">9 Jun</text>
              <text x="388" y="178" textAnchor="end">22 Jun</text>
            </g>
          </svg>
        </div>
      </motion.div>

    </div>
  );
}
