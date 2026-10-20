"use client";

import { useState } from "react";
import { Pencil, Trash2, Wand2, Check, X, Loader2 } from "lucide-react";
import { SearchQueryItem } from "../../types/dashboard";

interface QuestionCellProps {
  query: SearchQueryItem;
  onEdit?: (query: SearchQueryItem, text: string) => void;
  onRemove?: (query: SearchQueryItem) => void;
  // J8: ask the AI for a more human wording; resolves to the new text, or null when it could not
  onRewrite?: (query: SearchQueryItem) => Promise<string | null>;
}

// J8: one tracked question with its own edit pencil, a "sound more human" wand and a remove button.
// Clicks here never open the row's answer (the row itself is clickable).
export default function QuestionCell({ query, onEdit, onRemove, onRewrite }: QuestionCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(query.query);
  const [rewriting, setRewriting] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  const save = () => {
    const text = draft.trim();
    if (text && text !== query.query) onEdit?.(query, text);
    setEditing(false);
  };

  const rewrite = async () => {
    if (!onRewrite || rewriting) return;
    setRewriting(true);
    const text = await onRewrite(query);
    setRewriting(false);
    if (text) {
      setDraft(text);
      setEditing(true);
    }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5" onClick={stop} onKeyDown={stop}>
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") save();
            if (e.key === "Escape") { setDraft(query.query); setEditing(false); }
          }}
          aria-label="Edit question"
          className="min-w-0 flex-1 rounded-lg border border-[#15463b] bg-white px-2.5 py-1.5 text-[13.5px] focus:outline-none"
        />
        <button type="button" aria-label="Save question" onClick={save} className="cursor-pointer rounded-md p-1 text-[#1e7d4f] hover:bg-[#eef3f0]"><Check className="h-4 w-4" /></button>
        <button type="button" aria-label="Cancel" onClick={() => { setDraft(query.query); setEditing(false); }} className="cursor-pointer rounded-md p-1 text-[#6f6757] hover:bg-[#f5f0e6]"><X className="h-4 w-4" /></button>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-1.5">
      <span className="block min-w-0 flex-1 whitespace-normal break-words text-[14px] font-medium leading-snug tracking-tight text-[#1c1a16]">
        &ldquo;{query.query}&rdquo;
      </span>
      {confirmingRemove ? (
        <span className="flex shrink-0 items-center gap-1.5 text-[11.5px]" onClick={stop}>
          <span className="text-[#6f6757]">Remove?</span>
          <button type="button" onClick={(e) => { stop(e); onRemove?.(query); }} className="cursor-pointer font-semibold text-[#b1442a] hover:underline">Yes</button>
          <button type="button" onClick={(e) => { stop(e); setConfirmingRemove(false); }} className="cursor-pointer font-semibold text-[#6f6757] hover:underline">No</button>
        </span>
      ) : (
        <span className="flex shrink-0 items-center gap-0.5" onClick={stop}>
          {onEdit && (
            <button type="button" aria-label="Edit this question" title="Edit" onClick={(e) => { stop(e); setDraft(query.query); setEditing(true); }} className="cursor-pointer rounded-md p-1 text-[#6f6757] hover:bg-[#f5f0e6] hover:text-[#15463b]">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {onRewrite && (
            <button type="button" aria-label="Make this question sound more human" title="Make it sound more human" onClick={(e) => { stop(e); rewrite(); }} disabled={rewriting} className="cursor-pointer rounded-md p-1 text-[#6f6757] hover:bg-[#f5f0e6] hover:text-[#15463b] disabled:opacity-50">
              {rewriting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
            </button>
          )}
          {onRemove && (
            <button type="button" aria-label="Remove this question" title="Remove" onClick={(e) => { stop(e); setConfirmingRemove(true); }} className="cursor-pointer rounded-md p-1 text-[#6f6757] hover:bg-[#fdeeea] hover:text-[#b1442a]">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </span>
      )}
    </div>
  );
}
