"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import SettingsTabNav from "../../components/settings/SettingsTabNav";
import AccountInfoPanel from "../../components/settings/AccountInfoPanel";
import BusinessProfilesPanel from "../../components/settings/BusinessProfilesPanel";
import VoiceKeywordSetup from "../../components/settings/VoiceKeywordSetup";
import BlogGenerationPanel from "../../components/settings/BlogGenerationPanel";
import IntegrationsPanel from "../../components/settings/IntegrationsPanel";
import SecurityApiPanel from "../../components/settings/SecurityApiPanel";
import RadiusCrawlersPanel from "../../components/settings/RadiusCrawlersPanel";
import { useBusiness } from "../../context/BusinessContext";

const TAB_ALIASES: Record<string, string> = {
  business: "entity",
  "business-profiles": "entity",
  keywords: "voice",
};

const VALID_TABS = new Set([
  "account",
  "entity",
  "voice",
  "blog-generation",
  "integrations",
  "security",
  "crawlers",
]);

function normalizeTab(tab: string | null) {
  if (!tab) return "account";
  const normalized = TAB_ALIASES[tab] || tab;
  return VALID_TABS.has(normalized) ? normalized : "account";
}

function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refetchBusinesses } = useBusiness();
  const tabParam = searchParams.get("tab");
  const activeSub = normalizeTab(tabParam);

  useEffect(() => {
    const canonicalTab = normalizeTab(tabParam);
    if (tabParam && tabParam !== canonicalTab) {
      router.replace(`/settings?tab=${canonicalTab}`, { scroll: false });
    }
  }, [router, tabParam]);

  useEffect(() => {
    refetchBusinesses();
  }, [activeSub, refetchBusinesses]);

  const handleSelectSub = (tab: string) => {
    const canonicalTab = normalizeTab(tab);
    router.push(`/settings?tab=${canonicalTab}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <SettingsTabNav activeSub={activeSub} onSelectSub={handleSelectSub} />

      <div key={activeSub}>
        {activeSub === "account" && <AccountInfoPanel />}
        {activeSub === "entity" && <BusinessProfilesPanel />}
        {activeSub === "voice" && <VoiceKeywordSetup />}
        {activeSub === "blog-generation" && <BlogGenerationPanel />}
        {activeSub === "integrations" && <IntegrationsPanel />}
        {activeSub === "security" && <SecurityApiPanel />}
        {activeSub === "crawlers" && <RadiusCrawlersPanel />}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-[13px] text-[#8a8273]">Loading Settings...</div>}>
      <SettingsContent />
    </Suspense>
  );
}
