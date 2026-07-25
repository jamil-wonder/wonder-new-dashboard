export interface NavItem {
  id: string;
  label: string;
  href: string;
  iconPath: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Overview", href: "/overview", iconPath: "/icons/sidebar/dashboard.svg" },
  { id: "analyser", label: "Analyser", href: "/analyser", iconPath: "/icons/sidebar/analyse.svg" },
  { id: "query", label: "Query", href: "/query", iconPath: "/icons/sidebar/ai.svg" },
  { id: "blogs", label: "Blogs", href: "/blogs", iconPath: "/icons/sidebar/blogs.svg" },
  { id: "plan", label: "Plan", href: "/plan", iconPath: "/icons/sidebar/shield.svg" },
  { id: "settings", label: "Settings", href: "/settings", iconPath: "/icons/sidebar/settings.svg" },
];
