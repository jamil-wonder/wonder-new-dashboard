"use client";

import { Loader2, RefreshCw } from "lucide-react";

// I4: what a card shows when its data could not be loaded. Says so plainly and
// offers a retry - a failed load must never look like "nothing here yet" or "0".
export default function FailedState({
  message = "We couldn't load this. Please try again.",
  onRetry,
  isRetrying = false,
  variant = "light",
}: {
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  variant?: "light" | "dark";
}) {
  const box =
    variant === "dark"
      ? "bg-[#3a1d17]/40 border border-[#f6dcd5]/30 text-[#f6dcd5]"
      : "bg-[#fdf2f0] border border-[#f6dcd5] text-[#b1442a]";
  return (
    <div role="alert" className={`mt-4 p-4 rounded-lg text-center ${box}`}>
      <p className="text-[12.5px] leading-snug font-medium">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold underline underline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer bg-transparent border-none"
        >
          {isRetrying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {isRetrying ? "Trying again…" : "Try again"}
        </button>
      )}
    </div>
  );
}
