"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import NavTabs from "./NavTabs";
import UserDropdownMenu from "./UserDropdownMenu";
import { Bell, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useBusiness } from "../../context/BusinessContext";
import { WonderscoreLogo } from "../ui/WonderscoreSpinner";
import { fetchApi, getScanHistory } from "../../lib/api";

export default function DashboardHeader() {
  const { activeBusiness } = useBusiness();
  const [historyPrevScore, setHistoryPrevScore] = useState<number | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  // Only show a score if activeBusiness.completeness is a real number > 0
  const rawScore = activeBusiness?.completeness ?? 0;
  const scoreDisplay = rawScore > 0 ? rawScore : null;

  useEffect(() => {
    // Reset on business change
    setHistoryPrevScore(null);
    setHasScanned(false);

    if (!activeBusiness?.url) return;

    // Check client-side recorded scan history first
    const localScans = getScanHistory(activeBusiness.url);
    if (localScans.length >= 1) {
      setHasScanned(true);
    }
    if (localScans.length >= 2) {
      // Current scan is at localScans[length - 1], previous scan is at localScans[length - 2]
      const prev = Math.round(localScans[localScans.length - 2].score);
      setHistoryPrevScore(prev);
      return;
    }

    // Fallback: query backend (only if we have a real score to compare against)
    if (rawScore > 0) {
      fetchApi<any>(`/api/user/history/site-trend?site=${encodeURIComponent(activeBusiness.url)}`)
        .then((res) => {
          if (res && Array.isArray(res.points) && res.points.length >= 2) {
            setHasScanned(true);
            setHistoryPrevScore(Math.round(res.points[res.points.length - 2].score));
          } else if (res && Array.isArray(res.points) && res.points.length === 1) {
            setHasScanned(true);
            setHistoryPrevScore(null);
          }
        })
        .catch(() => {});
    }
  }, [activeBusiness?.url, activeBusiness?.id, activeBusiness?.completeness]);

  // Only compute delta if we have both a current score and a previous one
  const delta = (scoreDisplay !== null && historyPrevScore !== null)
    ? Math.round(scoreDisplay - historyPrevScore)
    : null;

  const direction = delta === null ? "none" : delta > 0 ? "up" : delta < 0 ? "down" : "flat";

  // Score ring fill: only fill if we have a real score
  const r = 28;
  const circ = 2 * Math.PI * r; // ≈ 175.9
  const ringFill = scoreDisplay !== null ? (scoreDisplay / 100) * circ : 0;

  return (
    <div className="sticky top-0 z-50 bg-[#fdfcf8]/95 backdrop-blur-md pt-4 pb-2 transition-all">
      <div className="max-w-[1180px] mx-auto px-4 md:px-9">
        <div className="bg-white border border-[#ece3d1] rounded-[18px] shadow-[0_4px_20px_rgba(60,48,28,0.06)]">
          {/* Top Header Row */}
          <div className="flex flex-wrap items-center gap-3 md:gap-4 p-4 md:px-5 md:py-3.5">
            {/* Logo */}
            <Link
              href="/overview"
              className="flex items-center gap-2.5 shrink-0"
            >
              <WonderscoreLogo size={32} color="#15463b" />
              <span className="font-spectral text-[25px] font-medium tracking-tight text-[#15463b]">
                Wonderscore
              </span>
            </Link>

            {/* Active Business Info & Dynamic Score Trend */}
            <div className="hidden lg:block shrink-0 pl-3.5 border-l border-[#efe7d6]">
              <div className="text-[15.5px] font-medium text-[#23211b] leading-snug">
                {activeBusiness.name}
              </div>
              <div className="text-[12px] text-[#9b927f] leading-tight mb-1">
                <div>{activeBusiness.category}</div>
                <div>{activeBusiness.location}</div>
              </div>

              {/* Trend badge — only shown after at least one scan */}
              {!hasScanned && scoreDisplay === null ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#9b927f] bg-[#f6f3ec] border border-[#ece3d1] px-2.5 py-0.5 rounded-full">
                  <Activity className="w-3 h-3 text-[#b3a98f]" />
                  Not yet scanned
                </span>
              ) : direction === "up" ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#15803d] bg-[#dcfce7] border border-[#bbf7d0] px-2.5 py-0.5 rounded-full">
                  <TrendingUp className="w-3 h-3 text-[#15803d]" />
                  Score Up
                </span>
              ) : direction === "down" ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#b91c1c] bg-[#fee2e2] border border-[#fca5a5] px-2.5 py-0.5 rounded-full">
                  <TrendingDown className="w-3 h-3 text-[#b91c1c]" />
                  Score Down
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#6f6757] bg-[#f6f3ec] border border-[#ece3d1] px-2.5 py-0.5 rounded-full">
                  <Activity className="w-3 h-3 text-[#8a8273]" />
                  Score Steady
                </span>
              )}
            </div>

            {/* Score Badge */}
            <div className="hidden sm:flex items-center gap-3 shrink-0 pl-4 border-l border-[#efe7d6]">
              <div className="relative w-[62px] h-[62px]">
                <svg width="62" height="62" viewBox="0 0 66 66">
                  <circle cx="33" cy="33" r={r} fill="none" stroke="#eef0ec" strokeWidth="6" />
                  {scoreDisplay !== null && (
                    <circle
                      cx="33" cy="33" r={r}
                      fill="none"
                      stroke={delta !== null && delta < 0 ? "#b91c1c" : "#1a5c44"}
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${ringFill} ${circ}`}
                      transform="rotate(-90 33 33)"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                  {scoreDisplay !== null ? (
                    <>
                      <span className="num font-spectral font-medium text-[20px] text-[#15463b]">
                        {scoreDisplay}
                      </span>
                      <span className="num text-[9px] text-[#9b927f] mt-0.5">/100</span>
                    </>
                  ) : (
                    <span className="num font-spectral font-medium text-[17px] text-[#c2b69c]">—</span>
                  )}
                </div>
              </div>

              <div>
                <div className="font-mono-spline text-[9.5px] uppercase tracking-wider text-[#9b927f]">
                  Score
                </div>
                {scoreDisplay !== null ? (
                  <>
                    <div className={`num text-[13.5px] font-medium mt-0.5 ${
                      delta !== null && delta > 0 ? "text-[#15803d]" :
                      delta !== null && delta < 0 ? "text-[#b91c1c]" :
                      "text-[#6f6757]"
                    }`}>
                      {delta !== null && delta > 0 ? `+${delta} points` :
                       delta !== null && delta < 0 ? `${delta} points` :
                       delta === 0 ? "Steady score" :
                       `${scoreDisplay}/100`}
                    </div>
                    <div className="text-[11px] text-[#9b927f]">
                      {delta !== null ? "vs last scan" : "first scan"}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="num text-[13px] font-medium mt-0.5 text-[#b3a98f]">No scan yet</div>
                    <div className="text-[11px] text-[#b3a98f]">run analyser</div>
                  </>
                )}
              </div>
            </div>

            {/* Plan Card */}
            <Link
              href="/plan"
              className="ob hidden lg:flex items-center gap-3 shrink-0 bg-[#f6f3ec] border border-[#ece3d1] rounded-[13px] px-3.5 py-2.5 w-[160px] h-[74px] ml-4 text-none hover:bg-[#eee9de] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[#e7f4ea] flex items-center justify-center shrink-0 text-[#1a5c44]">
                <Image
                  src="/icons/sidebar/shield.svg"
                  width={18}
                  height={18}
                  alt="Shield"
                  className="w-[18px] h-[18px]"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono-spline text-[9px] uppercase tracking-wider text-[#8a8273]">
                  Your plan
                </div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="num font-spectral text-[19px] font-medium text-[#15463b]">
                    Pro
                  </span>
                </div>
                <div className="text-[10.5px] text-[#8a8273] truncate font-normal">
                  Active Subscription
                </div>
              </div>
            </Link>

            {/* User Profile Dropdown Menu */}
            <div className="hidden sm:flex items-center gap-4 shrink-0 ml-auto pl-4 border-l border-[#efe7d6]">
              <div className="relative cursor-pointer text-[#9b927f] hover:text-[#15463b] transition-colors">
                <Bell className="w-5 h-5" />
                <span className="num absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#15463b] text-white text-[9.5px] font-medium flex items-center justify-center">
                  2
                </span>
              </div>

              <UserDropdownMenu />
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <NavTabs />
        </div>
      </div>
    </div>
  );
}
