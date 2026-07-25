"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SearchQueryItem } from "../../types/dashboard";

interface QueryTableProps {
  queries: SearchQueryItem[];
  onSelectQuery: (query: SearchQueryItem) => void;
}

export default function QueryTable({ queries, onSelectQuery }: QueryTableProps) {
  if (queries.length === 0) {
    return (
      <div className="text-center py-10 text-[#8a8273] text-[14px]">
        No matching AI search prompts found.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-2.5 relative overflow-hidden">
      <AnimatePresence mode="popLayout">
        {queries.map((q) => {
          let typeColor = "#5b4f86";
          let typeBg = "#efe9fb";
          if (q.type === "non-branded") { typeColor = "#9a6a12"; typeBg = "#f7e7c4"; }
          else if (q.type === "local-seo") { typeColor = "#1e7d4f"; typeBg = "#dcefe2"; }
          else if (q.type === "broad-seo") { typeColor = "#a86d7e"; typeBg = "#fdeef1"; }

          const isMentioned = q.status === "Mentioned";

          return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              key={q.id}
              onClick={() => onSelectQuery(q)}
              className="row-hover flex items-center border border-[#efe7d6] rounded-lg px-3.5 py-3 bg-[#fdfcf8] transition-colors cursor-pointer"
            >
              <div className="w-[5%] text-[12px] font-extrabold text-[#b3a98f]">
                #{q.id}
              </div>
              
              <div className="flex-1 pl-2.5 flex items-center gap-2.5 min-w-0">
                <span
                  className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded shrink-0"
                  style={{ color: typeColor, backgroundColor: typeBg }}
                >
                  {q.label}
                </span>
                <span className="text-[13.5px] font-semibold text-[#23211b] truncate">
                  "{q.query}"
                </span>
              </div>

              <div className="w-[14%] text-center shrink-0">
                {isMentioned ? (
                  <span className="text-[11px] font-bold text-[#1e7d4f] bg-[#dcefe2] px-2.5 py-1 rounded-md inline-flex items-center gap-1">
                    ✓ Mentioned
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-[#b1442a] bg-[#f6dcd5] px-2.5 py-1 rounded-md">
                    ✕ Not Mentioned
                  </span>
                )}
              </div>

              <div className="w-[10%] text-center shrink-0">
                {q.rank ? (
                  <span className="text-[12px] font-bold text-[#15463b] bg-[#e7f4ea] border border-[#c4dfc9] px-2 py-0.5 rounded-md">
                    #{q.rank}
                  </span>
                ) : (
                  <span className="text-[#c2b69c] font-bold">-</span>
                )}
              </div>

              <div className="w-[22%] text-right flex gap-1 justify-end flex-wrap shrink-0">
                {q.sources.length > 0 ? (
                  q.sources.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-[10.5px] font-semibold text-[#3a352b] bg-[#f6f3ec] border border-[#ece3d1] px-1.5 py-0.5 rounded"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-[#b3a98f]">None</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
