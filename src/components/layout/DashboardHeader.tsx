"use client";

import Link from "next/link";
import Image from "next/image";
import NavTabs from "./NavTabs";
import { Bell } from "lucide-react";
import { useBusiness } from "../../context/BusinessContext";

export default function DashboardHeader() {
  const { activeBusiness } = useBusiness();

  return (
    <div className="sticky top-0 z-50 bg-[#fdfcf8]/95 backdrop-blur-md pt-4 pb-2 transition-all">
      <div className="max-w-[1180px] mx-auto px-4 md:px-9">
        <div className="bg-white border border-[#ece3d1] rounded-[18px] shadow-[0_4px_20px_rgba(60,48,28,0.06)]">
          
          {/* Top Header Row */}
          <div className="flex flex-wrap items-center gap-3 md:gap-4 p-4 md:px-5 md:py-3.5">
            
            {/* Logo */}
            <Link href="/overview" className="flex items-center gap-2.5 shrink-0">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#15463b">
                <path d="M12 1 C12.6 6.7 17.3 11.4 23 12 C17.3 12.6 12.6 17.3 12 23 C11.4 17.3 6.7 12.6 1 12 C6.7 11.4 11.4 6.7 12 1 Z"></path>
              </svg>
              <span className="font-spectral text-[25px] font-semibold tracking-tight text-[#15463b]">
                Wenderscore
              </span>
            </Link>

            {/* Active Business Info — driven by context */}
            <div className="hidden lg:block shrink-0 pl-3.5 border-l border-[#efe7d6]">
              <div className="text-[16px] font-bold text-[#23211b] leading-snug">
                {activeBusiness.name}
              </div>
              <div className="text-[12.5px] text-[#9b927f] leading-snug mb-1">
                {activeBusiness.category} · {activeBusiness.location}
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#1a5c44] bg-[#e7f4ea] px-2.5 py-0.5 rounded-full">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="6"></line>
                  <polyline points="6 12 12 6 18 12"></polyline>
                </svg>
                Good week
              </span>
            </div>

            {/* Score Badge */}
            <div className="hidden sm:flex items-center gap-3 shrink-0 pl-4 border-l border-[#efe7d6]">
              <div className="relative w-[62px] h-[62px]">
                <svg width="62" height="62" viewBox="0 0 66 66">
                  <circle cx="33" cy="33" r="28" fill="none" stroke="#eef0ec" strokeWidth="6"></circle>
                  <circle cx="33" cy="33" r="28" fill="none" stroke="#1a5c44" strokeWidth="6" strokeLinecap="round" strokeDasharray="137 176" transform="rotate(-90 33 33)"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
                  <span className="num font-spectral font-bold text-[20px] text-[#15463b]">78</span>
                  <span className="num text-[9px] text-[#9b927f] mt-0.5">/100</span>
                </div>
              </div>
              <div>
                <div className="font-mono-spline text-[9.5px] uppercase tracking-wider text-[#9b927f]">Score</div>
                <div className="num text-[14px] font-bold text-[#1e7d4f] mt-0.5">+4 points</div>
                <div className="text-[11.5px] text-[#9b927f]">vs last week</div>
              </div>
            </div>

            {/* Plan Card */}
            <Link
              href="/plan"
              className="ob hidden lg:flex items-center gap-3 shrink-0 bg-[#f6f3ec] border border-[#ece3d1] rounded-[13px] px-3.5 py-2.5 w-[230px] h-[74px] ml-4 text-none"
            >
              <div className="w-8 h-8 rounded-full bg-[#e7f4ea] flex items-center justify-center shrink-0 text-[#1a5c44]">
                <Image src="/icons/sidebar/shield.svg" width={18} height={18} alt="Shield" className="w-[18px] h-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-mono-spline text-[9px] uppercase tracking-wider text-[#8a8273]">Your plan</div>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="num font-spectral text-[19px] font-bold text-[#15463b]">3</span>
                  <span className="num text-[12.5px] text-[#9b927f]">/ 5</span>
                </div>
                <div className="text-[10.5px] text-[#8a8273] truncate">actions complete</div>
              </div>
            </Link>

            {/* User Profile */}
            <div className="hidden sm:flex items-center gap-4 shrink-0 ml-auto pl-4 border-l border-[#efe7d6]">
              <div className="relative cursor-pointer text-[#9b927f]">
                <Bell className="w-5 h-5" />
                <span className="num absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#15463b] text-white text-[10px] font-bold flex items-center justify-center">
                  2
                </span>
              </div>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <div className="w-9 h-9 rounded-full bg-[#15463b] text-white flex items-center justify-center font-spectral text-[16px]">
                  {activeBusiness.initial}
                </div>
                <span className="text-[13.5px] font-semibold text-[#3a352b]">Marcus Reed</span>
              </Link>
            </div>

          </div>

          {/* Navigation Tabs Bar */}
          <NavTabs />

        </div>
      </div>
    </div>
  );
}
