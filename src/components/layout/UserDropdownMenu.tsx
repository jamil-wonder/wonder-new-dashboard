"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, Building2, KeyRound, LogOut, ChevronDown, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";

export default function UserDropdownMenu() {
  const { user, logout } = useUser();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const name = user?.full_name || "User";
  const email = user?.email || "";
  const initial = name.charAt(0).toUpperCase() || "U";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    logout();
    showToast("Signed out of session.", "info");
    // Hard navigation — forces every provider to remount from scratch so
    // no in-memory state from this session lingers for whoever logs in
    // next in this browser.
    window.location.href = "/auth";
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 cursor-pointer group bg-transparent border-none outline-none p-1 rounded-xl hover:bg-[#f5f0e6] transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-[#15463b] text-white flex items-center justify-center font-spectral text-[16px] font-bold group-hover:bg-[#1a5c44] transition-colors shadow-xs">
          {initial}
        </div>
        <div className="hidden md:flex flex-col text-left leading-tight">
          <span className="text-[13.5px] font-semibold text-[#3a352b] group-hover:text-[#15463b] transition-colors">
            {name}
          </span>
          <span className="text-[10.5px] text-[#9b927f] max-w-[130px] truncate">
            {email}
          </span>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-[#9b927f] hidden md:block transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>

      {/* Dropdown Menu Popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 z-50 w-[240px] bg-white border border-[#e5ddd0] rounded-2xl shadow-[0_12px_32px_rgba(21,70,59,0.15)] overflow-hidden p-1.5"
          >
            {/* Header user details inside menu */}
            <div className="p-3 bg-[#faf8f3] rounded-xl border border-[#efe7d6] mb-1.5">
              <div className="font-semibold text-[13.5px] text-[#15463b] truncate">{name}</div>
              <div className="text-[11.5px] text-[#8a8273] truncate">{email}</div>
              <span className="inline-block text-[9.5px] font-bold uppercase tracking-wider text-[#1e7d4f] bg-[#dcefe2] px-2 py-0.5 rounded-full mt-1.5">
                {user?.role || "Active Account"}
              </span>
            </div>

            {/* Admin Portal — only ever shown to an admin, redirects to /admin */}
            {user?.role === "admin" && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-bold text-[#15463b] hover:bg-[#f5f0e6] transition-colors"
              >
                <ShieldCheck className="w-4 h-4 text-[#15463b]" />
                <span>Admin Portal</span>
              </Link>
            )}

            {/* Menu Links */}
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#3a352b] hover:bg-[#f5f0e6] hover:text-[#15463b] transition-colors"
            >
              <User className="w-4 h-4 text-[#8a8273]" />
              <span>Account &amp; Profile</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#3a352b] hover:bg-[#f5f0e6] hover:text-[#15463b] transition-colors"
            >
              <Building2 className="w-4 h-4 text-[#8a8273]" />
              <span>Manage Businesses</span>
            </Link>

            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-[#3a352b] hover:bg-[#f5f0e6] hover:text-[#15463b] transition-colors"
            >
              <KeyRound className="w-4 h-4 text-[#8a8273]" />
              <span>API Keys &amp; Security</span>
            </Link>

            <div className="h-px bg-[#efe7d6] my-1" />

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-bold text-[#b1442a] hover:bg-[#fdf2f0] transition-colors cursor-pointer border-none"
            >
              <LogOut className="w-4 h-4 text-[#b1442a]" />
              <span>Sign Out</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
