"use client";

import Image from "next/image";
import { FileText } from "lucide-react";
import { MOCK_BLOGS } from "../../constants/mockData";

export default function BlogGenerationPanel() {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (1 / 2) * circumference;

  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-6 shadow-sm space-y-6">
      
      {/* Blog Generation Limit Ring */}
      <div className="flex items-center justify-between border-b border-[#efe7d6] pb-5">
        <div>
          <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">Blog Generation</h3>
          <p className="text-[12.5px] text-[#6f6757] mt-0.5">Auto-generation schedule limits and active history.</p>
        </div>
      </div>

      <div className="bg-[#faf8f3] border border-[#ece3d1] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="absolute w-16 h-16 transform -rotate-90">
              <circle cx="32" cy="32" r={radius} className="stroke-[#ece3d1]" strokeWidth="4" fill="transparent" />
              <circle cx="32" cy="32" r={radius} className="stroke-[#15463b] transition-all duration-300" strokeWidth="4" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
            </svg>
            <span className="text-sm font-bold text-[#15463b]">1/2</span>
          </div>
          <div>
            <h4 className="font-bold text-[15.5px] text-[#23211b]">Blog Generations Limit</h4>
            <p className="text-[11px] font-mono-spline uppercase tracking-wider text-[#9b927f] mt-0.5">Reset weekly every Sunday</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[15px] font-bold text-[#1e7d4f]">1 remaining</div>
          <div className="text-[12.5px] text-[#8a8273]">For this cycle</div>
        </div>
      </div>

      {/* Generated blog history list */}
      <div className="space-y-3.5">
        <h4 className="font-spectral text-[16px] font-semibold text-[#15463b]">Generated Blog History</h4>
        <div className="divide-y divide-[#efe7d6]">
          {MOCK_BLOGS.map((blog) => (
            <div key={blog.id} className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-[#f6f3ec] border border-[#ece3d1] flex items-center justify-center text-[#15463b] shrink-0 p-1">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13.5px] font-bold text-[#23211b] leading-tight line-clamp-1">{blog.title}</div>
                  <div className="text-[11px] text-[#8a8273] mt-0.5">{blog.keyword} · {blog.model}</div>
                </div>
              </div>
              <button
                onClick={() => alert(`Reviewing blog: ${blog.title}`)}
                className="ob text-[12px] font-semibold border border-[#d8cfbd] bg-white px-3 py-1.5 rounded-lg shrink-0 ml-4"
              >
                Review
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
