"use client";

import { Check, X } from "lucide-react";
import { SearchQueryItem } from "../../types/dashboard";

interface QuestionCellProps {
  query: SearchQueryItem;
  // J8: when set, the question is being edited with this text (the row's menu starts it)
  editingText: string | null;
  onEditingTextChange: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

// One tracked question: its words, or an edit box when the row's "..." menu started an edit.
// Clicks here never open the row's answer.
export default function QuestionCell({ query, editingText, onEditingTextChange, onSave, onCancel }: QuestionCellProps) {
  if (editingText === null) {
    return (
      <span className="block min-w-0 whitespace-normal break-words text-[14px] font-medium leading-snug tracking-tight text-[#1c1a16]">
        &ldquo;{query.query}&rdquo;
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <input
        autoFocus
        value={editingText}
        onChange={(e) => onEditingTextChange(e.target.value)}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Enter") onSave();
          if (e.key === "Escape") onCancel();
        }}
        aria-label="Edit question"
        className="min-w-0 flex-1 rounded-lg border border-[#15463b] bg-white px-2.5 py-1.5 text-[13.5px] focus:outline-none"
      />
      <button type="button" aria-label="Save question" onClick={onSave} className="cursor-pointer rounded-md p-1 text-[#1e7d4f] hover:bg-[#eef3f0]"><Check className="h-4 w-4" /></button>
      <button type="button" aria-label="Cancel" onClick={onCancel} className="cursor-pointer rounded-md p-1 text-[#6f6757] hover:bg-[#f5f0e6]"><X className="h-4 w-4" /></button>
    </div>
  );
}
