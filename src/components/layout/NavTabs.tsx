"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { NAV_ITEMS } from "../../constants/navigation";

export default function NavTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center justify-between gap-5 px-6 border-t border-[#efe7d6]">
      <div className="flex gap-7 font-semibold text-[14.5px] text-[#8a8273]">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href === "/overview" && pathname === "/");

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`relative inline-flex items-center gap-2 py-3.5 cursor-pointer transition-colors ${
                isActive ? "text-[#15463b] font-bold" : "hover:text-[#23211b]"
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

      <div className="num hidden md:flex items-center gap-2.5 text-[12.5px] text-[#9b927f] text-right leading-tight">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#b3a98f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <div>
          <div className="text-[#3a352b] font-semibold">Updated today</div>
          <div>Next cycle Sunday 4:00 AM</div>
        </div>
      </div>
    </div>
  );
}
