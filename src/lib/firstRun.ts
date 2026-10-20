// J5: the first-run flow's pure parts - turning the generated questions and the scan-run
// status into what the screen shows. No network, no React.

import type { ProgressStage } from "../components/ui/ProgressScreen";

export interface RunLeg {
  status: string;
  error?: string | null;
  http_status?: number | null;
  score?: number | null;
  pages?: number | null;
}

export interface RunStatus {
  run_id: string;
  status: "running" | "complete" | "incomplete" | "failed" | string;
  legs: { crawl?: RunLeg; tracker?: RunLeg };
  models?: Record<string, { answered: number; mentioned: number; failed: number }> | null;
  competitors_found?: number | null;
  tracker_progress: { processed: number; total: number; status?: string | null; error?: string | null } | null;
  wonder_score: number | null;
}

export interface FirstRunQuestion {
  id: number;
  type: "branded" | "non-branded" | "local-seo" | "broad-seo";
  label: string;
  query: string;
  // J8: false = set aside (not one of the 20); anything else = kept
  keep?: boolean;
}

const GROUPS: Array<[string, FirstRunQuestion["type"], string]> = [
  ["branded", "branded", "Branded"],
  ["nonBranded", "non-branded", "Non-Branded"],
  ["localSeo", "local-seo", "Local SEO"],
  ["broadSeo", "broad-seo", "Broad SEO"],
];

/** The generate-questions answer as numbered question rows (empty if it has none). */
export function questionsFromGeneration(res: { questions?: unknown; questionGroups?: Record<string, unknown> } | null | undefined): FirstRunQuestion[] {
  const out: Omit<FirstRunQuestion, "id">[] = [];
  const groups = res?.questionGroups;
  if (groups && typeof groups === "object") {
    for (const [key, type, label] of GROUPS) {
      const list = Array.isArray(groups[key]) ? (groups[key] as unknown[]) : [];
      for (const q of list) {
        const query = String(q || "").trim();
        if (query) out.push({ type, label, query });
      }
    }
  }
  return out.map((q, i) => ({ id: i + 1, ...q }));
}

export function failureMessage(status: RunStatus): string {
  const crawl = status.legs.crawl;
  if (crawl?.status === "failed") {
    return crawl.error || "We couldn't read your website.";
  }
  const tp = status.tracker_progress;
  if (tp?.error) return tp.error;
  return "Some of the AI models couldn't be reached, so we didn't record a score. Nothing was lost - try again.";
}

/** The three stages for a run's status. `onRetry` is attached to whichever stage failed. */
const MODELS: Array<[string, string]> = [
  ["chatgpt", "ChatGPT"],
  ["claude", "Claude"],
  ["perplexity", "Perplexity"],
  ["gemini", "Gemini"],
];

// J1: one stage for the website, one per AI model (with "Mentioned in 7 of 20"), competitors, the score and the plan.
export function deriveStages(status: RunStatus | null, onRetry: () => void): ProgressStage[] {
  const crawl = status?.legs.crawl?.status;
  const tracker = status?.legs.tracker?.status;
  const tp = status?.tracker_progress;
  const complete = status?.status === "complete";
  const finished = Boolean(status && status.status !== "running");

  const pages = status?.legs.crawl?.pages;
  const crawlStage: ProgressStage = {
    id: "crawl",
    label: "Scanning your website",
    status: crawl === "ok" ? "done" : crawl === "failed" ? "failed" : "running",
    detail:
      crawl === "ok"
        ? [typeof pages === "number" && pages > 0 ? `Found ${pages} page${pages === 1 ? "" : "s"}` : "", typeof status?.legs.crawl?.score === "number" ? `Website health: ${Math.round(status.legs.crawl.score)}/100` : ""].filter(Boolean).join(" - ") || "Website scanned"
        : crawl === "failed"
          ? failureMessage(status as RunStatus)
          : "Reading your pages, contact details and structure",
  };
  if (crawlStage.status === "failed") crawlStage.onRetry = onRetry;

  const crawlOk = crawl === "ok";
  const trackerDone = tracker === "ok" || complete;
  const trackerFailed = crawlOk && finished && !complete;
  const total = tp?.total || 20;

  const modelStages: ProgressStage[] = MODELS.map(([key, label]) => {
    const m = status?.models?.[key];
    const answered = m?.answered ?? 0;
    const failed = m?.failed ?? 0;
    const allIn = trackerDone || (answered + failed >= total && total > 0);
    const stage: ProgressStage = {
      id: `model-${key}`,
      label: `Asking ${label}`,
      status: !crawlOk ? "pending" : failed > 0 && answered === 0 && allIn ? "failed" : allIn ? "done" : "running",
      percent: crawlOk && !allIn && total > 0 ? (100 * (answered + failed)) / total : undefined,
      detail: !crawlOk
        ? undefined
        : failed > 0 && answered === 0 && allIn
          ? `${label} could not be reached`
          : allIn
            ? `Mentioned in ${m?.mentioned ?? 0} of ${answered}${failed > 0 ? ` (${failed} not answered)` : ""}`
            : answered > 0 ? `${answered} of ${total} answered` : "Waiting for answers",
    };
    if (stage.status === "failed" || (trackerFailed && stage.status === "running")) {
      stage.status = "failed";
      stage.detail = stage.detail || failureMessage(status as RunStatus);
      stage.onRetry = onRetry;
    }
    return stage;
  });

  const competitorsStage: ProgressStage = {
    id: "competitors",
    label: "Finding who you compete with",
    status: !crawlOk ? "pending" : complete || (trackerDone && (status?.competitors_found ?? 0) > 0) ? "done" : trackerDone ? "running" : "pending",
    detail: typeof status?.competitors_found === "number" && status.competitors_found > 0 ? `Found ${status.competitors_found} competitor${status.competitors_found === 1 ? "" : "s"}` : complete ? "No competitors found" : undefined,
  };

  const scoreStage: ProgressStage = {
    id: "score",
    label: "Working out your Wonder Score",
    status: complete ? "done" : trackerDone ? "running" : "pending",
    detail: complete && typeof status?.wonder_score === "number" ? `Your score: ${Math.round(status.wonder_score)}/100` : undefined,
  };

  const planStage: ProgressStage = {
    id: "plan",
    label: "Building your plan",
    status: complete ? "done" : "pending",
    detail: complete ? "Your first actions are ready" : undefined,
  };

  return [crawlStage, ...modelStages, competitorsStage, scoreStage, planStage];
}
