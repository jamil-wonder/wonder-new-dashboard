import { Info } from "lucide-react";

export function AiDisclaimer({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-[10.5px] text-[#9b927f] ${className}`}>
      <Info className="w-3 h-3 shrink-0" />
      <span>AI can make mistakes. Responses may change or be inaccurate — always double-check important details.</span>
    </div>
  );
}
