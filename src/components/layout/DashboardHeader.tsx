"use client";

import { classifyChange } from "../../lib/scoreChange";
import BusinessSwitcher from "./BusinessSwitcher";
import NotificationBell from "./NotificationBell";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import NavTabs from "./NavTabs";
import UserDropdownMenu from "./UserDropdownMenu";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useBusiness } from "../../context/BusinessContext";
import { WonderscoreLogo } from "../ui/WonderscoreSpinner";
import { fetchApi } from "../../lib/api";
import ScoreBreakdownPopover from "../ui/ScoreBreakdown";

export default function DashboardHeader() {
  const { activeBusiness } = useBusiness();
  const hasBusiness = Boolean(activeBusiness?.id);
  const [historyPrevScore, setHistoryPrevScore] = useState<number | null>(null);
  const [hasScanned, setHasScanned] = useState(false);

  // The Wonder Score of the latest COMPLETE scan run (J6) - it never moves
  // mid-run. While a run is in flight we say "Calculating…" and keep this
  // last complete score on screen.
  const calculating = Boolean(activeBusiness?.scanRunActive);
  const rawScore = activeBusiness?.hasVisibilityScore ? (activeBusiness?.completeness ?? 0) : 0;
  const scoreDisplay = rawScore > 0 ? rawScore : null;

  useEffect(() => {
    // Reset on business change
    setHistoryPrevScore(null);
    setHasScanned(false);

    if (!activeBusiness?.url) return;

    // Previous score = the previous COMPLETE run's Wonder Score. (The old
    // browser-local history held Analyzer-only technical scores, which are
    // not comparable with the Wonder Score.)
    if (rawScore > 0) {
      fetchApi<any>(`/api/user/history/site-trend?site=${encodeURIComponent(activeBusiness.url)}&metric=wonder`)
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

  // D8: the badge says what the trend says (and a move inside the noise margin is "steady")
  const trend = classifyChange(delta, activeBusiness?.latestWonderInputs?.score_margin);

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
              className="flex items-center gap-2 sm:gap-2.5 shrink-0"
            >
              <WonderscoreLogo size={28} color="#15463b" className="sm:hidden" />
              <WonderscoreLogo size={32} color="#15463b" className="hidden sm:block" />
              <span className="font-spectral text-[20px] sm:text-[25px] font-medium tracking-tight text-[#15463b]">
                Wonderscore
              </span>
            </Link>

            {/* Mobile-only compact score pill - the full ring badge below stays
                sm:+ only (hidden sm:flex), so this is the one place a mobile
                visitor can see their score at all without it colliding with
                the logo + bell/avatar row. */}
            {hasBusiness && (
              <div className="flex sm:hidden items-center gap-1.5 shrink-0">
                {calculating ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#92400e] bg-[#fef3c7] border border-[#fde68a] px-2.5 py-1 rounded-full animate-pulse">
                    Calculating…{scoreDisplay !== null ? ` (last ${scoreDisplay})` : ""}
                  </span>
                ) : scoreDisplay !== null ? (
                  <span className="num inline-flex items-center gap-1 text-[12px] font-bold text-[#15463b] bg-[#eef3f0] border border-[#d0e4d6] px-2.5 py-1 rounded-full">
                    {scoreDisplay}
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-white bg-[#8a8273] px-2.5 py-1 rounded-full">
                    Not Scanned
                  </span>
                )}
              </div>
            )}

            {/* G7: below lg the business name is a compact switcher on its own */}
            {hasBusiness && (
              <div className="lg:hidden min-w-0 flex-1 sm:flex-none">
                <BusinessSwitcher compact />
              </div>
            )}

                        {/* Active Business Info & Dynamic Score Trend - Expanded Layout */}
            <div className="hidden lg:block flex-1 min-w-0 pl-3.5 border-l border-[#efe7d6]">
              {hasBusiness ? (
                <>
                  <BusinessSwitcher />
                  <div className="text-[12px] text-[#9b927f] leading-tight mb-1 truncate">
                    <span>{activeBusiness.category}</span>
                    <span className="mx-1 text-[#d8cfbd]">·</span>
                    <span>{activeBusiness.location}</span>
                  </div>

                  {/* Dynamic Score Status Pill */}
                  {scoreDisplay === null ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-[#8a8273] px-2.5 py-0.5 rounded-full">
                      - Not Scanned
                    </span>
                  ) : trend.kind === "up" ? (
                    <span className="num inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-[#1e7d4f] px-2.5 py-0.5 rounded-full">
                      ▲ Up {Math.abs(trend.delta)} since last run
                    </span>
                  ) : trend.kind === "down" ? (
                    <span className="num inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-[#b1442a] px-2.5 py-0.5 rounded-full">
                      ▼ Down {Math.abs(trend.delta)} since last run
                    </span>
                  ) : trend.kind === "noise" ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4d4636] bg-[#efe7d6] px-2.5 py-0.5 rounded-full">
                      Steady since last run
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#4d4636] bg-[#efe7d6] px-2.5 py-0.5 rounded-full">
                      First scored run
                    </span>
                  )}
                </>
              ) : (
                <>
                  <div className="text-[13.5px] font-semibold text-[#8a8273] leading-snug">
                    No business added yet
                  </div>
                  <div className="text-[12px] text-[#b3a98f] leading-tight mb-1">
                    Add one to start tracking AI visibility
                  </div>
                  <Link
                    href="/settings?tab=entity"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#15463b] hover:underline"
                  >
                    + Add a business
                  </Link>
                </>
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
                      stroke="#1a5c44"
                      strokeWidth="6"
                      strokeLinecap="round"
                      strokeDasharray={`${ringFill} ${circ}`}
                      transform="rotate(-90 33 33)"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                  {scoreDisplay !== null ? (
                    <span className="num font-spectral font-medium text-[20px] text-[#15463b]">
                      {scoreDisplay}
                    </span>
                  ) : (
                    <span className="num font-spectral font-medium text-[17px] text-[#c2b69c]">-</span>
                  )}
                </div>
              </div>

              <div>
                <div className="font-mono-spline text-[11px] uppercase tracking-wider text-[#6f6757]">
                  Wonder Score
                </div>
                {calculating ? (
                  <>
                    <div className="num text-[13px] font-medium mt-0.5 text-[#92400e] animate-pulse">Calculating…</div>
                    {scoreDisplay !== null && (
                      <div className="text-[11px] text-[#9b927f]">Last complete run: {scoreDisplay}</div>
                    )}
                  </>
                ) : scoreDisplay !== null ? (
                  <>
                    <div className="text-[11px] text-[#9b927f]">
                      {scoreDisplay >= 80 ? "High AI Visibility" : scoreDisplay >= 65 ? "Good AI Visibility" : scoreDisplay >= 50 ? "Moderate Visibility" : "Low Visibility"}
                    </div>
                    <ScoreBreakdownPopover inputs={activeBusiness?.latestWonderInputs} score={activeBusiness?.latestWonderScore} />
                  </>
                ) : activeBusiness?.lastCrawl?.ok === false ? (
                  <>
                    <div className="text-[12.5px] font-medium mt-0.5 text-[#b1442a]">Score not available</div>
                    <Link href="/analyser?rescan=1" className="text-[11px] text-[#b1442a] hover:underline">
                      Website scan failed - Retry
                    </Link>
                  </>
                ) : (
                  <>
                    {activeBusiness?.latestPhase1At ? (
                      <>
                        <div className="num text-[13px] font-medium mt-0.5 text-[#b3a98f]">No score yet</div>
                        <Link href="/query" className="text-[11px] text-[#b3a98f] hover:text-[#15463b] hover:underline">
                          Website scanned - run Search Tracker to get your score
                        </Link>
                      </>
                    ) : (
                      <>
                        <div className="num text-[13px] font-medium mt-0.5 text-[#b3a98f]">Not yet scanned</div>
                        <Link href="/analyser" className="text-[11px] text-[#b3a98f] hover:text-[#15463b] hover:underline">
                          Scan your website to get started
                        </Link>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Subscription card - moved here from the old top-level "Plan" nav
                tab, which now points to the weekly action-plan page instead
                (see Part 4 of the platform-flow spec: billing lives in the
                account menu, not as its own nav tab). */}
            <Link
              href="/settings?tab=billing"
              className="ob hidden lg:flex items-center gap-3 shrink-0 bg-[#f6f3ec] border border-[#ece3d1] rounded-[13px] px-3.5 py-2.5 w-[160px] h-[74px] text-none hover:bg-[#eee9de] transition-colors"
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
                <div className="font-mono-spline text-[11px] uppercase tracking-wider text-[#6f6757]">
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

            {/* User Profile Dropdown Menu - was hidden entirely below sm with
                no substitute, leaving mobile with no way to reach account/
                sign-out at all. Now always visible; UserDropdownMenu already
                hides the name/email text below md on its own, so this stays
                compact (bell + avatar) on mobile and identical to before at
                sm and up. */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0 ml-auto pl-3 sm:pl-4 border-l border-[#efe7d6]">
              <NotificationBell />

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
