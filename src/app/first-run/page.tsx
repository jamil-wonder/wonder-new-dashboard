"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Pencil, Wand2, X } from "lucide-react";
import { useBusiness } from "../../context/BusinessContext";
import { fetchApi, parseApiError } from "../../lib/api";
import { WonderscoreLogo } from "../../components/ui/WonderscoreSpinner";
import ProgressScreen from "../../components/ui/ProgressScreen";
import FailedState from "../../components/ui/FailedState";
import ScoreBreakdownPopover from "../../components/ui/ScoreBreakdown";
import { deriveStages, questionsFromGeneration, type FirstRunQuestion, type RunStatus } from "../../lib/firstRun";

type Phase = "starting" | "generating" | "review" | "running" | "done" | "error";

const POLL_MS = 3000;
const MAX_POLL_FAILURES = 6;

// J5: after the profile steps - write the 20 questions, let the owner look at them, run ONE scan
// (website + the four AI models) with a progress screen, then the first score.
export default function FirstRunPage() {
  const router = useRouter();
  const { activeBusiness, hasLoadedOnce, refetchBusinesses } = useBusiness();
  const [phase, setPhase] = useState<Phase>("starting");
  const [questions, setQuestions] = useState<FirstRunQuestion[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [status, setStatus] = useState<RunStatus | null>(null);
  const [error, setError] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [starting, setStarting] = useState(false);
  // J8: which question is being edited, and the text in the box
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftText, setDraftText] = useState("");
  const [rewritingId, setRewritingId] = useState<number | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestNote, setSuggestNote] = useState("");
  const initRef = useRef(false);
  const failuresRef = useRef(0);

  const business = activeBusiness?.id ? activeBusiness : null;

  const generate = useCallback(async () => {
    if (!business) return;
    setPhase("generating");
    setError("");
    try {
      const services = Array.isArray(business.services)
        ? business.services
        : String(business.services || "").split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetchApi<any>("/api/phase5/generate-questions", {
        method: "POST",
        body: JSON.stringify({
          url: business.url.startsWith("http") ? business.url : `https://${business.url}`,
          business_id: business.id,
          businessName: business.name,
          category: business.category,
          location: business.location,
          description: business.description || business.aiDescription,
          services,
          questionGeneration: business.questionGeneration,
          avoidQuestions: questions.map((q) => q.query),
        }),
      });
      const rows = questionsFromGeneration(res);
      if (rows.length === 0) throw new Error("No questions came back.");
      // J3: the question the owner typed before signing up replaces the last generated Non-Branded one
      try {
        const own = (localStorage.getItem("wonder_first_question") || "").trim();
        if (own) {
          localStorage.removeItem("wonder_first_question");
          const idx = rows.map((r) => r.type).lastIndexOf("non-branded");
          if (idx >= 0) rows[idx] = { ...rows[idx], query: own };
        }
      } catch {}
      setQuestions(rows);
      setPhase("review");
    } catch (err) {
      setError(parseApiError(err, "We couldn't write your questions. Please try again."));
      setPhase("error");
    }
  }, [business, questions]);

  const keptQuestions = questions.filter((q) => q.keep !== false);

  // J8: ask for a more human wording; it lands in the edit box so the owner decides
  const rewriteQuestion = async (q: FirstRunQuestion) => {
    if (!business || rewritingId !== null) return;
    setRewritingId(q.id);
    try {
      const res = await fetchApi<{ rewritten: string | null }>("/api/phase5/rewrite-question", {
        method: "POST",
        body: JSON.stringify({ question: q.query, businessName: business.name, category: business.category, location: business.location, branded: q.type === "branded" }),
      });
      if (res.rewritten) {
        setEditingId(q.id);
        setDraftText(res.rewritten);
      }
    } catch {
      /* the original stays as it is */
    } finally {
      setRewritingId(null);
    }
  };

  // J8: a few more candidates (one quick call, about 15 seconds), set aside by default so the owner can swap some in
  const suggestMore = async () => {
    if (!business || suggesting) return;
    setSuggesting(true);
    try {
      const res = await fetchApi<{ questions: Array<{ text: string; type: FirstRunQuestion["type"]; label: string }> }>("/api/phase5/suggest-questions", {
        method: "POST",
        body: JSON.stringify({ business_id: business.id, existing: questions.map((q) => q.query) }),
      });
      let next = Math.max(0, ...questions.map((q) => q.id)) + 1;
      const fresh = (res.questions || []).map((q) => ({ id: next++, type: q.type, label: q.label, query: q.text, keep: false }));
      setQuestions((qs) => [...qs, ...fresh]);
      setSuggestNote(fresh.length > 0 ? `Added ${fresh.length} suggestions, unticked. Swap them in by ticking them and unticking others.` : "No new suggestions this time - try again, or write your own.");
    } catch {
      setSuggestNote("We couldn't write more just now. Please try again.");
    } finally {
      setSuggesting(false);
    }
  };

  const saveEdit = () => {
    const text = draftText.trim();
    setQuestions((qs) =>
      text
        ? qs.map((q) => (q.id === editingId ? { ...q, query: text } : q))
        : qs.filter((q) => !(q.id === editingId && !q.query.trim())), // an empty new question is dropped
    );
    setEditingId(null);
  };
  // a question written by the owner joins the Non-Branded group (a customer's own wording)
  const addOwn = () => {
    const id = Math.max(0, ...questions.map((q) => q.id)) + 1;
    setQuestions((qs) => [...qs, { id, type: "non-branded", label: "Non-Branded", query: "" }]);
    setEditingId(id);
    setDraftText("");
  };

  const startRun = useCallback(async () => {
    if (!business || starting) return;
    setStarting(true);
    setError("");
    try {
      const res = await fetchApi<{ run_id: string }>(`/api/user/businesses/${business.id}/first-run`, {
        method: "POST",
        body: JSON.stringify({ questions: keptQuestions.map(({ type, label, query }, i) => ({ id: i + 1, type, label, query: query.trim() })) }),
      });
      failuresRef.current = 0;
      setStatus(null);
      setRunId(res.run_id);
      setStartedAt(Date.now());
      setPhase("running");
    } catch (err) {
      // H6: an unverified email is refused with a 403 - say so in plain words, whatever the server's wording
      const refused = (err as { status?: number })?.status === 403;
      setError(refused ? "Please confirm your email address first - we sent you a code when you signed up." : parseApiError(err, "We couldn't start your scan. Please try again."));
      setPhase("error");
    } finally {
      setStarting(false);
    }
  }, [business, questions, starting]);

  // Where to begin: pick up a scan already running (page reloaded), show a finished score, or write the questions.
  useEffect(() => {
    if (!hasLoadedOnce || !business || initRef.current) return;
    initRef.current = true;
    if (business.scanRunActive?.run_id) {
      setRunId(business.scanRunActive.run_id);
      setStartedAt(Date.parse(business.scanRunActive.started_at || "") || Date.now());
      setPhase("running");
    } else if (business.hasVisibilityScore) {
      setPhase("done");
    } else if (business.questionsLocked && (business.trackedQuestions || []).length > 0) {
      setQuestions((business.trackedQuestions || []).map((q) => ({ id: Number(q.id), type: q.type as FirstRunQuestion["type"], label: q.label, query: q.query })));
      setPhase("review");
    } else {
      generate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoadedOnce, business?.id]);

  // Poll the run while it is going.
  useEffect(() => {
    if (phase !== "running" || !runId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetchApi<RunStatus>(`/api/scan-runs/${runId}`);
        if (cancelled) return;
        failuresRef.current = 0;
        setStatus(res);
        if (res.status === "complete") {
          await refetchBusinesses();
          if (!cancelled) setPhase("done");
        }
      } catch {
        if (cancelled) return;
        failuresRef.current += 1;
        if (failuresRef.current >= MAX_POLL_FAILURES) {
          setError("We lost touch with the scan. It may still be running - you can check your dashboard, or try again.");
          setPhase("error");
        }
      }
    };
    tick();
    const timer = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [phase, runId, refetchBusinesses]);

  useEffect(() => {
    if (phase !== "running" || startedAt === null) return;
    const timer = setInterval(() => setElapsed(Math.round((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [phase, startedAt]);

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen flex items-center justify-center p-4 py-10 bg-[#faf8f3]">{children}</div>
  );

  if (!hasLoadedOnce || !business || phase === "starting") {
    return shell(
      <div className="flex items-center gap-2 text-[13.5px] text-[#6f6757]" role="status">
        <Loader2 className="w-4 h-4 animate-spin" /> Getting things ready
      </div>,
    );
  }

  if (phase === "generating") {
    return shell(
      <ProgressScreen
        title="Writing your 20 questions"
        subtitle={`These are the questions real customers ask AI assistants about businesses like ${business.name}.`}
        stages={[{ id: "gen", label: "Writing questions for your business", status: "running", detail: "This usually takes 1 to 2 minutes" }]}
      />,
    );
  }

  if (phase === "review") {
    const groups = Array.from(new Set(questions.map((q) => q.label)));
    return shell(
      <div className="w-full max-w-[640px] bg-white border border-[#ece3d1] rounded-[24px] p-6 md:p-8">
        <h1 className="font-spectral text-[24px] font-semibold text-[#15463b] leading-tight">Your {questions.length} questions</h1>
        <p className="text-[13.5px] text-[#8a8273] mt-1.5 leading-relaxed">
          We&apos;ll ask these to ChatGPT, Claude, Perplexity and Gemini and see how often {business.name} comes up. They become your
          baseline - the same set every week. Check they sound like what your customers would really ask. You can edit them later in the Search Tracker.
        </p>
        <div className="mt-5 max-h-[340px] overflow-y-auto space-y-4 pr-1">
          {groups.map((label) => (
            <div key={label}>
              <div className="font-mono-spline text-[11px] uppercase tracking-wider text-[#6f6757] mb-1.5">{label}</div>
              <ol className="space-y-1.5 list-decimal list-inside text-[13px] text-[#23211b]">
                {questions.filter((q) => q.label === label).map((q) => (
                  <li key={q.id} className={`leading-snug marker:text-[#9b927f] ${q.keep === false ? "opacity-55" : ""}`}>
                    {editingId === q.id ? (
                      <span className="inline-flex w-[calc(100%-2rem)] items-center gap-2 align-middle">
                        <input
                          autoFocus
                          value={draftText}
                          onChange={(e) => setDraftText(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditingId(null); }}
                          className="min-w-0 flex-1 rounded-lg border border-[#15463b] bg-white px-2.5 py-1.5 text-[13px] focus:outline-none"
                          aria-label="Edit question"
                        />
                        <button type="button" onClick={saveEdit} className="cursor-pointer text-[12px] font-semibold text-[#15463b]">Save</button>
                      </span>
                    ) : (
                      <span className="group inline-flex w-[calc(100%-2rem)] items-start justify-between gap-2 align-top">
                        <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2">
                          <input
                            type="checkbox"
                            checked={q.keep !== false}
                            onChange={(e) => setQuestions((qs) => qs.map((x) => (x.id === q.id ? { ...x, keep: e.target.checked } : x)))}
                            aria-label="Keep this question"
                            className="mt-0.5 h-4 w-4 shrink-0 accent-[#15463b]"
                          />
                          <span>{q.query}</span>
                        </label>
                        <span className="flex shrink-0 gap-2">
                          <button type="button" aria-label="Make this question sound more human" title="Make it sound more human" disabled={rewritingId !== null} onClick={() => rewriteQuestion(q)} className="cursor-pointer text-[#6f6757] hover:text-[#15463b] disabled:opacity-50">
                            {rewritingId === q.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                          </button>
                          <button type="button" aria-label="Edit this question" onClick={() => { setEditingId(q.id); setDraftText(q.query); }} className="cursor-pointer text-[#6f6757] hover:text-[#15463b]"><Pencil className="h-3.5 w-3.5" /></button>
                          <button type="button" aria-label="Remove this question" onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))} className="cursor-pointer text-[#6f6757] hover:text-[#b1442a]"><X className="h-3.5 w-3.5" /></button>
                        </span>
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[12.5px]">
          <span className={keptQuestions.length === 20 ? "font-semibold text-[#1e7d4f]" : "font-semibold text-[#9a6a12]"}>
            {keptQuestions.length === 20
              ? "20 of 20 selected"
              : keptQuestions.length < 20
                ? `${keptQuestions.length} of 20 selected - tick ${20 - keptQuestions.length} more question${20 - keptQuestions.length === 1 ? "" : "s"} above to continue`
                : `${keptQuestions.length} of 20 selected - untick ${keptQuestions.length - 20} to continue`}
          </span>
          <span className="flex gap-4">
            <button type="button" onClick={suggestMore} disabled={suggesting} className="cursor-pointer font-semibold text-[#15463b] underline underline-offset-2 disabled:opacity-40">
              {suggesting ? "Writing more (about 15 seconds)..." : "Suggest more"}
            </button>
            <button type="button" onClick={addOwn} className="cursor-pointer font-semibold text-[#15463b] underline underline-offset-2">
              + Add your own question
            </button>
          </span>
        </div>
        {suggestNote && <p role="status" className="mt-2 text-[12.5px] text-[#6f6757]">{suggestNote}</p>}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={generate}
            className="sm:flex-1 h-11 rounded-xl border border-[#ece3d1] text-[13.5px] font-semibold text-[#6f6757] hover:bg-[#f6f3ec] transition-colors cursor-pointer"
          >
            Write different questions
          </button>
          <button
            type="button"
            onClick={startRun}
            disabled={starting || keptQuestions.length !== 20 || keptQuestions.some((q) => !q.query.trim())}
            className="sm:flex-[2] h-11 rounded-xl bg-[#15463b] text-white text-[13.5px] font-bold hover:bg-[#1a5c44] transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Looks good - start my first scan
          </button>
        </div>
      </div>,
    );
  }

  if (phase === "running") {
    const stages = deriveStages(status, startRun);
    const failed = stages.some((s) => s.status === "failed");
    return shell(
      <ProgressScreen
        title={failed ? "The scan didn't finish" : "Measuring your business"}
        subtitle={failed ? undefined : `One scan: your website and what the four AI models say about ${business.name}.`}
        stages={stages}
        elapsedSeconds={elapsed}
        footer={
          failed ? undefined : (
            <p className="mt-1">
              You can leave this page - the scan keeps going. Your score will be on your dashboard, and the bell will tell you when it&apos;s ready.{" "}
              <button
                type="button"
                onClick={() => router.replace("/overview")}
                className="underline underline-offset-2 text-[#15463b] font-semibold cursor-pointer bg-transparent border-none p-0"
              >
                Go to the dashboard
              </button>
            </p>
          )
        }
      />,
    );
  }

  if (phase === "done") {
    const score = Math.round(business.completeness || 0);
    return shell(
      <div className="w-full max-w-[520px] bg-white border border-[#ece3d1] rounded-[24px] p-6 md:p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#15463b] flex items-center justify-center mx-auto mb-4">
          <WonderscoreLogo size={26} color="white" />
        </div>
        <h1 className="font-spectral text-[26px] font-semibold text-[#15463b] leading-tight">All set up</h1>
        <p className="text-[13.5px] text-[#8a8273] mt-1.5">Here&apos;s where {business.name} stands today.</p>
        <div className="mt-5 inline-flex items-baseline gap-1">
          <span className="num font-spectral text-[64px] leading-none font-semibold text-[#15463b]">{score}</span>
          <span className="text-[16px] text-[#8a8273]">/100</span>
        </div>
        <div className="font-mono-spline text-[11px] uppercase tracking-wider text-[#6f6757] mt-1">Your Wonder Score</div>
        <div className="mt-2 flex justify-center">
          <ScoreBreakdownPopover inputs={business.latestWonderInputs} score={business.latestWonderScore} />
        </div>
        <div className="mt-7 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => router.replace("/plan")}
            className="sm:flex-1 h-11 rounded-xl border border-[#ece3d1] text-[13.5px] font-semibold text-[#15463b] hover:bg-[#f6f3ec] transition-colors cursor-pointer"
          >
            Improve your score
          </button>
          <button
            type="button"
            onClick={() => router.replace("/overview")}
            className="sm:flex-1 h-11 rounded-xl bg-[#15463b] text-white text-[13.5px] font-bold hover:bg-[#1a5c44] transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
          >
            Go to dashboard <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>,
    );
  }

  return shell(
    <div className="w-full max-w-[460px]">
      <FailedState message={error || "Something went wrong."} onRetry={questions.length > 0 ? startRun : generate} />
      <button
        type="button"
        onClick={() => router.replace("/overview")}
        className="mt-3 w-full text-center text-[13px] font-semibold text-[#15463b] underline underline-offset-2 cursor-pointer bg-transparent border-none"
      >
        Go to the dashboard instead
      </button>
    </div>,
  );
}
