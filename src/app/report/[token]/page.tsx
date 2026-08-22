"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { WonderscoreLogo } from "../../../components/ui/WonderscoreSpinner";
import { fetchApi } from "../../../lib/api";

interface PublicReport {
  businessName: string;
  domain: string;
  score: number | null;
  grade: string | null;
  previousScore: number | null;
  competitorAverage: number | null;
  rank: number | null;
  competitors: { name: string; domain: string; score: number }[];
  perModel: { model: string; mentioned: number; total: number }[];
  whatMoved: string[];
  auditAreas: { label: string; score: number }[];
  updatedAt: string | null;
}

function modelIcon(model: string) {
  const key = model.toLowerCase();
  if (key.includes("chatgpt") || key.includes("gpt") || key.includes("openai")) return "/icons/chatgpt.svg";
  if (key.includes("claude")) return "/icons/claude.svg";
  if (key.includes("gemini")) return "/icons/gemini.svg";
  if (key.includes("perplexity")) return "/icons/perplexity.svg";
  return null;
}

function getGradeColor(grade: string) {
  if (grade === "A+" || grade === "A") return { text: "#0f7a4d", bg: "#edf8f1" };
  if (grade === "B+" || grade === "B") return { text: "#9a6a12", bg: "#faf1da" };
  return { text: "#b1442a", bg: "#fbeee6" };
}

export default function SharedReportPage() {
  const params = useParams();
  const token = String(params?.token || "");
  const [report, setReport] = useState<PublicReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchApi<PublicReport>(`/api/public/reports/${encodeURIComponent(token)}`)
      .then((res) => setReport(res))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfcf8] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#15463b]" />
      </div>
    );
  }

  if (notFound || !report) {
    return (
      <div className="min-h-screen bg-[#fdfcf8] flex flex-col items-center justify-center px-4 text-center">
        <WonderscoreLogo size={32} color="#15463b" />
        <p className="mt-4 text-[15px] font-semibold text-[#23211b]">This report link isn't valid.</p>
        <p className="text-[13px] text-[#8a8273] mt-1">It may have been removed. Ask whoever sent it for a fresh link.</p>
      </div>
    );
  }

  const grade = report.grade || "-";
  const gradeColors = getGradeColor(grade);
  const delta = report.score !== null && report.previousScore !== null ? report.score - report.previousScore : null;

  return (
    <div className="min-h-screen bg-[#fdfcf8] flex flex-col items-center px-4 py-10 md:py-16">
      <header className="w-full max-w-[560px] flex items-center gap-2 mb-8">
        <WonderscoreLogo size={26} color="#15463b" />
        <span className="font-spectral text-[18px] font-medium text-[#15463b]">Wonderscore</span>
        <span className="text-[11px] text-[#9b927f] ml-auto font-mono-spline uppercase tracking-wider">Shared report</span>
      </header>

      <main className="w-full max-w-[560px]">
        <div className="bg-white border border-[#ece3d1] rounded-[20px] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="relative w-[84px] h-[84px] shrink-0">
              <svg width="84" height="84" viewBox="0 0 84 84">
                <circle cx="42" cy="42" r="36" fill="none" stroke="#eef0ec" strokeWidth="7" />
                <circle
                  cx="42" cy="42" r="36" fill="none" stroke="#1e7d4f" strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${((report.score || 0) / 100) * 2 * Math.PI * 36} ${2 * Math.PI * 36}`}
                  transform="rotate(-90 42 42)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-spectral font-bold text-[24px] text-[#15463b] leading-none">{report.score ?? "-"}</span>
                <span className="text-[9px] text-[#9b927f] mt-0.5">/100</span>
              </div>
            </div>
            <div>
              <div className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f]">Wonder Score for</div>
              <div className="font-spectral text-[19px] font-semibold text-[#23211b]">{report.businessName || report.domain}</div>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="text-[12px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ color: gradeColors.text, background: gradeColors.bg }}
                >
                  Grade {grade}
                </span>
                {delta !== null && (
                  <span className={`text-[12px] font-semibold ${delta > 0 ? "text-[#1e7d4f]" : delta < 0 ? "text-[#b1442a]" : "text-[#8a8273]"}`}>
                    {delta > 0 ? `+${delta}` : delta} vs last week
                  </span>
                )}
              </div>
            </div>
          </div>

          {(report.rank !== null || report.competitorAverage !== null) && (
            <div className="mt-5 pt-5 border-t border-[#efe7d6] flex items-center gap-4 text-[13px] text-[#6f6757] flex-wrap">
              {report.rank !== null && (
                <span>Rank: <span className="font-semibold text-[#23211b]">#{report.rank}</span> vs tracked competitors</span>
              )}
              {report.competitorAverage !== null && (
                <span>Competitor average: <span className="font-semibold text-[#23211b]">{report.competitorAverage}/100</span></span>
              )}
            </div>
          )}

          {report.perModel.length > 0 && (
            <div className="mt-5 pt-5 border-t border-[#efe7d6]">
              <div className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] mb-3">Where AI sees you</div>
              <div className="space-y-2.5">
                {report.perModel.map((m) => {
                  const icon = modelIcon(m.model);
                  return (
                  <div key={m.model} className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 w-[100px] shrink-0">
                      {icon && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={icon} alt={m.model} className="w-4 h-4 rounded-full object-contain shrink-0" />
                      )}
                      <span className="text-[12.5px] text-[#4a4437] truncate">{m.model}</span>
                    </div>
                    <div className="flex-1 h-2 bg-[#f0ebe0] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1e7d4f] rounded-full"
                        style={{ width: `${m.total > 0 ? (m.mentioned / m.total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-[12px] font-semibold text-[#15463b] w-[40px] text-right shrink-0">{m.mentioned}/{m.total}</span>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {report.competitors.length > 0 && (
            <div className="mt-5 pt-5 border-t border-[#efe7d6]">
              <div className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] mb-3">Competitors AI surfaces</div>
              <div className="space-y-1.5">
                {report.competitors.map((c) => (
                  <div key={c.domain} className="flex items-center gap-2.5 text-[13px] py-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${c.domain}&sz=32`}
                      alt=""
                      className="w-4 h-4 rounded-full shrink-0"
                    />
                    <span className="text-[#3a352b] flex-1 min-w-0 truncate">{c.name}</span>
                    <span className="font-semibold text-[#15463b] shrink-0">{c.score}/100</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.whatMoved.length > 0 && (
            <div className="mt-5 pt-5 border-t border-[#efe7d6]">
              <div className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] mb-3">What moved</div>
              <div className="space-y-1.5">
                {report.whatMoved.map((m, i) => (
                  <p key={i} className="text-[13px] text-[#3a352b] leading-relaxed">{m}</p>
                ))}
              </div>
            </div>
          )}

          {report.auditAreas.length > 0 && (
            <div className="mt-5 pt-5 border-t border-[#efe7d6]">
              <div className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] mb-3">Technical audit areas</div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {report.auditAreas.map((area) => (
                  <div key={area.label} className="bg-[#fdfcf8] border border-[#ece3d1] rounded-xl p-3">
                    <div className="text-[16px] font-bold text-[#15463b]">{area.score}</div>
                    <div className="text-[11px] text-[#8a8273] mt-0.5 leading-snug">{area.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.updatedAt && (
            <p className="mt-5 text-[11.5px] text-[#9b927f]">
              Last updated {new Date(report.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-[12px] text-[#9b927f]">
          This is a snapshot from Wonderscore's AI visibility tracking. Numbers update automatically each week.
        </p>
      </main>
    </div>
  );
}
