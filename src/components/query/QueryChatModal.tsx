"use client";

import Image from "next/image";
import { X, CheckCircle2, XCircle } from "lucide-react";
import { SearchQueryItem } from "../../types/dashboard";
import { normalizeDomain, isValidSourceDomain } from "../../lib/querySources";

interface QueryChatModalProps {
  query: SearchQueryItem | null;
  selectedModel: string;
  onClose: () => void;
}

const MODEL_CONFIG: Record<string, { name: string; icon: string }> = {
  ChatGPT:    { name: "ChatGPT",    icon: "/icons/chatgpt.svg" },
  Claude:     { name: "Claude",     icon: "/icons/claude.svg" },
  Perplexity: { name: "Perplexity", icon: "/icons/perplexity.svg" },
  Gemini:     { name: "Gemini",     icon: "/icons/gemini.svg" },
};

function parseDomainBullet(line: string): { domain: string; tail: string } | null {
  const match = line.match(/^\s*-\s*([a-z0-9.-]+\.[a-z]{2,})(.*)$/i);
  if (!match) return null;
  return {
    domain: normalizeDomain(match[1]),
    tail: (match[2] || "").trim(),
  };
}

function formatModelReplyText(
  rawResponse?: string | null,
  result?: any,
): string {
  const raw = (rawResponse || "").trim();
  const cleanText = (text: string) =>
    text
      .replace(/\[(\d+)\]/g, "")
      .replace(/\s+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  const shorten = (text: string, max = 650) => {
    const t = cleanText(text);
    if (t.length <= max) return t;
    return `${t.slice(0, max).trim()}...`;
  };

  const unfenced = (raw || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed: any = null;
  try {
    parsed = JSON.parse(unfenced);
  } catch {
    parsed = null;
  }

  const naturalFields = ["answer", "final_answer", "summary", "concise_answer", "natural_answer", "response"];
  let baseAnswer = raw;
  if (parsed && typeof parsed === "object") {
    for (const field of naturalFields) {
      const value = parsed[field];
      if (typeof value === "string" && value.trim()) {
        baseAnswer = value.trim();
        break;
      }
    }
  }

  if (!baseAnswer) {
    baseAnswer = "I could not generate a full natural-language answer for this query yet.";
  }

  const parsedTarget = parsed && typeof parsed.target === "object" ? parsed.target : {};
  const mentioned = typeof parsedTarget.mentioned === "boolean"
    ? parsedTarget.mentioned
    : Boolean(result?.status === "Mentioned");
  const position = typeof parsedTarget.position === "number"
    ? parsedTarget.position
    : result?.rank ?? null;

  const parsedReferences = Array.isArray(parsed?.references)
    ? parsed.references.filter((v: any) => typeof v === "string" && v.trim())
    : [];
  const resultReferences = [
    ...(result?.references || []),
    ...(result?.sources || []),
    ...((result?.sourceUrls || []).map((u: string) => normalizeDomain(u)).filter(Boolean) as string[]),
  ];
  const allReferences = Array.from(
    new Set(
      [...parsedReferences, ...resultReferences]
        .map((d) => normalizeDomain(String(d)))
        .filter((d) => d && isValidSourceDomain(d)),
    ),
  ).slice(0, 6);

  const parsedReasoning = typeof parsed?.reasoning === "string" ? parsed.reasoning.trim() : "";
  const reasoning = parsedReasoning || result?.reasoning || result?.evidence || "";

  const mentionLine = mentioned
    ? `- Status: Mentioned${position ? ` (approx rank #${position})` : ""}`
    : "- Status: Not Mentioned in top returned results";

  const whyLine = reasoning
    ? `- Why: ${cleanText(reasoning)}`
    : "- Why: Based on currently returned web evidence and ranking signals.";

  const evidenceLines =
    allReferences.length > 0
      ? allReferences.map((d) => `- ${d}`)
      : ["- No reliable third-party source domains were captured for this run."];

  const sections = [
    `${shorten(baseAnswer)}`,
    `Mention Check\n${mentionLine}\n${whyLine}`,
    `Where It Was Seen\n${evidenceLines.join("\n")}`,
  ];

  const siteObj = result?.targetSite || parsedTarget;
  if (siteObj) {
    const label =
      siteObj.status === "matched"
        ? "Site matched this prompt"
        : siteObj.status === "partial"
          ? "Partial matched this prompt"
          : "Not matched for this prompt";
    const siteLines = [
      siteObj.sourceDomain ? `- ${siteObj.sourceDomain}` : "",
      siteObj.summary ? `- ${siteObj.summary}` : "",
      ...(siteObj.matchedFacts || siteObj.matched_facts || []).slice(0, 3).map((fact: string) => `- Found: ${fact}`),
      ...(siteObj.missingFacts || siteObj.missing_facts || []).slice(0, 3).map((fact: string) => `- Missing: ${fact}`),
    ].filter(Boolean);
    sections.push(`Your Site As Source\n- ${label}\n${siteLines.join("\n")}`);
  }

  return sections.join("\n\n");
}

function Favicon({ domain }: { domain: string }) {
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

export default function QueryChatModal({ query, selectedModel, onClose }: QueryChatModalProps) {
  if (!query) return null;

  const cfg = MODEL_CONFIG[selectedModel] || MODEL_CONFIG.ChatGPT;
  const modelRes = query.resultsByModel?.[selectedModel] || {
    status: query.status,
    rank: query.rank,
    sources: query.sources,
    answerSnippet: query.answerSnippet,
    reasoning: query.reasoning || query.evidence,
    targetSite: query.targetSite,
  };

  const rawAnswer = modelRes.llmResponse || modelRes.answerSnippet || query.answerSnippet || "";
  const formattedText = formatModelReplyText(rawAnswer, modelRes);

  return (
    <div
      className="fixed inset-0 bg-[#0f1c18]/55 backdrop-blur-sm z-[999] flex items-center justify-center p-4 md:p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-[#ece3d1] rounded-[22px] shadow-[0_20px_48px_rgba(21,70,59,0.2)] w-full max-w-[760px] max-h-[88vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#efe7d6] bg-[#fdfcf8]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl border border-[#ece3d1] bg-white flex items-center justify-center shadow-xs">
              <Image src={cfg.icon} width={20} height={20} alt={cfg.name} className="object-contain" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-spectral text-[17px] font-semibold text-[#15463b]">
                {cfg.name} Response
              </span>
              <span className="text-[11px] font-mono-spline text-[#9b927f]">Generative AI Search Engine Log</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#9b927f] hover:text-[#23211b] transition-colors rounded-lg hover:bg-[#f5f0e6] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex flex-col gap-5 bg-[#faf8f3] flex-1">

          {/* User Query Bubble */}
          <div className="flex justify-end">
            <div className="bg-[#15463b] text-white px-5 py-3.5 rounded-[18px_18px_4px_18px] max-w-[85%] text-[14.5px] font-semibold leading-relaxed shadow-xs">
              &ldquo;{query.query}&rdquo;
            </div>
          </div>

          {/* AI Response Card - Formatted matching Old Dashboard */}
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-full bg-white border border-[#e5ddd0] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
              <Image src={cfg.icon} width={20} height={20} alt={cfg.name} className="object-contain" />
            </div>

            <div className="bg-white border border-[#ece3d1] p-5 md:p-6 rounded-[20px_20px_20px_4px] max-w-[88%] text-[13.5px] leading-relaxed text-[#23211b] shadow-xs flex-1 space-y-4">
              {formattedText.split("\n\n").map((section, sectionIndex) => {
                const lines = section.split("\n").filter(Boolean);
                const hasTitle = lines.length > 1 && !lines[0].trim().startsWith("-");
                const title = hasTitle ? lines[0] : "";
                const bodyLines = hasTitle ? lines.slice(1) : lines;

                return (
                  <div key={`sec-${sectionIndex}`} className="space-y-2">
                    {title && (
                      <p className="font-mono-spline text-[10.5px] font-bold uppercase tracking-wider text-[#8a8273] border-b border-[#efe7d6] pb-1.5 mb-2">
                        {title}
                      </p>
                    )}

                    {bodyLines.map((line, lineIndex) => {
                      const parsedDomain = parseDomainBullet(line);
                      if (parsedDomain?.domain) {
                        return (
                          <div
                            key={`line-${sectionIndex}-${lineIndex}`}
                            className="flex items-center gap-2 text-[13px] font-medium text-[#2c2821] py-0.5"
                          >
                            <Favicon domain={parsedDomain.domain} />
                            <span className="font-semibold text-[#15463b]">{parsedDomain.domain}</span>
                            {parsedDomain.tail && <span className="text-[#8a8273] text-[12px]">{parsedDomain.tail}</span>}
                          </div>
                        );
                      }

                      if (line.trim().startsWith("-")) {
                        const textValue = line.replace(/^\s*-\s*/, "").trim();
                        const isFound = textValue.startsWith("Found:");
                        const isMissing = textValue.startsWith("Missing:");
                        const isStatus = textValue.startsWith("Status:");
                        const isWhy = textValue.startsWith("Why:");

                        return (
                          <div
                            key={`line-${sectionIndex}-${lineIndex}`}
                            className="flex items-start gap-2 text-[13px] leading-relaxed text-[#3a352b]"
                          >
                            {isStatus ? (
                              <span className="font-bold text-[#15463b]">
                                {textValue.includes("Mentioned") && !textValue.includes("Not Mentioned") ? (
                                  <span className="inline-flex items-center gap-1 text-[#1e7d4f] font-bold">
                                    <CheckCircle2 className="w-4 h-4 inline" /> {textValue}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[#b1442a] font-bold">
                                    <XCircle className="w-4 h-4 inline" /> {textValue}
                                  </span>
                                )}
                              </span>
                            ) : isWhy ? (
                              <span>
                                <strong className="text-[#15463b]">Why:</strong> {textValue.replace(/^Why:\s*/, "")}
                              </span>
                            ) : isFound ? (
                              <span className="text-[#1e7d4f] font-medium">✓ {textValue}</span>
                            ) : isMissing ? (
                              <span className="text-[#b1442a] font-medium">✕ {textValue}</span>
                            ) : (
                              <>
                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#9b927f] shrink-0" />
                                <span>{textValue}</span>
                              </>
                            )}
                          </div>
                        );
                      }

                      return (
                        <p
                          key={`line-${sectionIndex}-${lineIndex}`}
                          className="text-[13.5px] leading-relaxed text-[#2c2821] whitespace-pre-wrap break-words font-medium"
                        >
                          {line}
                        </p>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
