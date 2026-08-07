"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchApi, getAuthToken } from "../lib/api";

export interface UserProfile {
  id?: string;
  email: string;
  full_name: string;
  role?: string;
  avatar_url?: string;
  email_verified?: boolean;
  notify_scan_complete?: boolean;
}

interface UserContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // login/signup no longer establish a session by themselves — both end
  // with a code emailed to the address given, and resolve to that email
  // (or throw on invalid credentials / a rejected email) so the caller can
  // send the user to /verify-email. The only way to actually get a token
  // is verifyOtp() below.
  login: (email: string, pass: string) => Promise<{ email: string }>;
  signup: (email: string, pass: string, name: string) => Promise<{ email: string }>;
  verifyOtp: (email: string, code: string) => Promise<void>;
  resendOtp: (email: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { full_name: string; email: string }) => Promise<void>;
  updateNotificationPreferences: (notifyScanComplete: boolean) => Promise<void>;
}

const UserContext = createContext<UserContextType | null>(null);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Best-effort read of the last-known profile from localStorage. Used both
  // when there's no token yet and as a fallback when a profile fetch fails
  // for a reason that isn't actually "this token is invalid" (see below).
  const hydrateFromStoredUser = useCallback((trustExistingToken = false): boolean => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("wonder_user");
    if (!stored) return false;
    try {
      const parsed = JSON.parse(stored);
      if (!parsed.email) return false;
      setUser({
        id: parsed.id || "user-local",
        email: parsed.email,
        full_name: parsed.full_name || parsed.name || "User",
        role: parsed.role || "user",
        avatar_url: parsed.avatar_url || "",
        // A stored profile is only a display fallback. If a token exists but
        // the first profile request has a transient failure, an old cached
        // email_verified:false value must not push the user back into OTP.
        email_verified: trustExistingToken ? parsed.email_verified !== false : Boolean(parsed.email_verified),
        notify_scan_complete: parsed.notify_scan_complete ?? true,
      });
      setIsAuthenticated(true);
      return true;
    } catch {
      return false;
    }
  }, []);

  const fetchUserProfile = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      // A cached profile is not a session. Without a token, the user must
      // sign in again rather than being treated as partially authenticated
      // and sent to the OTP page.
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await fetchApi<any>("/api/user/profile");
      if (data && (data.email || data.name)) {
        const prof: UserProfile = {
          id: data.id || "",
          email: data.email || "",
          full_name: data.name || data.full_name || "User",
          role: data.role || "user",
          avatar_url: data.avatar_url || "",
          email_verified: Boolean(data.email_verified),
          notify_scan_complete: data.notify_scan_complete ?? true,
        };
        setUser(prof);
        setIsAuthenticated(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("wonder_user", JSON.stringify(prof));
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      // A 401/403 means the token is genuinely invalid/expired — that's a
      // real logout. Anything else (network blip, backend cold-start
      // timeout, a 5xx) is NOT proof the token is bad, and used to wipe the
      // token + force a fresh OTP every time regardless — e.g. after just
      // closing and reopening a tab, if the host happened to be spinning
      // back up from idle on that first request. Now those cases keep the
      // token and fall back to the last-known cached profile instead of
      // logging the user out.
      const status = (err as { status?: number } | undefined)?.status;
      if (status === 401 || status === 403) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("wonder_token");
          localStorage.removeItem("wonder_user");
        }
        setUser(null);
        setIsAuthenticated(false);
      } else if (!hydrateFromStoredUser(true)) {
        // No cached profile to fall back to either — leave the token in
        // place and let the next request retry rather than logging out.
        setIsAuthenticated(Boolean(getAuthToken()));
      }
    } finally {
      setIsLoading(false);
    }
  }, [hydrateFromStoredUser]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const login = async (emailStr: string, passStr: string) => {
    const res = await fetchApi<any>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: emailStr, password: passStr }),
    });
    return { email: res?.email || emailStr };
  };

  const signup = async (emailStr: string, passStr: string, nameStr: string) => {
    const res = await fetchApi<any>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email: emailStr, password: passStr, name: nameStr }),
    });
    return { email: res?.email || emailStr };
  };

  const verifyOtp = async (emailStr: string, code: string) => {
    const res = await fetchApi<any>("/api/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify({ email: emailStr, code }),
    });
    if (res && res.access_token) {
      if (typeof window !== "undefined") {
        localStorage.setItem("wonder_token", res.access_token);
      }
      const prof: UserProfile = {
        id: res.user?.id || "u-id",
        email: res.user?.email || emailStr,
        full_name: res.user?.name || res.user?.full_name || "User",
        role: res.user?.role || "user",
        email_verified: Boolean(res.user?.email_verified),
        notify_scan_complete: res.user?.notify_scan_complete ?? true,
      };
      setUser(prof);
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("wonder_user", JSON.stringify(prof));
      }
    }
  };

  const resendOtp = async (emailStr: string) => {
    await fetchApi<any>("/api/auth/otp/resend", {
      method: "POST",
      body: JSON.stringify({ email: emailStr }),
    });
  };

  const logout = () => {
    if (typeof window !== "undefined") {
      // Remove all wonder_ prefixed cache keys (analyser, query, scan history, businesses, blogs, etc.)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("wonder_")) keysToRemove.push(key);
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      // Clear sessionStorage too
      const ssKeysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith("wonder_")) ssKeysToRemove.push(key);
      }
      ssKeysToRemove.forEach(k => sessionStorage.removeItem(k));
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (data: { full_name: string; email: string }) => {
    try {
      const updated = await fetchApi<any>("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify({ name: data.full_name, email: data.email }),
      });
      const prof: UserProfile = {
        ...user,
        email: updated.email || data.email,
        full_name: updated.name || updated.full_name || data.full_name,
        email_verified: Boolean(updated.email_verified),
        notify_scan_complete: updated.notify_scan_complete ?? user?.notify_scan_complete ?? true,
      };
      setUser(prof);
      if (typeof window !== "undefined") {
        localStorage.setItem("wonder_user", JSON.stringify(prof));
      }
    } catch {
      if (user) {
        const prof = { ...user, full_name: data.full_name, email: data.email };
        setUser(prof);
        if (typeof window !== "undefined") {
          localStorage.setItem("wonder_user", JSON.stringify(prof));
        }
      }
    }
  };

  const updateNotificationPreferences = async (notifyScanComplete: boolean) => {
    const updated = await fetchApi<any>("/api/user/notification-preferences", {
      method: "PUT",
      body: JSON.stringify({ notify_scan_complete: notifyScanComplete }),
    });
    setUser((prev) => {
      const prof: UserProfile = {
        ...(prev as UserProfile),
        notify_scan_complete: updated?.notify_scan_complete ?? notifyScanComplete,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("wonder_user", JSON.stringify(prof));
      }
      return prof;
    });
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        verifyOtp,
        resendOtp,
        logout,
        updateProfile,
        updateNotificationPreferences,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
