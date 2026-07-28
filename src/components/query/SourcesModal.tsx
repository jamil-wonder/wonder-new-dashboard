"use client";

import { X, Globe, ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { SearchQueryItem } from "../../types/dashboard";

interface SourcesModalProps {
  query: SearchQueryItem | null;
  onClose: () => void;
}

function normalizeDomain(value: string): string {
  const raw = (value || "").trim().toLowerCase();
  if (!raw) return "";
  try {
    const host = new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname;
    return host.replace(/^www\./, "").replace(/[),.;:]+$/g, "");
  } catch {
    return raw.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].replace(/[),.;:]+$/g, "");
  }
}

function DomainFavicon({ domain }: { domain: string }) {
  const clean = normalizeDomain(domain);
  if (!clean) return null;
  return (
    <img
      src={`https://www.google.com/s2/favicons?domain=${clean}&sz=64`}
      alt={clean}
      className="w-4 h-4 rounded-sm object-contain shrink-0 border border-[#ece3d1] bg-white"
      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
    />
  );
}

export default function SourcesModal({ query, onClose }: SourcesModalProps) {
  if (!query) return null;

  // Gather all unique sources across all providers for this query
  const allSourcesSet = new Set<string>();
  (query.sources || []).forEach((s) => allSourcesSet.add(normalizeDomain(s)));

  let targetSiteObj: any = (query as any).targetSite;

  if (query.resultsByModel) {
    Object.values(query.resultsByModel).forEach((mRes: any) => {
      (mRes.sources || []).forEach((s: string) => allSourcesSet.add(normalizeDomain(s)));
      if (mRes.targetSite && !targetSiteObj) {
        targetSiteObj = mRes.targetSite;
      }
    });
  }

  const sourcesList = Array.from(allSourcesSet).filter(Boolean);

  const siteStatus = targetSiteObj?.status;
  const siteDomain = targetSiteObj?.domain || "thegallivant.co.uk";
  const supportedFacts = Array.isArray(targetSiteObj?.supported_facts || targetSiteObj?.supportedFacts)
    ? (targetSiteObj?.supported_facts || targetSiteObj?.supportedFacts)
    : [];
  const missingFacts = Array.isArray(targetSiteObj?.missing_facts || targetSiteObj?.missingFacts)
    ? (targetSiteObj?.missing_facts || targetSiteObj?.missingFacts)
    : [];

  return (
    <div
      className="fixed inset-0 bg-[#0f1c18]/50 backdrop-blur-xs z-[9999] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-[#ece3d1] rounded-2xl shadow-[0_16px_36px_rgba(21,70,59,0.18)] w-full max-w-[580px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#efe7d6] bg-[#fdfcf8]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#eef3f0] border border-[#d0e4d6] text-[#15463b] flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-spectral text-[17px] font-semibold text-[#15463b]">
                All Extracted Cited Sources
              </h3>
              <p className="text-[11.5px] text-[#8a8273]">
                {sourcesList.length} domain sources captured for this prompt
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8a8273] hover:text-[#23211b] hover:bg-[#f5f0e6] rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Query Context Banner */}
        <div className="px-5 py-3 bg-[#f6f3ec] border-b border-[#efe7d6] text-[13px] font-medium text-[#2c2821]">
          &ldquo;{query.query}&rdquo;
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[65vh] overflow-y-auto space-y-4">
          
          {/* SECTION 1: Your Site As Source */}
          <div className="bg-[#fcfaf5] border border-[#efe7d6] rounded-xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#15463b]" />
                <span className="text-[13px] font-bold text-[#15463b]">Your Site As Source</span>
              </div>

              {siteStatus === "matched" && (
                <span className="text-[11px] font-bold text-[#15803d] bg-[#dcfce7] border border-[#bbf7d0] px-2.5 py-0.5 rounded-md">
                  ✓ Site matched this prompt
                </span>
              )}
              {siteStatus === "partial" && (
                <span className="text-[11px] font-bold text-[#92400e] bg-[#fef3c7] border border-[#fde68a] px-2.5 py-0.5 rounded-md">
                  Partial matched this prompt
                </span>
              )}
              {(siteStatus === "no_match" || !siteStatus) && (
                <span className="text-[11px] font-medium text-[#6b7280] bg-[#f3f4f6] border border-[#e5e7eb] px-2.5 py-0.5 rounded-md">
                  Not matched for this prompt
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[#2c2821] pt-1">
              <DomainFavicon domain={siteDomain} />
              <span>{siteDomain}</span>
            </div>

            {/* Supported & Missing Facts */}
            {supportedFacts.length > 0 && (
              <div className="space-y-1 pt-1">
                {supportedFacts.map((fact: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[12px] text-[#15803d]">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>✓ Found: {fact}</span>
                  </div>
                ))}
              </div>
            )}

            {missingFacts.length > 0 && (
              <div className="space-y-1 pt-1">
                {missingFacts.map((fact: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[12px] text-[#b91c1c]">
                    <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>✕ Missing: {fact}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: External Sources Grid */}
          <div>
            <div className="text-[12px] font-bold text-[#9b927f] uppercase tracking-wider mb-2">
              Captured External Domains ({sourcesList.length})
            </div>

            {sourcesList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sourcesList.map((srcDomain) => (
                  <a
                    key={srcDomain}
                    href={`https://${srcDomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-[#ece3d1] bg-[#fdfcf8] hover:border-[#15463b] hover:bg-white transition-all text-[13px] font-medium text-[#2c2821] group"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <DomainFavicon domain={srcDomain} />
                      <span className="truncate group-hover:underline">{srcDomain}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8a8273] group-hover:text-[#15463b] shrink-0 ml-1" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-[12.5px] text-[#8a8273]">
                No external third-party domain sources captured yet.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
