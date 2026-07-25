"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

const VOICE_DEFAULTS = ["authoritative", "approachable", "expert", "local"];
const KEYWORD_DEFAULTS = ["professional services Bristol", "corporate advisory", "business restructuring UK"];

export default function VoiceKeywordSetup() {
  const [voiceTags, setVoiceTags] = useState<string[]>(VOICE_DEFAULTS);
  const [keywords, setKeywords] = useState<string[]>(KEYWORD_DEFAULTS);
  const [newVoice, setNewVoice] = useState("");
  const [newKeyword, setNewKeyword] = useState("");

  const addVoice = () => {
    if (newVoice.trim() && !voiceTags.includes(newVoice.trim())) {
      setVoiceTags([...voiceTags, newVoice.trim()]);
      setNewVoice("");
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-5 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* AI Voice Tags */}
        <div className="space-y-3">
          <div>
            <h4 className="font-spectral text-[16px] font-semibold text-[#15463b]">AI Voice Profile</h4>
            <p className="text-[12px] text-[#8a8273] mt-0.5">Tone adjectives guiding how the AI writes your blogs.</p>
          </div>
          <div className="flex flex-wrap gap-2 p-3 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] min-h-[48px]">
            {voiceTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 bg-[#e7f4ea] text-[#15463b] border border-[#c5e3cc] px-2.5 py-1 rounded text-[12.5px] font-semibold"
              >
                {tag}
                <button onClick={() => setVoiceTags(voiceTags.filter((t) => t !== tag))} className="text-[#9b927f] hover:text-[#b1442a]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newVoice}
              onChange={(e) => setNewVoice(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addVoice()}
              placeholder="Add tone tag..."
              className="flex-1 text-[13px] px-3 py-2 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none"
            />
            <button onClick={addVoice} className="pb flex items-center gap-1 bg-[#15463b] text-white text-[12px] font-bold px-3 py-2 rounded-lg border-none">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

        {/* Focus Keywords */}
        <div className="space-y-3">
          <div>
            <h4 className="font-spectral text-[16px] font-semibold text-[#15463b]">Focus Keywords</h4>
            <p className="text-[12px] text-[#8a8273] mt-0.5">Core phrases the AI will naturally weave into generated content.</p>
          </div>
          <div className="flex flex-wrap gap-2 p-3 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] min-h-[48px]">
            {keywords.map((kw) => (
              <span
                key={kw}
                className="inline-flex items-center gap-1.5 bg-[#f6f3ec] text-[#5c4a1e] border border-[#d8cfbd] px-2.5 py-1 rounded text-[12.5px] font-semibold"
              >
                {kw}
                <button onClick={() => setKeywords(keywords.filter((k) => k !== kw))} className="text-[#9b927f] hover:text-[#b1442a]">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addKeyword()}
              placeholder="Add keyword..."
              className="flex-1 text-[13px] px-3 py-2 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none"
            />
            <button onClick={addKeyword} className="pb flex items-center gap-1 bg-[#15463b] text-white text-[12px] font-bold px-3 py-2 rounded-lg border-none">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
