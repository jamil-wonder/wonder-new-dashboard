"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Globe, ArrowRight } from "lucide-react";
import { WonderscoreLogo } from "../../components/ui/WonderscoreSpinner";
import { useBusiness } from "../../context/BusinessContext";
import { useToast } from "../../context/ToastContext";
import { fetchApi } from "../../lib/api";

const DEFAULT_QG = { branded: 5, nonBranded: 5, localSeo: 5, broadSeo: 5 };
type QG = typeof DEFAULT_QG;

function normalizeQG(value: QG): QG {
  const next: QG = {
    branded: Math.max(0, Math.min(20, Math.round(Number(value.branded) || 0))),
    nonBranded: Math.max(0, Math.min(20, Math.round(Number(value.nonBranded) || 0))),
    localSeo: Math.max(0, Math.min(20, Math.round(Number(value.localSeo) || 0))),
    broadSeo: Math.max(0, Math.min(20, Math.round(Number(value.broadSeo) || 0))),
  };
  const total = next.branded + next.nonBranded + next.localSeo + next.broadSeo;
  return total === 20 ? next : DEFAULT_QG;
}

function QGSlider({ label, desc, value, onChange }: { label: string; desc: string; value: number; onChange: (v: string) => void }) {
  return (
    <div className="bg-[#fdfcf8] border border-[#ece3d1] rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-[13px] text-[#23211b]">{label}</span>
        <span className="font-mono-spline font-bold text-[13px] text-[#15463b]">{value}</span>
      </div>
      <p className="text-[11px] text-[#9b927f] mb-2 leading-relaxed">{desc}</p>
      <input type="range" min={0} max={20} value={value} onChange={(e) => onChange(e.target.value)} className="w-full accent-[#15463b]" />
    </div>
  );
}

// One simple step after signup: give us your URL, we scrape what we can
// (name, description, an address if the site has one) and pre-fill it —
// same /api/scrape the Analyser already uses, no separate scraper to
// maintain. Category, AI description, services, and target audience have
// no reliable auto-extraction, so those stay manual rather than guessed.
// Fields mirror the Business Profiles "Add Profile" form in Settings —
// this intentionally does NOT replicate the old dashboard's multi-step
// competitor-search onboarding.
export default function OnboardingPage() {
  const router = useRouter();
  const { businesses, hasLoadedOnce, refetchBusinesses } = useBusiness();
  const { showToast } = useToast();

  const [step, setStep] = useState<"url" | "details">("url");
  const [url, setUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [services, setServices] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [qg, setQg] = useState<QG>(DEFAULT_QG);
  const qgTotal = qg.branded + qg.nonBranded + qg.localSeo + qg.broadSeo;

  const updateQG = (key: keyof QG, raw: string) => {
    setQg((cur) => ({ ...cur, [key]: Math.max(0, Math.min(20, Number(raw) || 0)) }));
  };

  // Existing users going through OTP for a routine login (not first-time
  // signup) already have a business — send them straight through instead
  // of onboarding again every time they log in.
  useEffect(() => {
    if (hasLoadedOnce && businesses.length > 0) {
      router.replace("/overview");
    }
  }, [hasLoadedOnce, businesses.length, router]);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setErrorMsg("");
    setIsFetching(true);
    const cleanUrl = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    try {
      const res = await fetchApi<any>("/api/scrape", {
        method: "POST",
        body: JSON.stringify({ url: cleanUrl }),
      });
      setName(res?.businessName || "");
      setDescription(res?.description || "");
      setLocation(Array.isArray(res?.addresses) && res.addresses[0] ? res.addresses[0] : "");
      setUrl(cleanUrl);
      setStep("details");
    } catch (err: any) {
      // A failed scrape shouldn't dead-end signup — fall through to the
      // same manual-entry step, just empty, with an honest note why.
      setErrorMsg("Couldn't reach that website automatically — you can still fill in the details yourself below.");
      setUrl(cleanUrl);
      setStep("details");
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg("Give your business a name.");
      return;
    }
    setIsSaving(true);
    setErrorMsg("");
    try {
      const servicesList = services.split(",").map((s) => s.trim()).filter(Boolean);
      await fetchApi("/api/user/businesses", {
        method: "POST",
        body: JSON.stringify({
          url,
          businessName: name.trim(),
          category: category.trim(),
          location: location.trim(),
          businessDescription: description.trim(),
          aiDescription: aiDescription.trim(),
          services: servicesList,
          targetAudience: targetAudience.trim(),
          questionGeneration: normalizeQG(qg),
        }),
      });
      await refetchBusinesses();
      showToast("Your business is set up — let's take a look.", "success");
      router.replace("/overview");
    } catch (err: any) {
      setErrorMsg(err?.message || "Couldn't save your business. Please try again.");
      setIsSaving(false);
    }
  };

  const handleSkip = () => router.replace("/overview");

  if (!hasLoadedOnce) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#15463b]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[640px] bg-white border border-[#ece3d1] rounded-[24px] p-6 md:p-8"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#15463b] flex items-center justify-center mb-4">
          <WonderscoreLogo size={26} color="white" />
        </div>
        <h1 className="font-spectral text-[24px] font-semibold text-[#15463b]">
          {step === "url" ? "Add your business" : "Confirm your details"}
        </h1>
        <p className="text-[13.5px] text-[#8a8273] mt-1.5 leading-relaxed">
          {step === "url"
            ? "Enter your website and we'll pull in what we can find automatically."
            : "We filled in what we could find on your site — check it over and add anything missing."}
        </p>

        {errorMsg && (
          <div className="mt-4 p-3 bg-[#fdf2f0] border border-[#f6dcd5] rounded-xl text-[12.5px] font-medium text-[#b1442a]">
            {errorMsg}
          </div>
        )}

        {step === "url" ? (
          <form onSubmit={handleFetch} className="mt-6 space-y-4">
            <div>
              <label className="font-mono-spline text-[10px] uppercase tracking-wider text-[#8a8273] block mb-1.5">
                Website URL
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 absolute left-3.5 top-3.5 text-[#9b927f]" />
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  autoFocus
                  className="w-full text-[14px] pl-10 pr-4 py-3 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isFetching}
              className="w-full py-3.5 bg-[#15463b] text-white text-[14px] font-bold rounded-xl hover:bg-[#1a5c44] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isFetching ? (
                <>
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  Scanning your website…
                </>
              ) : (
                <>
                  <WonderscoreLogo size={16} color="white" />
                  Fetch my business details
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="w-full text-center text-[12.5px] font-medium text-[#8a8273] hover:text-[#15463b] transition-colors cursor-pointer bg-transparent border-none py-1"
            >
              Skip for now
            </button>
          </form>
        ) : (
          <form onSubmit={handleSave} className="mt-6 space-y-5">
            <div className="space-y-4">
              <div>
                <label className="font-mono-spline text-[10px] uppercase tracking-wider text-[#8a8273] block mb-1.5">
                  Business Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  placeholder="Acme Inc."
                  className="w-full text-[14px] p-3 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono-spline text-[10px] uppercase tracking-wider text-[#8a8273] block mb-1.5">
                    Category
                  </label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Restaurant"
                    className="w-full text-[14px] p-3 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
                  />
                </div>
                <div>
                  <label className="font-mono-spline text-[10px] uppercase tracking-wider text-[#8a8273] block mb-1.5">
                    Location
                  </label>
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Austin, TX"
                    className="w-full text-[14px] p-3 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-1 border-t border-[#efe7d6]">
              <h3 className="font-spectral text-[14px] font-semibold text-[#15463b] pt-4">AI Description &amp; Details</h3>
              <div>
                <label className="font-mono-spline text-[10px] uppercase tracking-wider text-[#8a8273] block mb-1.5">
                  Business description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="What does this business do?"
                  className="w-full text-[14px] p-3 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none resize-none focus:border-[#15463b] transition-colors"
                />
              </div>
              <div>
                <label className="font-mono-spline text-[10px] uppercase tracking-wider text-[#8a8273] block mb-1.5">
                  AI Description
                </label>
                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  rows={3}
                  placeholder="AI training prompt description…"
                  className="w-full text-[14px] p-3 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none resize-none focus:border-[#15463b] transition-colors"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-mono-spline text-[10px] uppercase tracking-wider text-[#8a8273] block mb-1.5">
                    Services
                  </label>
                  <input
                    value={services}
                    onChange={(e) => setServices(e.target.value)}
                    placeholder="Dining, boutique hotel rooms"
                    className="w-full text-[14px] p-3 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
                  />
                </div>
                <div>
                  <label className="font-mono-spline text-[10px] uppercase tracking-wider text-[#8a8273] block mb-1.5">
                    Target audience
                  </label>
                  <input
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Couples, food lovers, travelers"
                    className="w-full text-[14px] p-3 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-1 border-t border-[#efe7d6]">
              <div className="flex items-center justify-between pt-4">
                <h3 className="font-spectral text-[14px] font-semibold text-[#15463b]">Question Generation Ratios</h3>
                <span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-lg ${qgTotal === 20 ? "bg-[#dcefe2] text-[#1e7d4f]" : "bg-[#f7e7c4] text-[#9a6a12]"}`}>
                  {qgTotal}/20
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <QGSlider label="Branded" desc="Uses business name." value={qg.branded} onChange={(v) => updateQG("branded", v)} />
                <QGSlider label="Non-Branded" desc="Category searches." value={qg.nonBranded} onChange={(v) => updateQG("nonBranded", v)} />
                <QGSlider label="Local SEO" desc="Location-focused." value={qg.localSeo} onChange={(v) => updateQG("localSeo", v)} />
                <QGSlider label="Broad SEO" desc="Nearby-area searches." value={qg.broadSeo} onChange={(v) => updateQG("broadSeo", v)} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-[#15463b] text-white text-[14px] font-bold rounded-xl hover:bg-[#1a5c44] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : (
                <>
                  Save and continue
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="w-full text-center text-[12.5px] font-medium text-[#8a8273] hover:text-[#15463b] transition-colors cursor-pointer bg-transparent border-none py-1"
            >
              Skip for now
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
