"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import DashboardHeader from "./DashboardHeader";
import { useUser } from "../../context/UserContext";
import { useBusiness } from "../../context/BusinessContext";
import { WonderscoreSpinner } from "../ui/WonderscoreSpinner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading: isUserLoading } = useUser();
  const { hasLoadedOnce: hasBusinessesLoadedOnce } = useBusiness();

  const isAuthPage = pathname === "/auth";

  // Route protection guard
  useEffect(() => {
    if (!isUserLoading && !isAuthenticated && !isAuthPage) {
      router.push("/auth");
    }
  }, [isAuthenticated, isUserLoading, isAuthPage, router]);

  // If on the /auth route, render the auth page directly without dashboard header
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#faf8f3] text-[#23211b]">
        {children}
      </div>
    );
  }

  // Never render dashboard content — header included — until we've
  // confirmed who's actually logged in and their real data has loaded at
  // least once for this identity. Rendering early here is exactly what let
  // a previous account's cached state flash on screen after switching
  // users. Deliberately keys off hasLoadedOnce, NOT isLoading — isLoading
  // flips true again on every routine refetch (e.g. Settings refetches on
  // every tab change), and gating on that unmounts+remounts this whole
  // layout each time, which re-triggers a page's own mount-time refetch
  // and loops forever.
  if (isUserLoading || !isAuthenticated || !hasBusinessesLoadedOnce) {
    return (
      <div className="min-h-screen bg-[#fdfcf8] flex items-center justify-center">
        <WonderscoreSpinner size={40} label="Loading your workspace…" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfcf8] text-[#23211b] pb-12">
      <DashboardHeader />
      <main className="max-w-[1180px] mx-auto pt-4 px-4 md:px-9">
        {children}
      </main>
    </div>
  );
}
