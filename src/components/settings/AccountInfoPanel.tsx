"use client";

import { useState, useEffect } from "react";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";

export default function AccountInfoPanel() {
  const { user, updateProfile } = useUser();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(user?.full_name || "");
    setEmail(user?.email || "");
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    try {
      setIsSaving(true);
      await updateProfile({ full_name: name, email });
      showToast("Account information saved successfully!", "success");
    } catch {
      showToast("Failed to update account information", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="bg-white border border-[#ece3d1] rounded-[18px] p-6 shadow-sm space-y-5">
      <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">Account Information</h3>
      
      {/* Avatar Display */}
      <div className="flex items-center gap-4 py-2 border-b border-[#efe7d6]">
        <div className="w-14 h-14 rounded-full bg-[#15463b] text-white flex items-center justify-center font-spectral text-[24px] font-bold border border-[#ece3d1]">
          {name.charAt(0).toUpperCase() || "U"}
        </div>
        <div>
          <span className="text-[14px] font-bold text-[#23211b] block">{name || "Marcus Reed"}</span>
          <span className="text-[12px] text-[#9b927f]">{email || "marcus@meridian.co"}</span>
        </div>
      </div>

      {/* Basic Profile Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full text-[14px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
          />
        </div>
        <div>
          <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full text-[14px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
          />
        </div>
      </div>

      <div className="pt-1.5">
        <button
          type="submit"
          disabled={isSaving}
          className="pb bg-[#15463b] text-white text-[13px] font-semibold px-5.5 py-2.5 rounded-lg border-none hover:bg-[#1a5c44] transition-colors cursor-pointer disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
