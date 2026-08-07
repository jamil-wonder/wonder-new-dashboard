"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WonderscoreSpinner } from "../components/ui/WonderscoreSpinner";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("wonder_token");
    router.replace(token ? "/overview" : "/auth");
  }, [router]);

  return (
    <div className="min-h-screen bg-[#fdfcf8] flex items-center justify-center">
      <WonderscoreSpinner size={40} label="Opening your workspace..." />
    </div>
  );
}
