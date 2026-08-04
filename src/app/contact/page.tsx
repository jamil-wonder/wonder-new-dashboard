"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { useUser } from "../../context/UserContext";
import { useBusiness } from "../../context/BusinessContext";

const TOPIC_OPTIONS = [
  { id: "analyser", label: "Website Analyser issue" },
  { id: "query", label: "AI Query / mentions issue" },
  { id: "blogs", label: "Blog generation issue" },
  { id: "billing", label: "Billing / plan" },
  { id: "other", label: "Something else" },
];

function businessDomain(url: string) {
  return String(url || "")
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .trim();
}

export default function ContactPage() {
  const { user } = useUser();
  const { activeBusiness } = useBusiness();
  const domain = businessDomain(activeBusiness?.url || "");

  const [topic, setTopic] = useState(TOPIC_OPTIONS[0].id);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !email.trim()) return;
    setIsSubmitted(true);
  };

  return (
    <div className="space-y-4 pb-10">
      <Link
        href="/overview"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#6f6757] hover:text-[#15463b] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Overview
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)] gap-4 items-stretch">
        {/* LEFT: intro + who's asking, one card, stretched to match the form's height */}
        <div className="bg-[#15463b] rounded-[16px] p-6 text-[#eaf3ee] flex flex-col justify-between">
          <div>
            <div className="font-mono-spline text-[10.5px] tracking-wider uppercase text-[#86b89f]">
              Talk to our team
            </div>
            <div className="font-spectral text-[24px] font-semibold text-white mt-1.5 leading-tight">
              Stuck on something the plan couldn&rsquo;t fix?
            </div>
            <p className="text-[13px] text-[#d9eee7] mt-2.5 leading-relaxed">
              If the weekly plan, an Analyser fix, or a Query result isn&rsquo;t adding up, tell us exactly what
              happened here. A real person on the team reads every message and follows up directly at the email
              you give us — no bots, no support-ticket maze, no waiting on an auto-reply.
            </p>
            <p className="text-[13px] text-[#d9eee7] mt-2.5 leading-relaxed">
              The more specific you are — what you expected vs. what you saw — the faster we can dig in.
            </p>
          </div>

          {activeBusiness?.name && (
            <div className="border-t border-white/15 pt-4 mt-6">
              <div className="font-mono-spline text-[9.5px] tracking-[0.14em] uppercase text-[#86b89f] mb-2.5">
                On behalf of
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 overflow-hidden">
                  {domain && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                      alt={activeBusiness.name}
                      className="w-5 h-5 object-contain"
                      onError={(e) => { (e.target as HTMLElement).style.display = "none"; }}
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-spectral text-[16px] font-semibold text-white truncate">{activeBusiness.name}</div>
                  <div className="text-[11.5px] text-[#9ac0b2] truncate">{activeBusiness.url}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: the form */}
        <div className="bg-white border border-[#ece3d1] rounded-[16px] p-6 md:p-7">
          {isSubmitted ? (
            <div className="flex flex-col items-center text-center py-10 gap-3">
              <div className="w-12 h-12 rounded-full bg-[#dcefe2] flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-[#1e7d4f]" />
              </div>
              <div className="font-spectral text-[19px] font-semibold text-[#15463b]">Message ready</div>
              <p className="text-[13px] text-[#6f6757] max-w-[380px] leading-relaxed">
                We&rsquo;ve got what you wrote below queued up. Delivery isn&rsquo;t wired up on our end yet, so nothing
                was actually sent — reach out directly at{" "}
                <a href="mailto:support@wonderscore.ai" className="font-semibold text-[#15463b] hover:underline">
                  support@wonderscore.ai
                </a>{" "}
                in the meantime.
              </p>
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="mt-2 text-[12.5px] font-semibold text-[#15463b] hover:underline cursor-pointer"
              >
                ← Edit message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <h3 className="font-spectral text-[19px] font-semibold text-[#15463b]">Contact us</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">
                    Your email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@company.com"
                    className="w-full text-[14px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
                  />
                </div>

                <div>
                  <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">
                    What&rsquo;s this about
                  </label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full text-[14px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors cursor-pointer"
                  >
                    {TOPIC_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={7}
                  placeholder="What happened, what did you expect instead, and anything else that'll help us help you faster."
                  className="w-full text-[14px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors resize-none leading-relaxed"
                />
              </div>

              <div className="pt-1.5">
                <button
                  type="submit"
                  disabled={!message.trim() || !email.trim()}
                  className="inline-flex items-center gap-2 bg-[#15463b] text-white text-[13px] font-semibold px-5.5 py-2.5 rounded-lg border-none hover:bg-[#1a5c44] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send message
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
