"use client";

const getApiUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
};

export const getAuthToken = (): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("wonder_token") || "";
};

export const getActiveBusinessId = (): string => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("wonder_active_business_id") || "";
};

export const setActiveBusinessId = (id: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem("wonder_active_business_id", id);
};

export interface ScanPoint {
  score: number;
  timestamp: string;
}

export function recordScanHistory(url: string, score: number): void {
  if (typeof window === "undefined" || !url) return;
  const clean = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const key = `wonder_scan_history_${clean}`;
  try {
    const raw = localStorage.getItem(key);
    let history: ScanPoint[] = raw ? JSON.parse(raw) : [];

    const now = new Date().toISOString();
    const last = history[history.length - 1];

    // Prevent immediate accidental duplicate pushes within 5 seconds with same score (e.g. strict react double mounts)
    if (last && last.score === score && (new Date(now).getTime() - new Date(last.timestamp).getTime()) < 5000) {
      return;
    }

    history.push({ score, timestamp: now });

    if (history.length > 50) history = history.slice(history.length - 50);
    localStorage.setItem(key, JSON.stringify(history));
  } catch {}
}

export function getScanHistory(url: string): ScanPoint[] {
  if (typeof window === "undefined" || !url) return [];
  const clean = url.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const key = `wonder_scan_history_${clean}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const baseUrl = getApiUrl();
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `API Error (${response.status}): ${errorText || response.statusText}`
    );
  }

  return response.json() as Promise<T>;
}
