"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface AddPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPrompt: (query: string, category: "branded" | "non-branded" | "local-seo" | "broad-seo") => void;
}

export default function AddPromptModal({ isOpen, onClose, onAddPrompt }: AddPromptModalProps) {
  const [queryText, setQueryText] = useState("");
  const [category, setCategory] = useState<"branded" | "non-branded" | "local-seo" | "broad-seo">("non-branded");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    onAddPrompt(queryText.trim(), category);
    setQueryText("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-[#0f1c18]/55 backdrop-blur-sm z-[999] flex items-center justify-center p-5"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-[#ece3d1] rounded-[20px] shadow-[0_20px_40px_rgba(21,70,59,0.2)] w-full max-w-[540px] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 px-5 border-b border-[#ece3d1] bg-[#fdfcf8]">
          <h3 className="font-spectral text-[18px] font-semibold text-[#15463b]">
            Add Custom Search Prompt
          </h3>
          <button onClick={onClose} className="text-[#9b927f] hover:text-[#23211b]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5.5 flex flex-col gap-4 bg-white">
          <div>
            <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] mb-1.5 block">
              Query Text
            </label>
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="e.g. Best corporate advisors near Bristol city centre?"
              className="w-full text-[14px] p-2.5 px-3.5 border border-[#ece3d1] rounded-lg outline-none bg-[#fdfcf8]"
            />
          </div>

          <div>
            <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] mb-1.5 block">
              Query Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full text-[14px] p-2.5 px-3.5 border border-[#ece3d1] rounded-lg outline-none bg-[#fdfcf8]"
            >
              <option value="branded">Branded</option>
              <option value="non-branded">Non-Branded</option>
              <option value="local-seo">Local SEO</option>
              <option value="broad-seo">Broad SEO</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="ob px-4 py-2 rounded-lg border border-[#d8cfbd] text-[13px] font-semibold bg-white text-[#6f6757]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="pb px-5 py-2 rounded-lg border-none text-[13px] font-semibold bg-[#15463b] text-white"
            >
              Save Prompt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
