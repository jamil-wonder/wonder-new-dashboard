import type { ReactNode } from "react";

// I2: badges come in exactly three kinds, and a card carries at most ONE coloured one.
//   status    - the result of a check (good / fair / needs work, mentioned / not mentioned): `tone` picks the colour
//   attention - something the owner should look at: amber
//   meta      - a plain fact about the item (its type, a category, a count): neutral grey, never coloured
export type BadgeKind = "status" | "attention" | "meta";
export type StatusTone = "good" | "fair" | "bad";

const STATUS: Record<StatusTone, string> = {
  good: "bg-[#dcefe2] text-[#1e7d4f] border-[#bbf7d0]",
  fair: "bg-[#f7e7c4] text-[#7a4a06] border-[#f0dfae]",
  bad: "bg-[#fee2e2] text-[#b91c1c] border-[#fca5a5]",
};

export default function Badge({
  kind = "meta",
  tone = "good",
  children,
  title,
  className = "",
}: {
  kind?: BadgeKind;
  tone?: StatusTone;
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  const colours =
    kind === "status" ? STATUS[tone] : kind === "attention" ? "bg-[#fff8e6] text-[#7a4a06] border-[#f0dfae]" : "bg-[#f0ebe0] text-[#4a4437] border-[#e5ddd0]";
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold leading-tight ${colours} ${className}`}>
      {children}
    </span>
  );
}
