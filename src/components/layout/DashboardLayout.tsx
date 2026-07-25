"use client";

import React from "react";
import DashboardHeader from "./DashboardHeader";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fdfcf8] text-[#23211b] pb-12">
      <DashboardHeader />
      <main className="max-w-[1180px] mx-auto pt-4 px-4 md:px-9">
        {children}
      </main>
    </div>
  );
}
