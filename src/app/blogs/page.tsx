"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import SundayCalendar from "../../components/blogs/SundayCalendar";
import BlogReaderModal from "../../components/blogs/BlogReaderModal";
import { useBusiness } from "../../context/BusinessContext";
import { useToast } from "../../context/ToastContext";
import { fetchApi } from "../../lib/api";
import { Settings, ArrowRight } from "lucide-react";

async function getValidMongoBusinessId(business: any): Promise<string | null> {
  if (!business) return null;
  if (business.id && /^[0-9a-fA-F]{24}$/.test(business.id)) {
    return business.id;
  }
  try {
    const res = await fetchApi<any>("/api/user/businesses", {
      method: "POST",
      body: JSON.stringify({
        url: business.url || "https://thegallivant.co.uk/",
        category: business.category || "Restaurant & Hotel",
        location: business.location || "Camber, Rye, UK",
        businessName: business.name || "The Gallivant",
      }),
    });
    if (res && res.id && /^[0-9a-fA-F]{24}$/.test(res.id)) {
      return res.id;
    }
  } catch (err) {
    console.error("Failed to sync business profile to DB:", err);
  }
  return null;
}

const getWeeklyBlogTaskKey = (businessId: string) => `wonder_blog_weekly_active_${businessId}`;

export default function BlogsPage() {
  const { activeBusiness } = useBusiness();
  const { showToast } = useToast();

  const [weeklyData, setWeeklyData] = useState<any>(null);
  const [isLoadingWeekly, setIsLoadingWeekly] = useState(true);
  const [isGeneratingWeekly, setIsGeneratingWeekly] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<any | null>(null);

  // Ensure or force-regenerate weekly blogs stored in MongoDB
  const ensureWeeklyBlogs = useCallback(async (force = false, targetMongoId?: string) => {
    if (!activeBusiness) {
      showToast("Please select a valid business profile first.", "info");
      return;
    }

    try {
      setIsGeneratingWeekly(true);
      const mongoId = targetMongoId || (await getValidMongoBusinessId(activeBusiness));
      if (!mongoId) {
        showToast("Could not resolve business profile in database.", "error");
        return;
      }

      if (force) {
        showToast(`Generating weekly blog drafts for ${activeBusiness.name || "your business"}. This can take 1-5 minutes.`, "info");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(getWeeklyBlogTaskKey(mongoId), JSON.stringify({
          businessId: mongoId,
          startedAt: Date.now(),
          force,
        }));
      }

      const res = await fetchApi<any>("/api/blogs/weekly/ensure", {
        method: "POST",
        body: JSON.stringify({
          business_id: mongoId,
          force,
          voice: activeBusiness.blogVoice || "",
          keywords: activeBusiness.blogKeywords || [],
        }),
      });

      if (res && res.success && res.weekly) {
        setWeeklyData(res.weekly);
        if (force) {
          showToast("Generated new weekly AI SEO blogs stored in database!", "success");
        }
      }
    } catch (err: any) {
      console.error("Weekly blog generation error:", err);
      showToast("Weekly blog generation encountered an issue", "error");
    } finally {
      if (typeof window !== "undefined") {
        try {
          const mongoId = targetMongoId || (activeBusiness?.id && /^[0-9a-fA-F]{24}$/.test(activeBusiness.id) ? activeBusiness.id : "");
          if (mongoId) localStorage.removeItem(getWeeklyBlogTaskKey(mongoId));
        } catch {}
      }
      setIsGeneratingWeekly(false);
      setIsLoadingWeekly(false);
    }
  }, [activeBusiness, showToast]);

  // Load weekly blogs directly from MongoDB database
  const loadWeeklyBlogs = useCallback(async () => {
    if (!activeBusiness) return;

    try {
      setIsLoadingWeekly(true);
      const mongoId = await getValidMongoBusinessId(activeBusiness);
      if (!mongoId) {
        setIsLoadingWeekly(false);
        return;
      }

      const res = await fetchApi<any>(`/api/blogs/weekly?business_id=${encodeURIComponent(mongoId)}`);
      
      if (res && res.success) {
        setWeeklyData(res.weekly || null);

        // If no weekly blogs exist in DB for this week, ensure generation
        if (!res.weekly || !res.weekly.drafts || res.weekly.drafts.length === 0) {
          ensureWeeklyBlogs(false, mongoId);
        }
      }
    } catch (err) {
      console.error("Failed to load weekly blogs from DB:", err);
    } finally {
      setIsLoadingWeekly(false);
    }
  }, [activeBusiness, ensureWeeklyBlogs]);

  useEffect(() => {
    loadWeeklyBlogs();
  }, [loadWeeklyBlogs]);

  useEffect(() => {
    if (!activeBusiness) return;
    let interval: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;

    const resumeWeeklyGeneration = async () => {
      const mongoId = await getValidMongoBusinessId(activeBusiness);
      if (!mongoId || cancelled || typeof window === "undefined") return;

      let activeTask: any = null;
      try {
        const raw = localStorage.getItem(getWeeklyBlogTaskKey(mongoId));
        activeTask = raw ? JSON.parse(raw) : null;
      } catch {}

      if (!activeTask?.startedAt) return;
      if (Date.now() - Number(activeTask.startedAt) > 20 * 60 * 1000) {
        localStorage.removeItem(getWeeklyBlogTaskKey(mongoId));
        return;
      }

      setIsGeneratingWeekly(true);
      showToast("Weekly blog drafts are still being prepared. This can take 1-5 minutes.", "info");

      const poll = async () => {
        try {
          const res = await fetchApi<any>(`/api/blogs/weekly?business_id=${encodeURIComponent(mongoId)}`);
          if (res?.success && res.weekly?.drafts?.length) {
            setWeeklyData(res.weekly);
            localStorage.removeItem(getWeeklyBlogTaskKey(mongoId));
            setIsGeneratingWeekly(false);
            if (interval) clearInterval(interval);
          }
        } catch {}
      };

      await poll();
      if (!cancelled) interval = setInterval(poll, 5000);
    };

    resumeWeeklyGeneration();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [activeBusiness, showToast]);

  return (
    <div className="space-y-4 pb-10">
      {/* Voice & Keywords Link directly targeting Settings AI Voice tab */}
      <Link
        href="/settings?tab=voice"
        className="flex items-center justify-between gap-3 bg-[#f6f3ec] border border-[#ece3d1] rounded-xl px-4 py-3 group transition-colors hover:bg-[#efe9db]"
      >
        <div className="flex items-center gap-2.5">
          <Settings className="w-4 h-4 text-[#8a8273] shrink-0" />
          <span className="text-[13px] text-[#6f6757]">
            <span className="font-semibold text-[#23211b]">AI Voice &amp; Focus Keywords</span>
            {" · "}
            <span>Tone &amp; Style: <strong className="text-[#15463b] font-medium">{activeBusiness?.blogVoice ? "Configured" : "Default Professional"}</strong></span>
          </span>
        </div>
        <span className="flex items-center gap-1 text-[12px] font-semibold text-[#15463b] whitespace-nowrap shrink-0 group-hover:gap-2 transition-all">
          Edit in Settings <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </Link>

      {/* Main Weekly Blog Calendar UI */}
      <SundayCalendar
        weeklyData={weeklyData}
        isLoading={isLoadingWeekly}
        isGenerating={isGeneratingWeekly}
        onEnsureWeekly={ensureWeeklyBlogs}
        onSelectBlog={setSelectedBlog}
      />

      <BlogReaderModal
        blog={selectedBlog}
        onClose={() => setSelectedBlog(null)}
      />
    </div>
  );
}
