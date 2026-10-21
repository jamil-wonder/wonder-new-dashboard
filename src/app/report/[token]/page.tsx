"use client";

import SiteIcon from "../../../components/ui/SiteIcon";
import { classifyChange, noiseLabel } from "../../../lib/scoreChange";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { WonderscoreLogo } from "../../../components/ui/WonderscoreSpinner";
import { fetchApi } from "../../../lib/api";
import { ScoreBreakdownTable } from "../../../components/ui/ScoreBreakdown";

interface PublicReport {
  businessName: string;
  domain: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  score: number | null;
  grade: string | null;
  // False when "score"/"grade" are only the Phase 1 technical crawl result
  // because Search Tracker has never completed a run for this business -
  // this page must never present that as a tested AI-visibility result.
  visibilityVerified: boolean;
  // The three inputs behind the score (A1), named exactly as in the app
  scoreExact?: number | null;
  scoreBreakdown?: { mention_rate?: number | null; technical_score?: number | null; market_position?: number | null; market_measured?: boolean; score_margin?: number | null } | null;
  previousScore: number | null;
  // the complete run "vs" compares against (always at least 6 days older), if there is one
  previousScoreAt?: string | null;
  whatMovedAvailable?: boolean;
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

// the business's logo, or its first letter when there is none (or it fails to load)
function BusinessMark({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  const [failed, setFailed] = useState(false);
  if (logoUrl && !failed) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt="" onError={() => setFailed(true)} className="h-14 w-14 shrink-0 rounded-2xl border border-[#ece3d1] bg-white object-contain p-1.5" />;
  }
  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#15463b] font-spectral text-[24px] text-[#a8d860]">
      {(name || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}

export default function SharedReportPage() {
  const params = useParams();
  const token = String(params?.token || "");
  const [report, setReport] = useState<PublicReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetchApi<PublicReport>(`/api/public/reports/${encodeURIComponent(token)}`)
      .then((res) => setReport(res))
      .catch((err) => {
        setExpired((err as { status?: number })?.status === 410);
        setNotFound(true);
      })
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
        <p className="mt-4 text-[15px] font-semibold text-[#23211b]">{expired ? "This report link has expired." : "This report link isn't available."}</p>
        <p className="text-[13px] text-[#8a8273] mt-1">
          {expired ? "Report links work for 30 days." : "It may have been turned off."} Ask whoever sent it for a fresh link.
        </p>
      </div>
    );
  }

  const delta = report.score !== null && report.previousScore !== null ? report.score - report.previousScore : null;
  // A5: a move inside the AI-answer noise margin is not shown as a change
  const change = classifyChange(delta, report.scoreBreakdown?.score_margin);

  return (
    <div className="min-h-screen bg-[#fdfcf8] flex flex-col items-center px-4 py-10 md:py-16">
      <header className="w-full max-w-[560px] mb-8">
        <div className="flex items-center gap-2">
          <WonderscoreLogo size={22} color="#15463b" />
          <span className="font-spectral text-[16px] font-medium text-[#15463b]">Wonderscore</span>
          <span className="text-[11px] text-[#6f6757] ml-auto font-mono-spline uppercase tracking-wider">Shared report</span>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <BusinessMark name={report.businessName || report.domain} logoUrl={report.logoUrl} />
          <div className="min-w-0">
            <div className="font-mono-spline text-[11px] uppercase tracking-wider text-[#6f6757]">Prepared for</div>
            <h1 className="font-spectral text-[26px] leading-tight font-semibold text-[#15463b] truncate">{report.businessName || report.domain}</h1>
            {report.domain && (
              <a href={report.websiteUrl || `https://${report.domain}`} target="_blank" rel="noreferrer" className="text-[12.5px] text-[#6f6757] hover:text-[#15463b] hover:underline">
                {report.domain}
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="w-full max-w-[560px]">
        <div className="bg-white border border-[#ece3d1] rounded-[20px] p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="relative w-[84px] h-[84px] shrink-0">
              <svg width="84" height="84" viewBox="0 0 84 84">
                <circle cx="42" cy="42" r="36" fill="none" stroke="#eef0ec" strokeWidth="7" />
                {report.visibilityVerified && (
                  <circle
                    cx="42" cy="42" r="36" fill="none" stroke="#1e7d4f" strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={`${((report.score || 0) / 100) * 2 * Math.PI * 36} ${2 * Math.PI * 36}`}
                    transform="rotate(-90 42 42)"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-spectral font-bold text-[24px] text-[#15463b] leading-none">
                  {report.visibilityVerified ? report.score ?? "-" : "-"}
                </span>
                <span className="text-[11px] text-[#6f6757] mt-0.5">/100</span>
              </div>
            </div>
            <div>
              <div className="font-mono-spline text-[11px] uppercase tracking-wider text-[#6f6757]">
                Wonder Score
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {report.visibilityVerified && delta !== null && (
                  <span className={`text-[12px] font-semibold ${change.kind === "up" ? "text-[#1e7d4f]" : change.kind === "down" ? "text-[#b1442a]" : "text-[#8a8273]"}`}>
                    {change.kind === "noise" ? noiseLabel(change.margin) : delta > 0 ? `+${delta}` : delta} vs {report.previousScoreAt ? new Date(report.previousScoreAt).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : "last week"}
                  </span>
                )}
                {!report.visibilityVerified && (
                  <span className="text-[12px] font-semibold text-[#9a6a12]">
                    AI visibility not yet tested
                  </span>
                )}
              </div>
            </div>
          </div>

          {!report.visibilityVerified && (
            <div className="mt-5 pt-5 border-t border-[#efe7d6]">
              <p className="text-[13px] text-[#6f6757] leading-relaxed">
                No AI model (ChatGPT, Claude, Perplexity, Gemini) has been queried about this business yet, so there's no Wonder
                Score to show. Run Search Tracker at least once to generate a real report.
              </p>
            </div>
          )}

          {report.visibilityVerified && report.scoreBreakdown && (
            <div className="mt-5 pt-5 border-t border-[#efe7d6]">
              <div className="font-mono-spline text-[11px] uppercase tracking-wider text-[#6f6757] mb-2">
                How this score is calculated
              </div>
              <ScoreBreakdownTable inputs={report.scoreBreakdown} score={report.scoreExact ?? report.score} />
            </div>
          )}

          {report.visibilityVerified && (report.rank !== null || report.competitorAverage !== null) && (
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
              <div className="font-mono-spline text-[11px] uppercase tracking-wider text-[#6f6757] mb-3">Where AI sees you</div>
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
              <div className="font-mono-spline text-[11px] uppercase tracking-wider text-[#6f6757] mb-3">Competitors AI surfaces</div>
              <div className="space-y-1.5">
                {report.competitors.map((c) => (
                  <div key={c.domain} className="flex items-center gap-2.5 text-[13px] py-1.5">
                    <SiteIcon domain={c.domain} size={16} className="rounded-full" />
                    <span className="text-[#3a352b] flex-1 min-w-0 truncate">{c.name}</span>
                    <span className="font-semibold text-[#15463b] shrink-0">{c.score}/100</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.whatMoved.length > 0 && (
            <div className="mt-5 pt-5 border-t border-[#efe7d6]">
              <div className="font-mono-spline text-[11px] uppercase tracking-wider text-[#6f6757] mb-3">What moved</div>
              <div className="space-y-1.5">
                {report.whatMoved.map((m, i) => (
                  <p key={i} className="text-[13px] text-[#3a352b] leading-relaxed">{m}</p>
                ))}
              </div>
            </div>
          )}

          {report.auditAreas.length > 0 && (
            <div className="mt-5 pt-5 border-t border-[#efe7d6]">
              <div className="font-mono-spline text-[11px] uppercase tracking-wider text-[#6f6757] mb-3">Technical audit areas</div>
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
        <footer className="mt-8 border-t border-[#efe7d6] pt-5 text-center text-[12.5px] text-[#6f6757]">
          Report by <span className="font-semibold text-[#15463b]">Wonderscore</span>.{" "}
          <a href="/auth?signup=true" className="font-semibold text-[#15463b] underline underline-offset-2">
            See how AI recommends your business
          </a>
        </footer>
      </main>
    </div>
  );
}
