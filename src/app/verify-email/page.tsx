"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { WonderscoreLogo } from "../../components/ui/WonderscoreSpinner";
import { useUser } from "../../context/UserContext";

const OTP_LENGTH = 6;

function OtpBoxes({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] || "");

  const setDigit = (index: number, rawValue: string) => {
    const clean = rawValue.replace(/\D/g, "");
    if (!clean) {
      const next = value.split("");
      next[index] = "";
      onChange(next.join("").slice(0, OTP_LENGTH));
      return;
    }

    const next = value.padEnd(OTP_LENGTH, " ").split("");
    clean.slice(0, OTP_LENGTH - index).split("").forEach((digit, offset) => {
      next[index + offset] = digit;
    });
    onChange(next.join("").replace(/\s/g, "").slice(0, OTP_LENGTH));

    const nextIndex = Math.min(index + clean.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (pasted) {
      onChange(pasted);
      inputRefs.current[Math.min(pasted.length, OTP_LENGTH) - 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-3">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            inputRefs.current[index] = node;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(event) => setDigit(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          autoFocus={index === 0}
          aria-label={`Verification code digit ${index + 1}`}
          className="h-12 w-11 rounded-xl border border-[#ece3d1] bg-[#fdfcf8] text-center text-[22px] font-bold text-[#15463b] outline-none transition-all focus:border-[#15463b] focus:bg-white focus:shadow-[0_0_0_3px_rgba(21,70,59,0.10)] disabled:opacity-60 sm:h-14 sm:w-12"
        />
      ))}
    </div>
  );
}

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
      // Goes to /onboarding rather than straight to /overview — that page
      // itself checks whether this account already has a business (a
      // routine login, not a first-time signup) and redirects straight
      // through to /overview on its own; only a genuinely new account
      // with zero businesses sees the onboarding step.
      window.location.href = "/onboarding";
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
          <OtpBoxes
            value={code}
            onChange={(nextCode) => {
              setCode(nextCode);
              setErrorMsg("");
            }}
            disabled={isVerifying}
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
