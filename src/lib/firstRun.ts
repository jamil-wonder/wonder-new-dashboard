// J5: the first-run flow's pure parts - turning the generated questions and the scan-run
// status into what the screen shows. No network, no React.

import type { ProgressStage } from "../components/ui/ProgressScreen";

export interface RunLeg {
  status: string;
  error?: string | null;
  http_status?: number | null;
  score?: number | null;
}

export interface RunStatus {
  run_id: string;
  status: "running" | "complete" | "incomplete" | "failed" | string;
  legs: { crawl?: RunLeg; tracker?: RunLeg };
  tracker_progress: { processed: number; total: number; status?: string | null; error?: string | null } | null;
  wonder_score: number | null;
}

export interface FirstRunQuestion {
  id: number;
  type: "branded" | "non-branded" | "local-seo" | "broad-seo";
  label: string;
  query: string;
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
export function deriveStages(status: RunStatus | null, onRetry: () => void): ProgressStage[] {
  const crawl = status?.legs.crawl?.status;
  const tracker = status?.legs.tracker?.status;
  const tp = status?.tracker_progress;
  const finished = status && status.status !== "running";

  const crawlStage: ProgressStage = {
    id: "crawl",
    label: "Scanning your website",
    status: crawl === "ok" ? "done" : crawl === "failed" ? "failed" : "running",
    detail:
      crawl === "ok"
        ? typeof status?.legs.crawl?.score === "number"
          ? `Website health: ${Math.round(status.legs.crawl.score)}/100`
          : "Website scanned"
        : crawl === "failed"
          ? failureMessage(status as RunStatus)
          : "Reading your pages, contact details and structure",
  };
  if (crawlStage.status === "failed") crawlStage.onRetry = onRetry;

  const crawlOk = crawl === "ok";
  const trackerFailed = crawlOk && Boolean(finished) && status?.status !== "complete";
  const percent = tp && tp.total > 0 ? (100 * tp.processed) / tp.total : 0;
  const trackerStage: ProgressStage = {
    id: "tracker",
    label: "Asking ChatGPT, Claude, Perplexity and Gemini",
    status: !crawlOk ? "pending" : trackerFailed ? "failed" : tracker === "ok" || status?.status === "complete" ? "done" : "running",
    percent,
    detail: !crawlOk
      ? undefined
      : trackerFailed
        ? failureMessage(status as RunStatus)
        : tp && tp.total > 0
          ? `${tp.processed} of ${tp.total} questions answered${tp.processed === tp.total ? "" : " - this is the long part, usually 5 to 15 minutes"}`
          : "Queuing your questions",
  };
  if (trackerStage.status === "failed") trackerStage.onRetry = onRetry;

  const scoreStage: ProgressStage = {
    id: "score",
    label: "Working out your Wonder Score",
    status: status?.status === "complete" ? "done" : trackerStage.status === "done" ? "running" : "pending",
    detail: status?.status === "complete" && typeof status.wonder_score === "number" ? `Your score: ${Math.round(status.wonder_score)}/100` : undefined,
  };
  return [crawlStage, trackerStage, scoreStage];
}
