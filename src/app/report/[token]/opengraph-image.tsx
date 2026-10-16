import { ImageResponse } from "next/og";

// I10: the card shown when a report link is pasted into chat or email - the business name and its real Wonder Score.
export const alt = "AI visibility report";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const base = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  let report: { businessName?: string; domain?: string; score?: number | null; visibilityVerified?: boolean } | null = null;
  try {
    const res = await fetch(`${base}/api/public/reports/${encodeURIComponent(token)}`, { cache: "no-store" });
    report = res.ok ? await res.json() : null;
  } catch {
    report = null;
  }
  const name = report?.businessName || report?.domain || "AI visibility report";
  const scored = Boolean(report?.visibilityVerified) && typeof report?.score === "number";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#15463b", color: "#fff", padding: 72 }}>
        <div style={{ display: "flex", fontSize: 30, letterSpacing: 2, color: "#a9cdb9" }}>WONDERSCORE · AI VISIBILITY REPORT</div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 700 }}>
            <div style={{ display: "flex", fontSize: 28, color: "#a9cdb9" }}>Prepared for</div>
            <div style={{ display: "flex", fontSize: name.length > 28 ? 56 : 74, fontWeight: 700, lineHeight: 1.1, marginTop: 10 }}>{name}</div>
            <div style={{ display: "flex", fontSize: 28, color: "#a9cdb9", marginTop: 24 }}>How often ChatGPT, Claude, Gemini and Perplexity recommend it</div>
          </div>
          {scored && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "#fff", color: "#15463b", borderRadius: 32, padding: "28px 44px" }}>
              <div style={{ display: "flex", fontSize: 140, fontWeight: 700, lineHeight: 1 }}>{report!.score}</div>
              <div style={{ display: "flex", fontSize: 28, marginTop: 6 }}>Wonder Score / 100</div>
            </div>
          )}
        </div>
      </div>
    ),
    { ...size },
  );
}
