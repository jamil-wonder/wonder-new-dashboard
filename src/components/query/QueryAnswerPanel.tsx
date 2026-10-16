"use client";

import SiteIcon from "../ui/SiteIcon";
import Image from "next/image";
import { X, CheckCircle2, XCircle } from "lucide-react";
import { SearchQueryItem } from "../../types/dashboard";
import { normalizeDomain, isValidSourceDomain } from "../../lib/querySources";
import { AiDisclaimer } from "../ui/AiDisclaimer";

interface QueryAnswerPanelProps {
  query: SearchQueryItem;
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
  // B1: show both ways a mention can happen, with the evidence for each
  const namedLine = result?.namedInAnswer
    ? `- Named in the answer: yes${result?.namedEvidence ? ` - "${cleanText(result.namedEvidence)}"` : ""}`
    : "- Named in the answer: no";
  const citedLine = result?.citedAsSource
    ? "- Cited as a source: yes (your site was one of the sources)"
    : "- Cited as a source: no";

  const whyLine = reasoning
    ? `- Why: ${cleanText(reasoning)}`
    : "- Why: Based on currently returned web evidence and ranking signals.";

  const evidenceLines =
    allReferences.length > 0
      ? allReferences.map((d) => `- ${d}`)
      : ["- No reliable third-party source domains were captured for this run."];

  const sections = [
    `${shorten(baseAnswer)}`,
    `Mention Check\n${mentionLine}\n${namedLine}\n${citedLine}\n${whyLine}`,
    `Sources Cited In This Answer\n${evidenceLines.join("\n")}`,
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
  return <SiteIcon domain={clean} size={16} className="border border-[#ece3d1] bg-white" />;
}

// B10: the answer is shown inline, right under the question's row, instead of in a pop-up.
export default function QueryAnswerPanel({ query, selectedModel, onClose }: QueryAnswerPanelProps) {
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
    <div className="-mt-1 rounded-xl border border-[#ece3d1] bg-[#faf8f3] min-w-[720px]">
      <div className="flex items-center justify-between border-b border-[#efe7d6] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Image src={cfg.icon} width={18} height={18} alt={cfg.name} className="object-contain" />
          <span className="font-spectral text-[15px] font-semibold text-[#15463b]">{cfg.name}&apos;s answer</span>
        </div>
        <button
          type="button" aria-label="Close answer" onClick={onClose}
          className="cursor-pointer rounded-lg p-1 text-[#6f6757] transition-colors hover:bg-[#f5f0e6] hover:text-[#23211b]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-col gap-4 p-4">
        <AiDisclaimer />
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
                      <p className="font-mono-spline text-[11px] font-bold uppercase tracking-wider text-[#6f6757] border-b border-[#efe7d6] pb-1.5 mb-2">
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
  );
}
