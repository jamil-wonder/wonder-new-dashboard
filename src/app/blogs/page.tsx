"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Blogs page absorbed into /plan per the platform-flow spec (Part 4: "Plan
// — replaces the blog page; where everything gets done"). Kept as a
// redirect so any old bookmarks/links still land somewhere real.
export default function BlogsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/plan");
  }, [router]);
  return null;
}
