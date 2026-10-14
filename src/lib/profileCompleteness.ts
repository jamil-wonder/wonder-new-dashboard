import type { Business } from "../context/BusinessContext";

// A6 / L5: profile completeness measures how much of the PROFILE is filled in -
// never the Wonder Score. ONE function, used by Settings (profile bar) and the
// Overview "Train your Wonder Score" card, so the two can never disagree.

export type ProfileField = {
  id: string;
  label: string;
  done: boolean;
  href: string;
  hint: string;
};

export type ProfileCompleteness = {
  fields: ProfileField[];
  done: number;
  total: number;
  percent: number;
  missing: ProfileField[];
};

// `services`/`targetAudience` are typed as `string` on Business, but arrive as
// an array from some save paths and a comma-joined string from others. Either
// shape counts as filled only when it has real content (not "" or []).
function hasContent(value: unknown): boolean {
  if (Array.isArray(value)) return value.some((item) => String(item || "").trim().length > 0);
  return String(value || "").trim().length > 0;
}

export function computeProfileCompleteness(business: Business | null | undefined): ProfileCompleteness {
  const b = business;
  const fields: ProfileField[] = [
    { id: "name", label: "Business name", done: hasContent(b?.name), href: "/settings?tab=entity", hint: "How AI models should refer to you." },
    { id: "url", label: "Website URL", done: hasContent(b?.url), href: "/settings?tab=entity", hint: "What gets crawled and tracked." },
    { id: "category", label: "Business category", done: hasContent(b?.category), href: "/settings?tab=entity", hint: "Helps AI models place you in the right search context." },
    { id: "location", label: "Location", done: hasContent(b?.location), href: "/settings?tab=entity", hint: "Powers local-SEO question matching." },
    { id: "description", label: "Business description", done: hasContent(b?.description), href: "/settings?tab=entity", hint: "What AI reads to describe you accurately." },
    { id: "ai_context", label: "AI description", done: hasContent(b?.aiDescription), href: "/settings?tab=entity", hint: "Extra context specifically for AI-generated answers." },
    { id: "services", label: "Services", done: hasContent(b?.services), href: "/settings?tab=entity", hint: "What you actually offer, for sharper question matching." },
    { id: "audience", label: "Target audience", done: hasContent(b?.targetAudience), href: "/settings?tab=entity", hint: "Who your real customers are." },
    { id: "logo", label: "Logo", done: hasContent(b?.logoUrl), href: "/settings?tab=entity", hint: "Shown on your shared reports and dashboard header." },
    { id: "voice", label: "Blog voice", done: hasContent(b?.blogVoice), href: "/settings?tab=voice", hint: "So blog drafts sound like you." },
    { id: "keywords", label: "Blog keywords", done: hasContent(b?.blogKeywords), href: "/settings?tab=voice", hint: "Topics your articles should cover." },
    { id: "questions", label: "Locked 20 Search Tracker questions", done: Boolean(b?.questionsLocked), href: "/query", hint: "Your stable weekly baseline - nothing is tracked until this is locked." },
  ];

  const done = fields.filter((f) => f.done).length;
  const total = fields.length;
  return {
    fields,
    done,
    total,
    percent: total > 0 ? Math.round((done / total) * 100) : 0,
    missing: fields.filter((f) => !f.done),
  };
}
