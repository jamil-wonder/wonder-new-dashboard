"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Globe, ArrowRight, ArrowLeft, Pencil, Check, Plus, X, RefreshCw, ChevronDown } from "lucide-react";
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

const CATEGORY_OPTIONS = [
  "Restaurant & Food",
  "Hotel & Hospitality",
  "Retail & Shopping",
  "Healthcare & Medical",
  "Legal Services",
  "Real Estate",
  "Home Services",
  "Automotive",
  "Beauty & Personal Care",
  "Fitness & Wellness",
  "Professional Services",
  "Education & Training",
  "Technology & Software",
  "Financial Services",
  "Construction & Contracting",
  "Entertainment & Events",
  "Travel & Tourism",
  "Nonprofit & Community",
  "Other",
];

// Tap-to-select chip list, backed by a plain comma-separated string value
// (matches what the save payload and the rest of the app already expect).
// The tappable options themselves come from a real AI suggestion call
// tailored to this specific business — not a generic list that's the same
// for a law firm and a taco truck — with free-text add as the escape
// hatch for anything the suggestions missed.
function ChipPicker({
  options,
  value,
  onChange,
  placeholder,
}: {
  options: string[];
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}) {
  const [customInput, setCustomInput] = useState("");
  const selected = useMemo(
    () => value.split(",").map((s) => s.trim()).filter(Boolean),
    [value]
  );

  const toggle = (item: string) => {
    const has = selected.some((s) => s.toLowerCase() === item.toLowerCase());
    const next = has
      ? selected.filter((s) => s.toLowerCase() !== item.toLowerCase())
      : [...selected, item];
    onChange(next.join(", "));
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!selected.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      onChange([...selected, trimmed].join(", "));
    }
    setCustomInput("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.some((s) => s.toLowerCase() === opt.toLowerCase());
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`px-3 py-1.5 rounded-full text-[12.5px] font-medium border transition-colors cursor-pointer ${
                isSelected
                  ? "bg-[#15463b] border-[#15463b] text-white"
                  : "bg-[#fdfcf8] border-[#ece3d1] text-[#4a4437] hover:border-[#15463b]"
              }`}
            >
              {isSelected && <Check className="w-3 h-3 inline mr-1 -mt-0.5" />}
              {opt}
            </button>
          );
        })}
      </div>

      {selected.filter((s) => !options.some((opt) => opt.toLowerCase() === s.toLowerCase())).length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1 border-t border-[#efe7d6]">
          {selected
            .filter((s) => !options.some((opt) => opt.toLowerCase() === s.toLowerCase()))
            .map((custom) => (
              <span
                key={custom}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium bg-[#eef3f0] border border-[#d0e4d6] text-[#15463b]"
              >
                {custom}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((s) => s !== custom).join(", "))}
                  className="cursor-pointer text-[#8a8273] hover:text-[#b1442a]"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
        </div>
      )}

      <div className="flex gap-2 pt-1">
        <input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder={placeholder}
          className="flex-1 text-[13.5px] px-3 py-2 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
        />
        <button
          type="button"
          onClick={addCustom}
          className="shrink-0 px-3 py-2 rounded-lg border border-[#ece3d1] text-[#15463b] hover:bg-[#eef3f0] transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SuggestingPlaceholder() {
  return (
    <div className="flex items-center gap-2 text-[13.5px] text-[#8a8273] py-6 justify-center">
      <Loader2 className="w-4 h-4 animate-spin" /> Analyzing your business…
    </div>
  );
}

function RegenerateLink({ isSuggesting, onClick }: { isSuggesting: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isSuggesting}
      className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#15463b] hover:underline cursor-pointer bg-transparent border-none disabled:opacity-50 disabled:cursor-default"
    >
      <RefreshCw className={`w-3 h-3 ${isSuggesting ? "animate-spin" : ""}`} />
      {isSuggesting ? "Regenerating…" : "Regenerate with AI"}
    </button>
  );
}

// AI-suggested text field that starts in a clearly-labeled "suggested"
// preview state and only becomes editable once the user taps Edit — the
// point isn't that the value is hidden, it's that accepting vs changing it
// is an explicit action, not something that happens by silently landing in
// an already-editable textarea the user might not even notice was pre-filled.
function AcceptOrEditText({
  value,
  onChange,
  rows = 3,
  placeholder,
  suggested,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder: string;
  suggested: boolean;
}) {
  const [editing, setEditing] = useState(!suggested);

  if (!editing) {
    return (
      <div className="border border-[#d0e4d6] bg-[#eef3f0] rounded-xl p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="font-mono-spline text-[10px] uppercase tracking-wider text-[#1e7d4f] font-semibold">
            AI-suggested from your site
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#15463b] hover:underline cursor-pointer bg-transparent border-none"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>
        <p className="text-[13.5px] text-[#2c2821] leading-relaxed whitespace-pre-wrap">
          {value || <span className="text-[#9b927f] italic">Nothing found — add this yourself.</span>}
        </p>
      </div>
    );
  }

  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      autoFocus
      placeholder={placeholder}
      className="w-full text-[14px] p-3 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none resize-none focus:border-[#15463b] transition-colors"
    />
  );
}

function CategoryDropdown({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        autoFocus
        className="w-full flex items-center justify-between gap-2 text-[14px] p-3 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors cursor-pointer text-left"
      >
        <span className={value ? "text-[#23211b]" : "text-[#9b927f]"}>
          {value || "Select a category…"}
        </span>
        <ChevronDown className={`w-4 h-4 text-[#9b927f] shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-20 mt-1.5 w-full max-h-64 overflow-y-auto bg-white border border-[#ece3d1] rounded-xl shadow-[0_12px_28px_rgba(21,70,59,0.14)] py-1.5"
          >
            {options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 text-left text-[13.5px] px-3.5 py-2.5 cursor-pointer transition-colors ${
                  opt === value ? "bg-[#eef3f0] text-[#15463b] font-semibold" : "text-[#4a4437] hover:bg-[#f6f3ec]"
                }`}
              >
                {opt}
                {opt === value && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type StepId =
  | "url"
  | "name"
  | "category"
  | "location"
  | "description"
  | "aiDescription"
  | "services"
  | "audience"
  | "ratios";

const STEP_ORDER: StepId[] = [
  "name",
  "category",
  "location",
  "description",
  "aiDescription",
  "services",
  "audience",
  "ratios",
];

// One simple step after signup: give us your URL, we scrape what we can
// (name, description, an address if the site has one) and pre-fill it —
// same /api/scrape the Analyser already uses, no separate scraper to
// maintain. Category, services, and target audience have no reliable
// auto-extraction, so those stay pick-don't-type instead of guessed.
//
// One question per screen, progress bar, never a long form — per the
// platform-flow spec (Part 2). The URL step is its own screen before the
// wizard starts since it's what unlocks every later step's pre-fill.
export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Settings > Business Profiles' "Add Profile" button sends existing
  // users here with ?add=1 to add a second/third business through this
  // same well-designed, one-step-at-a-time wizard, instead of the crude
  // all-fields-at-once form it used to open locally. Without this flag,
  // the redirect guard below (meant for "you already onboarded, skip
  // straight to your dashboard") would immediately bounce them back out
  // before they could add anything.
  const isAddingAnother = searchParams?.get("add") === "1";
  const { businesses, hasLoadedOnce, refetchBusinesses } = useBusiness();
  const { showToast } = useToast();

  const [stepIndex, setStepIndex] = useState(-1); // -1 = url step, 0..n = STEP_ORDER
  const [url, setUrl] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [name, setName] = useState("");
  const [nameWasSuggested, setNameWasSuggested] = useState(false);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [locationWasSuggested, setLocationWasSuggested] = useState(false);
  const [description, setDescription] = useState("");
  const [descriptionWasSuggested, setDescriptionWasSuggested] = useState(false);
  const [aiDescription, setAiDescription] = useState("");
  const [aiDescriptionWasSuggested, setAiDescriptionWasSuggested] = useState(false);
  const [services, setServices] = useState("");
  const [suggestedServices, setSuggestedServices] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState("");
  const [suggestedAudience, setSuggestedAudience] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [qg, setQg] = useState<QG>(DEFAULT_QG);
  const qgTotal = qg.branded + qg.nonBranded + qg.localSeo + qg.broadSeo;

  const faviconUrl = useMemo(() => {
    if (!url) return null;
    try {
      const hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    } catch {
      return null;
    }
  }, [url]);

  const updateQG = (key: keyof QG, raw: string) => {
    setQg((cur) => ({ ...cur, [key]: Math.max(0, Math.min(20, Number(raw) || 0)) }));
  };

  // One real AI call analyzing this specific business — replaces
  // description/AI description/services/audience being either blank or
  // (for services/audience) a generic hardcoded list that's the same
  // regardless of what the business actually is. Fired once right after
  // the URL is known, and again on demand via each step's Regenerate.
  const fetchSuggestions = async (targetUrl: string, targetName: string, targetScrapedDesc: string) => {
    if (!targetUrl) return;
    setIsSuggesting(true);
    try {
      const res = await fetchApi<any>("/api/onboarding/suggestions", {
        method: "POST",
        body: JSON.stringify({
          url: targetUrl,
          businessName: targetName,
          category,
          location,
          scrapedDescription: targetScrapedDesc,
        }),
      });
      if (res?.businessDescription) {
        setDescription(res.businessDescription);
        setDescriptionWasSuggested(true);
      }
      if (res?.aiDescription) {
        setAiDescription(res.aiDescription);
        setAiDescriptionWasSuggested(true);
      }
      if (Array.isArray(res?.services) && res.services.length > 0) setSuggestedServices(res.services);
      if (Array.isArray(res?.targetAudience) && res.targetAudience.length > 0) setSuggestedAudience(res.targetAudience);
    } catch {
      // Non-fatal — every one of these fields is still editable manually,
      // so a failed suggestion call just means starting from blank/scraped
      // text instead of AI-tailored text, not a dead end.
    } finally {
      setIsSuggesting(false);
    }
  };

  // Existing users going through OTP for a routine login (not first-time
  // signup) already have a business — send them straight through instead
  // of onboarding again every time they log in.
  useEffect(() => {
    if (isAddingAnother) return;
    if (hasLoadedOnce && businesses.length > 0) {
      router.replace("/overview");
    }
  }, [hasLoadedOnce, businesses.length, router, isAddingAnother]);

  // A visitor who already ran the free /scan preview and then created an
  // account shouldn't be asked to paste their URL again or wait through
  // another crawl — /scan's "Create free account" button stashes what it
  // already found here, one-time-use, so onboarding can pick up right
  // where the preview left off instead of starting cold.
  useEffect(() => {
    if (stepIndex !== -1) return;
    let prefill: any = null;
    try {
      const raw = localStorage.getItem("wonder_scan_prefill");
      if (raw) prefill = JSON.parse(raw);
    } catch {}
    if (!prefill?.url) return;
    localStorage.removeItem("wonder_scan_prefill");

    setUrl(prefill.url);
    if (prefill.businessName) {
      setName(prefill.businessName);
      setNameWasSuggested(true);
    }
    if (prefill.location) {
      setLocation(prefill.location);
      setLocationWasSuggested(true);
    }
    if (prefill.description) {
      setDescription(prefill.description);
      setDescriptionWasSuggested(true);
    }
    setStepIndex(0);
    fetchSuggestions(prefill.url, prefill.businessName || "", prefill.description || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIndex]);

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setErrorMsg("");
    setIsFetching(true);
    const cleanUrl = url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`;
    try {
      // record_scan: false — this is a background prefill crawl to
      // autofill name/description/location, not a user-requested Analyzer
      // run. Without this flag, a brand-new business showed up on the
      // Dashboard already "scanned" the moment onboarding finished, even
      // though the user never opened the Analyzer tab themselves.
      const res = await fetchApi<any>("/api/scrape", {
        method: "POST",
        body: JSON.stringify({ url: cleanUrl, record_scan: false }),
      });
      const scrapedName = res?.businessName || "";
      const scrapedDesc = res?.description || "";
      const scrapedLocation = Array.isArray(res?.addresses) && res.addresses[0] ? res.addresses[0] : "";
      setName(scrapedName);
      setNameWasSuggested(Boolean(scrapedName));
      setDescription(scrapedDesc);
      setDescriptionWasSuggested(Boolean(scrapedDesc));
      setLocation(scrapedLocation);
      setLocationWasSuggested(Boolean(scrapedLocation));
      setUrl(cleanUrl);
      setStepIndex(0);
      fetchSuggestions(cleanUrl, scrapedName, scrapedDesc);
    } catch (err: any) {
      // A failed scrape shouldn't dead-end signup — fall through to the
      // same manual-entry steps, just empty, with an honest note why.
      setErrorMsg("Couldn't reach that website automatically — you can still fill in the details yourself.");
      setUrl(cleanUrl);
      setStepIndex(0);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
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

  const currentStep = stepIndex >= 0 ? STEP_ORDER[stepIndex] : "url";
  const totalSteps = STEP_ORDER.length;

  const canAdvance = (): boolean => {
    if (currentStep === "name") return name.trim().length > 0;
    return true;
  };

  const goNext = () => {
    if (!canAdvance()) {
      setErrorMsg("Give your business a name.");
      return;
    }
    setErrorMsg("");
    if (stepIndex >= totalSteps - 1) {
      handleSave();
      return;
    }
    setStepIndex((i) => i + 1);
  };

  const goBack = () => {
    setErrorMsg("");
    setStepIndex((i) => Math.max(0, i - 1));
  };

  if (!hasLoadedOnce) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#15463b]" />
      </div>
    );
  }

  const stepTitles: Record<StepId, { title: string; sub: string }> = {
    url: { title: "Add your business", sub: "Enter your website and we'll pull in what we can find automatically." },
    name: { title: "What's your business called?", sub: "We found this on your site — keep it or fix it." },
    category: { title: "What category best fits?", sub: "Pick the closest match." },
    location: { title: "Where are you based?", sub: "We found this on your site — confirm or update it." },
    description: { title: "How would you describe the business?", sub: "A short, plain-English summary." },
    aiDescription: { title: "Anything AI models should know?", sub: "Extra context to help AI describe you accurately (optional)." },
    services: { title: "What services do you offer?", sub: "Tap to select, or add your own." },
    audience: { title: "Who's your target audience?", sub: "Tap to select, or add your own." },
    ratios: { title: "Question mix", sub: "How should your 20 tracked questions be split?" },
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-[560px] bg-white border border-[#ece3d1] rounded-[24px] p-6 md:p-8"
      >
        <div className="w-12 h-12 rounded-2xl bg-[#15463b] flex items-center justify-center mb-4">
          <WonderscoreLogo size={26} color="white" />
        </div>

        {stepIndex >= 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-mono-spline text-[10px] uppercase tracking-wider text-[#8a8273]">
                Step {stepIndex + 1} of {totalSteps}
              </span>
            </div>
            <div className="h-1.5 w-full bg-[#f0ebe0] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#15463b] rounded-full"
                initial={false}
                animate={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
                transition={{ duration: 0.25 }}
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            <h1 className="font-spectral text-[22px] font-semibold text-[#15463b]">
              {stepTitles[currentStep].title}
            </h1>
            <p className="text-[13.5px] text-[#8a8273] mt-1.5 leading-relaxed">
              {stepTitles[currentStep].sub}
            </p>

            {errorMsg && (
              <div className="mt-4 p-3 bg-[#fdf2f0] border border-[#f6dcd5] rounded-xl text-[12.5px] font-medium text-[#b1442a]">
                {errorMsg}
              </div>
            )}

            <div className="mt-6">
              {currentStep === "url" && (
                <form onSubmit={handleFetch} className="space-y-4">
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
                </form>
              )}

              {currentStep === "name" && (
                <div className="flex items-center gap-3">
                  {faviconUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={faviconUrl}
                      alt=""
                      className="w-9 h-9 rounded-lg border border-[#ece3d1] bg-white shrink-0 object-contain p-1"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    {nameWasSuggested ? (
                      <AcceptOrEditText
                        value={name}
                        onChange={setName}
                        rows={1}
                        placeholder="Acme Inc."
                        suggested
                      />
                    ) : (
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                        placeholder="Acme Inc."
                        className="w-full text-[14px] p-3 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
                      />
                    )}
                  </div>
                </div>
              )}

              {currentStep === "category" && (
                <CategoryDropdown value={category} onChange={setCategory} options={CATEGORY_OPTIONS} />
              )}

              {currentStep === "location" && (
                locationWasSuggested ? (
                  <AcceptOrEditText
                    value={location}
                    onChange={setLocation}
                    rows={1}
                    placeholder="Austin, TX"
                    suggested
                  />
                ) : (
                  <input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    autoFocus
                    placeholder="e.g. Austin, TX"
                    className="w-full text-[14px] p-3 border border-[#ece3d1] rounded-xl bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors"
                  />
                )
              )}

              {currentStep === "description" && (
                isSuggesting && !description ? (
                  <SuggestingPlaceholder />
                ) : (
                  <>
                    <AcceptOrEditText
                      value={description}
                      onChange={setDescription}
                      rows={4}
                      placeholder="What does this business do?"
                      suggested={descriptionWasSuggested}
                    />
                    <RegenerateLink isSuggesting={isSuggesting} onClick={() => fetchSuggestions(url, name, description)} />
                  </>
                )
              )}

              {currentStep === "aiDescription" && (
                isSuggesting && !aiDescription ? (
                  <SuggestingPlaceholder />
                ) : (
                  <>
                    <AcceptOrEditText
                      value={aiDescription}
                      onChange={setAiDescription}
                      rows={4}
                      placeholder="e.g. We specialize in same-day emergency repairs and family-owned service since 1998…"
                      suggested={aiDescriptionWasSuggested}
                    />
                    <RegenerateLink isSuggesting={isSuggesting} onClick={() => fetchSuggestions(url, name, description)} />
                  </>
                )
              )}

              {currentStep === "services" && (
                isSuggesting && suggestedServices.length === 0 ? (
                  <SuggestingPlaceholder />
                ) : (
                  <>
                    <ChipPicker
                      options={suggestedServices}
                      value={services}
                      onChange={setServices}
                      placeholder="Add a service we didn't list…"
                    />
                    <RegenerateLink isSuggesting={isSuggesting} onClick={() => fetchSuggestions(url, name, description)} />
                  </>
                )
              )}

              {currentStep === "audience" && (
                isSuggesting && suggestedAudience.length === 0 ? (
                  <SuggestingPlaceholder />
                ) : (
                  <>
                    <ChipPicker
                      options={suggestedAudience}
                      value={targetAudience}
                      onChange={setTargetAudience}
                      placeholder="Add an audience we didn't list…"
                    />
                    <RegenerateLink isSuggesting={isSuggesting} onClick={() => fetchSuggestions(url, name, description)} />
                  </>
                )
              )}

              {currentStep === "ratios" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-end">
                    <span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-lg ${qgTotal === 20 ? "bg-[#dcefe2] text-[#1e7d4f]" : "bg-[#f7e7c4] text-[#9a6a12]"}`}>
                      {qgTotal}/20
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <QGSlider label="Branded" desc="Uses business name." value={qg.branded} onChange={(v) => updateQG("branded", v)} />
                    <QGSlider label="Non-Branded" desc="Category searches." value={qg.nonBranded} onChange={(v) => updateQG("nonBranded", v)} />
                    <QGSlider label="Local SEO" desc="Location-focused." value={qg.localSeo} onChange={(v) => updateQG("localSeo", v)} />
                    <QGSlider label="Broad SEO" desc="Nearby-area searches." value={qg.broadSeo} onChange={(v) => updateQG("broadSeo", v)} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {stepIndex >= 0 && (
          <div className="mt-6 flex items-center gap-3">
            {stepIndex > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="shrink-0 w-11 h-11 rounded-xl border border-[#ece3d1] text-[#15463b] hover:bg-[#eef3f0] transition-colors cursor-pointer flex items-center justify-center"
              >
                <ArrowLeft className="w-4.5 h-4.5" />
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              disabled={isSaving}
              className="flex-1 py-3.5 bg-[#15463b] text-white text-[14px] font-bold rounded-xl hover:bg-[#1a5c44] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4.5 h-4.5 animate-spin" />
              ) : stepIndex >= totalSteps - 1 ? (
                <>
                  Save and continue
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4.5 h-4.5" />
                </>
              )}
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleSkip}
          className="w-full text-center text-[12.5px] font-medium text-[#8a8273] hover:text-[#15463b] transition-colors cursor-pointer bg-transparent border-none py-1 mt-3"
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );
}
