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

// The backend's anonymous-visitor rate limiter (/api/scrape, /api/ai-insights,
// /api/public/*) keys off an X-Wonder-Device-Id + X-Wonder-Scan-Id pair — but
// nothing on the frontend ever sent them. Every request fell back to a fixed
// "unknown-device" (so every anonymous visitor behind the same IP shared one
// rate-limit bucket) and a FRESH RANDOM scan_id per call (so the "was this
// scan_id's earlier attempt actually successful" check could never match
// across calls). That combination made every anonymous visitor's second
// public call — /api/ai-insights, /api/public/competitors, the unlock
// endpoint — 429 unconditionally, right after a scrape that had already
// spent real AI cost. deviceId is one stable id per browser, generated once
// and reused forever; scanId is generated fresh per scan attempt by the
// caller (see getNewScanId) and reused across that one scan's calls only.
function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem("wonder_device_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("wonder_device_id", id);
    }
    return id;
  } catch {
    return "";
  }
}

let currentScanId: string | null = null;

export function getNewScanId(): string {
  currentScanId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  return currentScanId;
}

export function getCurrentScanId(): string | null {
  return currentScanId;
}

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

  // Only relevant for anonymous calls (the backend ignores these once a
  // real auth token is present), but sent unconditionally since it's
  // harmless either way and simpler than threading "is this anonymous"
  // through every caller.
  const deviceId = getOrCreateDeviceId();
  if (deviceId && !headers["X-Wonder-Device-Id"]) {
    headers["X-Wonder-Device-Id"] = deviceId;
  }
  if (currentScanId && !headers["X-Wonder-Scan-Id"]) {
    headers["X-Wonder-Scan-Id"] = currentScanId;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    const err = new Error(
      `API Error (${response.status}): ${errorText || response.statusText}`
    ) as Error & { status?: number };
    err.status = response.status;
    throw err;
  }

  return response.json() as Promise<T>;
}
