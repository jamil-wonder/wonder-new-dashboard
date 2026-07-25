"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { useToast } from "../../context/ToastContext";

export default function SecurityApiPanel() {
  const { showToast } = useToast();
  const [tokenCopied, setTokenCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText("wonderscore_bearer_live_99281a498b17440912");
    setTokenCopied(true);
    showToast("API token copied to clipboard", "info");
    setTimeout(() => setTokenCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-6 shadow-sm space-y-6">
      
      {/* Change Password */}
      <div className="space-y-4">
        <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">Security &amp; Password</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1">Current Password</label>
            <input type="password" placeholder="••••••••" className="w-full text-[14px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none" />
          </div>
          <div>
            <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1">New Password</label>
            <input type="password" placeholder="••••••••" className="w-full text-[14px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none" />
          </div>
          <div>
            <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1">Confirm New Password</label>
            <input type="password" placeholder="••••••••" className="w-full text-[14px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none" />
          </div>
        </div>
        <button onClick={() => showToast("Password changed successfully!")} className="pb bg-[#15463b] text-white text-[13px] font-semibold px-5.5 py-2.5 rounded-lg border-none">
          Change password
        </button>
      </div>

      {/* Secret Token */}
      <div className="space-y-3 pt-4 border-t border-[#efe7d6]">
        <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">API Secret Tokens</h3>
        <div>
          <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">
            API Bearer Secret Token
          </label>
          <div className="flex gap-2.5">
            <input
              type="password"
              value="wonderscore_bearer_live_99281a498b17440912"
              readOnly
              className="flex-1 text-[13px] font-mono-spline p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none"
            />
            <button
              onClick={handleCopy}
              className="pb flex items-center gap-1.5 bg-[#15463b] text-white text-[12.5px] font-bold px-4 rounded-lg border-none shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              {tokenCopied ? "Copied!" : "Copy Token"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
