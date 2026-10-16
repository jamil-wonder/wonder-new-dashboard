"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import { NAV_ITEMS, ADMIN_NAV_ITEM, type NavItem } from "../../constants/navigation";
import { useUser } from "../../context/UserContext";

// I7: on a phone the six-tab row scrolled sideways and hid half the app. Below md the five things people
// use most sit in a bar at the thumb; everything else is under "More".
const PRIMARY = ["overview", "analyser", "query", "plan"];
const SHORT_LABEL: Record<string, string> = { overview: "Dashboard", analyser: "Analyzer", query: "Tracker", plan: "Plan" };

function TabIcon({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Image
      src={item.iconPath}
      width={22}
      height={22}
      alt=""
      className="h-[22px] w-[22px]"
      style={{
        filter: active
          ? "brightness(0) saturate(100%) invert(23%) sepia(35%) saturate(836%) hue-rotate(119deg) brightness(91%) contrast(92%)"
          : "brightness(0) opacity(0.5)",
      }}
    />
  );
}

export default function MobileTabBar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => setMoreOpen(false), [pathname]);

  const all = user?.role === "admin" ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
  const primary = PRIMARY.map((id) => all.find((i) => i.id === id)!).filter(Boolean);
  const more = all.filter((i) => !PRIMARY.includes(i.id));
  const isActive = (item: NavItem) => pathname === item.href || (item.id === "overview" && pathname === "/");
  const moreActive = more.some(isActive);

  return (
    <>
      {moreOpen && (
        <div className="fixed inset-0 z-[55] md:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-[#0f1c18]/40" />
          <div
            role="menu"
            aria-label="More"
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-3 bottom-[76px] rounded-2xl border border-[#ece3d1] bg-white p-2 shadow-[0_20px_50px_rgba(21,70,59,0.25)]"
          >
            {more.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                role="menuitem"
                className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-[15px] ${isActive(item) ? "bg-[#eef3f0] font-semibold text-[#15463b]" : "text-[#3a352b] hover:bg-[#f6f3ec]"}`}
              >
                <TabIcon item={item} active={isActive(item)} />
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-[56] border-t border-[#ece3d1] bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto flex max-w-[520px] items-stretch justify-around">
          {primary.map((item) => {
            const active = isActive(item);
            return (
              <li key={item.id} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] ${active ? "font-semibold text-[#15463b]" : "text-[#8a8273]"}`}
                >
                  <TabIcon item={item} active={active} />
                  {SHORT_LABEL[item.id] || item.label}
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-expanded={moreOpen}
              aria-haspopup="menu"
              className={`flex w-full cursor-pointer flex-col items-center gap-1 border-none bg-transparent px-1 py-2.5 text-[11px] ${moreActive || moreOpen ? "font-semibold text-[#15463b]" : "text-[#8a8273]"}`}
            >
              <MoreHorizontal className="h-[22px] w-[22px]" />
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
