"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface AdminPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function AdminPagination({ page, totalPages, total, pageSize, onPageChange }: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  // Compact page-number window: first, last, current +/-1, with ellipses
  // between gaps rather than every page number for large result sets.
  const pages: (number | "ellipsis")[] = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 1) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis");
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 pt-4 mt-2 border-t border-[#efe7d6] flex-wrap">
      <div className="text-[12.5px] text-[#8a8273]">
        Showing <span className="font-semibold text-[#3a352b]">{start}–{end}</span> of{" "}
        <span className="font-semibold text-[#3a352b]">{total}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#ece3d1] text-[#6f6757] hover:bg-[#f6f3ec] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors bg-white"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((p, i) =>
          p === "ellipsis" ? (
            <span key={`e-${i}`} className="w-8 h-8 flex items-center justify-center text-[12px] text-[#b3a98f]">
              &#8230;
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12.5px] font-semibold cursor-pointer transition-colors border ${
                p === page
                  ? "bg-[#15463b] text-white border-[#15463b]"
                  : "bg-white text-[#6f6757] border-[#ece3d1] hover:bg-[#f6f3ec]"
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#ece3d1] text-[#6f6757] hover:bg-[#f6f3ec] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors bg-white"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
