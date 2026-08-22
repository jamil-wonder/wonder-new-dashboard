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
  const { isAuthenticated, isLoading: isUserLoading, user } = useUser();
  const { hasLoadedOnce: hasBusinessesLoadedOnce } = useBusiness();

  const isAuthPage = pathname === "/auth";
  const isVerifyPage = pathname === "/verify-email";
  // /scan runs the free, no-login preview (platform-flow spec Part 1:
  // "value before every ask") — reached by redirect from the actual
  // marketing landing page (a separate project) after the visitor already
  // pasted their URL there, so this route never shows sell copy, just the
  // scan-in-progress → result → email gate. Root "/" is NOT this page —
  // it stays a plain redirect to /overview or /auth, matching the rest of
  // the app. It handles its own redirect for already-signed-in visitors
  // internally (straight to /overview).
  const isScanPage = pathname === "/scan";
  // /report/[token] is the recipient's side of Dashboard's "Share report" —
  // a manager, owner, or client opening a forwarded link has no account at
  // all, so this has to render with zero auth, same reasoning as /scan.
  const isSharedReportPage = pathname.startsWith("/report/");
  // /verify-email must work for someone who isn't signed in on this device
  // at all — signup and login both end with an emailed code and no token
  // exists until it's entered, so this page has to be reachable pre-auth.
  const isPublicPage = isAuthPage || isVerifyPage || isScanPage || isSharedReportPage;

  const needsVerification = isAuthenticated && !isUserLoading && !!user && !user.email_verified;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminUser = user?.role === "admin";
  // Still requires auth (goes through the loading/auth gate below like any
  // other page) but renders without the header/nav — with the nav visible,
  // a brand-new signup could just click away to Overview before ever
  // giving business info, defeating the point of asking for it first.
  const isOnboardingPage = pathname === "/onboarding";

  // Route protection guard. There is no such thing as an authenticated-but-
  // unverified session that gets dashboard access — signup, login, and a
  // later email change all funnel through the same rule: no verified email,
  // no access, full stop. This redirect is the only enforcement of that.
  useEffect(() => {
    if (isUserLoading) return;
    if (!isAuthenticated && !isPublicPage) {
      router.push("/auth");
      return;
    }
    if (needsVerification && !isVerifyPage) {
      router.push(`/verify-email?email=${encodeURIComponent(user!.email)}`);
      return;
    }
    // Admin routes aren't just hidden from the nav for a non-admin — they
    // must not be reachable by typing the URL either. isAdminUser only
    // becomes trustworthy once the user profile has actually loaded, so
    // this waits on isUserLoading the same way the checks above do.
    if (isAdminPage && isAuthenticated && !isUserLoading && !isAdminUser) {
      router.push("/overview");
    }
  }, [isAuthenticated, isUserLoading, isPublicPage, isVerifyPage, needsVerification, user, router, isAdminPage, isAdminUser]);

  // Public pages render directly, without the dashboard header/auth gate.
  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-[#faf8f3] text-[#23211b]">
        {children}
      </div>
    );
  }

  // Never render dashboard content — header included — until we've
  // confirmed who's actually logged in, that their email is verified, and
  // their real data has loaded at least once for this identity. Rendering
  // early here is exactly what let a previous account's cached state flash
  // on screen after switching users, and blocking on needsVerification is
  // what stops a one-frame flash of dashboard content before the redirect
  // above actually fires. Deliberately keys off hasLoadedOnce, NOT
  // isLoading — isLoading flips true again on every routine refetch (e.g.
  // Settings refetches on every tab change), and gating on that
  // unmounts+remounts this whole layout each time, which re-triggers a
  // page's own mount-time refetch and loops forever.
  if (isUserLoading || !isAuthenticated || !hasBusinessesLoadedOnce || needsVerification) {
    return (
      <div className="min-h-screen bg-[#fdfcf8] flex items-center justify-center">
        <WonderscoreSpinner size={40} label="Loading your workspace…" />
      </div>
    );
  }

  if (isOnboardingPage) {
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
