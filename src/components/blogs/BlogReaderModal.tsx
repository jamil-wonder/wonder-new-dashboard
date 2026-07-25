"use client";

import { BlogArticleItem } from "../../types/dashboard";
import { X } from "lucide-react";

interface BlogReaderModalProps {
  blog: BlogArticleItem | null;
  onClose: () => void;
}

export default function BlogReaderModal({ blog, onClose }: BlogReaderModalProps) {
  if (!blog) return null;

  return (
    <div
      className="fixed inset-0 bg-[#0f1c18]/55 backdrop-blur-sm z-[999] flex items-center justify-center p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-[#ece3d1] rounded-[20px] shadow-[0_20px_40px_rgba(21,70,59,0.2)] w-full max-w-[840px] max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-[#ece3d1] bg-[#fdfcf8]">
          <div>
            <span className="font-mono-spline text-[9.5px] font-bold text-[#15463b] uppercase">
              Generated Weekly Blog Article
            </span>
            <h3 className="font-spectral text-[20px] font-semibold text-[#15463b] mt-0.5">
              {blog.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#9b927f] hover:text-[#23211b] transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Article Body */}
        <div className="p-6 md:p-7 overflow-y-auto flex-1 bg-white">
          <div className="flex items-center gap-4 mb-5 pb-4 border-b border-[#efe7d6]">
            <div className="relative w-[50px] h-[50px] shrink-0">
              <svg width="50" height="50" viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="21" fill="none" stroke="#eef0ec" strokeWidth="4" />
                <circle cx="25" cy="25" r="21" fill="none" stroke="#1e7d4f" strokeWidth="4" strokeLinecap="round" strokeDasharray="128.5 132" transform="rotate(-90 25 25)" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-spectral font-bold text-[16px] text-[#15463b]">
                {blog.score}
              </div>
            </div>
            <div>
              <div className="text-[12px] font-bold text-[#1e7d4f]">Humanized Readability Score</div>
              <div className="font-mono-spline text-[11px] text-[#8a8273] mt-0.5">{blog.meta}</div>
            </div>
          </div>

          <div className="text-[14.5px] leading-relaxed text-[#3a352b] space-y-4">
            {blog.sections.map((sec, idx) => (
              <div key={idx}>
                <h4 className="font-spectral text-[18px] font-semibold text-[#15463b] mb-1.5">
                  {sec.heading}
                </h4>
                <p className="leading-relaxed text-[#3a352b]">{sec.body}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
