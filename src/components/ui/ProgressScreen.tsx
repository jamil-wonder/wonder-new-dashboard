"use client";

import { AlertCircle, CheckCircle2, Circle, Loader2, RefreshCw } from "lucide-react";

export type StageStatus = "pending" | "running" | "done" | "failed";

export interface ProgressStage {
  id: string;
  label: string;
  status: StageStatus;
  /** A result line once done ("Website health: 70/100"), or what is happening while running. */
  detail?: string;
  /** Shown on a failed stage; retries that stage's work. */
  onRetry?: () => void;
  /** 0-100 while running, when the work can say how far along it is. */
  percent?: number;
}

export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.max(0, Math.floor(seconds % 60));
  return `${m}:${String(s).padStart(2, "0")}`;
}

// The stage list, elapsed time and footer on their own - used by the full-page screen and by the progress pop-up.
export function ProgressBody({
  stages,
  elapsedSeconds,
  footer,
}: {
  stages: ProgressStage[];
  elapsedSeconds?: number;
  footer?: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <ol className="space-y-4" aria-live="polite">
        {stages.map((stage) => (
          <li key={stage.id} className="flex gap-3">
            <span className="mt-0.5 shrink-0" aria-hidden="true">
              {stage.status === "done" ? (
                <CheckCircle2 className="w-5 h-5 text-[#1e7d4f]" />
              ) : stage.status === "running" ? (
                <Loader2 className="w-5 h-5 text-[#15463b] animate-spin" />
              ) : stage.status === "failed" ? (
                <AlertCircle className="w-5 h-5 text-[#b1442a]" />
              ) : (
                <Circle className="w-5 h-5 text-[#d8cfbd]" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div
                className={`text-[14px] font-semibold leading-snug ${
                  stage.status === "pending" ? "text-[#9b927f]" : stage.status === "failed" ? "text-[#b1442a]" : "text-[#23211b]"
                }`}
              >
                {stage.label}
                <span className="sr-only"> - {stage.status}</span>
              </div>
              {stage.detail && (
                <div className={`text-[12.5px] mt-0.5 leading-snug ${stage.status === "failed" ? "text-[#b1442a]" : "text-[#6f6757]"}`}>
                  {stage.detail}
                </div>
              )}
              {stage.status === "running" && typeof stage.percent === "number" && (
                <div className="mt-2 h-1.5 w-full bg-[#f0ebe0] rounded-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(stage.percent)} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-[#15463b] rounded-full transition-all duration-500" style={{ width: `${Math.max(3, Math.min(100, stage.percent))}%` }} />
                </div>
              )}
              {stage.status === "failed" && stage.onRetry && (
                <button
                  type="button"
                  onClick={stage.onRetry}
                  className="mt-2 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#15463b] underline underline-offset-2 cursor-pointer bg-transparent border-none p-0"
                >
                  <RefreshCw className="w-3 h-3" /> Try this step again
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>

      {(typeof elapsedSeconds === "number" || footer) && (
        <div className="mt-5 pt-4 border-t border-[#efe7d6] text-[12px] text-[#8a8273] leading-relaxed">
          {typeof elapsedSeconds === "number" && <div className="num font-semibold text-[#6f6757]">Time so far: {formatElapsed(elapsedSeconds)}</div>}
          {footer}
        </div>
      )}
    </div>
  );
}

// J1 (first-run use): stages with their state, a result line each, time elapsed and a retry
// on the stage that failed. Pure display - the owner of the work passes in what is happening.
export default function ProgressScreen({
  title,
  subtitle,
  stages,
  elapsedSeconds,
  footer,
}: {
  title: string;
  subtitle?: string;
  stages: ProgressStage[];
  elapsedSeconds?: number;
  footer?: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-[520px] bg-white border border-[#ece3d1] rounded-[24px] p-6 md:p-8">
      <h1 className="font-spectral text-[24px] font-semibold text-[#15463b] leading-tight">{title}</h1>
      {subtitle && <p className="text-[13.5px] text-[#8a8273] mt-1.5 leading-relaxed">{subtitle}</p>}

      <ProgressBody stages={stages} elapsedSeconds={elapsedSeconds} footer={footer} />
    </div>
  );
}
