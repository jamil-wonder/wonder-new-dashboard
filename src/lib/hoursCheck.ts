// C4: opening hours that were found but cannot be right for the kind of business.
// A restaurant or bar that shuts before 6 pm, or lists the very same hours for every day, is
// far more likely to be a scraping slip (a footer, a lunch menu) than the real opening hours -
// so it is shown as "present, but looks wrong" instead of a green tick.

const HOSPITALITY = /restaurant|food|cafe|caf\u00e9|bar\b|pub|hospitality|hotel|dining|bistro|brasserie|nightlife/i;

export type HoursVerdict = { status: "missing" | "ok" | "suspicious"; reason: string };

function to24h(h: number, m: number, ap?: string): number {
  const a = (ap || "").toLowerCase();
  let hour = h;
  if (a === "pm" && hour < 12) hour += 12;
  if (a === "am" && hour === 12) hour = 0;
  return hour + m / 60;
}

// every "9am - 5pm", "09:00-17:30", "11 to 10pm" in a line -> { open, close } in 24h time
export function timeRanges(text: string): { open: number; close: number }[] {
  const re = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|\u2013|\u2014|to|until)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi;
  const out: { open: number; close: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const closeAp = m[6] || undefined;
    const openAp = m[3] || (closeAp && Number(m[1]) <= Number(m[4]) ? closeAp : undefined);
    let open = to24h(Number(m[1]), Number(m[2] || 0), openAp);
    let close = to24h(Number(m[4]), Number(m[5] || 0), closeAp);
    if (open > 23.99 || close > 23.99 && !closeAp) continue;
    if (close <= open) close += 24;       // 6pm - 1am
    out.push({ open, close });
  }
  return out;
}

export function checkOpeningHours(openingHours: string[] | undefined | null, category?: string | null, subType?: string | null): HoursVerdict {
  const lines = (openingHours || []).map((l) => String(l || "").trim()).filter(Boolean);
  if (lines.length === 0) return { status: "missing", reason: "Not found on site" };
  if (!HOSPITALITY.test(`${category || ""} ${subType || ""}`)) return { status: "ok", reason: "" };

  const ranges = lines.flatMap(timeRanges);
  if (ranges.length > 0) {
    const latestClose = Math.max(...ranges.map((r) => r.close));
    if (latestClose < 18) return { status: "suspicious", reason: "These hours end before 6 pm, which is unusual for a restaurant or bar - check them on your site." };
  }
  // the very same line for every day of the week
  const normalised = lines.map((l) => l.toLowerCase().replace(/^(mon|tue|wed|thu|fri|sat|sun)[a-z]*[:,]?\s*/, ""));
  if (lines.length >= 7 && new Set(normalised).size === 1) {
    return { status: "suspicious", reason: "The same hours are listed for all seven days - check them on your site." };
  }
  return { status: "ok", reason: "" };
}
