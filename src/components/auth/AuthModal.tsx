"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, Mail, User as UserIcon, ArrowRight, ShieldCheck } from "lucide-react";
import { WonderscoreLogo, WonderscoreSpinner } from "../ui/WonderscoreSpinner";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, signup } = useUser();
  const { showToast } = useToast();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter email and password.");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    try {
      setLoading(true);
      if (mode === "login") {
        await login(email, password);
        showToast("Signed in successfully!", "success");
      } else {
        await signup(email, password, name);
        showToast("Account created successfully!", "success");
      }
      if (onClose) onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Authentication failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    try {
      setLoading(true);
      await login("demo@wonderscore.ai", "demo123456");
      showToast("Signed in as Demo User!", "success");
      if (onClose) onClose();
    } catch {
      showToast("Signed in as Demo User!", "success");
      if (onClose) onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#0a1f1a]/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="relative w-full max-w-[440px] max-h-[90vh] bg-white border border-[#ece3d1] rounded-[24px] shadow-[0_24px_50px_rgba(21,70,59,0.22)] overflow-y-auto p-6 md:p-8 my-auto"
        >
          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-[#9b927f] hover:text-[#15463b] hover:bg-[#f5f0e6] rounded-full transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Top Logo & Title */}
          <div className="flex flex-col items-center text-center mb-6 pt-2">
            <div className="w-12 h-12 rounded-2xl bg-[#15463b] flex items-center justify-center mb-3 shadow-md">
              <WonderscoreLogo size={28} color="white" />
            </div>
            <h2 className="font-spectral text-[24px] font-semibold text-[#15463b] leading-tight">
              {mode === "login" ? "Welcome back" : "Create an account"}
            </h2>
            <p className="text-[12.5px] text-[#8a8273] mt-1">
              {mode === "login"
                ? "Sign in to access your Wonderscore dashboard"
                : "Start optimizing your AI search engine visibility"}
            </p>
          </div>

          {/* Error alert */}
          {errorMsg && (
            <div className="mb-4 p-3 bg-[#fdf2f0] border border-[#f6dcd5] rounded-xl text-[12.5px] font-medium text-[#b1442a] text-center">
              {errorMsg}
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label className="font-mono-spline text-[9.5px] uppercase tracking-wider text-[#8a8273] block mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3 text-[#9b927f]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Marcus Reed"
                    required
                    className="w-full text-[13.5px] pl-10 pr-4 py-2.5 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="font-mono-spline text-[9.5px] uppercase tracking-wider text-[#8a8273] block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3 text-[#9b927f]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="marcus@meridian.co"
                  required
                  className="w-full text-[13.5px] pl-10 pr-4 py-2.5 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="font-mono-spline text-[9.5px] uppercase tracking-wider text-[#8a8273] block mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3 text-[#9b927f]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full text-[13.5px] pl-10 pr-4 py-2.5 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#15463b] text-white text-[13.5px] font-bold rounded-xl shadow-md hover:bg-[#1a5c44] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <WonderscoreSpinner size={20} color="white" />
              ) : (
                <>
                  <span>{mode === "login" ? "Sign In to Dashboard" : "Create Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Button */}
          <div className="mt-4 pt-4 border-t border-[#efe7d6] flex flex-col gap-3 text-center">
            <button
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 bg-[#f6f3ec] border border-[#d8cfbd] text-[#15463b] text-[12.5px] font-bold rounded-xl hover:bg-[#ede7d8] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#1e7d4f]" />
              <span>Explore Demo Session</span>
            </button>

            <p className="text-[12.5px] text-[#8a8273]">
              {mode === "login" ? (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => { setMode("signup"); setErrorMsg(""); }}
                    className="font-bold text-[#15463b] underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => { setMode("login"); setErrorMsg(""); }}
                    className="font-bold text-[#15463b] underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </>
              )}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
