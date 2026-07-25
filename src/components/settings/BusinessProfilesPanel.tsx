"use client";

import { useState } from "react";
import { Plus, Trash2, Edit, CheckCircle2, X } from "lucide-react";
import { useBusiness } from "../../context/BusinessContext";
import type { Business } from "../../context/BusinessContext";
import { useToast } from "../../context/ToastContext";

const DEFAULT_QG = { branded: 5, nonBranded: 0, localSeo: 15, broadSeo: 0 };
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

export default function BusinessProfilesPanel() {
  const { activeBusiness, businesses, setBusinesses, switchBusiness } = useBusiness();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

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
  const [formPages, setFormPages] = useState<string[]>([]);
  const [formPageInput, setFormPageInput] = useState("");
  const [formQG, setFormQG] = useState<QG>(DEFAULT_QG);

  const qgTotal = formQG.branded + formQG.nonBranded + formQG.localSeo + formQG.broadSeo;

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
    setFormQG(p.questionGeneration ?? DEFAULT_QG);
    setIsEditing(true);
  };

  const openAdd = () => {
    setEditId(null);
    setFormName(""); setFormUrl(""); setFormCategory(""); setFormLocation(""); setFormLogoUrl("");
    setFormDesc(""); setFormAiDesc(""); setFormServices(""); setFormAudience("");
    setFormCompetitors([]); setFormPages([]); setFormQG(DEFAULT_QG);
    setIsEditing(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formUrl.trim()) return;
    const updated: Partial<Business> = {
      name: formName, url: formUrl, category: formCategory, location: formLocation,
      logoUrl: formLogoUrl, description: formDesc, aiDescription: formAiDesc,
      services: formServices, targetAudience: formAudience,
      competitors: formCompetitors, trackedPages: formPages, questionGeneration: formQG,
      completeness: 100, initial: formName.charAt(0).toUpperCase(),
    };
    if (editId) {
      setBusinesses(businesses.map((p) => p.id === editId ? { ...p, ...updated } : p));
      showToast("Business profile updated successfully!");
    } else {
      setBusinesses([...businesses, { id: `biz-${Date.now()}`, completeness: 65, ...updated } as Business]);
      showToast("New business profile added!");
    }
    setIsEditing(false);
  };

  // ── Edit / Add Form ──────────────────────────────────────────────────────────
  if (isEditing) {
    return (
      <form onSubmit={handleSave} className="bg-white border border-[#ece3d1] rounded-[18px] p-6 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-[#efe7d6] pb-4">
          <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">{editId ? "Edit profile" : "New business profile"}</h3>
          <button type="button" onClick={() => setIsEditing(false)} className="text-[13px] text-[#8a8273] hover:text-[#23211b]">Cancel</button>
        </div>

        {/* Core Details */}
        <div className="space-y-3">
          <h4 className="font-spectral text-[15px] font-semibold text-[#15463b]">Core Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Business Name", val: formName, set: setFormName, ph: "Meridian & Co.", req: true },
              { label: "Website URL", val: formUrl, set: setFormUrl, ph: "meridian.co", req: true },
              { label: "Category", val: formCategory, set: setFormCategory, ph: "Professional Services" },
              { label: "Location", val: formLocation, set: setFormLocation, ph: "Bristol, UK" },
              { label: "Logo / Favicon URL", val: formLogoUrl, set: setFormLogoUrl, ph: "https://meridian.co/favicon.ico" },
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
          <h4 className="font-spectral text-[15px] font-semibold text-[#15463b]">AI Training</h4>
          <div>
            <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">Business description</label>
            <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} rows={3} placeholder="What does this business do?"
              className="w-full text-[13.5px] p-3 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none resize-none" />
          </div>
          <div>
            <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">How AI should describe this business</label>
            <textarea value={formAiDesc} onChange={(e) => setFormAiDesc(e.target.value)} rows={3} placeholder="Preferred plain-English description for AI recommendations."
              className="w-full text-[13.5px] p-3 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none resize-none" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">Services</label>
              <input value={formServices} onChange={(e) => setFormServices(e.target.value)} placeholder="Advisory, restructuring, compliance"
                className="w-full text-[13.5px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none" />
            </div>
            <div>
              <label className="font-mono-spline text-[10px] uppercase text-[#8a8273] block mb-1.5">Target audience</label>
              <input value={formAudience} onChange={(e) => setFormAudience(e.target.value)} placeholder="Local executives, business owners"
                className="w-full text-[13.5px] p-2.5 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none" />
            </div>
          </div>
        </div>

        {/* Question Generation */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-spectral text-[15px] font-semibold text-[#15463b]">Question Generation</h4>
            <span className={`text-[11.5px] font-bold px-2.5 py-1 rounded-lg ${qgTotal === 20 ? "bg-[#dcefe2] text-[#1e7d4f]" : "bg-[#f7e7c4] text-[#9a6a12]"}`}>
              {qgTotal}/20
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QGSlider label="Branded" desc="Uses the business name." value={formQG.branded} onChange={(v) => updateQG("branded", v)} />
            <QGSlider label="Non-Branded" desc="Category searches." value={formQG.nonBranded} onChange={(v) => updateQG("nonBranded", v)} />
            <QGSlider label="Local SEO" desc="Location-focused." value={formQG.localSeo} onChange={(v) => updateQG("localSeo", v)} />
            <QGSlider label="Broad SEO" desc="Nearby-area searches." value={formQG.broadSeo} onChange={(v) => updateQG("broadSeo", v)} />
          </div>
        </div>

        {/* Tracking Setup */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Competitors */}
          <div className="space-y-2">
            <h4 className="font-spectral text-[15px] font-semibold text-[#15463b]">Tracked competitors <span className="text-[12px] text-[#9b927f] font-normal">(up to 5)</span></h4>
            <TagList items={formCompetitors} onRemove={(v) => setFormCompetitors(formCompetitors.filter((x) => x !== v))} />
            <div className="flex gap-2 mt-2">
              <input value={formCompInput} onChange={(e) => setFormCompInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(formCompetitors, setFormCompetitors, formCompInput, setFormCompInput, 5))}
                placeholder="competitor.co.uk"
                className="flex-1 text-[13px] p-2 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none" />
              <button type="button" onClick={() => addItem(formCompetitors, setFormCompetitors, formCompInput, setFormCompInput, 5)}
                className="pb bg-[#15463b] text-white text-[12px] font-semibold px-3 py-2 rounded-lg border-none">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Tracked Pages */}
          <div className="space-y-2">
            <h4 className="font-spectral text-[15px] font-semibold text-[#15463b]">Tracked pages <span className="text-[12px] text-[#9b927f] font-normal">(up to 5)</span></h4>
            <TagList items={formPages} onRemove={(v) => setFormPages(formPages.filter((x) => x !== v))} />
            <div className="flex gap-2 mt-2">
              <input value={formPageInput} onChange={(e) => setFormPageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem(formPages, setFormPages, formPageInput, setFormPageInput, 5))}
                placeholder="/services"
                className="flex-1 text-[13px] p-2 border border-[#ece3d1] rounded-lg bg-[#fdfcf8] outline-none" />
              <button type="button" onClick={() => addItem(formPages, setFormPages, formPageInput, setFormPageInput, 5)}
                className="pb bg-[#15463b] text-white text-[12px] font-semibold px-3 py-2 rounded-lg border-none">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <button type="submit" className="pb bg-[#15463b] text-white text-[13px] font-semibold px-6 py-2.5 rounded-lg border-none">
          Save business profile
        </button>
      </form>
    );
  }

  // ── Card Grid ───────────────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-[#ece3d1] rounded-[18px] p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-spectral text-[20px] font-semibold text-[#15463b]">Business Profiles</h3>
          <p className="text-[12.5px] text-[#9b927f] mt-0.5">
            Active: <span className="font-semibold text-[#1e7d4f]">{activeBusiness.name}</span>
          </p>
        </div>
        <button onClick={openAdd} disabled={businesses.length >= 3}
          className="ob inline-flex items-center gap-1.5 border border-[#d8cfbd] bg-[#fdfcf8] text-[#15463b] text-[12.5px] font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40">
          <Plus className="w-3.5 h-3.5" /> Add
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {businesses.map((p) => {
          const isActive = p.id === activeBusiness.id;
          const pct = p.completeness;
          const barColor = pct >= 75 ? "#1e7d4f" : pct >= 50 ? "#d6a23a" : "#c0513a";

          return (
            <div key={p.id} className={`rounded-2xl p-5 flex flex-col gap-3.5 transition-all ${
              isActive ? "bg-[#f4faf6] border-2 border-[#15463b]" : "bg-white border border-[#e4ddd0] hover:border-[#c8c0b0]"
            }`}>

              {/* Top: avatar · name · actions */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center font-spectral font-bold text-[17px] ${
                  isActive ? "bg-[#15463b] text-white" : "bg-[#ede8de] text-[#7a7060]"
                }`}>{p.initial}</div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-spectral font-semibold text-[15.5px] text-[#1c1a16] truncate leading-tight">{p.name}</span>
                    {isActive && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-[#1e7d4f] bg-[#dcefe2] px-1.5 py-0.5 rounded-full shrink-0">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Active
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] text-[#1e7d4f] font-medium">{p.url}</span>
                </div>

                <div className="flex gap-1 shrink-0">
                  {!isActive && (
                    <button onClick={() => switchBusiness(p.id)}
                      className="text-[11.5px] font-semibold text-white bg-[#15463b] border border-[#15463b] px-3 py-1 rounded-lg hover:bg-[#1a5c44] transition-colors">
                      Activate
                    </button>
                  )}
                  <button onClick={() => openEdit(p)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#ece3d1] bg-white text-[#9b927f] hover:text-[#15463b] transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  {!isActive && (
                    <button onClick={() => setBusinesses(businesses.filter((x) => x.id !== p.id))} className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#ece3d1] bg-white text-[#9b927f] hover:text-[#b1442a] transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Bio */}
              <p className="text-[12.5px] text-[#6f6757] leading-relaxed line-clamp-2">
                {p.description || "No description added yet."}
              </p>

              {/* Competitors */}
              {p.competitors && p.competitors.length > 0 && (
                <div>
                  <p className="font-mono-spline text-[9.5px] uppercase tracking-wider text-[#9b927f] mb-1.5">Tracked competitors</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.competitors.map((c) => (
                      <span key={c} className="text-[11.5px] font-medium text-[#3a352b] bg-[#f0ebe0] px-2 py-0.5 rounded-lg">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags + progress */}
              <div className="space-y-2.5 pt-1 border-t border-[#efe7d6]">
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11.5px] font-medium text-[#5c4a1e] bg-[#f7e7c4] px-2.5 py-1 rounded-lg">{p.category}</span>
                  <span className="text-[11.5px] font-medium text-[#3a5068] bg-[#ddeaf5] px-2.5 py-1 rounded-lg">{p.location}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#9b927f] font-mono-spline uppercase tracking-wide">Profile completeness</span>
                  <span className="font-bold" style={{ color: barColor }}>{pct}%</span>
                </div>
                <div className="h-[3px] w-full bg-[#eee9de] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: barColor }} />
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
