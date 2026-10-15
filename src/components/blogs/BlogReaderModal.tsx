"use client";

import { blogReadability, blogScore, blogWordCount } from "../../lib/blogStats";
import { useState } from "react";
import { X, Copy, Check, FileText, Sparkles } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { AiDisclaimer } from "../ui/AiDisclaimer";
import Dialog from "../ui/Dialog";

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
  const score = blogScore(blog);
  const readability = blogReadability(blog);
  const wordCount = blogWordCount(blog);
  const languageLabel: string | null = blog.language ? ({ "en-GB": "British English", "en-US": "American English", "en-IE": "Irish English", "en-AU": "Australian English", "en-NZ": "New Zealand English", "en-CA": "Canadian English", "en-IN": "Indian English", "en-ZA": "South African English", "en-SG": "Singapore English" } as Record<string, string>)[blog.language] || blog.language : null;
  const checkList: string[] = Array.isArray(blog.checkBeforePublishing) ? blog.checkBeforePublishing.filter(Boolean) : [];

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
    <Dialog
      onClose={onClose}
      labelledBy="blog-reader-title"
      overlayClassName="fixed inset-0 bg-[#0f1c18]/55 backdrop-blur-xs z-[9999] flex items-center justify-center p-4 md:p-6"
      className="bg-white border border-[#ece3d1] rounded-[22px] shadow-[0_20px_40px_rgba(21,70,59,0.2)] w-full max-w-[860px] max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
    >
      <div className="contents">
        
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
              <h3 id="blog-reader-title" className="font-spectral text-[18px] font-semibold text-[#15463b] leading-tight line-clamp-1">
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
              type="button" aria-label="Close" onClick={onClose}
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
          
          {/* Metadata Banner - this article's own readability metric, deliberately
              NOT styled as a ring/gauge like the Wonder Score elsewhere in the app.
              A second circular /100 here reads as a rival headline score for the
              same business; it's a detail about this one article, not the
              business's AI-visibility score. */}
          <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#fcfaf5] border border-[#efe7d6] flex-wrap">
            <div className="flex items-center gap-3">
              {score !== null && (
                <div className="shrink-0 w-9 h-9 rounded-lg bg-[#f0ebe0] border border-[#e5ddd0] flex items-center justify-center">
                  <span className="font-mono-spline text-[13px] font-bold text-[#6f6757]">{score}</span>
                </div>
              )}
              <div>
                {score !== null && (
                  <div className="text-[12px] font-semibold text-[#6f6757]">
                    Readability: {readability?.band || "score"} <span className="font-normal text-[#8a8273]">(Flesch reading ease, 100 = easiest)</span>
                  </div>
                )}
                <div className="font-mono-spline text-[11px] text-[#8a8273] mt-0.5">{wordCount !== null ? `${wordCount} Words · ` : ""}{sections.length} Sections{languageLabel ? ` · ${languageLabel}` : ""}</div>
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

          {/* F1: what to confirm before this goes live. Statements about the business
              come only from the profile / website; anything unsourced and specific
              was removed, and the draft never invents a customer story. */}
          <div className="p-4 rounded-xl bg-[#fff8e6] border border-[#f0dfae]">
            <span className="font-mono-spline text-[9.5px] font-bold text-[#9a6a12] uppercase tracking-wider block mb-2">
              Check before publishing
            </span>
            {checkList.length > 0 ? (
              <ul className="space-y-1.5 list-disc pl-4">
                {checkList.map((item: string, i: number) => (
                  <li key={i} className="text-[13px] text-[#4a4437] leading-snug">{item}</li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-[#4a4437] leading-snug">
                This draft was written before claim-checking was added. Confirm every statement about your business
                (prices, hours, awards, history) against your own records before publishing.
              </p>
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
    </Dialog>
  );
}
