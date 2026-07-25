"use client";

import { useState } from "react";
import Image from "next/image";
import { useToast } from "../../context/ToastContext";

export default function AccountInfoPanel() {
  const { showToast } = useToast();
  const [name, setName] = useState("Marcus Reed");
  const [email, setEmail] = useState("marcus@meridian.co");

  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-6 shadow-sm space-y-5">
      <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">Account Information</h3>
      
      {/* Avatar Uploader */}
      <div className="flex items-center gap-4 py-2 border-b border-[#efe7d6]">
        <div className="relative w-14 h-14 rounded-full overflow-hidden border border-[#ece3d1]">
          <Image
            src="/icons/sidebar/user.png"
            fill
            alt="User Avatar"
            className="object-cover"
          />
        </div>
        <div>
          <button className="ob text-[12px] font-semibold bg-white border border-[#d8cfbd] px-3 py-1.5 rounded-md">
            Upload new avatar
          </button>
          <p className="text-[11.5px] text-[#9b927f] mt-1">JPG or PNG under 2MB</p>
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
            className="w-full text-[14px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none focus:border-[#15463b]"
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
            className="w-full text-[14px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none focus:border-[#15463b]"
          />
        </div>
      </div>

      <div className="pt-1.5">
        <button
          onClick={() => showToast("Account information saved successfully!")}
          className="pb bg-[#15463b] text-white text-[13px] font-semibold px-5.5 py-2.5 rounded-lg border-none"
        >
          Save changes
        </button>
      </div>
    </div>
  );
}
