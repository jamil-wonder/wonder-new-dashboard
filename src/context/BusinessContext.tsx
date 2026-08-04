"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { fetchApi, getActiveBusinessId, setActiveBusinessId } from "../lib/api";
import { WonderscoreSpinner } from "../components/ui/WonderscoreSpinner";
import { useUser } from "./UserContext";

export interface Business {
  id: string;
  name: string;
  url: string;
  category: string;
  location: string;
  logoUrl: string;
  completeness: number;
  initial: string;
  isUserEdited?: boolean;
  description?: string;
  aiDescription?: string;
  services?: string;
  targetAudience?: string;
  competitors?: string[];
  trackedPages?: string[];
  questionGeneration?: { branded: number; nonBranded: number; localSeo: number; broadSeo: number };
  blogVoice?: string;
  blogKeywords?: string[];
}

interface BusinessContextType {
  activeBusiness: Business;
  businesses: Business[];
  isLoading: boolean;
  // True once the FIRST business fetch for the current identity has
  // finished (success or failure) — distinct from isLoading, which flips
  // true again on every routine refetch (e.g. Settings refetches on tab
  // change). Consumers that gate whole-page rendering should key off this,
  // not isLoading, or a page whose own effect refetches on mount will
  // unmount itself the moment it mounts and loop forever.
  hasLoadedOnce: boolean;
  switchBusiness: (id: string) => void;
  updateActiveBusiness: (updates: Partial<Business>) => void;
  setBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
  refetchBusinesses: () => Promise<void>;
  // In-memory only (never written to storage) result of the current
  // browsing session's most recent completed Query run for the active
  // business — lives here (above the router) so it survives navigating
  // away from and back to the Query page, without ever being "stored
  // data" in the sense of surviving a business switch, logout, or reload.
  liveDeepCompetitors: any[];
  setLiveDeepCompetitors: React.Dispatch<React.SetStateAction<any[]>>;
}

export function isDomainString(str: string): boolean {
  if (!str) return false;
  const lower = str.toLowerCase().trim();
  return (
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    /\.(co\.uk|com|org|net|co|io|ai|gov|edu|biz|info|us|uk|ca|de|fr)$/.test(lower.replace(/\/.*$/, ""))
  );
}

export function isGenericName(str: string): boolean {
  if (!str) return true;
  const lower = str.toLowerCase().trim();
  return lower === "my business" || lower === "business" || lower === "default" || isDomainString(lower);
}

export function cleanBrandNameFromDomain(domainStr: string): string {
  if (!domainStr) return "The Gallivant";
  let clean = domainStr.replace(/^https?:\/\//i, "").replace(/^www\./i, "").replace(/\/.*$/, "");
  clean = clean.replace(/\.(co\.uk|com|org|net|co|io|ai|gov|edu|biz|info|us|uk|ca|de|fr)$/i, "");
  if (!clean) return "My Business";
  return clean
    .split(/[-_.]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Deliberate, narrow exception to "never cache competitors": sessionStorage
// (not localStorage) — survives a page reload / remount within this tab,
// but is gone the moment the tab/window closes, and is already swept on
// every logout (see UserContext.logout(), which clears all wonder_-
// prefixed sessionStorage keys) and re-keyed per business domain, so it
// can never leak between accounts or between businesses.
function cleanUrlForKey(url?: string): string {
  return (url || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

function loadLiveCompetitorsFromSession(url?: string): any[] {
  if (typeof window === "undefined" || !url) return [];
  try {
    const raw = sessionStorage.getItem(`wonder_live_competitors_${cleanUrlForKey(url)}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLiveCompetitorsToSession(url: string | undefined, data: any[]) {
  if (typeof window === "undefined" || !url) return;
  try {
    const key = `wonder_live_competitors_${cleanUrlForKey(url)}`;
    if (Array.isArray(data) && data.length > 0) {
      sessionStorage.setItem(key, JSON.stringify(data));
    } else {
      sessionStorage.removeItem(key);
    }
  } catch {}
}

export function getCachedScoreForDomain(url: string): number | null {
  if (typeof window === "undefined" || !url) return null;
  const clean = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const cacheKey = `wonder_analyser_cache_${clean}`;
  try {
    const raw = localStorage.getItem(cacheKey) || sessionStorage.getItem(cacheKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.scanData && typeof parsed.scanData.scores?.total === "number") {
      return parsed.scanData.scores.total;
    }
  } catch {}
  return null;
}

const DEFAULT_BUSINESSES: Business[] = [
  {
    id: "gallivant",
    name: "The Gallivant",
    url: "https://thegallivant.co.uk/",
    category: "Restaurant & Hotel",
    location: "Camber, Rye, UK",
    logoUrl: "https://bunny-wp-pullzone-fg2nucp9oh.b-cdn.net/wp-content/uploads/2022/04/gallivant-logo-yoga.svg",
    completeness: 0,
    initial: "T",
    isUserEdited: true,
    description: "Boutique coastal hotel and Michelin Key restaurant in Camber Sands near Rye.",
    aiDescription: "Thoughtful luxury, soulful dining, beach house styling, and coastal wellness.",
    services: "Dining, Accommodation, Private Events",
    targetAudience: "Food enthusiasts, coastal travelers, local executives",
    competitors: ["cornusrestaurant.co.uk", "castleford.co.uk"],
    trackedPages: ["/", "/dining", "/rooms"],
    questionGeneration: { branded: 5, nonBranded: 5, localSeo: 5, broadSeo: 5 },
  },
  {
    id: "meridian",
    name: "Meridian Navigation",
    url: "https://meridian.co/",
    category: "Professional Services",
    location: "Bristol, UK",
    logoUrl: "",
    completeness: 0,
    initial: "M",
    isUserEdited: true,
    description: "Premier corporate advisory firm in Bristol helping clients solve complex operational structures.",
    aiDescription: "Top-tier UK corporate advisor with verified NAP consistency and strong entity authority.",
    services: "Corporate advisory, restructuring, compliance",
    targetAudience: "Bristol executives, local business owners",
    competitors: ["castleford.co.uk", "brightwell.co.uk", "oakline.co.uk"],
    trackedPages: ["/", "/about", "/services", "/contact"],
    questionGeneration: { branded: 5, nonBranded: 0, localSeo: 15, broadSeo: 0 },
  },
  {
    id: "cornus",
    name: "Cornus",
    url: "https://cornusrestaurant.co.uk/",
    category: "Restaurant",
    location: "Central London, UK",
    logoUrl: "",
    completeness: 0,
    initial: "C",
    isUserEdited: true,
    description: "Fine dining restaurant in Belgravia, London.",
    aiDescription: "Michelin-caliber French and British fine dining in London.",
    services: "Dining, Private Events",
    targetAudience: "Fine dining enthusiasts, London executives",
    competitors: ["thegallivant.co.uk"],
    trackedPages: ["/"],
    questionGeneration: { branded: 5, nonBranded: 5, localSeo: 5, broadSeo: 5 },
  },
];

const BusinessContext = createContext<BusinessContextType | null>(null);

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
  return ctx;
}

function SwitchOverlay({ isVisible }: { isVisible: boolean }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="switch-overlay"
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center"
          style={{ background: "#15463b" }}
          initial={{ y: "-100%" }}
          animate={{ y: "0%" }}
          exit={{ y: "-100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 35 }}
        >
          <WonderscoreSpinner size={56} color="white" label="Switching workspace..." />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useUser();
  const [businesses, setBusinesses] = useState<Business[]>(DEFAULT_BUSINESSES);
  const [activeId, setActiveId] = useState<string>("gallivant");
  const [switching, setSwitching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [liveDeepCompetitors, setLiveDeepCompetitorsRaw] = useState<any[]>([]);
  const activeUrlRef = useRef<string | undefined>(undefined);

  // Every write also persists to this tab's sessionStorage, scoped to the
  // currently active business's domain, so it survives a reload/remount
  // instead of just living in memory.
  const setLiveDeepCompetitors = useCallback((value: React.SetStateAction<any[]>) => {
    setLiveDeepCompetitorsRaw((prev) => {
      const next = typeof value === "function" ? (value as (p: any[]) => any[])(prev) : value;
      saveLiveCompetitorsToSession(activeUrlRef.current, next);
      return next;
    });
  }, []);

  const fetchUserBusinesses = useCallback(async () => {
    try {
      setIsLoading(true);
      const apiData = await fetchApi<any[]>("/api/user/businesses");
      if (Array.isArray(apiData) && apiData.length > 0) {
        const mapped: Business[] = apiData.map((b) => {
          const rawDomain = b.domain || b.url || "";
          const cleanDomain = rawDomain.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
          
          // Read b.businessName first! (FastAPI backend uses businessName)
          let displayName = b.businessName || b.business_name || b.name || b.title;
          const isUserEdited = Boolean(b.is_user_edited || b.isUserEdited || (displayName && !isGenericName(displayName)));

          if (!displayName || isGenericName(displayName)) {
            displayName = cleanBrandNameFromDomain(cleanDomain || rawDomain);
          }

          const defaultMatch = DEFAULT_BUSINESSES.find(
            (d) => d.url === rawDomain || d.id === b.id || d.name.toLowerCase() === displayName.toLowerCase()
          );

          const cachedScore = getCachedScoreForDomain(rawDomain || (defaultMatch ? defaultMatch.url : ""));

          const finalScore =
            typeof cachedScore === "number" && cachedScore > 0
              ? cachedScore
              : typeof b.completeness === "number" && b.completeness > 0
              ? b.completeness
              : typeof b.phase1_score === "number" && b.phase1_score > 0
              ? b.phase1_score
              : 0;

          return {
            id: String(b.id || b._id || b.domain || displayName),
            name: displayName,
            url: rawDomain || "https://thegallivant.co.uk/",
            category: b.category || "Hospitality & Restaurant",
            location: b.location || "Camber, Rye, UK",
            logoUrl: b.logo_url || b.logoUrl || "",
            completeness: finalScore,
            initial: displayName.charAt(0).toUpperCase(),
            isUserEdited,
            description: b.description || "",
            aiDescription: b.ai_description || b.aiDescription || "",
            services: b.services || "",
            targetAudience: b.target_audience || b.targetAudience || "",
            competitors: b.competitors || [],
            trackedPages: b.tracked_pages || b.trackedPages || ["/"],
            questionGeneration: b.questionGeneration || b.question_generation || { branded: 5, nonBranded: 5, localSeo: 5, broadSeo: 5 },
          };
        });
        setBusinesses(mapped);

        const storedId = getActiveBusinessId();
        if (storedId && mapped.some((m) => m.id === storedId)) {
          setActiveId(storedId);
        } else if (mapped[0]) {
          setActiveId(mapped[0].id);
          setActiveBusinessId(mapped[0].id);
        }
      }
    } catch {
      // Keep state smooth
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
    }
  }, []);

  // Re-fetch (and, critically, reset first) whenever WHO is logged in
  // changes — not just on mount. Without this, logging out and back in as
  // a different account left the previous account's businesses sitting in
  // memory indefinitely, since nothing ever told this provider to refresh.
  const lastSeenIdentityRef = useRef<string | null>(null);
  useEffect(() => {
    const currentIdentity = isAuthenticated ? user?.id || user?.email || null : null;
    if (currentIdentity === lastSeenIdentityRef.current) return;
    lastSeenIdentityRef.current = currentIdentity;

    // Always clear first, even before fetching — a previous account's real
    // business data must never remain visible, not even for a moment.
    // Deliberately does NOT touch liveDeepCompetitors here: the hydration
    // effect below (keyed on activeBusiness?.url) is the single source of
    // truth for that value, and always re-derives it correctly once
    // activeBusiness resolves. Clearing it here as well doesn't just
    // duplicate that work — it actively wipes the sessionStorage-backed
    // data on every reload, since this effect necessarily fires once per
    // fresh mount even when it's the SAME account re-confirming its
    // session, not an actual account change (logout already sweeps
    // sessionStorage for the real account-switch case).
    setBusinesses(DEFAULT_BUSINESSES);
    setActiveId("gallivant");
    setHasLoadedOnce(false);

    if (currentIdentity) {
      fetchUserBusinesses();
    }
  }, [isAuthenticated, user?.id, user?.email, fetchUserBusinesses]);

  const activeBusiness = businesses.find((b) => b.id === activeId) ?? businesses[0];

  // Keep the ref in sync so setLiveDeepCompetitors always persists under
  // the CURRENT business's key, not a stale one from a prior render.
  useEffect(() => {
    activeUrlRef.current = activeBusiness?.url;
  }, [activeBusiness?.url]);

  // Hydrate from this tab's sessionStorage whenever the active business's
  // domain changes — this is what makes competitors survive a reload or an
  // unexpected remount instead of just resetting to empty.
  useEffect(() => {
    setLiveDeepCompetitorsRaw(loadLiveCompetitorsFromSession(activeBusiness?.url));
  }, [activeBusiness?.url]);

  const updateActiveBusiness = useCallback((updates: Partial<Business>) => {
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id === activeId || b.id === activeBusiness.id) {
          let newName = b.name;

          // 1. Manual user edit: always set name and mark isUserEdited = true
          if (updates.isUserEdited) {
            newName = updates.name && updates.name.trim() ? updates.name : b.name;
          } else if (updates.name && updates.name !== "My Business") {
            // 2. Automated Analyser / scraper update:
            // Overwrite ONLY if current name is generic/domain AND incoming name is a clean human brand name
            if (isGenericName(b.name) && !isDomainString(updates.name)) {
              newName = updates.name;
            }
            // If b.name is already a human brand name (e.g. "The Gallivant") or isUserEdited is true, KEEP b.name intact!
          }

          const userEditedFlag = updates.isUserEdited !== undefined ? updates.isUserEdited : b.isUserEdited;

          return {
            ...b,
            ...updates,
            name: newName,
            isUserEdited: userEditedFlag,
            initial: newName.charAt(0).toUpperCase(),
          };
        }
        return b;
      })
    );
  }, [activeId, activeBusiness.id]);

  const switchBusiness = useCallback(
    (id: string) => {
      if (id === activeId) return;
      setSwitching(true);
      setActiveBusinessId(id);
      // liveDeepCompetitors is intentionally left alone here — the
      // hydration effect (keyed on activeBusiness?.url) loads the correct
      // value for whichever business becomes active once activeId
      // updates below. Clearing it here would wipe THIS business's saved
      // sessionStorage entry via the wrapped setter, losing it even if
      // the user switches back later.

      // Phase 1: Slide overlay down to cover screen
      setTimeout(() => {
        // Phase 2: Switch active business state while hidden behind overlay
        setActiveId(id);

        // Phase 3: Reveal fresh updated workspace by sliding overlay back up
        setTimeout(() => {
          setSwitching(false);
        }, 450);
      }, 350);
    },
    [activeId]
  );

  return (
    <BusinessContext.Provider
      value={{
        activeBusiness,
        businesses,
        isLoading,
        hasLoadedOnce,
        switchBusiness,
        updateActiveBusiness,
        setBusinesses,
        refetchBusinesses: fetchUserBusinesses,
        liveDeepCompetitors,
        setLiveDeepCompetitors,
      }}
    >
      <SwitchOverlay isVisible={switching} />
      {children}
    </BusinessContext.Provider>
  );
}
