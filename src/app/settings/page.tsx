"use client";

import { useState } from "react";
import SettingsTabNav from "../../components/settings/SettingsTabNav";
import AccountInfoPanel from "../../components/settings/AccountInfoPanel";
import BusinessProfilesPanel from "../../components/settings/BusinessProfilesPanel";
import VoiceKeywordSetup from "../../components/blogs/VoiceKeywordSetup";
import BlogGenerationPanel from "../../components/settings/BlogGenerationPanel";
import IntegrationsPanel from "../../components/settings/IntegrationsPanel";
import SecurityApiPanel from "../../components/settings/SecurityApiPanel";
import RadiusCrawlersPanel from "../../components/settings/RadiusCrawlersPanel";

export default function SettingsPage() {
  const [activeSub, setActiveSub] = useState("account");

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
