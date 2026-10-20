"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal, Pencil, Trash2, Wand2, Loader2 } from "lucide-react";

interface RowMenuProps {
  label: string;
  onEdit?: () => void;
  onRewrite?: () => void;
  onRemove?: () => void;
  rewriting?: boolean;
}

// J8: the actions for one question live in a single "..." menu at the end of its row.
// The list is fixed-positioned from the button so a table that scrolls sideways never clips it.
export default function RowMenu({ label, onEdit, onRewrite, onRemove, rewriting = false }: RowMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    setConfirming(false);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !buttonRef.current?.contains(t)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (open) return close();
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const below = window.innerHeight - rect.bottom;
      setPos({ top: below < 190 ? Math.max(8, rect.top - 150) : rect.bottom + 6, right: Math.max(8, window.innerWidth - rect.right) });
    }
    setOpen(true);
  };

  const item = "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-[#3a352b] hover:bg-[#f6f3ec] disabled:opacity-50";

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="cursor-pointer rounded-lg p-1.5 text-[#6f6757] transition-colors hover:bg-[#f0ebe0] hover:text-[#15463b]"
      >
        {rewriting ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
      </button>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          role="menu"
          onClick={(e) => e.stopPropagation()}
          style={{ position: "fixed", top: pos.top, right: pos.right }}
          className="z-[60] w-[230px] rounded-xl border border-[#ece3d1] bg-white p-1.5 shadow-[0_12px_32px_rgba(21,70,59,0.18)]"
        >
          {confirming ? (
            <div className="px-3 py-2">
              <p className="text-[13px] font-semibold text-[#23211b]">Remove this question?</p>
              <p className="mt-0.5 text-[12px] text-[#6f6757]">You'll need 20 again before the next run.</p>
              <div className="mt-2.5 flex gap-2">
                <button type="button" onClick={() => { close(); onRemove?.(); }} className="cursor-pointer rounded-lg bg-[#b1442a] px-3 py-1.5 text-[12.5px] font-semibold text-white">Remove</button>
                <button type="button" onClick={() => setConfirming(false)} className="cursor-pointer rounded-lg border border-[#ece3d1] px-3 py-1.5 text-[12.5px] font-semibold text-[#6f6757]">Keep</button>
              </div>
            </div>
          ) : (
            <>
              {onEdit && (
                <button type="button" role="menuitem" className={item} onClick={() => { close(); onEdit(); }}>
                  <Pencil className="h-3.5 w-3.5 text-[#6f6757]" /> Edit question
                </button>
              )}
              {onRewrite && (
                <button type="button" role="menuitem" className={item} onClick={() => { close(); onRewrite(); }}>
                  <Wand2 className="h-3.5 w-3.5 text-[#6f6757]" /> Make it sound more human
                </button>
              )}
              {onRemove && (
                <button type="button" role="menuitem" className={`${item} text-[#b1442a] hover:bg-[#fdeeea]`} onClick={() => setConfirming(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}
