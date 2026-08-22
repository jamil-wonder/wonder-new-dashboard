export interface NavItem {
  id: string;
  label: string;
  href: string;
  iconPath: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Dashboard", href: "/overview", iconPath: "/icons/sidebar/dashboard.svg" },
  { id: "analyser", label: "Analyzer", href: "/analyser", iconPath: "/icons/sidebar/analyse.svg" },
  { id: "query", label: "Search Tracker", href: "/query", iconPath: "/icons/sidebar/ai.svg" },
  { id: "plan", label: "Plan", href: "/plan", iconPath: "/icons/sidebar/shield.svg" },
  { id: "reports", label: "Reports", href: "/reports", iconPath: "/icons/sidebar/analytics.svg" },
  { id: "settings", label: "Settings", href: "/settings", iconPath: "/icons/sidebar/settings.svg" },
];

// Appended to NAV_ITEMS at render time (see NavTabs.tsx) only when
// user.role === "admin" — kept separate so it's never accidentally shown
// to a regular user just by editing NAV_ITEMS.
export const ADMIN_NAV_ITEM: NavItem = {
  id: "admin",
  label: "Admin",
  href: "/admin",
  iconPath: "/icons/sidebar/adv-settings.svg",
};
