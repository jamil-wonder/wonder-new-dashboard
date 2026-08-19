"use client";

import { useState } from "react";
import { X, Copy, Check, FileText, Sparkles } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { AiDisclaimer } from "../ui/AiDisclaimer";

interface BlogReaderModalProps {
  blog: any | null;
  onClose: () => void;
}

export default function BlogReaderModal({ blog, onClose }: BlogReaderModalProps) {
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!blog) return null;

  const title = blog.title || "SEO Blog Article";
  const metaDescription = blog.metaDescription || blog.excerpt || "";
  const keywords = Array.isArray(blog.keywords) ? blog.keywords : [];
  const sections = Array.isArray(blog.sections) ? blog.sections : [];
  const score = blog.humanizedScore || blog.score || 94;
  const wordCount = blog.wordCount || 1200;

  const handleCopyFullArticle = () => {
    const fullText = `# ${title}\n\n${metaDescription}\n\n` +
      sections.map((s: any) => `## ${s.heading || s.label}\n\n${s.content || s.body || ""}`).join("\n\n");

    navigator.clipboard.writeText(fullText).then(() => {
      setCopied(true);
      showToast("Full blog article copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="fixed inset-0 bg-[#0f1c18]/55 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 md:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-[#ece3d1] rounded-[22px] shadow-[0_20px_40px_rgba(21,70,59,0.2)] w-full max-w-[860px] max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-[#ece3d1] bg-[#fdfcf8]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#eef3f0] border border-[#d0e4d6] text-[#15463b] flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono-spline text-[9.5px] font-bold text-[#15463b] uppercase tracking-wider">
                Generated Weekly Blog Article
              </span>
              <h3 className="font-spectral text-[18px] font-semibold text-[#15463b] leading-tight line-clamp-1">
                {title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyFullArticle}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium bg-[#f5f0e6] text-[#3a352b] border border-[#e0d8c8] hover:bg-white hover:border-[#15463b] transition-all cursor-pointer whitespace-nowrap shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#1e7d4f]" /> : <Copy className="w-3.5 h-3.5 text-[#6f6757]" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>

            <button
              onClick={onClose}
              className="text-[#9b927f] hover:text-[#23211b] hover:bg-[#f5f0e6] rounded-md transition-colors p-1.5 cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
        <div className="px-6 py-2 border-b border-[#ece3d1] bg-[#fdfcf8]">
          <AiDisclaimer />
        </div>

        {/* Article Body */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 bg-white space-y-6">
          
          {/* Metadata Banner */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#fcfaf5] border border-[#efe7d6] flex-wrap">
            <div className="flex items-center gap-4">
              <div className="relative w-[48px] h-[48px] shrink-0">
                <svg width="48" height="48" viewBox="0 0 48 48">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#eef0ec" strokeWidth="4" />
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#1e7d4f" strokeWidth="4" strokeLinecap="round" strokeDasharray="125.6 130" transform="rotate(-90 24 24)" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-spectral font-bold text-[15px] text-[#15463b]">
                  {score}
                </div>
              </div>
              <div>
                <div className="text-[13px] font-bold text-[#1e7d4f]">Humanized Readability &amp; SEO Score</div>
                <div className="font-mono-spline text-[11px] text-[#8a8273] mt-0.5">{wordCount} Words · {sections.length} Sections</div>
              </div>
            </div>

            {keywords.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap max-w-[360px]">
                {keywords.slice(0, 4).map((kw: string, i: number) => (
                  <span key={i} className="text-[10.5px] font-medium text-[#15463b] bg-[#eef3f0] border border-[#d0e4d6] px-2 py-0.5 rounded">
                    #{kw}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Meta Description / Excerpt Box */}
          {metaDescription && (
            <div className="p-4 rounded-xl bg-[#f6f3ec] border border-[#ece3d1]">
              <span className="font-mono-spline text-[9.5px] font-bold text-[#9b927f] uppercase tracking-wider block mb-1">
                Meta Description / Summary
              </span>
              <p className="text-[13.5px] italic text-[#4a4437] leading-relaxed">
                "{metaDescription}"
              </p>
            </div>
          )}

          {/* Sections List */}
          <div className="space-y-6 pt-2">
            {sections.map((sec: any, idx: number) => (
              <div key={sec.id || idx} className="border-b border-[#efe7d6] pb-5 last:border-none last:pb-0">
                <h4 className="font-spectral text-[18px] font-semibold text-[#15463b] mb-2 leading-snug">
                  {sec.heading || sec.label || `Section ${idx + 1}`}
                </h4>
                <div className="text-[14.5px] leading-relaxed text-[#2c2821] whitespace-pre-wrap">
                  {sec.content || sec.body || ""}
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
}
