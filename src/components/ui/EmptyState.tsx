import Link from "next/link";
import { ArrowRight } from "lucide-react";

// D1: what a card shows when its own data source has nothing yet. One shape
// everywhere - say what is missing, say what produces it, link to it - instead
// of a blank box, a zero, or a guess.
export default function EmptyState({
  message,
  href,
  actionLabel,
  variant = "light",
}: {
  message: string;
  href?: string;
  actionLabel?: string;
  variant?: "light" | "warm" | "dark";
}) {
  const box =
    variant === "dark"
      ? "bg-white/5 border border-white/10 text-[#d9eee7]"
      : variant === "warm"
        ? "bg-[#f6efe0] text-[#9a8a5e]"
        : "bg-[#f8f5ee] text-[#9b927f]";
  const link = variant === "dark" ? "text-[#a8d860]" : "text-[#1e7d4f]";
  return (
    <div role="status" className={`mt-4 p-4 rounded-lg text-center ${box}`}>
      <p className="text-[12.5px] leading-snug">{message}</p>
      {href && actionLabel && (
        <Link href={href} className={`mt-2 inline-flex items-center gap-1 text-[12px] font-semibold ${link}`}>
          {actionLabel} <ArrowRight className="w-3 h-3" />
        </Link>
      )}
    </div>
  );
}
