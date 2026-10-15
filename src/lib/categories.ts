// G5: the one list of business categories, used by the onboarding picker AND Settings, so a
// category picked from the website scan means the same thing in both places.

export const CATEGORY_OPTIONS = [
  "Restaurant & Food",
  "Hotel & Hospitality",
  "Retail & Shopping",
  "Healthcare & Medical",
  "Legal Services",
  "Real Estate",
  "Home Services",
  "Automotive",
  "Beauty & Personal Care",
  "Fitness & Wellness",
  "Professional Services",
  "Education & Training",
  "Technology & Software",
  "Financial Services",
  "Construction & Contracting",
  "Entertainment & Events",
  "Travel & Tourism",
  "Nonprofit & Community",
  "Other",
];

// Maps whatever the crawler returned onto the picker's exact options; anything
// unrecognised is dropped rather than shown as a label that isn't selectable.
export function matchCategory(raw: unknown): string {
  const text = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return CATEGORY_OPTIONS.find((option) => option.toLowerCase() === text) || "";
}
