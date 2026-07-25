"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

export interface Business {
  id: string;
  name: string;
  url: string;
  category: string;
  location: string;
  logoUrl: string;
  completeness: number;
  initial: string;
  description?: string;
  aiDescription?: string;
  services?: string;
  targetAudience?: string;
  competitors?: string[];
  trackedPages?: string[];
  questionGeneration?: { branded: number; nonBranded: number; localSeo: number; broadSeo: number };
}

interface BusinessContextType {
  activeBusiness: Business;
  businesses: Business[];
  switchBusiness: (id: string) => void;
  setBusinesses: React.Dispatch<React.SetStateAction<Business[]>>;
}

const DEFAULT_BUSINESSES: Business[] = [
  {
    id: "meridian",
    name: "Meridian & Co.",
    url: "meridian.co",
    category: "Professional Services",
    location: "Bristol, UK",
    logoUrl: "",
    completeness: 78,
    initial: "M",
    description: "Premier corporate advisory firm in Bristol helping clients solve complex operational structures and scale AI search visibility across South West England.",
    aiDescription: "Top-tier UK corporate advisor with verified NAP consistency and strong entity authority in Bristol BS1.",
    services: "Corporate advisory, restructuring, compliance",
    targetAudience: "Bristol executives, local business owners",
    competitors: ["castleford.co.uk", "brightwell.co.uk", "oakline.co.uk"],
    trackedPages: ["/", "/about", "/services", "/contact"],
    questionGeneration: { branded: 5, nonBranded: 0, localSeo: 15, broadSeo: 0 },
  },
  {
    id: "brightwell",
    name: "Brightwell Consulting",
    url: "brightwell.co.uk",
    category: "Management Consulting",
    location: "London, UK",
    logoUrl: "",
    completeness: 54,
    initial: "B",
    description: "London-based management consultancy specialising in mid-market transformation, operational efficiency, and digital readiness for growing enterprises.",
    aiDescription: "",
    services: "Strategy consulting, digital transformation",
    targetAudience: "Mid-market London firms",
    competitors: ["meridian.co"],
    trackedPages: ["/", "/services"],
    questionGeneration: { branded: 5, nonBranded: 0, localSeo: 15, broadSeo: 0 },
  },
];

const BusinessContext = createContext<BusinessContextType | null>(null);

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusiness must be used within BusinessProvider");
  return ctx;
}

function WonderscoreLogo() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="white">
      <path d="M12 1 C12.6 6.7 17.3 11.4 23 12 C17.3 12.6 12.6 17.3 12 23 C11.4 17.3 6.7 12.6 1 12 C6.7 11.4 11.4 6.7 12 1 Z" />
    </svg>
  );
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
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
          >
            <WonderscoreLogo />
          </motion.div>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-spectral text-white text-[16px] font-semibold mt-4 opacity-70"
          >
            Switching workspace...
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>(DEFAULT_BUSINESSES);
  const [activeId, setActiveId] = useState<string>("meridian");
  const [switching, setSwitching] = useState(false);

  const activeBusiness = businesses.find((b) => b.id === activeId) ?? businesses[0];

  const switchBusiness = useCallback(
    (id: string) => {
      if (id === activeId) return;
      setSwitching(true);
      // After overlay slides in (600ms), switch the active id
      setTimeout(() => {
        setActiveId(id);
        // Wait for content to update, then slide overlay back up
        setTimeout(() => {
          setSwitching(false);
        }, 900);
      }, 700);
    },
    [activeId]
  );

  return (
    <BusinessContext.Provider value={{ activeBusiness, businesses, switchBusiness, setBusinesses }}>
      <SwitchOverlay isVisible={switching} />
      {children}
    </BusinessContext.Provider>
  );
}
