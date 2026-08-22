"use client";

import { useState } from "react";
import { Link2, Check, ExternalLink, Copy } from "lucide-react";
import { useBusiness } from "../../context/BusinessContext";
import { useOverviewData } from "../../hooks/useOverviewData";
import { useToast } from "../../context/ToastContext";
import { fetchApi } from "../../lib/api";

function getGradeColor(grade: string) {
  if (grade === "A+" || grade === "A") return { text: "#0f7a4d", bg: "#edf8f1" };
  if (grade === "B+" || grade === "B") return { text: "#9a6a12", bg: "#faf1da" };
  return { text: "#b1442a", bg: "#fbeee6" };
}

export default function ReportsPage() {
  const { activeBusiness } = useBusiness();
  const { showToast } = useToast();
  const data = useOverviewData(activeBusiness?.url || "", undefined, activeBusiness?.completeness);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const grade = data.grade || "-";
  const gradeColors = getGradeColor(grade);

  const handleShare = async () => {
    if (!activeBusiness?.id) return;
    setIsSharing(true);
    try {
      const res = await fetchApi<{ token: string; url: string }>("/api/reports/share-link", {
        method: "POST",
        body: JSON.stringify({ business_id: activeBusiness.id }),
      });
      if (res?.url) {
        setShareUrl(res.url);
        try {
          await navigator.clipboard.writeText(res.url);
          setCopied(true);
          showToast("Share link copied to clipboard", "success");
          setTimeout(() => setCopied(false), 2500);
        } catch {
          showToast("Link created successfully", "success");
        }
      }
    } catch {
      showToast("Failed to create share link. Please try again.", "error");
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLinkOnly = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      showToast("Link copied to clipboard", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Failed to copy link", "error");
    }
  };

  return (
    <div className="max-w-[640px] space-y-6">
      
      {/* Title Header */}
      <div>
        <h1 className="font-spectral text-[26px] font-semibold text-[#15463b] tracking-tight">Reports</h1>
        <p className="text-[13px] text-[#8a8273] mt-1">
          Generate a live shareable dashboard link for clients or team members.
        </p>
      </div>

      {/* Main Card: Preview & Actions unified */}
      <div className="bg-white border border-[#ece3d1] rounded-[20px] shadow-sm overflow-hidden">
        
        {/* Preview Segment */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-[#efe7d6] pb-4">
            <span className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f]">Real-time Preview</span>
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
              style={{ color: gradeColors.text, background: gradeColors.bg }}
            >
              Grade {grade}
            </span>
          </div>

          <div className="flex items-center gap-6">
            {/* Score Ring */}
            <div className="relative w-[76px] h-[76px] shrink-0">
              <svg width="76" height="76" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r="33" fill="none" stroke="#eef0ec" strokeWidth="6" />
                <circle
                  cx="38" cy="38" r="33" fill="none" stroke="#1e7d4f" strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${((data.score || 0) / 100) * 2 * Math.PI * 33} ${2 * Math.PI * 33}`}
                  transform="rotate(-90 38 38)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-spectral font-bold text-[20px] text-[#15463b] leading-none">{data.score ?? "-"}</span>
                <span className="text-[9px] text-[#9b927f] mt-0.5">/100</span>
              </div>
            </div>

            <div>
              <div className="font-mono-spline text-[9px] uppercase tracking-wider text-[#9b927f]">Target Website</div>
              <div className="font-spectral text-[20px] font-semibold text-[#23211b] mt-0.5">
                {activeBusiness?.name || "Your business"}
              </div>
              <div className="text-[12px] text-[#8a8273] mt-0.5 truncate max-w-[320px]">{activeBusiness?.url}</div>
            </div>
          </div>

          {/* Audit Metrics Breakdown */}
          {data.auditAreas.length > 0 && (
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {data.auditAreas.slice(0, 6).map((area) => (
                <div key={area.id} className="bg-[#fdfcf8] border border-[#ece3d1] rounded-xl p-3 flex flex-col justify-between">
                  <div className="text-[11px] text-[#8a8273] font-medium leading-tight">{area.label}</div>
                  <div className="text-[18px] font-bold text-[#15463b] mt-2">{area.score}%</div>
                </div>
              ))}
            </div>
          )}

          {!data.hasAnalyserData && !data.hasQueryData && (
            <div className="text-[12px] text-[#8a8273] text-center py-4 bg-[#fdfcf8] border border-dashed border-[#ece3d1] rounded-xl">
              No audit data loaded. Run a scan or search tracker check first.
            </div>
          )}
        </div>

        {/* Share Action Segment */}
        <div className="bg-[#fdfcf8] border-t border-[#ece3d1] p-6 md:p-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-[14px] font-bold text-[#15463b]">Share Link</h4>
              <p className="text-[12px] text-[#8a8273] mt-0.5">
                Generates a single URL reflecting current stats.
              </p>
            </div>
            {!shareUrl && (
              <button
                onClick={handleShare}
                disabled={isSharing || !activeBusiness?.id}
                className="inline-flex items-center justify-center gap-2 py-2 px-5 bg-[#15463b] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1a5c44] transition-colors cursor-pointer disabled:opacity-50 h-10 w-full sm:w-auto"
              >
                <Link2 className="w-4 h-4" />
                {isSharing ? "Generating..." : "Generate Link"}
              </button>
            )}
          </div>

          {shareUrl && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 flex items-center justify-between gap-2 px-3 py-2 bg-white border border-[#ece3d1] rounded-lg min-w-0 h-10 shadow-inner">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 min-w-0 text-[12.5px] text-[#1e7d4f] font-semibold truncate hover:underline"
                >
                  {shareUrl}
                </a>
                <a href={shareUrl} target="_blank" rel="noreferrer" className="text-[#9b927f] hover:text-[#15463b] shrink-0 p-1">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <button
                onClick={handleCopyLinkOnly}
                className="flex items-center justify-center p-2.5 bg-white border border-[#ece3d1] hover:border-[#15463b] hover:bg-[#efe7d6] text-[#15463b] rounded-lg transition-all cursor-pointer shrink-0 h-10 w-10 shadow-sm"
                title="Copy Link"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

