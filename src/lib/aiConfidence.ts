// C2: how confident are we that an AI model really knows this business?
// Derived from checks on what the model actually said - never asserted.
//
//   Failed  the model could not be reached (missing data, not a judgement)
//   High    every check we can run passes
//   Medium  one check fails
//   Low     two or more fail, or the model contradicts the profile
//
// Checks: (1) the model says it recognises the business, (2) the summary is not
// hedged ("may", "appears to", "limited information"), (3) it states the
// location we have on file, (4) it describes the category we have on file.
// A contradiction (it puts the business in another place, or calls it another
// kind of business) is a Discrepancy: always Low, shown in red with a quick win.

export type Confidence = "High" | "Medium" | "Low" | "Failed";

export type InsightProfile = { name?: string; category?: string; location?: string };

export type Discrepancy = {
  kind: "location" | "category";
  said: string;
  expected: string;
  message: string;
  quickWin: string;
};

export type Assessment = {
  level: Confidence;
  checks: { known: boolean; hedged: boolean; location: "yes" | "no" | "n/a"; category: "yes" | "no" | "n/a" };
  discrepancy: Discrepancy | null;
  verified: string[];
  missing: string[];
};

const HEDGES =
  /\b(may|might|possibly|perhaps|appears? to|seems? to|could be|probably|likely|not (?:sure|certain|familiar)|unclear|unable to (?:verify|confirm)|cannot (?:verify|confirm)|no (?:specific|detailed|verified|reliable) information|limited (?:public )?information|(?:don't|do not) have)\b/i;

// Words that do not identify a place or a kind of business
const GENERIC_PLACE = new Set(["the", "and", "united", "kingdom", "uk", "england", "great", "britain", "usa", "north", "south", "east", "west", "city", "county", "street", "road", "area"]);

// category word -> other words an AI would use for the same kind of business
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  restaurant: ["restaurant", "dining", "eatery", "bistro", "brasserie", "kitchen", "cuisine", "chef", "tasting menu"],
  hotel: ["hotel", "inn", "accommodation", "guest house", "bed and breakfast", "resort", "stay"],
  bank: ["bank", "banking", "wealth", "private bank"],
  supermarket: ["supermarket", "grocery", "grocer", "retailer", "food retail"],
  cafe: ["cafe", "café", "coffee"],
  bar: ["bar", "pub", "cocktail"],
  agency: ["agency", "studio", "consultancy"],
  consulting: ["consulting", "consultancy", "advisory"],
  law: ["law", "solicitor", "legal", "attorney"],
  accountant: ["accountant", "accounting", "tax"],
  clinic: ["clinic", "medical", "health", "dental", "dentist", "doctor"],
  salon: ["salon", "hair", "beauty", "barber"],
  gym: ["gym", "fitness", "studio"],
  ecommerce: ["e-commerce", "ecommerce", "online store", "online shop", "saas", "platform"],
  software: ["software", "saas", "platform", "app"],
  shop: ["shop", "store", "retail", "boutique"],
  bakery: ["bakery", "baker", "patisserie"],
  school: ["school", "academy", "education", "college", "tutor"],
};

// Kinds of business an AI might wrongly call this one (used only to spot a contradiction)
const CATEGORY_NOUNS = [
  "restaurant", "hotel", "bank", "supermarket", "cafe", "café", "pub", "law firm", "solicitor", "accountancy",
  "clinic", "dentist", "salon", "gym", "bakery", "school", "software company", "marketing agency", "consultancy",
  "estate agent", "charity", "museum", "theatre",
];

const clean = (v: unknown) => String(v ?? "").trim();
const lower = (v: unknown) => clean(v).toLowerCase();
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const hasWord = (text: string, word: string) => new RegExp(`(?<![a-z0-9])${escapeRe(word)}(?![a-z0-9])`, "i").test(text);

function expectedPlaceTokens(location: string): string[] {
  return lower(location)
    .split(/[,;/|]|\s-\s/)
    .flatMap((part) => [part.trim(), ...part.split(/\s+/)])
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !GENERIC_PLACE.has(t) && !/^\d/.test(t));
}

function categoryWords(category: string): string[] {
  const base = lower(category)
    .split(/[&,/]|\band\b/)
    .flatMap((p) => p.split(/\s+/))
    .map((w) => w.replace(/s$/, ""))
    .filter((w) => w.length >= 4);
  const out = new Set<string>(base);
  for (const w of base) for (const s of CATEGORY_SYNONYMS[w] || []) out.add(s);
  return [...out];
}

export function assessInsight(
  item: { summary?: string; isKnown?: boolean; fetchStatus?: string; sentiment?: string; platforms?: string[] } | null | undefined,
  profile: InsightProfile,
): Assessment {
  if (!item || item.fetchStatus === "failed") {
    return { level: "Failed", checks: { known: false, hedged: false, location: "n/a", category: "n/a" }, discrepancy: null, verified: [], missing: [] };
  }

  const summary = clean(item.summary);
  const known = item.isKnown === true;
  const hedged = HEDGES.test(summary);

  // --- location
  const placeTokens = expectedPlaceTokens(clean(profile.location));
  let location: "yes" | "no" | "n/a" = "n/a";
  if (placeTokens.length > 0) location = placeTokens.some((t) => hasWord(summary, t)) ? "yes" : "no";

  // --- category
  const catWords = categoryWords(clean(profile.category));
  let category: "yes" | "no" | "n/a" = "n/a";
  if (catWords.length > 0) category = catWords.some((w) => hasWord(summary, w)) ? "yes" : "no";

  // --- contradictions (precise on purpose: a false alarm is worse than a miss)
  let discrepancy: Discrepancy | null = null;
  if (location === "no") {
    const m = summary.match(/\b(?:based|located|headquartered|situated)\s+in\s+([A-Z][\p{L}'’-]+(?:\s+[A-Z][\p{L}'’-]+)?)/u);
    if (m && !placeTokens.some((t) => hasWord(m[1], t))) {
      discrepancy = {
        kind: "location",
        said: m[1],
        expected: clean(profile.location),
        message: `This model places the business in ${m[1]}, but your profile says ${clean(profile.location)}.`,
        quickWin: `State "${clean(profile.location)}" clearly on your homepage, contact page, schema markup and business profiles so AI models stop placing you in ${m[1]}.`,
      };
    }
  }
  if (!discrepancy && category === "no") {
    const wrong = CATEGORY_NOUNS.find((n) => hasWord(summary, n) && !catWords.includes(n));
    if (wrong) {
      discrepancy = {
        kind: "category",
        said: wrong,
        expected: clean(profile.category),
        message: `This model describes the business as a ${wrong}, but your profile says ${clean(profile.category)}.`,
        quickWin: `Say plainly what you are ("${clean(profile.category)}") in your homepage headline, meta description and schema so AI models don't call you a ${wrong}.`,
      };
    }
  }

  // --- level
  const failures = [!known, hedged, location === "no", category === "no"].filter(Boolean).length;
  const level: Confidence = discrepancy || failures >= 2 ? "Low" : failures === 1 ? "Medium" : "High";

  // --- what it got right / what is missing, from the same checks
  const verified: string[] = [];
  const missing: string[] = [];
  if (profile.name && lower(profile.name).split(/\s+/).filter((w) => w.length >= 3).some((w) => hasWord(summary, w))) verified.push("Name");
  if (location === "yes") verified.push("Location");
  if (category === "yes") verified.push("Category");
  if (known) verified.push("Recognised");
  if (location === "no") missing.push("Location not stated");
  if (category === "no") missing.push("Category not described");
  if (!known) missing.push("Not clearly recognised");
  if (hedged) missing.push("Hedged wording");

  return { level, checks: { known, hedged, location, category }, discrepancy, verified, missing };
}

export const CONFIDENCE_STYLE: Record<Confidence, { color: string; bg: string }> = {
  High: { color: "#1e7d4f", bg: "#dcefe2" },
  Medium: { color: "#9a6a12", bg: "#f7e7c4" },
  Low: { color: "#b1442a", bg: "#f6dcd5" },
  Failed: { color: "#92400e", bg: "#fef3c7" },
};
