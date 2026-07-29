"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchApi, getAuthToken } from "../lib/api";

export interface UserProfile {
  id?: string;
  email: string;
  full_name: string;
  role?: string;
  avatar_url?: string;
}

interface UserContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: { full_name: string; email: string }) => Promise<void>;
}

const DEFAULT_DEMO_USER: UserProfile = {
  id: "user-demo",
  email: "marcus@meridian.co",
  full_name: "Marcus Reed",
  role: "admin",
};

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

  const fetchUserProfile = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("wonder_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.email) {
              setUser({
                id: parsed.id || "user-local",
                email: parsed.email,
                full_name: parsed.full_name || parsed.name || "Marcus Reed",
                role: parsed.role || "user",
                avatar_url: parsed.avatar_url || "",
              });
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            }
          } catch {}
        }
      }
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
          full_name: data.name || data.full_name || "Marcus Reed",
          role: data.role || "user",
          avatar_url: data.avatar_url || "",
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
    } catch {
      if (typeof window !== "undefined") {
        localStorage.removeItem("wonder_token");
        localStorage.removeItem("wonder_user");
      }
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const login = async (emailStr: string, passStr: string) => {
    try {
      const res = await fetchApi<any>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: emailStr, password: passStr }),
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
        };
        setUser(prof);
        setIsAuthenticated(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("wonder_user", JSON.stringify(prof));
        }
      }
    } catch (err: any) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("wonder_token");
        localStorage.removeItem("wonder_user");
      }
      setUser(null);
      setIsAuthenticated(false);
      throw err;
    }
  };

  const signup = async (emailStr: string, passStr: string, nameStr: string) => {
    try {
      const res = await fetchApi<any>("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({ email: emailStr, password: passStr, name: nameStr }),
      });

      if (res && res.access_token) {
        if (typeof window !== "undefined") {
          localStorage.setItem("wonder_token", res.access_token);
        }
        const prof: UserProfile = {
          id: res.user?.id || "u-id",
          email: res.user?.email || emailStr,
          full_name: res.user?.name || nameStr,
          role: res.user?.role || "user",
        };
        setUser(prof);
        setIsAuthenticated(true);
        if (typeof window !== "undefined") {
          localStorage.setItem("wonder_user", JSON.stringify(prof));
        }
      }
    } catch (err) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("wonder_token");
        localStorage.removeItem("wonder_user");
      }
      setUser(null);
      setIsAuthenticated(false);
      throw err;
    }
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

  return (
    <UserContext.Provider
      value={{
        user: user || DEFAULT_DEMO_USER,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
