"use client";

import { useState } from "react";
import { Plus, Trash2, Edit, Building2, Tag, MapPin, Globe, CheckCircle2, X } from "lucide-react";
import { useBusiness } from "../../context/BusinessContext";
import type { Business } from "../../context/BusinessContext";
import { useToast } from "../../context/ToastContext";
import { fetchApi } from "../../lib/api";

const DEFAULT_QG = { branded: 5, nonBranded: 5, localSeo: 5, broadSeo: 5 };
type QG = typeof DEFAULT_QG;

function TagList({ items, onRemove }: { items: string[]; onRemove: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {items.map((item) => (
        <span key={item} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#15463b] bg-[#eef3f0] border border-[#d0e4d6] px-2 py-0.5 rounded-lg">
          {item}
          <button type="button" onClick={() => onRemove(item)} className="text-[#9b927f] hover:text-[#b1442a]"><X className="w-2.5 h-2.5" /></button>
        </span>
      ))}
    </div>
  );
}

function QGSlider({ label, desc, value, onChange }: { label: string; desc: string; value: number; onChange: (v: string) => void }) {
  return (
    <div className="bg-[#fdfcf8] border border-[#ece3d1] rounded-xl p-3.5">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-[13px] text-[#23211b]">{label}</span>
        <span className="font-mono-spline font-bold text-[13px] text-[#15463b]">{value}</span>
      </div>
      <p className="text-[11px] text-[#9b927f] mb-2 leading-relaxed">{desc}</p>
      <input type="range" min={0} max={20} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full accent-[#15463b]" />
    </div>
  );
}

const AVATAR_COLORS = [
  { bg: "bg-[#eef3f0]", text: "text-[#15463b]" },
  { bg: "bg-[#f5f0e6]", text: "text-[#9a6a12]" },
  { bg: "bg-[#efe9fb]", text: "text-[#5b4f86]" },
  { bg: "bg-[#fdeef1]", text: "text-[#a86d7e]" },
];

export default function BusinessProfilesPanel() {
  const { activeBusiness, businesses, switchBusiness, refetchBusinesses } = useBusiness();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formLogoUrl, setFormLogoUrl] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formAiDesc, setFormAiDesc] = useState("");
  const [formServices, setFormServices] = useState("");
  const [formAudience, setFormAudience] = useState("");
  const [formCompetitors, setFormCompetitors] = useState<string[]>([]);
  const [formCompInput, setFormCompInput] = useState("");
  const [formSystemCompetitors, setFormSystemCompetitors] = useState<NonNullable<Business["systemCompetitors"]>>([]);
  const [formPages, setFormPages] = useState<string[]>([]);
  const [formPageInput, setFormPageInput] = useState("");
  const [formQG, setFormQG] = useState<QG>(DEFAULT_QG);

  const qgTotal = formQG.branded + formQG.nonBranded + formQG.localSeo + formQG.broadSeo;

  const normalizeQG = (value: QG): QG => {
    const next: QG = {
      branded: Math.max(0, Math.min(20, Math.round(Number(value.branded) || 0))),
      nonBranded: Math.max(0, Math.min(20, Math.round(Number(value.nonBranded) || 0))),
      localSeo: Math.max(0, Math.min(20, Math.round(Number(value.localSeo) || 0))),
      broadSeo: Math.max(0, Math.min(20, Math.round(Number(value.broadSeo) || 0))),
    };
    const total = next.branded + next.nonBranded + next.localSeo + next.broadSeo;
    return total === 20 ? next : DEFAULT_QG;
  };

  const updateQG = (key: keyof QG, raw: string) => {
    const next = Math.max(0, Math.min(20, Number(raw) || 0));
    setFormQG((cur) => ({ ...cur, [key]: next }));
  };

  const addItem = (list: string[], set: (v: string[]) => void, val: string, inputSet: (v: string) => void, limit = 10) => {
    const v = val.trim().toLowerCase();
    if (!v || list.includes(v) || list.length >= limit) return;
    set([...list, v]);
    inputSet("");
  };

  const openEdit = (p: Business) => {
    setEditId(p.id);
    setFormName(p.name); setFormUrl(p.url); setFormCategory(p.category);
    setFormLocation(p.location); setFormLogoUrl(p.logoUrl || "");
    setFormDesc(p.description || ""); setFormAiDesc(p.aiDescription || "");
    setFormServices(p.services || ""); setFormAudience(p.targetAudience || "");
    setFormCompetitors(p.competitors || []); setFormPages(p.trackedPages || []);
    setFormSystemCompetitors(p.systemCompetitors || []);
    setFormQG(p.questionGeneration ?? DEFAULT_QG);
    setIsEditing(true);
  };

  const openAdd = () => {
    setEditId(null);
    setFormName(""); setFormUrl(""); setFormCategory(""); setFormLocation(""); setFormLogoUrl("");
    setFormDesc(""); setFormAiDesc(""); setFormServices(""); setFormAudience("");
    setFormCompetitors([]); setFormPages([]); setFormQG(DEFAULT_QG);
    setFormSystemCompetitors([]);
    setIsEditing(true);
  };

  const handleDelete = async (id: string, name: string) => {
    // This is a hard, permanent delete on the backend (a single
    // delete_one with no soft-delete or archival) that also takes every
    // scan, score history, and tracked question tied to this business
    // with it — there was previously no confirmation at all before this
    // fired, one click on a small icon button sitting directly next to
    // the same-size Edit button.
    const confirmed = window.confirm(
      `Delete "${name}"? This permanently removes its score history, tracked questions, and blog drafts. This can't be undone.`
    );
    if (!confirmed) return;

    try {
      await fetchApi(`/api/user/businesses/${id}`, { method: "DELETE" });
      showToast("Business profile deleted successfully!", "info");
      await refetchBusinesses();
    } catch (err) {
      console.error("Delete business error:", err);
      showToast("Could not delete this business profile. Please try again.", "error");
      await refetchBusinesses();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) return;

    const formattedUrl = formUrl.trim().startsWith("http") ? formUrl.trim() : `https://${formUrl.trim()}`;
    const servicesList = typeof formServices === "string" 
      ? formServices.split(",").map((s) => s.trim()).filter(Boolean)
      : formServices;

    const normalizedQG = normalizeQG(formQG);
    const payload = {
      url: formattedUrl,
      businessName: formName.trim(),
      category: formCategory.trim(),
      location: formLocation.trim(),
      logoUrl: formLogoUrl.trim(),
      businessDescription: formDesc.trim(),
      aiDescription: formAiDesc.trim(),
      services: servicesList,
      targetAudience: formAudience.trim(),
      questionGeneration: normalizedQG,
      competitors: formCompetitors,
      trackedPages: formPages,
      business_id: editId || undefined,
    };

    try {
      setIsSubmitting(true);
      const saved = await fetchApi<{ id?: string }>("/api/user/businesses", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      showToast(editId ? "Business profile updated!" : "New business profile created!", "success");
      await refetchBusinesses();
      // Adding a new profile (not editing the existing one) never switched
      // to it — the active business stayed whatever it was before, so
      // navigating to Overview right after "adding a new business" was
      // actually still showing the previous business's real, already-scanned
      // data. A newly created profile should become the active one.
      if (!editId && saved?.id) {
        switchBusiness(saved.id);
      }
      setIsEditing(false);
    } catch (err) {
      console.error("Save business error:", err);
      showToast("Could not save this business profile. Please check the details and try again.", "error");
      await refetchBusinesses();
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Edit / Add Form ──────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="bg-white border border-[#ece3d1] rounded-[18px] p-4 sm:p-6 shadow-xs space-y-6">
        <div className="flex justify-between items-center border-b border-[#efe7d6] pb-4">
          <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">{editId ? "Edit Business Profile" : "New Business Profile"}</h3>
          <button type="button" onClick={() => setIsEditing(false)} className="text-[13px] text-[#8a8273] hover:text-[#23211b] cursor-pointer">Cancel</button>
        </div>

        {/* Core Details */}
        <div className="space-y-3">
          <h4 className="font-spectral text-[15px] font-semibold text-[#15463b]">Core Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Business Name", val: formName, set: setFormName, ph: "Acme Inc.", req: true },
              { label: "Website URL", val: formUrl, set: setFormUrl, ph: "https://example.com/", req: true },
              { label: "Category", val: formCategory, set: setFormCategory, ph: "e.g. Restaurant, Consulting" },
              { label: "Location", val: formLocation, set: setFormLocation, ph: "e.g. Austin, TX" },
            ].map(({ label, val, set, ph, req }) => (
              <div key={label}>
                <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">{label}</label>
                <input value={val} onChange={(e) => set(e.target.value)} required={req} placeholder={ph}
                  className="w-full text-[13.5px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none focus:border-[#15463b] transition-colors" />
              </div>
            ))}
          </div>
        </div>

        {/* AI Training */}
        <div className="space-y-3">
          <h4 className="font-spectral text-[15px] font-semibold text-[#15463b]">AI Description &amp; Details</h4>
          <div>
            <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">Business description</label>
            <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} placeholder="What does this business do?"
              className="w-full text-[13.5px] p-3 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none resize-none" />
          </div>
          <div>
            <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">AI Description</label>
            <textarea value={formAiDesc} onChange={(e) => setFormAiDesc(e.target.value)} rows={3} placeholder="AI training prompt description..."
              className="w-full text-[13.5px] p-3 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none resize-none" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">Services</label>
              <input value={formServices} onChange={(e) => setFormServices(e.target.value)} placeholder="Dining, boutique hotel rooms"
                className="w-full text-[13.5px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none" />
            </div>
            <div>
              <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">Target audience</label>
              <input value={formAudience} onChange={(e) => setFormAudience(e.target.value)} placeholder="Couples, food lovers, travelers"
                className="w-full text-[13.5px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none" />
            </div>
          </div>
        </div>

        {/* Question Generation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-spectral text-[15px] font-semibold text-[#15463b]">Question Generation Ratios</h4>
            <span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-lg ${qgTotal === 20 ? "bg-[#dcefe2] text-[#1e7d4f]" : "bg-[#f7e7c4] text-[#9a6a12]"}`}>
              {qgTotal}/20
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <QGSlider label="Branded" desc="Uses business name." value={formQG.branded} onChange={(v) => updateQG("branded", v)} />
            <QGSlider label="Non-Branded" desc="Category searches." value={formQG.nonBranded} onChange={(v) => updateQG("nonBranded", v)} />
            <QGSlider label="Local SEO" desc="Location-focused." value={formQG.localSeo} onChange={(v) => updateQG("localSeo", v)} />
            <QGSlider label="Broad SEO" desc="Nearby-area searches." value={formQG.broadSeo} onChange={(v) => updateQG("broadSeo", v)} />
          </div>
        </div>

        {/* Tracking Setup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <h4 className="font-spectral text-[15px] font-semibold text-[#15463b]">Tracked Competitors</h4>
            <TagList items={formCompetitors} onRemove={(v) => setFormCompetitors(formCompetitors.filter((x) => x !== v))} />
            <div className="flex gap-2 mt-2">
              <input value={formCompInput} onChange={(e) => setFormCompInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(formCompetitors, setFormCompetitors, formCompInput, setFormCompInput, 5))}
                placeholder="competitor.co.uk"
                className="flex-1 text-[13px] p-2 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none" />
              <button type="button" onClick={() => addItem(formCompetitors, setFormCompetitors, formCompInput, setFormCompInput, 5)}
                className="bg-[#15463b] text-white text-[12px] font-semibold px-3 py-2 rounded-lg border-none cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {formSystemCompetitors.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#ece3d1]">
                <p className="text-[11px] font-semibold text-[#9b927f] uppercase tracking-wide mb-1.5">
                  Found by AI while tracking
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {formSystemCompetitors.map((c, i) => (
                    <span key={c.domain || i} className="inline-flex items-center gap-1 text-[12px] font-medium text-[#4a4437] bg-[#f6f3ec] border border-[#ece3d1] px-2 py-0.5 rounded-lg">
                      {c.domain}{typeof c.score === "number" ? ` · ${c.score}/100` : ""}
                    </span>
                  ))}
                </div>
                <p className="text-[10.5px] text-[#9b927f] mt-1.5">
                  Updates automatically from your Search Tracker runs — not editable here.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="font-spectral text-[15px] font-semibold text-[#15463b]">Tracked Pages</h4>
            <TagList items={formPages} onRemove={(v) => setFormPages(formPages.filter((x) => x !== v))} />
            <div className="flex gap-2 mt-2">
              <input value={formPageInput} onChange={(e) => setFormPageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(formPages, setFormPages, formPageInput, setFormPageInput, 5))}
                placeholder="/menu"
                className="flex-1 text-[13px] p-2 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none" />
              <button type="button" onClick={() => addItem(formPages, setFormPages, formPageInput, setFormPageInput, 5)}
                className="bg-[#15463b] text-white text-[12px] font-semibold px-3 py-2 rounded-lg border-none cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="pt-3 flex gap-3">
          <button type="submit" disabled={isSubmitting} className="bg-[#15463b] text-white text-[13.5px] font-semibold px-6 py-2.5 rounded-xl border-none cursor-pointer disabled:opacity-50 hover:bg-[#1a5c44] transition-colors">
            {isSubmitting ? "Saving..." : "Save Business Profile"}
          </button>
          <button type="button" onClick={() => setIsEditing(false)} className="bg-[#f5f0e6] text-[#6f6757] text-[13.5px] font-semibold px-5 py-2.5 rounded-xl border-none cursor-pointer hover:bg-[#ede5d4] transition-colors">
            Cancel
          </button>
        </div>
      </form>
    );
  }

  // ── Sleek, Minimal, Modern Card Grid ───────────────────────────────────────
  return (
    <div className="bg-white border border-[#ece3d1] rounded-[22px] p-4 sm:p-6 shadow-xs">
      {/* Header Container */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-[#efe7d6] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#e8f2ee] text-[#15463b] flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <h3 className="font-spectral text-[22px] font-semibold text-[#15463b]">Business Profiles</h3>
          </div>
          <p className="text-[13px] text-[#8a8273] mt-1">
            Manage your Wonderscore business profiles and keep your dashboard settings synchronized.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <span className="text-[12px] font-semibold text-[#15463b] bg-[#eef3f0] border border-[#d0e4d6] px-3 py-1 rounded-full">
            {businesses.length} / 3 SAVED
          </span>
          <button
            onClick={openAdd}
            disabled={businesses.length >= 3}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#15463b] bg-[#fdfcf8] hover:bg-white hover:border-[#15463b] border border-[#e2d8c4] px-4 py-2 rounded-xl cursor-pointer transition-all disabled:opacity-40 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Profile</span>
          </button>
        </div>
      </div>

      {businesses.length === 0 && (
        <div className="flex flex-col items-center text-center py-10 gap-2">
          <div className="w-11 h-11 rounded-xl bg-[#f6f3ec] border border-[#ece3d1] flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#9b927f]" />
          </div>
          <p className="text-[13.5px] font-semibold text-[#23211b]">No business profiles yet</p>
          <p className="text-[12.5px] text-[#8a8273] max-w-[320px]">
            Add your first business to start tracking its AI visibility.
          </p>
        </div>
      )}

      {/* Grid of Minimal & Modern Business Profile Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {businesses.map((p, idx) => {
          const isActive = p.id === activeBusiness.id;
          const pct = p.completeness || 0;
          const colorTheme = AVATAR_COLORS[idx % AVATAR_COLORS.length];
          const formattedUrl = p.url.startsWith("http") ? p.url : `https://${p.url}`;

          return (
            <div
              key={p.id}
              className={`relative rounded-2xl p-5 md:p-6 transition-all duration-200 flex flex-col justify-between ${
                isActive
                  ? "bg-white border-2 border-[#15463b] shadow-[0_8px_24px_rgba(21,70,59,0.08)]"
                  : "bg-[#fdfcf8] border border-[#ece3d1] hover:border-[#d9cbaf] hover:shadow-xs"
              }`}
            >
              {/* Sleek Top Badge for Active Card */}
              {isActive && (
                <div className="absolute -top-3 left-6 bg-[#15463b] text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
                  Active Profile
                </div>
              )}

              <div>
                {/* Header: Initial Avatar, Name, URL & Actions */}
                <div className="flex items-start justify-between gap-3 mb-4 pt-1">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center font-spectral font-bold text-[19px] border border-[#ece3d1]/60 shadow-2xs ${colorTheme.bg} ${colorTheme.text}`}
                    >
                      {p.initial || p.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="font-spectral text-[18px] font-semibold text-[#15463b] truncate leading-tight">
                        {p.name}
                      </h4>
                      <a
                        href={formattedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[12.5px] text-[#6f6757] hover:text-[#15463b] font-normal truncate block mt-0.5"
                      >
                        {formattedUrl}
                      </a>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {!isActive && (
                      <button
                        onClick={() => switchBusiness(p.id)}
                        className="text-[12px] font-medium text-white bg-[#15463b] hover:bg-[#10362d] px-3 py-1 rounded-lg transition-all cursor-pointer border-none shadow-xs"
                      >
                        Activate
                      </button>
                    )}
                    <button
                      onClick={() => openEdit(p)}
                      className="p-1.5 text-[#8a8273] hover:text-[#15463b] hover:bg-[#f5f0e6] rounded-lg transition-colors cursor-pointer border-none"
                      title="Edit profile"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {!isActive && (
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="p-1.5 text-[#8a8273] hover:text-[#b1442a] hover:bg-[#fdf2f0] rounded-lg transition-colors cursor-pointer border-none"
                        title="Delete profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Metadata Chips (Category & Location) */}
                <div className="flex items-center gap-2 flex-wrap mb-4 text-[12px]">
                  <span className="inline-flex items-center gap-1.5 bg-[#f6f3ec] border border-[#ece3d1] px-2.5 py-1 rounded-lg text-[#3a352b] font-medium">
                    <Tag className="w-3.5 h-3.5 text-[#15463b]" />
                    {p.category || "General"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-[#f6f3ec] border border-[#ece3d1] px-2.5 py-1 rounded-lg text-[#3a352b] font-medium">
                    <MapPin className="w-3.5 h-3.5 text-[#15463b]" />
                    {p.location || "UK"}
                  </span>
                </div>

                {/* Clean Completeness Progress Bar */}
                <div className="bg-[#f9f7f2] border border-[#efe7d6] rounded-xl p-3 mb-4">
                  <div className="flex items-center justify-between text-[11.5px] mb-1.5">
                    <span className="font-mono-spline font-medium uppercase text-[#8a8273]">Profile Completeness</span>
                    <span className="font-mono-spline font-bold text-[#15463b]">{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#e5ddd0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#15463b] rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom AI Description Footer */}
              <div className="pt-3 border-t border-[#efe7d6] text-[12px]">
                <span className="font-mono-spline text-[9.5px] uppercase font-bold text-[#9b927f] block mb-1">
                  AI Context Description
                </span>
                <p className="line-clamp-2 leading-relaxed text-[#554e41]">
                  {p.aiDescription || p.description || "No custom AI prompt trained yet."}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
