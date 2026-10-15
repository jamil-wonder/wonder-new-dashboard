// L8: which kind of website a cited source is. A source lands in a bucket only if its
// site is on that bucket's list - never because a word happens to appear inside the
// domain ("aa" inside "baaz.com", "local" inside "localhost.dev", "standard" inside a bank).

export type SourceBucket = "reviews" | "guides" | "directories" | "industry";

// Matched against the site's own name (the part before .com / .co.uk), so
// tripadvisor.com, tripadvisor.co.uk and uk.tripadvisor.com all match "tripadvisor",
// while tripadvisor-fake.com and tripadvisor.evil.com do not.
const SITE_NAMES: Record<SourceBucket, string[]> = {
  reviews: ["trustpilot", "tripadvisor", "yelp", "opentable", "squaremeal", "thefork", "feefo", "reviews", "g2", "capterra", "trustradius", "glassdoor", "productreview", "sitejabber", "doctify", "checkatrade", "trustatrader", "which"],
  guides: ["timeout", "theinfatuation", "eater", "cntraveller", "condenast", "telegraph", "standard", "secretldn", "theguardian", "forbes", "bbcgoodfood", "lonelyplanet", "roughguides", "ft", "bloomberg", "techradar", "pcmag", "zdnet", "wired"],
  directories: ["yell", "yellowpages", "foursquare", "thomsonlocal", "cylex", "hotfrog", "brownbook", "192", "bing", "tupalo", "scoot", "manta", "bbb", "whitepages", "visitbritain", "visitlondon", "visitengland", "visitscotland", "visitwales", "visitmanchester", "visitleeds"],
  industry: ["michelin", "theaa", "gmc-uk", "gdc-uk", "sra", "rics", "icaew", "cipd", "cqc", "ofsted", "who", "nhs"],
};

// Whole hosts for sites whose bare name is too general (google.com is also a search engine).
const HOSTS: Record<SourceBucket, string[]> = {
  reviews: [],
  guides: [],
  directories: ["maps.google.com", "g.page", "business.google.com", "maps.apple.com"],
  industry: [],
};

// Words that, as a whole piece of the domain (split on "." and "-"), mark an industry body.
const INDUSTRY_WORDS = ["association", "federation", "council", "guild", "institute", "chamber"];

const SECOND_LEVEL = new Set(["co", "com", "org", "net", "gov", "ac", "edu"]);

export function cleanHost(domain: string): string {
  return String(domain || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#].*$/, "");
}

/** The site's own name: "tripadvisor" for uk.tripadvisor.co.uk. */
export function siteName(host: string): string {
  const labels = host.split(".").filter(Boolean);
  if (labels.length < 2) return labels[0] || "";
  const n = labels.length;
  const last = labels[n - 1];
  const second = labels[n - 2];
  if (n >= 3 && last.length === 2 && SECOND_LEVEL.has(second)) return labels[n - 3];
  return second;
}

export function bucketFor(domain: string): SourceBucket | null {
  const host = cleanHost(domain);
  if (!host) return null;
  const order: SourceBucket[] = ["reviews", "guides", "directories", "industry"];
  const name = siteName(host);
  for (const bucket of order) {
    if (HOSTS[bucket].some((h) => host === h || host.endsWith(`.${h}`))) return bucket;
    if (SITE_NAMES[bucket].includes(name)) return bucket;
  }
  const pieces = host.split(/[.-]/);
  if (pieces.some((p) => INDUSTRY_WORDS.includes(p))) return "industry";
  return null;
}
