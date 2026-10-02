"use client";

import { Loader2, RefreshCw } from "lucide-react";
import { WonderscoreLogo } from "./WonderscoreSpinner";

export default function WorkspaceLoadError({
  onRetry,
  isRetrying,
}: {
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="min-h-screen bg-[#fdfcf8] flex items-center justify-center p-4">
      <div role="alert" className="w-full max-w-[420px] bg-white border border-[#ece3d1] rounded-[24px] p-7 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#15463b] flex items-center justify-center mx-auto mb-4">
          <WonderscoreLogo size={26} color="white" />
        </div>
        <h1 className="font-spectral text-[21px] font-semibold text-[#15463b]">We couldn&apos;t load your workspace</h1>
        <p className="text-[13.5px] text-[#8a8273] mt-2 leading-relaxed">
          This is usually a brief connection hiccup — your businesses and data are safe. Give it another try.
        </p>
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-5 w-full py-3 bg-[#15463b] text-white text-[14px] font-bold rounded-xl hover:bg-[#1a5c44] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          {isRetrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {isRetrying ? "Trying again…" : "Try again"}
        </button>
      </div>
    </div>
  );
}
