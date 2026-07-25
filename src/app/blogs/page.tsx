"use client";

import { useState } from "react";
import Link from "next/link";
import BlogHeaderBar from "../../components/blogs/BlogHeaderBar";
import SundayCalendar from "../../components/blogs/SundayCalendar";
import BlogReaderModal from "../../components/blogs/BlogReaderModal";
import { BlogArticleItem } from "../../types/dashboard";
import { Settings, ArrowRight } from "lucide-react";

export default function BlogsPage() {
  const [selectedBlog, setSelectedBlog] = useState<BlogArticleItem | null>(null);

  return (
    <div className="space-y-4">
            {/* Compact Voice & Keyword Reminder */}
      <Link
        href="/settings"
        className="flex items-center justify-between gap-3 bg-[#f6f3ec] border border-[#ece3d1] rounded-xl px-4 py-3 group transition-colors hover:bg-[#efe9db]"
      >
        <div className="flex items-center gap-2.5">
          <Settings className="w-4 h-4 text-[#8a8273] shrink-0" />
          <span className="text-[13px] text-[#6f6757]">
            <span className="font-semibold text-[#23211b]">AI Voice &amp; Focus Keywords</span>
            {" · "}
            <span>Your blog tone and keyword targets are set in Settings</span>
          </span>
        </div>
        <span className="flex items-center gap-1 text-[12px] font-semibold text-[#15463b] whitespace-nowrap shrink-0 group-hover:gap-2 transition-all">
          Edit in Settings <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </Link>
      <BlogHeaderBar />

      {/* Main Calendar UI */}
      <SundayCalendar onSelectBlog={setSelectedBlog} />

      <BlogReaderModal
        blog={selectedBlog}
        onClose={() => setSelectedBlog(null)}
      />
    </div>
  );
}
