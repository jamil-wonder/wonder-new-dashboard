"use client";

import { motion } from "framer-motion";
import { BlogArticleItem } from "../../types/dashboard";
import { MOCK_BLOGS } from "../../constants/mockData";

interface SundayCalendarProps {
  onSelectBlog: (blog: BlogArticleItem) => void;
}

// 7-day week grid matching the interactive HTML dashboard
const WEEK_DAYS = [
  { label: "Mon 21", slot: false },
  { label: "Tue 22", slot: false },
  { label: "Wed 23", slot: false },
  { label: "Thu 24", slot: false },
  { label: "Fri 25", slot: false },
  { label: "Sat 26", slot: false },
];

function ScoreRing({ score }: { score: number }) {
  const r = 14;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  return (
    <div className="relative w-[34px] h-[34px] shrink-0">
      <svg width="34" height="34" viewBox="0 0 34 34">
        <circle cx="17" cy="17" r={r} fill="none" stroke="#eef0ec" strokeWidth="3" />
        <circle
          cx="17" cy="17" r={r}
          fill="none" stroke="#1e7d4f" strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          transform="rotate(-90 17 17)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-spectral font-bold text-[12px] text-[#15463b]">
        {score}
      </div>
    </div>
  );
}

export default function SundayCalendar({ onSelectBlog }: SundayCalendarProps) {
  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-6 md:p-[24px_28px] shadow-[0_1px_2px_rgba(60,48,28,0.04)]">

      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f]">
            Publication Schedule
          </div>
          <div className="font-spectral text-[20px] font-semibold text-[#15463b] mt-0.5">
            Weekly Blog Calendar · July 2026
          </div>
        </div>
        <div className="font-mono-spline text-[11px] text-[#1a5c44] bg-[#e7f4ea] px-3 py-1.5 rounded-lg border border-[#c4dfc9]">
          Weekly cycle triggers every Sunday at 4:00 AM
        </div>
      </div>

      {/* 7-Day Grid: Sun spans 2 cols, Mon–Sat each 1 col */}
      <div className="grid gap-2.5" style={{ gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr" }}>

        {/* SUNDAY — active, spans 2 cols visually via 2fr */}
        <div className="bg-[#f4faf6] border-2 border-[#15463b] rounded-[14px] p-3.5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="font-mono-spline text-[9.5px] font-bold text-[#15463b] uppercase">
              Sun 27 Jul
            </span>
            <span className="text-[8.5px] font-bold text-white bg-[#15463b] px-2 py-0.5 rounded-full">
              GENERATED
            </span>
          </div>

          {/* Blog 1 */}
          <motion.div
            whileHover={{ y: -2, boxShadow: "0 4px 14px rgba(21,70,59,0.12)" }}
            onClick={() => onSelectBlog(MOCK_BLOGS[0])}
            className="bg-white border border-[#d4e8dc] rounded-xl p-3.5 mb-2.5 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono-spline text-[8.5px] font-bold text-[#9a6a12] bg-[#f7e7c4] px-1.5 py-0.5 rounded uppercase">
                Blog 1 · Advisory
              </span>
              <ScoreRing score={MOCK_BLOGS[0].score} />
            </div>
            <h4 className="font-spectral text-[14.5px] font-semibold text-[#15463b] mt-2 leading-snug">
              {MOCK_BLOGS[0].title}
            </h4>
            <div className="flex justify-between items-center mt-2.5 text-[11px] text-[#6f6757]">
              <span>{MOCK_BLOGS[0].wordCount} words</span>
              <span className="text-[#1e7d4f] font-semibold">Read article →</span>
            </div>
          </motion.div>

          {/* Blog 2 */}
          <motion.div
            whileHover={{ y: -2, boxShadow: "0 4px 14px rgba(21,70,59,0.12)" }}
            onClick={() => onSelectBlog(MOCK_BLOGS[1])}
            className="bg-white border border-[#d4e8dc] rounded-xl p-3.5 cursor-pointer"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono-spline text-[8.5px] font-bold text-[#9a6a12] bg-[#f7e7c4] px-1.5 py-0.5 rounded uppercase">
                Blog 2 · Consultant
              </span>
              <ScoreRing score={MOCK_BLOGS[1].score} />
            </div>
            <h4 className="font-spectral text-[14.5px] font-semibold text-[#15463b] mt-2 leading-snug">
              {MOCK_BLOGS[1].title}
            </h4>
            <div className="flex justify-between items-center mt-2.5 text-[11px] text-[#6f6757]">
              <span>{MOCK_BLOGS[1].wordCount} words</span>
              <span className="text-[#1e7d4f] font-semibold">Read article →</span>
            </div>
          </motion.div>
        </div>

        {/* MON – SAT: muted no-slot cells */}
        {WEEK_DAYS.map((d) => (
          <div key={d.label} className="bg-[#fdfcf8] border border-[#ece3d1] rounded-xl p-3 opacity-70 flex flex-col">
            <div className="font-mono-spline text-[9px] font-bold text-[#9b927f] uppercase">{d.label}</div>
            <div className="text-[12px] text-[#8a8273] mt-3 italic">No blog slot</div>
          </div>
        ))}

      </div>
    </div>
  );
}
