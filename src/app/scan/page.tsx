"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, ArrowRight, Lock } from "lucide-react";
import { WonderscoreLogo } from "../../components/ui/WonderscoreSpinner";
import { fetchApi } from "../../lib/api";

type Stage = "entry" | "scanning" | "result" | "unlocked";

const SCAN_MESSAGES = [
  "Testing recommendations across ChatGPT, Gemini, Claude and Perplexity…",
  "Checking whether AI assistants know your business…",
  "Comparing you against nearby competitors…",
  "Pulling together your Wonder Score…",
];

function getGrade(score: number) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 55) return "B";
  if (score >= 40) return "C";
  return "F";
}

function getVisibilityText(score: number) {
  if (score >= 80) return "High Visibility";
  if (score >= 65) return "Good Visibility";
  if (score >= 50) return "Moderate Visibility";
  if (score >= 35) return "Low Visibility";
  return "Very Low Visibility";
}

const MODEL_ICONS: Record<string, string> = {
  chatgpt: "/icons/chatgpt.svg",
  gpt: "/icons/chatgpt.svg",
  openai: "/icons/chatgpt.svg",
  claude: "/icons/claude.svg",
  anthropic: "/icons/claude.svg",
  gemini: "/icons/gemini.svg",
  google: "/icons/gemini.svg",
  perplexity: "/icons/perplexity.svg",
  sonar: "/icons/perplexity.svg",
};

function modelIcon(modelName?: string): string | null {
  if (!modelName) return null;
  const lowered = modelName.toLowerCase();
  const key = Object.keys(MODEL_ICONS).find((k) => lowered.includes(k));
  return key ? MODEL_ICONS[key] : null;
}

const MODEL_DISPLAY_NAMES: Record<string, string> = {
  chatgpt: "ChatGPT",
  gpt: "ChatGPT",
  openai: "ChatGPT",
  claude: "Claude",
  anthropic: "Claude",
  gemini: "Gemini",
  google: "Gemini",
  perplexity: "Perplexity",
  sonar: "Perplexity",
};

// Raw model identifiers (gpt-5.4-mini, claude-sonnet-4-5, ...) are an
// implementation detail — the brand name is what a visitor recognizes.
function modelDisplayName(modelName?: string): string {
  if (!modelName) return "AI";
  const lowered = modelName.toLowerCase();
  const key = Object.keys(MODEL_DISPLAY_NAMES).find((k) => lowered.includes(k));
  return key ? MODEL_DISPLAY_NAMES[key] : modelName;
}

type Finding = { text: string; modelName?: string };

// Real findings only, synthesized from the actual per-model AI insight data
// (isKnown/summary/evidence/platforms) — never fabricated point values or
// invented "X of 10 questions" stats we don't have data for at this stage.
function buildFindings(insights: any[], businessName: string): Finding[] {
  const findings: Finding[] = [];
  if (!Array.isArray(insights) || insights.length === 0) {
    return [{ text: "We couldn't gather AI recognition data for this site — try again in a moment." }];
  }
  const known = insights.filter((i) => i?.isKnown);
  const unknown = insights.filter((i) => !i?.isKnown);
  const total = insights.length;

  if (known.length === 0) {
    findings.push({ text: `None of the ${total} AI assistant${total === 1 ? "" : "s"} we tested recognize${total === 1 ? "s" : ""} ${businessName} yet.` });
  } else if (known.length === total) {
    findings.push({ text: `${total === 1 ? "The" : "All " + total} AI assistant${total === 1 ? "" : "s"} we tested already recognize${total === 1 ? "s" : ""} ${businessName}.` });
  } else {
    findings.push({ text: `${known.length} of ${total} AI assistants recognize ${businessName} — ${unknown.map((i) => modelDisplayName(i.modelName)).join(", ")} ${unknown.length === 1 ? "doesn't" : "don't"}.` });
  }

  const sampleKnown = known.find((i) => i.summary);
  if (sampleKnown?.summary) {
    findings.push({
      text: `Says: "${String(sampleKnown.summary)}"`,
      modelName: sampleKnown.modelName,
    });
  }

  const sampleEvidence = unknown.find((i) => Array.isArray(i.evidence) && i.evidence.length > 0);
  if (sampleEvidence) {
    findings.push({ text: "Has no evidence of your business in its answers yet.", modelName: sampleEvidence.modelName });
  } else if (findings.length < 3 && known.length > 0 && known.length < total) {
    findings.push({ text: "Closing that gap is exactly what weekly tracking is for." });
  } else if (findings.length < 3) {
    // Single fully-known-model case (the anonymous preview only tests one
    // model to keep cost down) — a third genuine data point instead of
    // stopping at two: what platforms it says it knows the business from.
    const withPlatforms = known.find((i) => Array.isArray(i.platforms) && i.platforms.length > 0);
    if (withPlatforms) {
      findings.push({ text: `Knows you from: ${withPlatforms.platforms.slice(0, 4).join(", ")}.`, modelName: withPlatforms.modelName });
    }
  }

  return findings.slice(0, 3);
}

function scrapeErrorMessage(err: any): string {
  if (err?.status === 429) {
    return "You've used today's free Wonder Score previews. Sign up for full access, or try again tomorrow.";
  }
  return "We couldn't reach that website. Double-check the URL and try again.";
}

function ScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("url") || "";

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [stage, setStage] = useState<Stage>("entry");
  const [url, setUrl] = useState(initialUrl);
  const [errorMsg, setErrorMsg] = useState("");
  const [scanMessageIndex, setScanMessageIndex] = useState(0);

  const [score, setScore] = useState<number | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [findings, setFindings] = useState<Finding[]>([]);
  const [findingsLoading, setFindingsLoading] = useState(false);
  const [findingsLimited, setFindingsLimited] = useState(false);

  const [email, setEmail] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [competitorsLoading, setCompetitorsLoading] = useState(false);
  const [competitorsLoaded, setCompetitorsLoaded] = useState(false);
  const [fullResultQuestions, setFullResultQuestions] = useState<any[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsLoaded, setQuestionsLoaded] = useState(false);

  const scanMessageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // Synchronous re-entrancy guard — the anonymous scan is rate-limited to
  // one real success per day per visitor, so an accidental double-submit
  // (double-click, a stray re-render re-firing the handler, or the
  // auto-run-on-arrival effect racing a manual click) must never burn that
  // single allowance on a duplicate call.
  const isScanningRef = useRef(false);
  const autoRunDone = useRef(false);

  // Already-signed-in visitors skip straight to their dashboard — this
  // page is the anonymous entry point only.
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("wonder_token") : null;
    if (token) {
      router.replace("/overview");
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  useEffect(() => {
    if (stage === "scanning") {
      scanMessageTimer.current = setInterval(() => {
        setScanMessageIndex((i) => (i + 1) % SCAN_MESSAGES.length);
      }, 2500);
    }
    return () => {
      if (scanMessageTimer.current) clearInterval(scanMessageTimer.current);
    };
  }, [stage]);

  const runScan = async (rawUrl: string) => {
    if (!rawUrl.trim() || isScanningRef.current) return;
    isScanningRef.current = true;
    setErrorMsg("");
    setFindingsLimited(false);
    setScanMessageIndex(0);
    setStage("scanning");
    const cleanUrl = rawUrl.trim().startsWith("http") ? rawUrl.trim() : `https://${rawUrl.trim()}`;

    try {
      const scrapeRes = await fetchApi<any>("/api/scrape", {
        method: "POST",
        body: JSON.stringify({ url: cleanUrl }),
      });
      const totalScore = scrapeRes?.scores?.total ?? 0;
      const detectedName = scrapeRes?.businessName || cleanUrl.replace(/^https?:\/\//, "").split("/")[0];
      // The scrape already found real location/description signal — losing
      // it here means the competitor lookup below has nothing to anchor on
      // but a bare name, which is exactly what let it return same-name-ish
      // matches from the wrong country entirely.
      const detectedLocation = Array.isArray(scrapeRes?.addresses) && scrapeRes.addresses[0] ? scrapeRes.addresses[0] : "";
      const detectedDescription = scrapeRes?.description || "";
      setScore(totalScore);
      setBusinessName(detectedName);
      setLocation(detectedLocation);
      setDescription(detectedDescription);
      setUrl(cleanUrl);
      setStage("result");

      setFindingsLoading(true);
      try {
        const insightsRes = await fetchApi<any>("/api/ai-insights", {
          method: "POST",
          body: JSON.stringify({ url: cleanUrl, businessName: detectedName }),
        });
        setFindings(buildFindings(insightsRes?.insights || [], detectedName));
      } catch (insightErr: any) {
        // A 429 here means the visitor's free AI-recognition check for today
        // is already spent — a real, honest state, not a slow response, so
        // it must say so rather than implying "still loading."
        if (insightErr?.status === 429) {
          setFindingsLimited(true);
        } else {
          setFindings([{ text: "AI recognition data is temporarily unavailable — the full breakdown will have it." }]);
        }
      } finally {
        setFindingsLoading(false);
      }
    } catch (err: any) {
      setStage("entry");
      setErrorMsg(scrapeErrorMessage(err));
    } finally {
      isScanningRef.current = false;
    }
  };

  // Arriving here with ?url= already means the visitor pasted it on the
  // real marketing landing page and clicked through — don't make them
  // type it again, just start scanning immediately.
  useEffect(() => {
    if (checkingAuth || autoRunDone.current || !initialUrl.trim()) return;
    autoRunDone.current = true;
    runScan(initialUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingAuth, initialUrl]);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    runScan(url);
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsUnlocking(true);
    setErrorMsg("");
    try {
      await fetchApi("/api/public/scan-unlock", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), url, score }),
      });
      setStage("unlocked");
      setCompetitorsLoading(true);
      setQuestionsLoading(true);
      Promise.all([
        (async () => {
          try {
            const compRes = await fetchApi<any>("/api/public/competitors", {
              method: "POST",
              body: JSON.stringify({ url, businessName, location, description }),
            });
            setCompetitors(compRes?.competitors || []);
          } catch {
            // Competitor lookup is a nice-to-have on the unlocked view — the
            // score and findings are already real and already shown, so a
            // failure here shouldn't block anything.
          } finally {
            setCompetitorsLoading(false);
            setCompetitorsLoaded(true);
          }
        })(),
        (async () => {
          try {
            const qRes = await fetchApi<any>("/api/public/full-results", {
              method: "POST",
              body: JSON.stringify({ url, businessName, category: "", location, description }),
            });
            setFullResultQuestions(qRes?.questions || []);
          } catch {
            // Same as competitors — a nice-to-have on top of the already-real
            // score and findings, so a failure here shouldn't block anything.
          } finally {
            setQuestionsLoading(false);
            setQuestionsLoaded(true);
          }
        })(),
      ]);
    } catch (err: any) {
      setErrorMsg(err?.message || "Couldn't unlock your results. Please try again.");
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleCreateAccount = () => {
    // Onboarding's own URL-entry step is redundant for someone who already
    // ran this preview — hand off what we already found so it can skip
    // straight past re-typing the URL and re-crawling the site.
    try {
      localStorage.setItem("wonder_scan_prefill", JSON.stringify({ url, businessName, location, description }));
    } catch {}
    router.push("/auth?signup=true");
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#fdfcf8] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#15463b]" />
      </div>
    );
  }

  const grade = score !== null ? getGrade(score) : "";
  const visibilityText = score !== null ? getVisibilityText(score) : "";

  return (
    <div className="min-h-screen bg-[#fdfcf8] flex flex-col">
      <header className="px-6 py-5 flex items-center justify-between max-w-[900px] w-full mx-auto">
        <div className="flex items-center gap-2">
          <WonderscoreLogo size={28} color="#15463b" />
          <span className="font-spectral text-[20px] font-medium text-[#15463b]">Wonderscore</span>
        </div>
        <button
          onClick={() => router.push("/auth")}
          className="text-[13px] font-semibold text-[#15463b] hover:underline cursor-pointer bg-transparent border-none"
        >
          Sign in
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-10 md:py-16">
        <AnimatePresence>
          {stage === "entry" && (
            <motion.div
              key="entry"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-[480px]"
            >
              {/* No sell copy here — the pitch already happened on the real
                  landing page. This is just the working input for someone
                  who's already decided to check. */}
              <form onSubmit={handleScan} className="flex gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9b927f]" />
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="yourbusiness.com"
                    required
                    autoFocus
                    className="w-full text-[14px] pl-10 pr-4 py-3 border border-[#ece3d1] rounded-xl bg-white outline-none focus:border-[#15463b] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="shrink-0 inline-flex items-center justify-center gap-2 py-3 px-5 bg-[#15463b] text-white text-[14px] font-bold rounded-xl hover:bg-[#1a5c44] transition-colors cursor-pointer"
                >
                  Scan <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {errorMsg && (
                <div className="mt-4 p-3 bg-[#fdf2f0] border border-[#f6dcd5] rounded-xl text-[12.5px] font-medium text-[#b1442a]">
                  {errorMsg}
                </div>
              )}
            </motion.div>
          )}

          {stage === "scanning" && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-[480px] text-center py-16"
            >
              <Loader2 className="w-9 h-9 animate-spin text-[#15463b] mx-auto mb-6" />
              <AnimatePresence>
                <motion.p
                  key={scanMessageIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-[14px] text-[#4a4437] font-medium"
                >
                  {SCAN_MESSAGES[scanMessageIndex]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}

          {(stage === "result" || stage === "unlocked") && score !== null && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-[620px]"
            >
              <div className="bg-white border border-[#ece3d1] rounded-[20px] p-6 md:p-8 shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="relative w-[84px] h-[84px] shrink-0">
                    <svg width="84" height="84" viewBox="0 0 84 84">
                      <circle cx="42" cy="42" r="36" fill="none" stroke="#eef0ec" strokeWidth="7" />
                      <circle
                        cx="42" cy="42" r="36" fill="none" stroke="#1e7d4f" strokeWidth="7"
                        strokeLinecap="round"
                        strokeDasharray={`${(score / 100) * 2 * Math.PI * 36} ${2 * Math.PI * 36}`}
                        transform="rotate(-90 42 42)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-spectral font-bold text-[24px] text-[#15463b] leading-none">{score}</span>
                      <span className="text-[9px] text-[#9b927f] mt-0.5">/100</span>
                    </div>
                  </div>
                  <div>
                    <div className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f]">Wonder Score for</div>
                    <div className="font-spectral text-[19px] font-semibold text-[#23211b]">{businessName}</div>
                    <div className="text-[12.5px] font-semibold text-[#1e7d4f] mt-1">Grade {grade} · {visibilityText}</div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[#efe7d6]">
                  <div className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] mb-3">What we found</div>
                  {findingsLoading ? (
                    <div className="flex items-center gap-2 text-[13px] text-[#8a8273]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking AI recognition…
                    </div>
                  ) : findingsLimited ? (
                    <div className="text-[13px] text-[#8a8273] leading-relaxed">
                      You've used today's free AI-recognition check. Your Wonder Score above is still real — sign up to see per-model findings and track them weekly.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {findings.map((f, i) => {
                        const icon = modelIcon(f.modelName);
                        const displayName = modelDisplayName(f.modelName);
                        return (
                          <div key={i} className="flex items-start gap-2.5">
                            {icon ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={icon} alt={displayName} title={displayName} className="w-5 h-5 rounded-full shrink-0 mt-0.5 object-contain" />
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-[#eef3f0] text-[#1e7d4f] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                            )}
                            <p className="text-[13.5px] text-[#4a4437] leading-relaxed">{f.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Full breakdown — blurred + email-gated until unlocked, the
                  highest-converting moment per Part 1: it comes AFTER the
                  free findings, never before. */}
              <div className="relative mt-4">
                <div className={stage === "unlocked" ? "" : "pointer-events-none select-none blur-[6px]"}>
                  <div className="bg-white border border-[#ece3d1] rounded-[20px] p-6 md:p-8 shadow-sm">
                    <div className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] mb-3">Every question, who wins it</div>
                    {stage === "unlocked" && questionsLoading ? (
                      <div className="flex items-center gap-2 text-[13px] text-[#8a8273] py-2 mb-4">
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                        Running real questions against AI models…
                      </div>
                    ) : stage === "unlocked" && fullResultQuestions.length > 0 ? (
                      <div className="space-y-3 mb-6">
                        {fullResultQuestions.map((q, i) => (
                          <div key={i} className="py-3 px-3 -mx-1 rounded-lg border border-[#f1eadf]">
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-[13.5px] text-[#23211b] font-medium leading-snug">{q.query}</p>
                              <span
                                className={`shrink-0 text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                                  q.mentioned ? "bg-[#e9f6ee] text-[#1e7d4f]" : "bg-[#fdf2f0] text-[#b1442a]"
                                }`}
                              >
                                {q.mentioned ? "You win" : "Not mentioned"}
                              </span>
                            </div>
                            {!q.mentioned && q.topCompetitor && (
                              <p className="text-[12px] text-[#8a8273] mt-1.5">
                                Winning it right now: <span className="font-semibold text-[#4a4437]">{q.topCompetitor}</span>
                              </p>
                            )}
                            {Array.isArray(q.sources) && q.sources.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-2">
                                <span className="text-[11px] text-[#9b927f] mr-0.5">Sources cited:</span>
                                {q.sources.slice(0, 5).map((s: string) => (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    key={s}
                                    src={`https://www.google.com/s2/favicons?domain=${s}&sz=32`}
                                    alt={s}
                                    title={s}
                                    className="w-4 h-4 rounded-full shrink-0"
                                  />
                                ))}
                                {q.sources.length > 5 && (
                                  <span className="text-[11px] text-[#9b927f]">+{q.sources.length - 5}</span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : stage === "unlocked" && questionsLoaded ? (
                      <div className="text-[13px] text-[#8a8273] py-2 mb-4">
                        No question results available right now — that sharpens once you're tracking weekly.
                      </div>
                    ) : null}

                    <div className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] mb-3">Competitors</div>
                    {stage === "unlocked" && competitors.length > 0 ? (
                      <div className="space-y-1">
                        {competitors.map((c, i) => (
                          <a
                            key={c.domain || i}
                            href={c.url || `https://${c.domain}/`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-3 py-3 px-2 -mx-2 rounded-lg border-b border-[#f1eadf] last:border-0 hover:bg-[#f6f3ec] transition-colors cursor-pointer"
                          >
                            {c.faviconUrl && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.faviconUrl} alt="" className="w-7 h-7 rounded-md shrink-0" />
                            )}
                            <span className="text-[15px] text-[#23211b] font-medium flex-1 min-w-0 truncate">{c.domain}</span>
                            {c.score !== undefined && <span className="text-[14px] font-bold text-[#15463b]">{c.score}/100</span>}
                          </a>
                        ))}
                      </div>
                    ) : stage === "unlocked" && competitorsLoaded && !competitorsLoading ? (
                      // Genuinely no competitors surfaced — an honest result,
                      // not a stuck loading state. Only shows once the call
                      // has actually finished, so it never flashes before
                      // the real answer arrives.
                      <div className="text-[13px] text-[#8a8273] py-2">
                        No specific competitors surfaced for this site yet — that sharpens once you're tracking weekly.
                      </div>
                    ) : stage === "unlocked" && competitorsLoading ? (
                      // Explicit, visibly-active state — this lookup can take
                      // up to ~30s, and static gray bars alone read as stuck
                      // rather than working.
                      <div className="flex items-center gap-2 text-[13px] text-[#8a8273] py-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                        Finding real competitors for you — this can take up to 30 seconds…
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="h-4 bg-[#f0ebe0] rounded w-full animate-pulse" />
                        ))}
                      </div>
                    )}
                    <p className="text-[12.5px] text-[#8a8273] mt-4">
                      This is a snapshot. Weekly tracking, competitor comparisons, and a prepared plan to close every gap is the paid product.
                    </p>
                  </div>
                </div>

                {stage === "result" && (
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <form onSubmit={handleUnlock} className="bg-white border border-[#ece3d1] rounded-2xl p-5 shadow-[0_8px_28px_rgba(21,70,59,0.16)] w-full max-w-[380px] text-center">
                      <Lock className="w-5 h-5 text-[#15463b] mx-auto mb-2" />
                      <div className="font-spectral text-[16px] font-semibold text-[#15463b]">Unlock the full breakdown</div>
                      <p className="text-[12px] text-[#8a8273] mt-1 mb-4">One email — no account needed yet.</p>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoFocus
                        placeholder="you@business.com"
                        className="w-full text-[13.5px] px-3.5 py-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors text-center"
                      />
                      <button
                        type="submit"
                        disabled={isUnlocking}
                        className="w-full mt-2.5 py-2.5 bg-[#15463b] text-white text-[13px] font-bold rounded-lg hover:bg-[#1a5c44] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isUnlocking ? "Unlocking…" : "Unlock full breakdown"}
                      </button>
                    </form>
                  </div>
                )}
              </div>

              {stage === "unlocked" && (
                <div className="mt-5 text-center">
                  <button
                    onClick={handleCreateAccount}
                    className="inline-flex items-center gap-2 py-3.5 px-7 bg-[#15463b] text-white text-[14px] font-bold rounded-xl hover:bg-[#1a5c44] transition-colors cursor-pointer"
                  >
                    Create free account & start tracking <ArrowRight className="w-4 h-4" />
                  </button>
                  <p className="text-[11.5px] text-[#9b927f] mt-2.5">Free trial, no charge until you're ready.</p>
                </div>
              )}

              {errorMsg && (
                <div className="mt-4 p-3 bg-[#fdf2f0] border border-[#f6dcd5] rounded-xl text-[12.5px] font-medium text-[#b1442a] text-center">
                  {errorMsg}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fdfcf8] flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-[#15463b]" /></div>}>
      <ScanContent />
    </Suspense>
  );
}
