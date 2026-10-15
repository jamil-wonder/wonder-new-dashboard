"use client";

import Image from "next/image";
import SegmentedControl from "../ui/SegmentedControl";

interface AdminTabNavProps {
  activeSub: string;
  onSelectSub: (sub: string) => void;
}

const TABS = [
  { id: "overview", label: "Overview", icon: "/icons/sidebar/dashboard.svg" },
  { id: "users", label: "Users", icon: "/icons/sidebar/user.svg" },
  { id: "ai-usage", label: "AI Usage", icon: "/icons/sidebar/ai.svg" },
];

export default function AdminTabNav({ activeSub, onSelectSub }: AdminTabNavProps) {
  return (
    <SegmentedControl
      ariaLabel="Admin sections"
      options={TABS.map((t) => ({ id: t.id, label: t.label }))}
      value={activeSub}
      onChange={onSelectSub}
      className="flex bg-[#f6f3ec] p-1.5 border border-[#ece3d1] rounded-xl gap-1 mb-6 w-fit"
      itemClassName={(isActive) =>
        `relative flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-bold border-none transition-colors cursor-pointer whitespace-nowrap z-10 ${
          isActive ? "text-white" : "text-[#6f6757] hover:text-[#23211b] bg-transparent"
        }`
      }
      gliderId="activeAdminTabPill"
      gliderClassName="absolute inset-0 bg-[#15463b] rounded-lg shadow-sm"
      renderOption={(opt, isActive) => {
        const t = TABS.find((x) => x.id === opt.id)!;
        return (
          <>
            <Image
              src={t.icon}
              width={16}
              height={16}
              alt=""
              className="w-4 h-4 relative z-10"
              style={{ filter: isActive ? "brightness(0) invert(1)" : "brightness(0) opacity(0.55)" }}
            />
            <span className="relative z-10">{t.label}</span>
          </>
        );
      }}
    />
  );
}
