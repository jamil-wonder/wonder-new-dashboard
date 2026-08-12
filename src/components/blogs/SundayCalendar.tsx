"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Lock, ChevronLeft, ChevronRight, BookOpen, ArrowRight } from "lucide-react";
import { WonderscoreSpinner } from "../ui/WonderscoreSpinner";
import { fetchApi } from "../../lib/api";

interface SundayCalendarProps {
  weeklyData: any;
  isLoading: boolean;
  isGenerating: boolean;
  onEnsureWeekly: (force?: boolean) => void;
  onSelectBlog: (blog: any) => void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function WonderscoreLogoIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
    </svg>
  );
}

const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

const startOfSundayWeek = (date: Date) => {
  const next = startOfDay(date);
  next.setDate(next.getDate() - next.getDay());
  return next;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const isSameDate = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const getMonthGrid = (monthDate: Date) => {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const gridStart = startOfSundayWeek(first);
  return Array.from({ length: 35 }, (_, index) => addDays(gridStart, index));
};

function MiniScoreRing({ score }: { score: number }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(score || 0)));
  const r = 12;
  const circ = 2 * Math.PI * r;
  const fill = (safeScore / 100) * circ;
  return (
    <div className="relative w-7 h-7 shrink-0 flex items-center justify-center">
      <svg width="28" height="28" viewBox="0 0 28 28">
        <circle cx="14" cy="14" r="14" fill="none" stroke="#eef0ec" strokeWidth="2" />
        <circle
          cx="14" cy="14" r={r}
          fill="none" stroke="#1e7d4f" strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={`${fill} ${circ}`}
          transform="rotate(-90 14 14)"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-spectral font-medium text-[10px] text-[#15463b]">
        {safeScore}
      </span>
    </div>
  );
}

export default function SundayCalendar({
  weeklyData,
  isLoading,
  isGenerating,
  onEnsureWeekly,
  onSelectBlog,
}: SundayCalendarProps) {
  const [usageInfo, setUsageInfo] = useState<{ remaining: number; used: number; total: number }>({ remaining: 0, used: 2, total: 2 });
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  const today = useMemo(() => startOfDay(new Date()), []);
  const daysGrid = useMemo(() => getMonthGrid(currentMonthDate), [currentMonthDate]);

  const drafts = Array.isArray(weeklyData?.drafts) ? weeklyData.drafts : [];

  useEffect(() => {
    fetchApi<any>("/api/blogs/usage")
      .then((res) => {
        if (res && typeof res.remaining === "number") {
          const limitVal = res.limit || res.total || 2;
          const usedVal = typeof res.used === "number" ? res.used : (limitVal - res.remaining);
          setUsageInfo({
            used: usedVal,
            remaining: res.remaining,
            total: limitVal,
          });
        }
      })
      .catch(() => {});
  }, [weeklyData]);

  const monthYearLabel = currentMonthDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const handlePrevMonth = () => {
    const prev = new Date(currentMonthDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentMonthDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentMonthDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentMonthDate(next);
  };

  const handleGoToToday = () => {
    setCurrentMonthDate(new Date());
  };

  const currentSundayWeek = startOfSundayWeek(today);

  // The 7x5 grid only ever shows real content on Sunday cells — every other
  // day is a bare "-". Rather than squeezing that whole grid into a phone
  // screen (illegible at ~35px/column), mobile gets a simple stacked list
  // of just the Sundays, reusing this exact same content logic so desktop
  // and mobile can never drift out of sync.
  const renderSundayCellContent = (day: Date, isCurrentSundayWeek: boolean, isFutureSunday: boolean, isPastSunday: boolean, inMonth: boolean) => (
    <>
      {isCurrentSundayWeek && (
        drafts.length > 0 ? (
          <div className="space-y-1.5">
            {drafts.slice(0, 2).map((draft: any, index: number) => {
              const score = draft.humanizedScore || draft.score || 94;
              const wordCnt = draft.wordCount || (draft.sections ? draft.sections.reduce((acc: number, s: any) => acc + (s.content || "").split(/\s+/).length, 0) : 1200);

              return (
                <motion.div
                  key={draft.id || index}
                  whileHover={{ y: -1 }}
                  onClick={() => onSelectBlog(draft)}
                  className="bg-white border border-[#d4e8dc] hover:border-[#15463b] rounded-md p-2.5 cursor-pointer transition-all group"
                >
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <span className="font-mono-spline text-[8px] font-medium text-[#9a6a12] bg-[#f7e7c4] px-1.5 py-0.2 rounded-sm uppercase tracking-wider">
                      Blog {index + 1} · {index === 0 ? "Advisory" : "Strategic"}
                    </span>
                    <MiniScoreRing score={score} />
                  </div>

                  <h4 className="font-spectral text-[14px] font-bold text-[#15463b] leading-tight line-clamp-2 group-hover:underline">
                    {draft.title}
                  </h4>

                  <p className="text-[11px] text-[#554e41] mt-1 line-clamp-1 leading-normal font-normal">
                    {draft.excerpt || draft.metaDescription || "Structured AI article"}
                  </p>

                  <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-[#f0f7f2] text-[10.5px] text-[#6f6757]">
                    <span className="font-normal">{wordCnt} words</span>
                    <span className="text-[#1e7d4f] font-medium inline-flex items-center gap-1">
                      Read article <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <button
            onClick={() => onEnsureWeekly(true)}
            className="w-full text-center p-2 rounded-md border border-dashed border-[#d4e8dc] bg-white text-[11px] font-medium text-[#15463b] hover:bg-[#eef3f0] transition-colors cursor-pointer"
          >
            + Generate Weekly Articles
          </button>
        )
      )}

      {isFutureSunday && (
        <div className="p-2 rounded-md border border-dashed border-[#e6d3a8] bg-[#fcfaf5] text-center">
          <div className="flex items-center justify-center gap-1 text-[9.5px] font-medium text-[#9a6a12] uppercase tracking-wider mb-0.5">
            <Lock className="w-3 h-3" />
            <span>Locked</span>
          </div>
          <span className="block text-[10px] text-[#8a8273] font-normal leading-tight">
            2 articles unlock Sun {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        </div>
      )}

      {isPastSunday && inMonth && (
        <div className="p-1.5 rounded-md border border-[#efe7d6] bg-[#fdfcf8] text-center text-[10px] text-[#9b927f]">
          <BookOpen className="w-3 h-3 text-[#b3a98f] mx-auto mb-0.5 opacity-60" />
          <span>Completed Cycle</span>
        </div>
      )}
    </>
  );

  return (
    <div className="bg-white border border-[#ece3d1] rounded-lg p-3 sm:p-5 md:p-6 shadow-[0_1px_2px_rgba(60,48,28,0.03)] space-y-4">

      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap pb-3 border-b border-[#efe7d6]">

        {/* Month Navigation & Today Button */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap gap-y-2">
          <h3 className="font-spectral text-[15px] sm:text-[19px] font-medium text-[#15463b]">
            Weekly Blog Calendar
          </h3>

          <div className="flex items-center gap-1 bg-[#fdfcf8] border border-[#e2d8c4] rounded-md p-0.5">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-[#f5f0e6] rounded text-[#6f6757] hover:text-[#15463b] transition-colors cursor-pointer"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="font-spectral font-medium text-[13px] text-[#15463b] px-1.5">
              {monthYearLabel}
            </span>

            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-[#f5f0e6] rounded text-[#6f6757] hover:text-[#15463b] transition-colors cursor-pointer"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleGoToToday}
            className="px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider text-[#15463b] bg-[#f5f0e6] hover:bg-[#eef3f0] border border-[#e2d8c4] rounded-md transition-colors cursor-pointer"
          >
            Today
          </button>
        </div>

        {/* Right Controls: Regenerate Button + Compact Limit Score Card */}
        <div className="flex items-center gap-2.5 self-center">
          
          {/* Regenerate Button with Primary Background (Only shown if remaining > 0) */}
          {usageInfo.remaining > 0 && (
            <button
              onClick={() => onEnsureWeekly(true)}
              disabled={isGenerating || isLoading}
              title="Re-generate fresh weekly AI SEO blogs"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-[12.5px] font-medium bg-[#15463b] text-white hover:bg-[#10362d] transition-all cursor-pointer disabled:opacity-50 shrink-0 border border-[#15463b]"
            >
              <WonderscoreLogoIcon className="w-3.5 h-3.5 text-white" />
              <span>Regenerate</span>
            </button>
          )}

          {/* Compact Weekly Limit Card */}
          <div className="flex items-center gap-2.5 bg-[#fdfcf8] border border-[#ece3d1] px-3 py-1 rounded-md h-9">
            <div>
              <div className="font-mono-spline text-[8px] tracking-wider text-[#9b927f] uppercase font-medium">
                Weekly Limit
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-spectral text-[16px] font-medium text-[#15463b] leading-none">
                  {Math.min(usageInfo.used, usageInfo.total)}
                </span>
                <span className="text-[10.5px] text-[#9b927f] font-normal">/ {usageInfo.total}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Loading State */}
      {isLoading || isGenerating ? (
        <div className="py-16 text-center flex flex-col items-center justify-center border border-dashed border-[#ece3d1] rounded-md bg-[#fdfcf8] my-2">
          <WonderscoreSpinner
            size={44}
            label={isGenerating ? "Generating weekly blog drafts" : "Loading weekly blogs"}
            note={isGenerating ? "This can take 1-5 minutes. You can move around the dashboard and come back." : undefined}
          />
          <p className="text-[13px] text-[#8a8273] max-w-[420px] mx-auto mt-2 font-normal">
            {isGenerating
              ? "Creating two drafts from the saved business profile, voice, and focus keywords."
              : "Checking the saved weekly calendar."}
          </p>
        </div>
      ) : (
        <>
        {/* Full 7-Day Sun-Sat Month Grid (Sunday column wider) — desktop
            only below; a phone can't fit 7 columns legibly, so it gets a
            simple stacked list of just the Sundays instead (see below). */}
        <div className="hidden sm:block border border-[#ece3d1] rounded-md overflow-hidden bg-white">

          {/* Day Headers (Sun - Sat) */}
          <div className="grid border-b border-[#ece3d1] bg-[#fdfcf8]" style={{ gridTemplateColumns: "2.4fr 1fr 1fr 1fr 1fr 1fr 1fr" }}>
            {DAY_LABELS.map((day, idx) => (
              <div
                key={day}
                className={`py-1.5 text-center font-mono-spline text-[9.5px] font-medium uppercase tracking-wider ${
                  idx === 0 ? "text-[#15463b] bg-[#eef3f0]/80" : "text-[#9b927f]"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Cells Grid */}
          <div className="grid divide-x divide-y divide-[#ece3d1]" style={{ gridTemplateColumns: "2.4fr 1fr 1fr 1fr 1fr 1fr 1fr" }}>
            {daysGrid.map((day) => {
              const inMonth = day.getMonth() === currentMonthDate.getMonth();
              const isTodayDate = isSameDate(day, today);
              const isSunday = day.getDay() === 0;

              const isCurrentSundayWeek = isSunday && isSameDate(day, currentSundayWeek);
              const isFutureSunday = isSunday && day > currentSundayWeek;
              const isPastSunday = isSunday && day < currentSundayWeek;

              return (
                <div
                  key={day.toISOString()}
                  className={`p-2 flex flex-col justify-between transition-colors ${
                    isSunday ? "min-h-[140px]" : "min-h-[100px]"
                  } ${inMonth ? "bg-white" : "bg-[#fcfbf8] opacity-50"} ${
                    isCurrentSundayWeek ? "bg-[#f4faf6]" : ""
                  }`}
                >
                  {/* Top Cell Bar */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[11px] font-medium ${
                        isTodayDate
                          ? "bg-[#15463b] text-white"
                          : inMonth
                          ? "text-[#3a352b]"
                          : "text-[#c2b69c]"
                      }`}
                    >
                      {day.getDate()}
                    </span>

                    {isSunday && (
                      <span
                        className={`text-[8px] font-medium uppercase tracking-wider px-1.5 py-0.2 rounded-sm ${
                          isCurrentSundayWeek
                            ? "bg-[#15463b] text-white"
                            : isFutureSunday
                            ? "bg-[#f7e7c4] text-[#9a6a12]"
                            : "bg-[#efe7d6] text-[#8a8273]"
                        }`}
                      >
                        {isCurrentSundayWeek ? "Active Cycle" : isFutureSunday ? "Locked" : "Past"}
                      </span>
                    )}
                  </div>

                  {/* Cell Content */}
                  <div className="flex-1 flex flex-col justify-center">
                    {isSunday ? (
                      renderSundayCellContent(day, isCurrentSundayWeek, isFutureSunday, isPastSunday, inMonth)
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <span className="text-[10px] text-[#d8cfbd] font-normal italic">-</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Mobile: stacked list of just this month's Sundays — the only
            cells with real content. */}
        <div className="sm:hidden space-y-3">
          {daysGrid
            .filter((day) => day.getDay() === 0)
            .map((day) => {
              const inMonth = day.getMonth() === currentMonthDate.getMonth();
              const isCurrentSundayWeek = isSameDate(day, currentSundayWeek);
              const isFutureSunday = day > currentSundayWeek;
              const isPastSunday = day < currentSundayWeek;

              return (
                <div
                  key={day.toISOString()}
                  className={`border border-[#ece3d1] rounded-md p-3 ${inMonth ? "bg-white" : "bg-[#fcfbf8] opacity-50"} ${isCurrentSundayWeek ? "bg-[#f4faf6] border-[#d4e8dc]" : ""}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-spectral font-medium text-[14px] text-[#15463b]">
                      Sun, {day.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                    <span
                      className={`text-[8.5px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                        isCurrentSundayWeek
                          ? "bg-[#15463b] text-white"
                          : isFutureSunday
                          ? "bg-[#f7e7c4] text-[#9a6a12]"
                          : "bg-[#efe7d6] text-[#8a8273]"
                      }`}
                    >
                      {isCurrentSundayWeek ? "Active Cycle" : isFutureSunday ? "Locked" : "Past"}
                    </span>
                  </div>
                  {renderSundayCellContent(day, isCurrentSundayWeek, isFutureSunday, isPastSunday, inMonth)}
                </div>
              );
            })}
        </div>
        </>
      )}
    </div>
  );
}
