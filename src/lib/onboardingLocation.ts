export type LocationConfidence = "high" | "medium" | "low";

export interface DetectedLocation {
  id: string;
  label: string;
  city: string;
  country: string;
  address: string;
  postalCode: string;
  branchCount: number;
  confidence: LocationConfidence;
}

const MAX_LOCATIONS = 12;

function text(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

// The scrape payload is third-party-derived data; never trust its shape.
export function parseDetectedLocations(raw: unknown): DetectedLocation[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: DetectedLocation[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const label = text(record.label);
    if (!label || label.length > 80) continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const branches = typeof record.branchCount === "number" && Number.isFinite(record.branchCount) ? Math.round(record.branchCount) : 1;
    out.push({
      id: text(record.id) || key,
      label,
      city: text(record.city) || label,
      country: text(record.country),
      address: text(record.address),
      postalCode: text(record.postalCode),
      branchCount: Math.max(1, branches),
      confidence: record.confidence === "high" || record.confidence === "medium" ? record.confidence : "low",
    });
    if (out.length >= MAX_LOCATIONS) break;
  }
  return out;
}

const STREET_WORD = /\b(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|boulevard|blvd|way|square|sq|court|ct|place|pl|terrace|crescent|parade|highway|hwy)\b\.?/i;
const UK_POSTCODE = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[ABD-HJLNP-UW-Z]{2}\b/i;
const US_ZIP = /\b\d{5}(?:-\d{4})?\b/;

// The saved location feeds every local-search question we ask AI ("Best
// restaurant in <location>?"), so it must be a city/area, not a street address.
export function validateLocationInput(raw: string): string | null {
  const value = raw.replace(/\s+/g, " ").trim();
  if (!value) return "Tell us where you're based so we can track the local searches your customers make.";
  if (value.length < 2) return "That location looks too short.";
  if (value.length > 80) return "Keep the location short - a city or area is enough.";
  if (!/[A-Za-zÀ-ɏ]{2}/.test(value)) return "Enter a city or area, like “London, UK”.";
  if (/[@/]|https?:|www\./i.test(value)) return "Enter a city or area, like “London, UK”.";
  if (UK_POSTCODE.test(value) || US_ZIP.test(value) || (/\d/.test(value) && STREET_WORD.test(value))) {
    return "Enter a city or area (like “London, UK”), not a full street address or postcode.";
  }
  return null;
}

export function normalizeDomain(url: string): string {
  return String(url || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#].*$/, "")
    .replace(/:\d+$/, "");
}
