"use client";

import { MOCK_AUDIT_AREAS } from "../../constants/mockData";
import { MessageSquare, BookOpen, FileText, Layout, Search, Wrench } from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  MessageSquare,
  BookOpen,
  FileText,
  Layout,
  Search,
  Wrench,
};

export default function AreaScoreBars() {
  return (
    <div className="bg-[#fdfcf8] border border-[#ece3d1] rounded-2xl p-5 md:p-[22px_26px] mb-6">
      <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f] mb-4.5">
        Score Breakdown · 6 Weighted Audit Areas
      </div>
      <div className="flex flex-col gap-3.5">
        {MOCK_AUDIT_AREAS.map((item) => {
          const IconComponent = ICON_MAP[item.iconName] || FileText;
          return (
            <div key={item.id} className="flex items-center gap-3">
              <IconComponent className="w-4 h-4 text-[#7a7363] shrink-0" />
              <span className="w-[175px] text-[13.5px] text-[#23211b] font-medium truncate">
                {item.label}
              </span>
              <div className="flex-1 h-[7px] bg-[#eee9de] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.score}%`, backgroundColor: item.barColor }}
                />
              </div>
              <span className="num text-[13px] font-bold text-[#23211b] w-[50px] text-right">
                {item.score}<span className="text-[#b3a98f] font-normal">/100</span>
              </span>
              <span
                className="font-mono-spline text-[8px] font-semibold tracking-wider px-2 py-0.5 rounded text-center w-[64px] shrink-0"
                style={{ color: item.statusColor, backgroundColor: item.statusBg }}
              >
                {item.statusText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
