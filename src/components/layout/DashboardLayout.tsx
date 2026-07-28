"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import DashboardHeader from "./DashboardHeader";
import { useUser } from "../../context/UserContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUser();

  const isAuthPage = pathname === "/auth";

  // Route protection guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isAuthPage) {
      router.push("/auth");
    }
  }, [isAuthenticated, isLoading, isAuthPage, router]);

  // If on the /auth route, render the auth page directly without dashboard header
  if (isAuthPage) {
    return (
      <div className="min-h-screen bg-[#faf8f3] text-[#23211b]">
        {children}
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
