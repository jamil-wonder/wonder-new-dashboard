"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Lock, ArrowRight } from "lucide-react";
import { WonderscoreLogo } from "../../../components/ui/WonderscoreSpinner";
import { fetchApi, parseApiError } from "../../../lib/api";

const MIN_LENGTH = 8;
type Phase = "checking" | "ready" | "invalid" | "done";

function ResetForm() {
  const token = useSearchParams().get("token") || "";
  const [phase, setPhase] = useState<Phase>(token ? "checking" : "invalid");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchApi<{ valid: boolean }>("/api/auth/reset/check", {
      method: "POST",
      body: JSON.stringify({ token }),
    })
      .then((res) => !cancelled && setPhase(res.valid ? "ready" : "invalid"))
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(parseApiError(err, "We couldn't check this link. Please try again."));
        setPhase("ready"); // let them try; the real reset will report the real problem
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_LENGTH) {
      setErrorMsg(`Choose a password with at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setErrorMsg("The two passwords don't match.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      await fetchApi<{ message: string }>("/api/auth/reset", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setPhase("done");
    } catch (err) {
      const msg = parseApiError(err, "We couldn't change your password. Please try again.");
      setErrorMsg(msg);
      if (/expired|already used/i.test(msg)) setPhase("invalid");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full text-[14px] pl-10 pr-4 py-2.5 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors";

  return (
    <div className="w-full max-w-[460px] bg-white border border-[#ece3d1] rounded-[28px] shadow-[0_20px_50px_rgba(21,70,59,0.12)] p-6 md:p-9">
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#15463b] flex items-center justify-center mb-3.5 shadow-lg">
          <WonderscoreLogo size={32} color="white" />
        </div>
        <h1 className="font-spectral text-[26px] font-semibold text-[#15463b] tracking-tight leading-tight">
          Choose a new password
        </h1>
      </div>

      {phase === "checking" && (
        <div className="flex items-center justify-center gap-2 py-6 text-[13.5px] text-[#6f6757]">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking your link
        </div>
      )}

      {phase === "invalid" && (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-[#fdf2f0] border border-[#f6dcd5] rounded-xl text-[13.5px] text-[#b1442a] leading-relaxed">
            This reset link has expired or was already used. Please ask for a new one.
          </div>
          <a
            href="/auth/forgot"
            className="inline-block w-full py-3 bg-[#15463b] text-white text-[14px] font-bold rounded-xl hover:bg-[#1a5c44] transition-colors"
          >
            Send me a new link
          </a>
        </div>
      )}

      {phase === "done" && (
        <div className="space-y-4 text-center">
          <div className="p-4 bg-[#eef6f1] border border-[#cfe5d8] rounded-xl text-[13.5px] text-[#15463b] leading-relaxed">
            Your password has been changed. You can sign in with it now.
          </div>
          <a
            href="/auth"
            className="inline-block w-full py-3 bg-[#15463b] text-white text-[14px] font-bold rounded-xl hover:bg-[#1a5c44] transition-colors"
          >
            Go to sign in
          </a>
        </div>
      )}

      {phase === "ready" && (
        <>
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-[#fdf2f0] border border-[#f6dcd5] rounded-xl text-[13px] font-medium text-[#b1442a] text-center">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="font-mono-spline text-[10px] uppercase tracking-wider text-[#8a8273] block mb-1.5">
                New password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#9b927f]" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  required
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="font-mono-spline text-[10px] uppercase tracking-wider text-[#8a8273] block mb-1.5">
                Confirm new password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[#9b927f]" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Type it again"
                  autoComplete="new-password"
                  required
                  className={inputClass}
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
                  <span>Change password</span>
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#faf8f3] flex flex-col items-center justify-center p-4 md:p-6">
      <Suspense fallback={null}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
