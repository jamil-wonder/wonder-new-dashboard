import { Loader2 } from "lucide-react";

// I4: what a card shows while its own data is on the way. Says what is loading
// (no blank box, no zero, no placeholder number) and announces itself to screen readers.
export default function LoadingState({
  label = "Loading…",
  variant = "light",
}: {
  label?: string;
  variant?: "light" | "warm" | "dark";
}) {
  const box =
    variant === "dark"
      ? "bg-white/5 border border-white/10 text-[#d9eee7]"
      : variant === "warm"
        ? "bg-[#f6efe0] text-[#9a8a5e]"
        : "bg-[#f8f5ee] text-[#8a8273]";
  return (
    <div role="status" aria-live="polite" className={`mt-4 p-4 rounded-lg flex items-center justify-center gap-2 ${box}`}>
      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
      <p className="text-[12.5px] leading-snug">{label}</p>
    </div>
  );
}
