"use client";

import { useState, useEffect } from "react";
import { Plus, Sparkles, Check } from "lucide-react";
import { useBusiness } from "../../context/BusinessContext";
import { useToast } from "../../context/ToastContext";
import { fetchApi } from "../../lib/api";

export default function VoiceKeywordSetup() {
  const { activeBusiness, updateActiveBusiness } = useBusiness();
  const { showToast } = useToast();

  const [voiceText, setVoiceText] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeywordInput, setNewKeywordInput] = useState("");
  const [isAddingKw, setIsAddingKw] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeBusiness) {
      setVoiceText(activeBusiness.blogVoice || "");
      if (Array.isArray(activeBusiness.blogKeywords) && activeBusiness.blogKeywords.length > 0) {
        setKeywords(activeBusiness.blogKeywords);
      } else {
        setKeywords([
          "corporate advisory Bristol",
          "restructuring services UK",
          "Bristol business consultant",
        ]);
      }
    }
  }, [activeBusiness]);

  const handleAddKeyword = () => {
    const val = newKeywordInput.trim();
    if (val && !keywords.includes(val)) {
      setKeywords([...keywords, val]);
      setNewKeywordInput("");
      setIsAddingKw(false);
    }
  };

  const handleRemoveKeyword = (kw: string) => {
    setKeywords(keywords.filter((item) => item !== kw));
  };

  const handleSaveSetup = async () => {
    if (!activeBusiness?.id) {
      showToast("Please select a business profile first.", "info");
      return;
    }

    try {
      setIsSaving(true);
      const res = await fetchApi<any>("/api/blogs/weekly/setup", {
        method: "POST",
        body: JSON.stringify({
          business_id: activeBusiness.id,
          voice: voiceText,
          keywords,
        }),
      });

      if (res && res.success) {
        updateActiveBusiness({
          blogVoice: voiceText,
          blogKeywords: keywords,
        });
        showToast("Voice & keywords saved successfully!", "success");
      }
    } catch (err: any) {
      console.error("Save voice setup error:", err);
      showToast(`Error saving voice profile: ${err.message || "Failed"}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-6 md:p-[24px_26px] shadow-[0_1px_2px_rgba(60,48,28,0.04)] mb-5.5">
      {/* Main Section Header */}
      <div className="mb-4 pb-3 border-b border-[#efe7d6]">
        <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">
          AI Voice &amp; Focus Keywords
        </h3>
        <p className="text-[12.5px] text-[#8a8273] mt-0.5">
          Configure how AI copywriters format your weekly blog articles and target search intent.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        
        {/* Business Voice */}
        <div className="flex flex-col">
          <label className="font-spectral text-[16px] font-semibold text-[#15463b] mb-2">
            Business Voice
          </label>
          <textarea
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            placeholder="e.g. Warm, local, expert, calm, helpful, premium but not formal."
            className="flex-1 font-sans text-[13.5px] leading-relaxed text-[#23211b] border border-[#ece3d1] rounded-xl p-3.5 outline-none bg-[#fdfcf8] resize-none min-h-[120px] focus:border-[#15463b] focus:bg-white transition-colors"
          />
        </div>

        {/* Target Keywords */}
        <div className="flex flex-col">
          <label className="font-spectral text-[16px] font-semibold text-[#15463b] mb-2">
            Target Keywords
          </label>
          <div className="border border-[#ece3d1] rounded-xl p-3.5 bg-[#fdfcf8] flex-1 flex flex-wrap gap-2 content-start min-h-[120px]">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1.5 bg-[#eef3f0] text-[#15463b] text-[12.5px] font-semibold px-2.5 py-1 rounded-md border border-[#dbe6df]"
              >
                {kw}
                <button
                  type="button"
                  onClick={() => handleRemoveKeyword(kw)}
                  className="font-bold text-[#9b927f] hover:text-[#b1442a] ml-0.5 cursor-pointer"
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
                  className="text-[12px] px-2.5 py-1 border border-[#15463b] rounded-md outline-none bg-white w-32"
                  autoFocus
                />
                <button
                  onClick={handleAddKeyword}
                  className="text-[11.5px] font-bold bg-[#15463b] text-white px-2.5 py-1 rounded-md cursor-pointer"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingKw(true)}
                className="inline-flex items-center gap-1 bg-[#efe7d6] text-[#6f6757] border border-dashed border-[#d8cfbd] text-[12.5px] font-semibold px-2.5 py-1 rounded-md cursor-pointer hover:bg-[#e7decb] transition-colors"
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
          onClick={handleSaveSetup}
          disabled={isSaving}
          className="inline-flex items-center gap-2 bg-[#1a5c44] text-white text-[13px] font-semibold px-5.5 py-2.5 rounded-lg border-none hover:bg-[#10362d] transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
        >
          {isSaving ? (
            <Sparkles className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Check className="w-4 h-4 text-white" />
          )}
          <span>{isSaving ? "Saving..." : "Save voice & keywords"}</span>
        </button>
      </div>
    </div>
  );
}
