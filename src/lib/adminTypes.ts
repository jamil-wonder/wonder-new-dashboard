export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "banned";
  email_verified: boolean;
  notify_scan_complete: boolean;
  businesses_count: number;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  admin_count: number;
  banned_count: number;
  verified_count: number;
  total_businesses: number;
  scans_this_week: number;
  ai_calls_today: number;
  ai_calls_this_week: number;
}

export interface AiUsageSummary {
  total_events: number;
  total_ai_calls_estimate: number;
  unique_users: number;
  by_feature: Record<string, number>;
  by_model: Record<string, number>;
  top_users: Array<{ user_email: string; ai_calls_estimate: number }>;
}

export interface AiUsageEvent {
  id: string;
  timestamp: string;
  feature: string;
  provider: string;
  model_name: string;
  user_email: string;
  url: string;
  ai_calls_estimate: number;
}
