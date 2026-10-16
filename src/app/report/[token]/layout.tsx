import type { Metadata } from "next";

// E2: a shared report is branded with the business it is about - the browser tab, and the card shown
// when the link is pasted into chat or email. The link is private, so search engines are told to skip it.
type Props = { children: React.ReactNode; params: Promise<{ token: string }> };

async function loadReport(token: string): Promise<{ businessName?: string; domain?: string; score?: number | null; visibilityVerified?: boolean } | null> {
  const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  try {
    const res = await fetch(`${base}/api/public/reports/${encodeURIComponent(token)}`, { cache: "no-store" });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const report = await loadReport(token);
  const name = report?.businessName || report?.domain;
  const title = name ? `${name} - AI visibility report | Wonderscore` : "AI visibility report | Wonderscore";
  const description =
    name && report?.visibilityVerified && typeof report.score === "number"
      ? `${name} has a Wonder Score of ${report.score}/100: how often ChatGPT, Claude, Gemini and Perplexity recommend it.`
      : "How often ChatGPT, Claude, Gemini and Perplexity recommend this business, from Wonderscore.";
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "website", siteName: "Wonderscore" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default function ReportLayout({ children }: Props) {
  return children;
}
