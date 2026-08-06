"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { WonderscoreLogo } from "../../components/ui/WonderscoreSpinner";
import { useUser } from "../../context/UserContext";

const OTP_LENGTH = 6;

function parseErrorMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err || "");
  const match = raw.match(/API Error \(\d+\):\s*(.*)/);
  const body = match ? match[1] : raw;
  try {
    const parsed = JSON.parse(body);
    if (typeof parsed?.detail === "string") return parsed.detail;
  } catch {}
  return body || "Couldn't verify that code — try again.";
}

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const { user, verifyOtp, resendOtp } = useUser();
  // Whoever got sent here — a brand-new signup, someone mid-login, or an
  // existing session whose email just changed — always arrives with the
  // email in the URL. Falling back to the current user only covers the
  // rare case of landing here with a live session and no query param.
  const email = searchParams.get("email") || user?.email || "";

  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [resendMsg, setResendMsg] = useState("");

  if (!email) {
    return (
      <div className="min-h-screen bg-[#faf8f3] flex flex-col items-center justify-center p-4 md:p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-[460px] bg-white border border-[#ece3d1] rounded-[28px] shadow-[0_20px_50px_rgba(21,70,59,0.12)] p-6 md:p-9 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#15463b] flex items-center justify-center mb-3.5 shadow-lg mx-auto">
            <WonderscoreLogo size={32} color="white" />
          </div>
          <h1 className="font-spectral text-[22px] font-semibold text-[#15463b] mt-4">No pending verification</h1>
          <p className="text-[13.5px] text-[#8a8273] mt-2 max-w-[320px] mx-auto leading-relaxed">
            Sign in or create an account first — we&rsquo;ll send a code and bring you back here.
          </p>
          <Link
            href="/auth"
            className="mt-6 inline-flex items-center justify-center gap-2 w-full py-3.5 bg-[#15463b] text-white text-[14px] font-bold rounded-xl shadow-md hover:bg-[#1a5c44] transition-colors"
          >
            Go to sign in
          </Link>
        </motion.div>
      </div>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== OTP_LENGTH) {
      setErrorMsg(`Enter the ${OTP_LENGTH}-digit code from your email.`);
      return;
    }
    setIsVerifying(true);
    setErrorMsg("");
    try {
      await verifyOtp(email, code.trim());
      // Hard navigation — forces every provider (BusinessContext included)
      // to remount and fetch fresh with this session's brand-new token.
      window.location.href = "/overview";
    } catch (err) {
      setErrorMsg(parseErrorMessage(err));
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    setResendMsg("");
    setErrorMsg("");
    try {
      await resendOtp(email);
      setResendMsg("A fresh code is on its way — check your inbox.");
    } catch (err) {
      setResendMsg(parseErrorMessage(err));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f3] flex flex-col items-center justify-center p-4 md:p-6 relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#15463b]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#1a5c44]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-[460px] bg-white border border-[#ece3d1] rounded-[28px] shadow-[0_20px_50px_rgba(21,70,59,0.12)] p-6 md:p-9 relative z-10 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-[#15463b] flex items-center justify-center mb-3.5 shadow-lg mx-auto">
          <WonderscoreLogo size={32} color="white" />
        </div>

        <h1 className="font-spectral text-[22px] font-semibold text-[#15463b] mt-4">Enter your code</h1>
        <p className="text-[13.5px] text-[#8a8273] mt-2 max-w-[320px] mx-auto leading-relaxed">
          Enter the {OTP_LENGTH}-digit code we sent to{" "}
          <strong className="text-[#23211b] font-semibold">{email}</strong>.
        </p>

        {errorMsg && (
          <div className="mt-5 p-3.5 bg-[#fdf2f0] border border-[#f6dcd5] rounded-xl text-[13px] font-medium text-[#b1442a] text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-6">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={OTP_LENGTH}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, OTP_LENGTH))}
            placeholder="000000"
            autoFocus
            className="w-full text-center text-[28px] font-bold tracking-[0.5em] pl-[0.5em] py-3.5 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
          />
          <button
            type="submit"
            disabled={isVerifying || code.length !== OTP_LENGTH}
            className="mt-4 w-full py-3.5 bg-[#15463b] text-white text-[14px] font-bold rounded-xl shadow-md hover:bg-[#1a5c44] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isVerifying ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : "Verify and continue"}
          </button>
        </form>

        <div className="mt-5 text-[12.5px] text-[#8a8273]">
          Didn&rsquo;t get a code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="font-semibold text-[#15463b] hover:underline disabled:opacity-50 cursor-pointer bg-transparent border-none p-0"
          >
            {isResending ? "Sending…" : "Resend code"}
          </button>
        </div>
        {resendMsg && <p className="text-[12px] text-[#8a8273] mt-2">{resendMsg}</p>}
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf8f3]" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
