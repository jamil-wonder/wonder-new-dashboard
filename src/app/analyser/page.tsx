"use client";

import React, { useState } from "react";
import {
  Globe, MapPin, Tag, RefreshCw, CheckCircle2, XCircle, AlertCircle,
  Phone, Mail, Clock, Link2, FileCode2, Cpu, ShieldCheck, Smartphone,
  FileSearch, Bot, BrainCircuit, MessageSquare, Sparkles, ArrowRight,
  Building2, Languages, Image as ImageIcon, BookOpen, TrendingUp
} from "lucide-react";
import { MOCK_AUDIT_AREAS, MOCK_COMPETITORS } from "../../constants/mockData";
import ScanProgressModal from "../../components/analyser/ScanProgressModal";
import { useToast } from "../../context/ToastContext";

// ── Mock scan result data ──────────────────────────────────────────────────
const SCAN = {
  businessName: "Meridian & Co.",
  url: "meridian.co",
  category: "Professional Services",
  location: "Bristol, UK",
  description: "Premier corporate advisory firm in Bristol helping clients solve complex operational structures.",
  canonicalUrl: "https://meridian.co",
  language: "en",
  hasSSL: true,
  hasMobileMeta: true,
  sitemapFound: true,
  robotsTxtFound: true,
  emails: ["hello@meridian.co"],
  phones: ["+44 117 900 1234"],
  addresses: ["14 Broad Quay, Bristol, BS1 4DA"],
  openingHours: ["Mon–Fri 09:00–17:30"],
  socialLinks: { linkedin: "linkedin.com/company/meridian", twitter: "twitter.com/meridianuk" },
  schemas: [{ "@type": "LocalBusiness" }],
  hasBooking: false,
  logoFound: true,
  technologies: ["Next.js", "Cloudflare", "Google Analytics", "HubSpot"],
  scores: {
    total: 78,
    grade: "B+",
    coreIdentity: { total: 82, businessName: 20, description: 18, logo: 20, language: 24 },
    contact: { total: 70, phone: 25, email: 25, address: 20 },
    operating: { total: 60, hoursVisible: 30, hoursStructured: 30 },
    trust: { total: 65, socialLinks: 35, booking: 30 },
    schema: { total: 55, present: 20, correctType: 20, keyFields: 15 },
    technical: { total: 90, ssl: 20, mobile: 20, canonical: 20, sitemap: 15, robots: 15 },
  },
};

const AI_INSIGHTS = [
  {
    model: "ChatGPT",
    icon: "/icons/chatgpt.svg",
    confidence: "High",
    confidenceColor: "#1e7d4f",
    confidenceBg: "#dcefe2",
    summary: "ChatGPT has crawled your domain and successfully linked your brand name to your Bristol location. It has indexed your LocalBusiness schema structure.",
    verifiedFields: ["Name", "URL", "Category", "Location", "Email"],
    missingFields: ["Phone", "Hours"]
  },
  {
    model: "Claude",
    icon: "/icons/claude.svg",
    confidence: "Medium",
    confidenceColor: "#9a6a12",
    confidenceBg: "#f7e7c4",
    summary: "Claude recognizes your core domain but has low confidence regarding specific physical services. Structured citation references are needed to strengthen the entity map.",
    verifiedFields: ["Name", "URL", "Location"],
    missingFields: ["Category", "Phone", "Hours"]
  },
  {
    model: "Perplexity",
    icon: "/icons/perplexity.svg",
    confidence: "High",
    confidenceColor: "#1e7d4f",
    confidenceBg: "#dcefe2",
    summary: "Perplexity has successfully resolved your entity details via active Google Business API citation links. Domain mapping and canonical URLs match correctly.",
    verifiedFields: ["Name", "URL", "Category", "Location", "Phone"],
    missingFields: ["Hours", "Socials"]
  },
  {
    model: "Gemini",
    icon: "/icons/gemini.svg",
    confidence: "Low",
    confidenceColor: "#b1442a",
    confidenceBg: "#f6dcd5",
    summary: "Gemini shows weak entity linking for Bristol advisory services. Absence of localized JSON-LD schemas on tracked sub-pages limits its indexing scope.",
    verifiedFields: ["Name", "URL"],
    missingFields: ["Category", "Location", "Phone", "Hours", "Socials"]
  }
];

function StatusIcon({ ok, warn }: { ok?: boolean; warn?: boolean }) {
  if (warn) return <AlertCircle className="w-4 h-4 text-[#d6a23a] shrink-0" />;
  return ok
    ? <CheckCircle2 className="w-4 h-4 text-[#1e7d4f] shrink-0" />
    : <XCircle className="w-4 h-4 text-[#d9694a] shrink-0" />;
}

const ICON_MAP: Record<string, React.ElementType> = {
  MessageSquare, BookOpen, FileCode2, Building2, FileSearch, Cpu,
};

export default function AnalyserPage() {
  const { showToast } = useToast();
  const [isScanning, setIsScanning] = useState(false);

  const handleStartScan = React.useCallback(() => {
    setIsScanning(true);
    showToast("Starting sitemap audit crawl...", "info");
  }, [showToast]);

  const handleScanComplete = React.useCallback(() => {
    setIsScanning(false);
    showToast("Sitemap audit crawl completed successfully! Your Wonder Score is up to date.", "success");
  }, [showToast]);

  return (
    <div className="space-y-5 pb-12 relative">
      
      {/* ── Scan Progress Modal ── */}
      <ScanProgressModal
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onComplete={handleScanComplete}
      />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border border-[#ece3d1] rounded-[18px] p-6 md:p-[28px_32px] shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#ece3d1] pb-5 mb-5">
          <div>
            <h1 className="font-spectral text-[28px] font-semibold text-[#15463b]">AI Visibility Analyser</h1>
            <p className="text-[14px] text-[#6f6757] mt-1 max-w-[520px] leading-relaxed">
              Sitemaps, schema, entity signals, crawler permissions, and how each AI model sees your business.
            </p>
          </div>
          <button
            onClick={handleStartScan}
            disabled={isScanning}
            className="pb inline-flex items-center gap-2 bg-[#15463b] text-white text-[13.5px] font-semibold px-5 py-2.5 rounded-xl border-none hover:bg-[#1a5c44] transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "Crawling..." : "Re-run crawl"}
          </button>
        </div>

        {/* Config pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {[
            { icon: Globe, label: "Domain", value: SCAN.url },
            { icon: Tag, label: "Category", value: SCAN.category },
            { icon: MapPin, label: "Location", value: SCAN.location },
            { icon: Languages, label: "Language", value: SCAN.language.toUpperCase() },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 bg-[#fdfcf8] border border-[#ece3d1] rounded-xl p-3.5">
              <Icon className="w-4 h-4 text-[#9b927f] shrink-0" />
              <div>
                <div className="font-mono-spline text-[9.5px] tracking-wider uppercase text-[#9b927f]">{label}</div>
                <div className="text-[14px] font-bold text-[#23211b] mt-0.5">{value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Overall Score + Area Breakdown ──────────────────────────────── */}
      <div className={`grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 transition-all duration-300 ${isScanning ? "opacity-75 blur-[1px]" : ""}`}>

        {/* Score card */}
        <div className="bg-[#15463b] rounded-[18px] p-6 text-white flex flex-col justify-between">
          <div>
            <div className="font-mono-spline text-[10px] tracking-[0.16em] uppercase text-[#86b89f]">Overall Score</div>
            
            <div className="flex items-center justify-between gap-2 mt-3.5">
              <div className="flex items-baseline gap-0.5">
                <span className="font-spectral text-[72px] leading-none font-semibold">{SCAN.scores.total}</span>
                <span className="font-spectral text-[17px] text-[#7fae97]">/100</span>
              </div>

              {/* Circle progress ring with trend icon */}
              <div className="relative w-[80px] h-[80px] shrink-0">
                <svg width="80" height="80" viewBox="0 0 80 80" className="block">
                  <circle cx="40" cy="40" r="33" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="8" />
                  <circle cx="40" cy="40" r="33" fill="none" stroke="#a8d860" strokeWidth="8"
                    strokeLinecap="round" strokeDasharray="161.7 207.3" transform="rotate(-90 40 40)" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-[#a8d860]" />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[#3a2e08] bg-[#f0d878] px-3 py-1 rounded-full">
                Grade {SCAN.scores.grade} · Good visibility
              </span>
            </div>
          </div>
          <div className="mt-6 space-y-2.5">
            {[
              { label: "Core Identity",  val: SCAN.scores.coreIdentity.total },
              { label: "Contact Info",   val: SCAN.scores.contact.total },
              { label: "Schema",         val: SCAN.scores.schema.total },
              { label: "Technical",      val: SCAN.scores.technical.total },
            ].map(({ label, val }) => (
              <div key={label}>
                <div className="flex justify-between text-[11.5px] mb-1">
                  <span className="text-[#86b89f]">{label}</span>
                  <span className="font-bold text-white">{val}</span>
                </div>
                <div className="h-[4px] bg-white/15 rounded-full overflow-hidden">
                  <div className="h-full bg-[#a8d860] rounded-full" style={{ width: `${val}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6 Audit Area bars */}
        <div className="bg-[#fdfcf8] border border-[#ece3d1] rounded-[18px] p-5 md:p-[22px_26px]">
          <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f] mb-5">
            Score Breakdown · 6 Weighted Audit Areas
          </div>
          <div className="flex flex-col gap-4">
            {MOCK_AUDIT_AREAS.map((item) => {
              const IconComponent = ICON_MAP[item.iconName] || FileCode2;
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: item.statusBg }}>
                    <IconComponent className="w-4 h-4" style={{ color: item.statusColor }} />
                  </div>
                  <span className="w-[160px] text-[13.5px] text-[#23211b] font-medium truncate shrink-0">{item.label}</span>
                  <div className="flex-1 h-[7px] bg-[#eee9de] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${item.score}%`, backgroundColor: item.barColor }} />
                  </div>
                  <span className="num text-[13px] font-bold text-[#23211b] w-[50px] text-right shrink-0">
                    {item.score}<span className="text-[#b3a98f] font-normal">/100</span>
                  </span>
                  <span className="font-mono-spline text-[8px] font-semibold tracking-wider px-2 py-1 rounded text-center w-[68px] shrink-0"
                    style={{ color: item.statusColor, backgroundColor: item.statusBg }}>
                    {item.statusText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── AI Model Insights ───────────────────────────────────────────── */}
      <div className={`bg-white border border-[#ece3d1] rounded-[18px] p-5 md:p-[22px_26px] shadow-sm transition-all duration-300 ${isScanning ? "opacity-75 blur-[1px]" : ""}`}>
        <div className="flex items-center gap-2 mb-5">
          <BrainCircuit className="w-4 h-4 text-[#15463b]" />
          <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f]">
            AI Model Insights · How each model sees this business
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {AI_INSIGHTS.map((ai) => {
            return (
              <div key={ai.model} className="border border-[#ece3d1] rounded-xl p-4 flex flex-col gap-3 bg-[#fdfcf8]">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 shrink-0 flex items-center justify-center overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ai.icon} alt={ai.model} className="w-6 h-6 object-contain" />
                    </div>
                    <span className="font-semibold text-[13.5px] text-[#23211b]">{ai.model}</span>
                  </div>
                  <span className="text-[9.5px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full shrink-0"
                    style={{ color: ai.confidenceColor, backgroundColor: ai.confidenceBg }}>
                    {ai.confidence}
                  </span>
                </div>
                <p className="text-[12px] text-[#6f6757] leading-relaxed min-h-[72px]">{ai.summary}</p>
                
                {/* Verified vs Missing Entity parameters */}
                <div className="border-t border-[#f0ebe0] pt-2.5 mt-auto">
                  <div className="text-[9.5px] uppercase font-mono-spline text-[#9b927f] tracking-wide mb-1.5">Verified Parameters</div>
                  <div className="flex flex-wrap gap-1">
                    {ai.verifiedFields.map((field) => (
                      <span key={field} className="text-[10px] font-semibold text-[#1e7d4f] bg-[#dcefe2] px-1.5 py-0.5 rounded">
                        ✓ {field}
                      </span>
                    ))}
                    {ai.missingFields.slice(0, 2).map((field) => (
                      <span key={field} className="text-[10px] font-semibold text-[#c0513a] bg-[#f6dcd5] px-1.5 py-0.5 rounded">
                        ✗ {field}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Entity & Contact Signals + Technical Readiness ─────────────── */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-4 transition-all duration-300 ${isScanning ? "opacity-75 blur-[1px]" : ""}`}>

        {/* Entity & Contact Signals */}
        <div className="bg-white border border-[#ece3d1] rounded-[18px] p-5 md:p-[22px_26px] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[#15463b]" />
            <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f]">Entity &amp; Contact Signals</div>
          </div>
          <div className="space-y-3">
            {[
              { icon: Building2,  label: "Business name",    value: SCAN.businessName, ok: true },
              { icon: MessageSquare, label: "Description",   value: SCAN.description.slice(0, 55) + "…", ok: true },
              { icon: ImageIcon,  label: "Logo detected",    value: "Logo found in markup", ok: true },
              { icon: Phone,      label: "Phone",            value: SCAN.phones[0], ok: SCAN.phones.length > 0 },
              { icon: Mail,       label: "Email",            value: SCAN.emails[0], ok: SCAN.emails.length > 0 },
              { icon: MapPin,     label: "Address",          value: SCAN.addresses[0], ok: SCAN.addresses.length > 0 },
              { icon: Clock,      label: "Opening hours",    value: SCAN.openingHours[0] || "Not found", ok: SCAN.openingHours.length > 0 },
              { icon: Link2,      label: "Social links",     value: Object.keys(SCAN.socialLinks).join(", ") || "None found", ok: Object.keys(SCAN.socialLinks).length > 0 },
              { icon: BookOpen,   label: "Booking path",     value: SCAN.hasBooking ? "Found" : "Not detected", ok: SCAN.hasBooking, warn: !SCAN.hasBooking },
            ].map(({ icon: Icon, label, value, ok, warn }) => (
              <div key={label} className="flex items-start gap-3 py-2 border-b border-[#f0ebe0] last:border-0">
                <div className="w-7 h-7 rounded-lg bg-[#f5f0e6] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-[#7a7363]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-[#23211b]">{label}</div>
                  <div className="text-[12px] text-[#8a8273] truncate mt-0.5">{value}</div>
                </div>
                <StatusIcon ok={ok} warn={warn} />
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Technical + Schema + Competitors */}
        <div className="flex flex-col gap-4">

          {/* Technical Readiness */}
          <div className="bg-white border border-[#ece3d1] rounded-[18px] p-5 md:p-[22px_26px] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-[#15463b]" />
              <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f]">Technical Readiness</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { icon: ShieldCheck, label: "HTTPS / SSL",        ok: SCAN.hasSSL },
                { icon: Smartphone,  label: "Mobile viewport",     ok: SCAN.hasMobileMeta },
                { icon: Globe,       label: "Canonical URL",       ok: !!SCAN.canonicalUrl },
                { icon: FileSearch,  label: "Sitemap.xml",         ok: SCAN.sitemapFound },
                { icon: Bot,         label: "Robots.txt",          ok: SCAN.robotsTxtFound },
                { icon: Bot,         label: "GPTBot permitted",    ok: true },
                { icon: Bot,         label: "ClaudeBot permitted", ok: true },
                { icon: Bot,         label: "PerplexityBot",       ok: true },
              ].map(({ icon: Icon, label, ok }) => (
                <div key={label} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#fdfcf8] border border-[#ece3d1]">
                  <Icon className="w-3.5 h-3.5 text-[#9b927f] shrink-0" />
                  <span className="flex-1 text-[13px] text-[#23211b]">{label}</span>
                  <StatusIcon ok={ok} />
                </div>
              ))}
            </div>
          </div>

          {/* Schema */}
          <div className="bg-white border border-[#ece3d1] rounded-[18px] p-5 md:p-[22px_26px] shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <FileCode2 className="w-4 h-4 text-[#15463b]" />
              <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f]">Schema / Structured Data</div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: "JSON-LD present",     ok: SCAN.schemas.length > 0 },
                { label: "LocalBusiness type",  ok: SCAN.schemas.some(s => String(s["@type"]).includes("Business")) },
                { label: "Name field",           ok: true },
                { label: "Address field",        ok: SCAN.addresses.length > 0 },
                { label: "Telephone field",      ok: SCAN.phones.length > 0 },
                { label: "Opening hours spec",   ok: false, warn: true },
                { label: "sameAs (socials)",     ok: Object.keys(SCAN.socialLinks).length > 0 },
              ].map(({ label, ok, warn }) => (
                <div key={label} className="flex items-center justify-between py-1.5 border-b border-[#f0ebe0] last:border-0">
                  <span className="text-[13px] text-[#23211b]">{label}</span>
                  <StatusIcon ok={ok} warn={warn} />
                </div>
              ))}
            </div>
          </div>

          {/* Technologies detected */}
          <div className="bg-[#fdfcf8] border border-[#ece3d1] rounded-[18px] p-5 md:p-[18px_22px] shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-4 h-4 text-[#15463b]" />
              <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9b927f]">Technologies detected</div>
            </div>
            <div className="flex flex-wrap gap-2">
              {SCAN.technologies.map((tech) => (
                <span key={tech} className="text-[12px] font-medium text-[#3a352b] bg-[#f0ebe0] border border-[#e4ddd0] px-2.5 py-1 rounded-lg">{tech}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Competitor Score Comparison ─────────────────────────────────── */}
      <div className={`bg-[#faf3e2] border border-[#efe3c8] rounded-[18px] p-5 md:p-[22px_26px] transition-all duration-300 ${isScanning ? "opacity-75 blur-[1px]" : ""}`}>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-[#9a8a5e]" />
            <div className="font-mono-spline text-[10px] tracking-[0.14em] uppercase text-[#9a8a5e]">
              Competitor Score Comparison
            </div>
          </div>
          <span className="text-[12.5px] text-[#8a8273]">3 points behind #1 · Castleford Group</span>
        </div>
        <div className="flex flex-col gap-2">
          {MOCK_COMPETITORS.map((comp) => (
            <div key={comp.rank} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              comp.isUser ? "bg-white shadow-[0_1px_4px_rgba(60,48,28,0.08)] border border-[#ece3d1]" : "hover:bg-[#f6eee0]"
            }`}>
              <span className={`num text-[12px] w-4 text-center shrink-0 ${comp.isUser ? "text-[#1a5c44] font-bold" : "text-[#9b927f]"}`}>{comp.rank}</span>
              <span className={`flex-1 text-[13.5px] ${comp.isUser ? "text-[#1a5c44] font-bold" : "text-[#23211b]"}`}>
                {comp.name} {comp.isUser && <span className="font-normal text-[#9b927f] text-[11px] ml-1">You</span>}
                {comp.change === "NEW" && <span className="font-mono-spline text-[8.5px] tracking-wider text-[#9a6a12] bg-[#f7e7c4] px-1.5 py-0.5 rounded ml-1.5 align-middle">NEW</span>}
              </span>
              <div className="w-[140px] h-[6px] bg-[#ece0c4] rounded-full overflow-hidden shrink-0">
                <div className={`h-full ${comp.isUser ? "bg-[#1e7d4f]" : "bg-[#c2b69c]"}`} style={{ width: `${comp.score}%` }} />
              </div>
              <span className={`num text-[15px] font-bold w-8 text-right shrink-0 ${comp.isUser ? "text-[#1a5c44]" : "text-[#23211b]"}`}>{comp.score}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
