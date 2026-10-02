"use client";

import { useState } from "react";
import { Info, MapPin, Pencil, TriangleAlert } from "lucide-react";
import type { DetectedLocation } from "../../lib/onboardingLocation";

function LocationInput({
  value,
  onChange,
  onEnter,
  autoFocus,
  placeholder,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  autoFocus?: boolean;
  placeholder: string;
  invalid: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter();
        }
      }}
      autoFocus={autoFocus}
      maxLength={80}
      placeholder={placeholder}
      aria-label="Business location"
      aria-invalid={invalid}
      className={`w-full text-[14px] p-3 border rounded-xl bg-[#fdfcf8] outline-none transition-colors ${
        invalid ? "border-[#e0a595] focus:border-[#b1442a]" : "border-[#ece3d1] focus:border-[#15463b]"
      }`}
    />
  );
}

function Note({ tone, children }: { tone: "info" | "warn"; children: React.ReactNode }) {
  const Icon = tone === "warn" ? TriangleAlert : Info;
  const style =
    tone === "warn"
      ? "bg-[#faf1da] border-[#f0dfae] text-[#7a5410]"
      : "bg-[#eef3f0] border-[#d0e4d6] text-[#15463b]";
  return (
    <div className={`flex items-start gap-2.5 border rounded-xl p-3 text-[12.5px] leading-relaxed ${style}`}>
      <Icon className="w-4 h-4 shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  );
}

// Three honest states instead of silently guessing one "AI-suggested" string:
//   none   -> say we found nothing, ask for a city
//   one    -> show what we found (and how sure we are), editable
//   several-> say so, let them pick the ONE the product will track
export default function LocationStep({
  detected,
  value,
  onChange,
  onEnter,
  invalid,
}: {
  detected: DetectedLocation[];
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  invalid: boolean;
}) {
  const [editingSingle, setEditingSingle] = useState(false);
  const trimmed = value.trim().toLowerCase();

  if (detected.length === 0) {
    return (
      <div className="space-y-3">
        <Note tone="info">We couldn&apos;t find an address on your website to suggest from.</Note>
        <LocationInput value={value} onChange={onChange} onEnter={onEnter} autoFocus placeholder="e.g. Manchester, UK" invalid={invalid} />
        <p className="text-[12px] text-[#9b927f] leading-relaxed">
          A city or area is enough — for example &ldquo;Manchester, UK&rdquo; or &ldquo;Austin, TX&rdquo;. We use it to ask AI the
          same local questions your customers ask.
        </p>
      </div>
    );
  }

  if (detected.length === 1) {
    const only = detected[0];
    const unchanged = trimmed === only.label.toLowerCase();
    if (editingSingle || !unchanged) {
      return (
        <div className="space-y-3">
          <LocationInput value={value} onChange={onChange} onEnter={onEnter} autoFocus placeholder="e.g. Manchester, UK" invalid={invalid} />
          {!unchanged && (
            <button
              type="button"
              onClick={() => {
                onChange(only.label);
                setEditingSingle(false);
              }}
              className="text-[12px] font-semibold text-[#15463b] hover:underline cursor-pointer bg-transparent border-none p-0"
            >
              Use &ldquo;{only.label}&rdquo; from your site instead
            </button>
          )}
        </div>
      );
    }
    return (
      <div className="space-y-3">
        <div className="border border-[#d0e4d6] bg-[#eef3f0] rounded-xl p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="font-mono-spline text-[10px] uppercase tracking-wider text-[#1e7d4f] font-semibold">
              Found on your site
            </span>
            <button
              type="button"
              onClick={() => setEditingSingle(true)}
              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[#15463b] hover:underline cursor-pointer bg-transparent border-none"
            >
              <Pencil className="w-3 h-3" /> Edit
            </button>
          </div>
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-[#15463b] shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="text-[15px] font-semibold text-[#23211b]">{only.label}</div>
              {only.address && <div className="text-[12px] text-[#6f6757] mt-0.5">{only.address}</div>}
            </div>
          </div>
        </div>
        {only.confidence === "low" && (
          <Note tone="warn">We&apos;re not fully sure about this one — please check it&apos;s the right place before continuing.</Note>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Note tone="info">
        <strong className="font-semibold">We found {detected.length} locations on your site.</strong> WonderScore tracks one
        location per business, so choose the one that matters most — you can change it any time in Settings.
      </Note>
      <div role="radiogroup" aria-label="Choose your main location" className="space-y-2 max-h-[260px] overflow-y-auto pr-0.5">
        {detected.map((loc) => {
          const isSelected = trimmed === loc.label.toLowerCase();
          return (
            <button
              key={loc.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(loc.label)}
              className={`w-full text-left rounded-xl border p-3.5 transition-colors flex items-start gap-3 cursor-pointer ${
                isSelected ? "border-[#15463b] bg-[#eef3f0]" : "border-[#ece3d1] bg-[#fdfcf8] hover:border-[#15463b]"
              }`}
            >
              <span
                className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                  isSelected ? "border-[#15463b]" : "border-[#c8bfa9]"
                }`}
              >
                {isSelected && <span className="w-2 h-2 rounded-full bg-[#15463b]" />}
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-[#23211b]">{loc.label}</span>
                {(loc.address || loc.branchCount > 1) && (
                  <span className="block text-[12px] text-[#8a8273] truncate">
                    {loc.branchCount > 1 ? `${loc.branchCount} branches · ` : ""}
                    {loc.address}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
      <div>
        <label className="font-mono-spline text-[10px] uppercase tracking-wider text-[#9b927f] block mb-1.5">
          Or enter a different location
        </label>
        <LocationInput value={value} onChange={onChange} onEnter={onEnter} placeholder="e.g. Manchester, UK" invalid={invalid} />
      </div>
    </div>
  );
}
