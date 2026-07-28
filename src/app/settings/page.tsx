"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import SettingsTabNav from "../../components/settings/SettingsTabNav";
import AccountInfoPanel from "../../components/settings/AccountInfoPanel";
import BusinessProfilesPanel from "../../components/settings/BusinessProfilesPanel";
import VoiceKeywordSetup from "../../components/settings/VoiceKeywordSetup";
import BlogGenerationPanel from "../../components/settings/BlogGenerationPanel";
import IntegrationsPanel from "../../components/settings/IntegrationsPanel";
import SecurityApiPanel from "../../components/settings/SecurityApiPanel";
import RadiusCrawlersPanel from "../../components/settings/RadiusCrawlersPanel";

function SettingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeSub, setActiveSub] = useState("account");

  useEffect(() => {
    if (tabParam === "voice" || tabParam === "keywords") {
      setActiveSub("voice");
    } else if (tabParam === "entity" || tabParam === "business") {
      setActiveSub("entity");
    } else if (tabParam === "blog-generation") {
      setActiveSub("blog-generation");
    }
  }, [tabParam]);

  return (
    <div className="space-y-6">
      <SettingsTabNav activeSub={activeSub} onSelectSub={setActiveSub} />

      {activeSub === "account" && <AccountInfoPanel />}
      {activeSub === "entity" && <BusinessProfilesPanel />}
      {activeSub === "voice" && <VoiceKeywordSetup />}
      {activeSub === "blog-generation" && <BlogGenerationPanel />}
      {activeSub === "integrations" && <IntegrationsPanel />}
      {activeSub === "security" && <SecurityApiPanel />}
      {activeSub === "crawlers" && <RadiusCrawlersPanel />}
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
