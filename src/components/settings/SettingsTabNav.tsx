"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface SettingsTabNavProps {
  activeSub: string;
  onSelectSub: (sub: string) => void;
}

export default function SettingsTabNav({ activeSub, onSelectSub }: SettingsTabNavProps) {
  const tabs = [
    { id: "account", label: "Account Info", icon: "/icons/sidebar/user.svg" },
    { id: "billing", label: "Billing", icon: "/icons/sidebar/shield.svg" },
    { id: "entity", label: "Business Profiles", icon: "/icons/sidebar/business.svg" },
    { id: "voice", label: "AI Voice & Keywords", icon: "/icons/sidebar/ai.svg" },
    { id: "saved-queries", label: "Saved Search Tracker", icon: "/icons/sidebar/ai.svg" },
    { id: "integrations", label: "Integrations", icon: "/icons/sidebar/integrate.svg" },
    { id: "crawlers", label: "Crawlers", icon: "/icons/sidebar/browser.svg" },
  ];

  return (
    <div className="flex bg-[#f6f3ec] p-1.5 border border-[#ece3d1] rounded-xl overflow-x-auto gap-1 mb-6">
      {tabs.map((t) => {
        const isActive = activeSub === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelectSub(t.id)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold border-none transition-colors cursor-pointer whitespace-nowrap z-10 ${
              isActive
                ? "text-white"
                : "text-[#6f6757] hover:text-[#23211b] bg-transparent"
            }`}
          >
            <Image
              src={t.icon}
              width={16}
              height={16}
              alt={t.label}
              className="w-4 h-4 transition-all relative z-10"
              style={{
                filter: isActive
                  ? "brightness(0) invert(1)"
                  : "brightness(0) opacity(0.55)",
              }}
            />
            <span className="relative z-10">{t.label}</span>

            {/* Framer Motion Gliding Active Pill */}
            {isActive && (
              <motion.div
                layoutId="activeSubPill"
                className="absolute inset-0 bg-[#15463b] rounded-lg shadow-sm z-0"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
