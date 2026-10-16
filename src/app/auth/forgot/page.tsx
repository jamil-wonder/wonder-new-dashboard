"use client";

import React, { useState } from "react";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { WonderscoreLogo } from "../../../components/ui/WonderscoreSpinner";
import { fetchApi, parseApiError } from "../../../lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg("Please enter your email address.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      // The server gives the same answer whether or not the email has an account.
      const res = await fetchApi<{ message: string }>("/api/auth/forgot", {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setMessage(res.message);
    } catch (err) {
      setErrorMsg(parseApiError(err, "We couldn't send the reset link. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f3] flex flex-col items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-[460px] bg-white border border-[#ece3d1] rounded-[28px] shadow-[0_20px_50px_rgba(21,70,59,0.12)] p-6 md:p-9">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#15463b] flex items-center justify-center mb-3.5 shadow-lg">
            <WonderscoreLogo size={32} color="white" />
          </div>
          <h1 className="font-spectral text-[26px] font-semibold text-[#15463b] tracking-tight leading-tight">
            Forgot your password?
          </h1>
          <p className="text-[13.5px] text-[#8a8273] mt-1 max-w-[320px] leading-relaxed">
            Enter your email and we&apos;ll send you a link to choose a new one.
          </p>
        </div>

        {message ? (
          <div className="p-4 bg-[#eef6f1] border border-[#cfe5d8] rounded-xl text-[13.5px] text-[#15463b] text-center leading-relaxed">
            {message}
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="mb-5 p-3.5 bg-[#fdf2f0] border border-[#f6dcd5] rounded-xl text-[13px] font-medium text-[#b1442a] text-center">
                {errorMsg}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="font-mono-spline text-[11px] uppercase tracking-wider text-[#6f6757] block mb-1.5">
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
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#15463b] text-white text-[14px] font-bold rounded-xl shadow-md hover:bg-[#1a5c44] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <>
                    <span>Send reset link</span>
                    <ArrowRight className="w-4.5 h-4.5" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <a href="/auth" className="text-[13px] font-medium text-[#15463b] hover:underline">
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  );
}
