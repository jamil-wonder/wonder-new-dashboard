"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useToast } from "../../context/ToastContext";

export default function VoiceKeywordSetup() {
  const { showToast } = useToast();
  const [voiceText, setVoiceText] = useState(
    "Meridian & Co. is a premier professional corporate advisory firm in Bristol, helping clients solve complex operational structures and scale sitemaps reliably."
  );
  const [keywords, setKeywords] = useState([
    "corporate advisory Bristol",
    "restructuring services UK",
    "Bristol business consultant",
  ]);
  const [newKeywordInput, setNewKeywordInput] = useState("");
  const [isAddingKw, setIsAddingKw] = useState(false);

  const handleAddKeyword = () => {
    if (newKeywordInput.trim() && !keywords.includes(newKeywordInput.trim())) {
      setKeywords([...keywords, newKeywordInput.trim()]);
      setNewKeywordInput("");
      setIsAddingKw(false);
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((item) => item !== kw));
  };

  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-6 md:p-[24px_26px] shadow-[0_1px_2px_rgba(60,48,28,0.04)] mb-5.5">
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        
        {/* Business Voice */}
        <div className="flex flex-col">
          <label className="font-mono-spline text-[10px] tracking-wider uppercase text-[#8a8273] mb-2">
            Business Voice Settings
          </label>
          <textarea
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            className="flex-1 font-sans text-[14px] leading-relaxed text-[#23211b] border border-[#ece3d1] rounded-xl p-3.5 outline-none bg-[#fdfcf8] resize-none min-h-[110px]"
          />
        </div>

        {/* Target Keywords */}
        <div className="flex flex-col">
          <label className="font-mono-spline text-[10px] tracking-wider uppercase text-[#8a8273] mb-2">
            Target Keywords
          </label>
          <div className="border border-[#ece3d1] rounded-xl p-3.5 bg-[#fdfcf8] flex-1 flex flex-wrap gap-2 content-start">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1.5 bg-[#eef3f0] text-[#15463b] text-[12.5px] font-semibold px-2.5 py-1 rounded-md border border-[#dbe6df]"
              >
                {kw}
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(kw)}
                  className="font-bold text-[#9b927f] hover:text-[#b1442a]"
                >
                  ✕
                </button>
              </span>
            ))}

            {isAddingKw ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newKeywordInput}
                  onChange={(e) => setNewKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddKeyword();
                  }}
                  placeholder="New keyword..."
                  className="text-[12px] px-2 py-0.5 border border-[#15463b] rounded outline-none bg-white w-32"
                  autoFocus
                />
                <button
                  onClick={handleAddKeyword}
                  className="text-[11px] font-bold bg-[#15463b] text-white px-2 py-0.5 rounded"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingKw(true)}
                className="inline-flex items-center gap-1 bg-[#efe7d6] text-[#8a8273] border border-dashed border-[#d8cfbd] text-[12.5px] font-semibold px-2.5 py-1 rounded-md cursor-pointer hover:bg-[#e7decb]"
              >
                <Plus className="w-3.5 h-3.5" />
                Add keyword
              </button>
            )}
          </div>
        </div>

      </div>

      <div className="flex justify-end mt-4 border-t border-[#ece3d1] pt-3.5">
        <button
          onClick={() => showToast("Voice & keywords saved successfully!")}
          className="pb bg-[#1a5c44] text-white text-[13px] font-semibold px-5.5 py-2.5 rounded-lg border-none"
        >
          Save voice &amp; keywords
        </button>
      </div>
    </div>
  );
}
