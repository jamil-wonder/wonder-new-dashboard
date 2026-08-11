"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { fetchApi } from "../../lib/api";
import { getFeatureMeta, getModelMeta } from "../../lib/aiUsageLabels";
import type { AdminStats } from "../../lib/adminTypes";
import { AdminSectionLoader } from "./AdminPageLoader";

function StatCard({
  iconPath,
  label,
  value,
  accent,
}: {
  iconPath: string;
  label: string;
  value: string | number;
  accent?: "amber" | "red";
}) {
  const accentColor = accent === "amber" ? "#9a6a12" : accent === "red" ? "#b1442a" : "#15463b";
  const accentBg = accent === "amber" ? "#f7e7c4" : accent === "red" ? "#f6dcd5" : "#eef3f0";

  return (
    <div className="bg-white border border-[#ece3d1] rounded-2xl p-5 flex items-start gap-3.5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: accentBg }}>
        <Image src={iconPath} alt={label} width={20} height={20} className="w-5 h-5" style={{ filter: `brightness(0) saturate(100%)`, opacity: 0.82 }} />
      </div>
      <div className="min-w-0">
        <div className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f]">{label}</div>
        <div className="num font-spectral text-[26px] font-semibold text-[#23211b] mt-0.5 leading-none" style={{ color: accentColor }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function BreakdownItem({ rawKey, value, max, kind }: { rawKey: string; value: number; max: number; kind: "feature" | "model" }) {
  const meta = kind === "feature" ? getFeatureMeta(rawKey) : getModelMeta(rawKey);
  const percent = Math.max(4, (value / max) * 100);

  return (
    <div className="flex items-center gap-3 min-h-[44px]">
      {meta.icon ? (
        <Image src={meta.icon} alt={meta.label} width={26} height={26} className="w-[26px] h-[26px] shrink-0 object-contain" />
      ) : (
        <div className="w-[26px] h-[26px] shrink-0 rounded-full bg-[#e5ddd0] flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-[#9b927f]" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-medium text-[#3a352b] truncate mb-1">{meta.label}</div>
        <div className="w-full h-1.5 bg-[#e5ddd0] rounded-full overflow-hidden">
          <div className="h-full bg-[#15463b] rounded-full transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>
      <div className="num font-bold text-[#15463b] text-[13px] shrink-0 w-10 text-right">{value}</div>
    </div>
  );
}

export default function AdminOverviewPanel() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [byFeature, setByFeature] = useState<Record<string, number>>({});
  const [byModel, setByModel] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetchApi<{ stats: AdminStats }>("/api/admin/stats");
        if (res?.stats) setStats(res.stats);

        const aiRes = await fetchApi<{ summary: { by_feature: Record<string, number>; by_model: Record<string, number> } }>(
          "/api/admin/ai-usage?limit=3000"
        );
        if (aiRes?.summary) {
          setByFeature(aiRes.summary.by_feature || {});
          setByModel(aiRes.summary.by_model || {});
        }
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <AdminSectionLoader label="Loading dashboard..." />;
  }

  const featureRows = Object.entries(byFeature).sort((a, b) => b[1] - a[1]);
  const modelRows = Object.entries(byModel).sort((a, b) => b[1] - a[1]);
  const maxFeature = Math.max(1, ...featureRows.map(([, v]) => v));
  const maxModel = Math.max(1, ...modelRows.map(([, v]) => v));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard iconPath="/icons/sidebar/user.svg" label="Total users" value={stats?.total_users || 0} />
        <StatCard iconPath="/icons/sidebar/shield.svg" label="Admins" value={stats?.admin_count || 0} />
        <StatCard iconPath="/icons/sidebar/shield.svg" label="Banned" value={stats?.banned_count || 0} accent={stats && stats.banned_count > 0 ? "red" : undefined} />
        <StatCard iconPath="/icons/sidebar/analytics.svg" label="Email verified" value={stats?.verified_count || 0} />
        <StatCard iconPath="/icons/sidebar/business.svg" label="Saved businesses" value={stats?.total_businesses || 0} />
        <StatCard iconPath="/icons/sidebar/history.svg" label="Scans this week" value={stats?.scans_this_week || 0} />
        <StatCard iconPath="/icons/sidebar/ai.svg" label="AI calls today" value={stats?.ai_calls_today || 0} accent="amber" />
        <StatCard iconPath="/icons/sidebar/ai.svg" label="AI calls this week" value={stats?.ai_calls_this_week || 0} accent="amber" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white border border-[#ece3d1] rounded-2xl p-5">
          <div className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] mb-4 font-semibold">Usage by feature</div>
          <div className="space-y-3.5">
            {featureRows.length === 0 && <div className="text-[12.5px] text-[#8a8273] py-4 text-center">No AI usage recorded yet.</div>}
            {featureRows.map(([key, value]) => (
              <BreakdownItem key={key} rawKey={key} value={value} max={maxFeature} kind="feature" />
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#ece3d1] rounded-2xl p-5">
          <div className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] mb-4 font-semibold">Usage by model</div>
          <div className="space-y-3.5">
            {modelRows.length === 0 && <div className="text-[12.5px] text-[#8a8273] py-4 text-center">No AI usage recorded yet.</div>}
            {modelRows.map(([key, value]) => (
              <BreakdownItem key={key} rawKey={key} value={value} max={maxModel} kind="model" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
