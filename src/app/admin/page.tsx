"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import AdminTabNav from "../../components/admin/AdminTabNav";
import AdminPageLoader from "../../components/admin/AdminPageLoader";
import AdminOverviewPanel from "../../components/admin/AdminOverviewPanel";
import AdminUsersPanel from "../../components/admin/AdminUsersPanel";
import AdminAiUsagePanel from "../../components/admin/AdminAiUsagePanel";

const VALID_TABS = new Set(["overview", "users", "ai-usage"]);

function normalizeTab(tab: string | null) {
  return tab && VALID_TABS.has(tab) ? tab : "overview";
}

function AdminContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSub = normalizeTab(searchParams.get("tab"));

  const handleSelectSub = (tab: string) => {
    router.push(`/admin?tab=${normalizeTab(tab)}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      <AdminTabNav activeSub={activeSub} onSelectSub={handleSelectSub} />

      <div key={activeSub}>
        {activeSub === "overview" && <AdminOverviewPanel />}
        {activeSub === "users" && <AdminUsersPanel />}
        {activeSub === "ai-usage" && <AdminAiUsagePanel />}
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminPageLoader />}>
      <AdminContent />
    </Suspense>
  );
}
