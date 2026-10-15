"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Plus, Settings2 } from "lucide-react";
import { useBusiness } from "../../context/BusinessContext";

const MAX_BUSINESSES = 3;

// G7: the business name in the header is a switcher - every profile in one dropdown, plus Add business.
export default function BusinessSwitcher({ compact = false }: { compact?: boolean }) {
  const { activeBusiness, businesses, switchBusiness } = useBusiness();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const atLimit = businesses.length >= MAX_BUSINESSES;

  return (
    <div className="relative min-w-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Business: ${activeBusiness.name}. Switch business`}
        className={`inline-flex items-center gap-1.5 max-w-full cursor-pointer bg-transparent border-none p-0 text-left ${
          compact ? "text-[12.5px] font-semibold text-[#15463b]" : "text-[15.5px] font-semibold text-[#23211b] leading-snug"
        } hover:text-[#15463b]`}
      >
        <span className={`truncate ${compact ? "max-w-[110px]" : ""}`}>{activeBusiness.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-[#8a8273] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Your businesses"
          className="absolute left-0 top-full mt-2 w-[300px] max-w-[calc(100vw-32px)] bg-white border border-[#ece3d1] rounded-xl shadow-[0_12px_32px_rgba(21,70,59,0.16)] z-[60] overflow-hidden"
        >
          <ul className="max-h-[300px] overflow-y-auto divide-y divide-[#f1eadf]">
            {businesses.map((b) => {
              const active = b.id === activeBusiness.id;
              return (
                <li key={b.id}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => {
                      setOpen(false);
                      if (!active) switchBusiness(b.id);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center gap-2.5 cursor-pointer border-none transition-colors hover:bg-[#f6f3ec] ${active ? "bg-[#f4f9f6]" : "bg-white"}`}
                  >
                    <span className="w-6 shrink-0 flex justify-center">{active ? <Check className="w-4 h-4 text-[#1e7d4f]" /> : null}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-semibold text-[#23211b] truncate">{b.name}</span>
                      <span className="block text-[11.5px] text-[#8a8273] truncate">
                        {[b.category, b.location].filter(Boolean).join(" · ") || b.url}
                      </span>
                    </span>
                    {b.hasVisibilityScore && <span className="num shrink-0 text-[12px] font-bold text-[#15463b]">{b.completeness}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-[#ece3d1] bg-[#fdfcf8]">
            {atLimit ? (
              <p className="px-3.5 py-2.5 text-[11.5px] text-[#8a8273] leading-snug">
                You&apos;ve reached the limit of {MAX_BUSINESSES} businesses. Remove one in Settings to add another.
              </p>
            ) : (
              <Link
                href="/onboarding?add=1"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-3.5 py-2.5 text-[13px] font-semibold text-[#15463b] hover:bg-[#f6f3ec] transition-colors"
              >
                <Plus className="w-4 h-4" /> Add business
              </Link>
            )}
            <Link
              href="/settings?tab=business-profiles"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3.5 py-2.5 text-[12.5px] font-medium text-[#6f6757] hover:bg-[#f6f3ec] transition-colors border-t border-[#f1eadf]"
            >
              <Settings2 className="w-3.5 h-3.5" /> Manage businesses
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
