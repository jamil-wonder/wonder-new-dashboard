"use client";

import { blogReadability, blogScore, blogWordCount } from "../../lib/blogStats";
import { useState } from "react";
import { X, Copy, Check, FileText, Download, Pencil, CheckCircle2 } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { useBusiness } from "../../context/BusinessContext";
import { fetchApi } from "../../lib/api";
import { articleToDocx, articleToHtml, articleToMarkdown, fileSafeName, parseMarkdown, type Inline } from "../../lib/articleFormats";
import { AiDisclaimer } from "../ui/AiDisclaimer";
import Dialog from "../ui/Dialog";

interface BlogReaderModalProps {
  blog: any | null;
  onClose: () => void;
  onChanged?: () => void;
}

function Inlines({ items }: { items: Inline[] }) {
  return (
    <>
      {items.map((i, n) =>
        i.kind === "bold" ? <strong key={n}>{i.text}</strong>
        : i.kind === "italic" ? <em key={n}>{i.text}</em>
        : i.kind === "link" ? <a key={n} href={i.href} target="_blank" rel="noopener noreferrer" className="text-[#15463b] underline">{i.text}</a>
        : <span key={n}>{i.text}</span>,
      )}
    </>
  );
}

function RichText({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-[14.5px] leading-relaxed text-[#2c2821]">
      {parseMarkdown(text).map((b, n) =>
        b.kind === "heading" ? <h5 key={n} className="font-spectral text-[16px] font-semibold text-[#15463b]"><Inlines items={b.inlines} /></h5>
        : b.kind === "list" ? (
          b.ordered
            ? <ol key={n} className="list-decimal space-y-1 pl-5">{b.items.map((it, k) => <li key={k}><Inlines items={it} /></li>)}</ol>
            : <ul key={n} className="list-disc space-y-1 pl-5">{b.items.map((it, k) => <li key={k}><Inlines items={it} /></li>)}</ul>
        )
        : <p key={n}><Inlines items={b.inlines} /></p>,
      )}
    </div>
  );
}

export default function BlogReaderModal({ blog, onClose, onChanged }: BlogReaderModalProps) {
  const { showToast } = useToast();
  const { activeBusiness } = useBusiness();
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<{ sections?: Record<string, string>; publishedAt?: string | null }>({});
  const [busy, setBusy] = useState(false);

  if (!blog) return null;

  const title = blog.title || "SEO Blog Article";
  const metaDescription = blog.metaDescription || blog.excerpt || "";
  const keywords = Array.isArray(blog.keywords) ? blog.keywords : [];
  const sections = (Array.isArray(blog.sections) ? blog.sections : []).map((s: any, i: number) => {
    const key = String(s.id || i);
    const override = saved.sections?.[key];
    return override !== undefined ? { ...s, content: override } : s;
  });
  const publishedAt: string | null = saved.publishedAt !== undefined ? saved.publishedAt : blog.published_at || null;
  const businessId = activeBusiness?.id || "";
  const canEdit = Boolean(businessId && blog.id);
  const parts = {
    title,
    metaDescription,
    sections: sections.map((s: any, i: number) => ({ heading: s.heading || s.label || `Section ${i + 1}`, content: s.content || s.body || "" })),
  };
  const score = blogScore(blog);
  const readability = blogReadability(blog);
  const wordCount = blogWordCount(blog);
  const languageLabel: string | null = blog.language ? ({ "en-GB": "British English", "en-US": "American English", "en-IE": "Irish English", "en-AU": "Australian English", "en-NZ": "New Zealand English", "en-CA": "Canadian English", "en-IN": "Indian English", "en-ZA": "South African English", "en-SG": "Singapore English" } as Record<string, string>)[blog.language] || blog.language : null;
  const checkList: string[] = Array.isArray(blog.checkBeforePublishing) ? blog.checkBeforePublishing.filter(Boolean) : [];

  const done = (msg: string) => {
    setCopied(true);
    showToast(msg, "success");
    setTimeout(() => setCopied(false), 2000);
  };
  const copyMarkdown = () => navigator.clipboard.writeText(articleToMarkdown(parts)).then(() => done("Copied as Markdown"));
  const copyHtml = () => {
    const html = articleToHtml(parts);
    const write = typeof ClipboardItem !== "undefined" && navigator.clipboard.write
      ? navigator.clipboard.write([new ClipboardItem({ "text/html": new Blob([html], { type: "text/html" }), "text/plain": new Blob([html], { type: "text/plain" }) })])
      : navigator.clipboard.writeText(html);
    write.then(() => done("Copied with formatting"));
  };
  const save = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const downloadMd = () => save(new Blob([articleToMarkdown(parts)], { type: "text/markdown" }), `${fileSafeName(title)}.md`);
  const downloadDocx = () => save(articleToDocx(parts), `${fileSafeName(title)}.docx`);

  const post = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      await fetchApi("/api/blogs/weekly/draft", { method: "POST", body: JSON.stringify({ business_id: businessId, draft_id: blog.id, ...body }) });
      onChanged?.();
      return true;
    } catch {
      showToast("Couldn't save that - please try again", "error");
      return false;
    } finally {
      setBusy(false);
    }
  };
  const startEdit = () => {
    const init: Record<string, string> = {};
    sections.forEach((s: any, i: number) => { init[String(s.id || i)] = s.content || s.body || ""; });
    setEdits(init);
    setEditing(true);
  };
  const saveEdits = async () => {
    const payload = sections.map((s: any, i: number) => ({ id: s.id ? String(s.id) : null, content: edits[String(s.id || i)] ?? (s.content || "") }));
    if (await post({ sections: payload })) {
      setSaved((p) => ({ ...p, sections: { ...(p.sections || {}), ...edits } }));
      setEditing(false);
      showToast("Changes saved", "success");
    }
  };
  const togglePublished = async () => {
    const next = !publishedAt;
    if (await post({ published: next })) setSaved((p) => ({ ...p, publishedAt: next ? new Date().toISOString() : null }));
  };
  const btn = "inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12px] font-medium bg-[#f5f0e6] text-[#3a352b] border border-[#e0d8c8] hover:bg-white hover:border-[#15463b] transition-all cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50";

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
              <span className="font-mono-spline text-[11px] font-bold text-[#15463b] uppercase tracking-wider">
                Generated Weekly Blog Article
              </span>
              <h3 id="blog-reader-title" className="font-spectral text-[18px] font-semibold text-[#15463b] leading-tight line-clamp-1">
                {title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button onClick={copyMarkdown} className={btn} title="Copy as Markdown">
              {copied ? <Check className="w-3.5 h-3.5 text-[#1e7d4f]" /> : <Copy className="w-3.5 h-3.5 text-[#6f6757]" />}
              <span>{copied ? "Copied" : "Markdown"}</span>
            </button>
            <button onClick={copyHtml} className={btn} title="Copy with formatting (for your website editor)">
              <Copy className="w-3.5 h-3.5 text-[#6f6757]" /><span>HTML</span>
            </button>
            <button onClick={downloadDocx} className={btn} title="Download as a Word document">
              <Download className="w-3.5 h-3.5 text-[#6f6757]" /><span>.docx</span>
            </button>
            <button onClick={downloadMd} className={btn} title="Download as a Markdown file">
              <Download className="w-3.5 h-3.5 text-[#6f6757]" /><span>.md</span>
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
                  <span key={i} className="text-[11px] font-medium text-[#15463b] bg-[#eef3f0] border border-[#d0e4d6] px-2 py-0.5 rounded">
                    {kw}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* F1: what to confirm before this goes live. Statements about the business
              come only from the profile / website; anything unsourced and specific
              was removed, and the draft never invents a customer story. */}
          <div className="p-4 rounded-xl bg-[#fff8e6] border border-[#f0dfae]">
            <span className="font-mono-spline text-[11px] font-bold text-[#9a6a12] uppercase tracking-wider block mb-2">
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
              <span className="font-mono-spline text-[11px] font-bold text-[#6f6757] uppercase tracking-wider block mb-1">
                Meta Description / Summary
              </span>
              <p className="text-[13.5px] italic text-[#4a4437] leading-relaxed">
                "{metaDescription}"
              </p>
            </div>
          )}

          {canEdit && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <button onClick={saveEdits} disabled={busy} className="inline-flex h-8 cursor-pointer items-center rounded-lg bg-[#15463b] px-3 text-[12px] font-medium text-white disabled:opacity-50">{busy ? "Saving..." : "Save changes"}</button>
                    <button onClick={() => setEditing(false)} disabled={busy} className={btn}>Cancel</button>
                  </>
                ) : (
                  <button onClick={startEdit} className={btn}><Pencil className="w-3.5 h-3.5 text-[#6f6757]" />Edit article</button>
                )}
              </div>
              <button onClick={togglePublished} disabled={busy || editing} className={btn}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${publishedAt ? "text-[#1e7d4f]" : "text-[#6f6757]"}`} />
                {publishedAt ? `Published ${new Date(publishedAt).toLocaleDateString()} - undo` : "Mark as published"}
              </button>
            </div>
          )}

          {/* Sections List */}
          <div className="space-y-6 pt-2">
            {sections.map((sec: any, idx: number) => (
              <div key={sec.id || idx} className="border-b border-[#efe7d6] pb-5 last:border-none last:pb-0">
                <h4 className="font-spectral text-[18px] font-semibold text-[#15463b] mb-2 leading-snug">
                  {sec.heading || sec.label || `Section ${idx + 1}`}
                </h4>
                {editing ? (
                  <textarea
                    value={edits[String(sec.id || idx)] ?? ""}
                    onChange={(e) => setEdits((p) => ({ ...p, [String(sec.id || idx)]: e.target.value }))}
                    rows={Math.min(18, Math.max(5, Math.ceil((edits[String(sec.id || idx)] || "").length / 90) + 2))}
                    className="w-full rounded-lg border border-[#e0d8c8] bg-[#fdfcf8] p-3 font-mono-spline text-[13px] leading-relaxed text-[#2c2821] focus:border-[#15463b] focus:outline-none"
                  />
                ) : (
                  <RichText text={sec.content || sec.body || ""} />
                )}
              </div>
            ))}
          </div>

        </div>

      </div>
    </Dialog>
  );
}
