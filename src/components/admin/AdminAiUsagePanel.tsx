"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { fetchApi } from "../../lib/api";
import { getFeatureMeta, getModelMeta } from "../../lib/aiUsageLabels";
import type { AiUsageSummary, AiUsageEvent } from "../../lib/adminTypes";
import AdminPagination from "./AdminPagination";
import { AdminSectionLoader } from "./AdminPageLoader";

const PAGE_SIZE = 12;
const TOP_USERS_PAGE_SIZE = 10;

function SummaryCard({ iconPath, label, value }: { iconPath: string; label: string; value: string | number }) {
  return (
    <div className="bg-white border border-[#ece3d1] rounded-2xl p-5 flex items-center gap-3.5">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#eef3f0]">
        <Image src={iconPath} alt={label} width={20} height={20} className="w-5 h-5" style={{ opacity: 0.82 }} />
      </div>
      <div>
        <div className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f]">{label}</div>
        <div className="num font-spectral text-[24px] font-semibold text-[#23211b] leading-none mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function formatTimestamp(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return iso;
  }
}

const MEDAL_BG = ["bg-[#f7e7c4]", "bg-[#eef0f0]", "bg-[#f5e2d0]"];
const MEDALS = ["🥇", "🥈", "🥉"];

export default function AdminAiUsagePanel() {
  const [page, setPage] = useState(1);
  const [topUsersPage, setTopUsersPage] = useState(1);
  const [summary, setSummary] = useState<AiUsageSummary | null>(null);
  const [events, setEvents] = useState<AiUsageEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetchApi<{ summary: AiUsageSummary; recent: AiUsageEvent[] }>("/api/admin/ai-usage?limit=200");
        if (res) {
          setSummary(res.summary);
          setEvents(res.recent || []);
        }
      } catch (err) {
        console.error("Failed to load AI usage data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <AdminSectionLoader label="Loading AI usage..." />;
  }

  const totalPages = Math.max(1, Math.ceil((summary?.total_events || 0) / PAGE_SIZE));
  const pageRows = events.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const topUsers = summary?.top_users || [];
  const topUsersTotalPages = Math.max(1, Math.ceil(topUsers.length / TOP_USERS_PAGE_SIZE));
  const topUsersRows = topUsers.slice((topUsersPage - 1) * TOP_USERS_PAGE_SIZE, topUsersPage * TOP_USERS_PAGE_SIZE);
  const topUsersRankOffset = (topUsersPage - 1) * TOP_USERS_PAGE_SIZE;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard iconPath="/icons/sidebar/history.svg" label="Total events" value={summary?.total_events || 0} />
        <SummaryCard iconPath="/icons/sidebar/ai.svg" label="Total AI calls" value={summary?.total_ai_calls_estimate || 0} />
        <SummaryCard iconPath="/icons/sidebar/user.svg" label="Unique users" value={summary?.unique_users || 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5">
        {/* Recent events table */}
        <div className="bg-white border border-[#ece3d1] rounded-2xl p-6 shadow-xs">
          <div className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] mb-4 font-semibold">Recent events</div>
          {pageRows.length === 0 ? (
            <div className="text-[12.5px] text-[#8a8273] py-10 text-center">No AI usage recorded yet.</div>
          ) : (
            <>
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-[13px] min-w-[700px]">
                  <thead>
                    <tr className="text-left border-b border-[#efe7d6]">
                      <th className="px-2 py-2.5 font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] font-semibold">When</th>
                      <th className="px-2 py-2.5 font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] font-semibold">Feature</th>
                      <th className="px-2 py-2.5 font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] font-semibold">Model</th>
                      <th className="px-2 py-2.5 font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] font-semibold">User</th>
                      <th className="px-2 py-2.5 font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] font-semibold text-right">Calls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((e) => {
                      const featureMeta = getFeatureMeta(e.feature);
                      const modelMeta = getModelMeta(e.model_name);
                      return (
                        <tr key={e.id} className="border-b border-[#f4efe4] hover:bg-[#fdfcf8] transition-colors">
                          <td className="px-2 py-2.5 text-[#6f6757] whitespace-nowrap">{formatTimestamp(e.timestamp)}</td>
                          <td className="px-2 py-2.5">
                            <div className="flex items-center gap-2">
                              {featureMeta.icon && (
                                <Image src={featureMeta.icon} alt={featureMeta.label} width={18} height={18} className="w-[18px] h-[18px] shrink-0" />
                              )}
                              <span className="text-[#3a352b] font-medium">{featureMeta.label}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2.5">
                            <div className="flex items-center gap-2">
                              {modelMeta.icon && (
                                <Image src={modelMeta.icon} alt={modelMeta.label} width={18} height={18} className="w-[18px] h-[18px] shrink-0" />
                              )}
                              <span className="text-[#3a352b] font-medium">{modelMeta.label}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2.5 text-[#6f6757] truncate max-w-[160px]">{e.user_email}</td>
                          <td className="px-2 py-2.5 num text-right font-semibold text-[#23211b]">{e.ai_calls_estimate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <AdminPagination page={page} totalPages={totalPages} total={summary?.total_events || 0} pageSize={PAGE_SIZE} onPageChange={setPage} />
            </>
          )}
        </div>

        {/* Top users leaderboard */}
        <div className="bg-white border border-[#ece3d1] rounded-2xl p-5 shadow-xs h-fit">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[14px]">🏆</span>
            <div className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] font-semibold">Top users</div>
          </div>
          <div className="space-y-2">
            {topUsers.length === 0 && (
              <div className="text-[12.5px] text-[#8a8273] py-4 text-center">No data yet.</div>
            )}
            {topUsersRows.map((u, i) => {
              const rank = topUsersRankOffset + i;
              return (
                <div
                  key={u.user_email}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${MEDAL_BG[rank] || "bg-[#fdfcf8]"}`}
                >
                  <div className="text-[16px] w-6 text-center shrink-0">
                    {rank < 3 ? MEDALS[rank] : <span className="text-[#9b927f] text-[12px] font-semibold">#{rank + 1}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11.5px] font-semibold text-[#3a352b] truncate">{u.user_email}</div>
                  </div>
                  <div className="num font-bold text-[#15463b] text-[12px] shrink-0">{u.ai_calls_estimate}</div>
                </div>
              );
            })}
          </div>

          {topUsersTotalPages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-[#efe7d6]">
              <span className="text-[11px] text-[#8a8273]">
                Page <span className="font-semibold text-[#3a352b]">{topUsersPage}</span> of {topUsersTotalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTopUsersPage((p) => Math.max(1, p - 1))}
                  disabled={topUsersPage <= 1}
                  className="w-6 h-6 flex items-center justify-center rounded-md border border-[#ece3d1] text-[#6f6757] hover:bg-[#f6f3ec] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors bg-white"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setTopUsersPage((p) => Math.min(topUsersTotalPages, p + 1))}
                  disabled={topUsersPage >= topUsersTotalPages}
                  className="w-6 h-6 flex items-center justify-center rounded-md border border-[#ece3d1] text-[#6f6757] hover:bg-[#f6f3ec] disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer transition-colors bg-white"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
