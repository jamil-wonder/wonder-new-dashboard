"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { NAV_ITEMS } from "../../constants/navigation";

function getWeeklyCycleInfo() {
  const now = new Date();
  
  // Find the most recent Sunday 6:00 AM cycle timestamp
  const lastSunday = new Date(now);
  const dayOfWeek = lastSunday.getDay(); // 0 = Sunday
  
  // If today is Sunday but before 6:00 AM, the last cycle was 7 days ago
  if (dayOfWeek === 0 && lastSunday.getHours() < 6) {
    lastSunday.setDate(lastSunday.getDate() - 7);
  } else {
    lastSunday.setDate(lastSunday.getDate() - dayOfWeek);
  }
  lastSunday.setHours(6, 0, 0, 0);

  // Check if last Sunday 6:00 AM is today
  const isToday =
    now.getFullYear() === lastSunday.getFullYear() &&
    now.getMonth() === lastSunday.getMonth() &&
    now.getDate() === lastSunday.getDate();

  // Check if last Sunday was yesterday
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    yesterday.getFullYear() === lastSunday.getFullYear() &&
    yesterday.getMonth() === lastSunday.getMonth() &&
    yesterday.getDate() === lastSunday.getDate();

  let relativeText = "Updated last Sunday";
  if (isToday) relativeText = "Updated today";
  else if (isYesterday) relativeText = "Updated yesterday";

  const dateStr = lastSunday.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  
  const detailText = isToday ? "Sunday 6:00 AM" : `Sunday (${dateStr}) 6:00 AM`;

  return { relativeText, detailText };
}

export default function NavTabs() {
  const pathname = usePathname();
  const [cycleInfo, setCycleInfo] = useState({ relativeText: "Updated today", detailText: "Sunday 6:00 AM" });

  useEffect(() => {
    setCycleInfo(getWeeklyCycleInfo());
  }, []);

  return (
    <div className="flex items-center justify-between gap-5 px-6 border-t border-[#efe7d6]">
      <div className="flex gap-7 font-medium text-[14.5px] text-[#8a8273]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href === "/overview" && pathname === "/");

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative inline-flex items-center gap-2 py-3.5 cursor-pointer transition-colors ${
                isActive ? "text-[#15463b] font-medium" : "hover:text-[#23211b]"
              }`}
            >
              <Image
                src={item.iconPath}
                width={18}
                height={18}
                alt={item.label}
                className="w-[18px] h-[18px] transition-all"
                style={{
                  filter: isActive
                    ? "brightness(0) saturate(100%) invert(23%) sepia(35%) saturate(836%) hue-rotate(119deg) brightness(91%) contrast(92%)"
                    : "brightness(0) opacity(0.5)",
                }}
              />
              <span>{item.label}</span>

              {/* Framer-Motion Gliding Active Indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#15463b]"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Dynamic Weekly Audit Cycle Header */}
      <div className="num hidden md:flex items-center gap-2.5 text-[12.5px] text-[#9b927f] text-right leading-tight font-normal">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#b3a98f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <div>
          <div className="text-[#3a352b] font-medium">{cycleInfo.relativeText}</div>
          <div>{cycleInfo.detailText}</div>
        </div>
      </div>
    </div>
  );
}
