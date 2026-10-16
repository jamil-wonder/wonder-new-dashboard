"use client";

import { useState } from "react";

// I8: a site's icon. If the icon can't be loaded the site's first letter is shown instead - never a
// broken image or an empty gap - and a site whose icon failed once is remembered for this visit, so
// it isn't asked for again by every row that shows it.
const failed = new Set<string>();

function cleanHost(domain: string): string {
  return String(domain || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#].*$/, "");
}

export default function SiteIcon({ domain, size = 16, className = "" }: { domain: string; size?: number; className?: string }) {
  const host = cleanHost(domain);
  const [, rerender] = useState(0);
  if (!host) return null;
  const letter = host.charAt(0).toUpperCase();
  if (failed.has(host)) {
    return (
      <span
        aria-hidden
        style={{ width: size, height: size, fontSize: Math.max(8, Math.round(size * 0.58)) }}
        className={`inline-flex shrink-0 items-center justify-center rounded-sm bg-[#eef3f0] font-semibold leading-none text-[#15463b] ${className}`}
      >
        {letter}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=${size > 20 ? 64 : 32}`}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      className={`shrink-0 rounded-sm object-contain ${className}`}
      onError={() => {
        failed.add(host);
        rerender((n) => n + 1);
      }}
    />
  );
}
