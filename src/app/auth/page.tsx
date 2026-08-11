"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Lock, Mail, User as UserIcon, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { GoogleOAuthProvider, GoogleLogin, type CredentialResponse } from "@react-oauth/google";
import { WonderscoreLogo } from "../../components/ui/WonderscoreSpinner";
import { useUser } from "../../context/UserContext";
import { useToast } from "../../context/ToastContext";

export default function AuthPage() {
  const { login, signup, loginWithGoogle, isAuthenticated, isLoading } = useUser();
  const { showToast } = useToast();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [canUseGoogleAuth, setCanUseGoogleAuth] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      window.location.replace("/overview");
    }
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    // Google rejects a bare "localhost" origin unless it's been explicitly
    // added to the OAuth client's allowed origins, which produces a console
    // error on every local dev load — same fix the old dashboard and the
    // landing site already use: only render the button on localhost when
    // that's been deliberately opted into.
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
    const allowLocalGoogle = process.env.NEXT_PUBLIC_ALLOW_LOCAL_GOOGLE_AUTH === "true";
    const hostname = window.location.hostname;
    const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";
    setCanUseGoogleAuth(Boolean(clientId) && (!isLocalhost || allowLocalGoogle));
  }, []);

  const handleGoogleSuccess = async (response: CredentialResponse) => {
    if (!response.credential) {
      setErrorMsg("Google did not return a valid sign-in credential.");
      return;
    }
    setErrorMsg("");
    setGoogleLoading(true);
    try {
      await loginWithGoogle(response.credential);
      // loginWithGoogle already sets isAuthenticated; the redirect effect
      // above handles navigation once it flips.
    } catch (err: any) {
      setErrorMsg(err?.message || "Google sign-in failed.");
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    try {
      setLoading(true);
      // Neither path signs the user in directly anymore — both send a code
      // to the email and only /verify-email actually establishes a session.
      // No hard navigation here (unlike after verifying) since there's no
      // token yet for providers to pick up.
      if (mode === "login") {
        const { email: confirmedEmail } = await login(email, password);
        showToast("We sent a sign-in code to your email.", "success");
        window.location.assign(`/verify-email?email=${encodeURIComponent(confirmedEmail)}`);
      } else {
        const { email: confirmedEmail } = await signup(email, password, name);
        showToast("Account created — check your email for a verification code.", "success");
        window.location.assign(`/verify-email?email=${encodeURIComponent(confirmedEmail)}`);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Authentication failed. Please check credentials.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f3] flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
      
      {/* Background ambient gradient glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#15463b]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#1a5c44]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-[460px] bg-white border border-[#ece3d1] rounded-[28px] shadow-[0_20px_50px_rgba(21,70,59,0.12)] p-6 md:p-9 relative z-10"
      >
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-[#15463b] flex items-center justify-center mb-3.5 shadow-lg">
            <WonderscoreLogo size={32} color="white" />
          </div>
          <h1 className="font-spectral text-[30px] font-semibold text-[#15463b] tracking-tight leading-tight">
            Wonderscore AI
          </h1>
          <p className="text-[13.5px] text-[#8a8273] mt-1 max-w-[320px] leading-relaxed">
            AI Search Engine Optimization &amp; Visibility Intelligence Dashboard
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#f5f0e6] p-1 border border-[#e8dfc8] rounded-xl gap-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode("login"); setErrorMsg(""); }}
            className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all cursor-pointer border-none ${
              mode === "login"
                ? "bg-[#15463b] text-white shadow-xs"
                : "bg-transparent text-[#6f6757] hover:text-[#23211b]"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setErrorMsg(""); }}
            className={`flex-1 py-2 text-[13px] font-bold rounded-lg transition-all cursor-pointer border-none ${
              mode === "signup"
                ? "bg-[#15463b] text-white shadow-xs"
                : "bg-transparent text-[#6f6757] hover:text-[#23211b]"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-5 p-3.5 bg-[#fdf2f0] border border-[#f6dcd5] rounded-xl text-[13px] font-medium text-[#b1442a] text-center">
            {errorMsg}
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="font-mono-spline text-[10px] uppercase tracking-wider text-[#8a8273] block mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-[#9b927f]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Marcus Reed"
                  required
                  className="w-full text-[14px] pl-10 pr-4 py-2.5 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="font-mono-spline text-[10px] uppercase tracking-wider text-[#8a8273] block mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[#9b927f]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="marcus@meridian.co"
                required
                className="w-full text-[14px] pl-10 pr-4 py-2.5 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="font-mono-spline text-[10px] uppercase tracking-wider text-[#8a8273] block mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#9b927f]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full text-[14px] pl-10 pr-4 py-2.5 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#15463b] text-white text-[14px] font-bold rounded-xl shadow-md hover:bg-[#1a5c44] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-3"
          >
            {loading ? (
              <Loader2 className="w-4.5 h-4.5 animate-spin" />
            ) : (
              <>
                <span>{mode === "login" ? "Sign In to Dashboard" : "Create Account"}</span>
                <ArrowRight className="w-4.5 h-4.5" />
              </>
            )}
          </button>
        </form>

        {canUseGoogleAuth && (
          <>
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-[#ece3d1]" />
              <span className="text-[11px] font-medium text-[#9b927f] uppercase tracking-wider">or continue with</span>
              <div className="flex-1 h-px bg-[#ece3d1]" />
            </div>

            {googleLoading ? (
              <div className="w-full flex items-center justify-center gap-2 py-3 border border-[#ece3d1] rounded-xl text-[13.5px] font-medium text-[#6f6757]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Connecting your Google account
              </div>
            ) : (
              <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""}>
                <div className="flex justify-center [&>div]:w-full">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setErrorMsg("Google sign-in was cancelled or failed.")}
                    theme="outline"
                    size="large"
                    shape="rectangular"
                    text="continue_with"
                    width="360"
                  />
                </div>
              </GoogleOAuthProvider>
            )}
          </>
        )}
      </motion.div>

      {/* Footer copyright */}
      <div className="mt-8 text-center text-[12px] text-[#9b927f]">
        &copy; {new Date().getFullYear()} Wonderscore AI. All rights reserved.
      </div>
    </div>
  );
}
