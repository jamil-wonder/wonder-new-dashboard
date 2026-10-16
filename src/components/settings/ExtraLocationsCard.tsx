"use client";

import { useEffect, useState } from "react";
import { MapPin, X } from "lucide-react";
import { useBusiness } from "../../context/BusinessContext";
import { useToast } from "../../context/ToastContext";
import { fetchApi, parseApiError } from "../../lib/api";

const MAX_EXTRA = 4;

// G4: a business in several places lists them here. When its questions are next written, the local
// ones are split across the places (one place per question) so each location is checked.
export default function ExtraLocationsCard() {
  const { activeBusiness, updateActiveBusiness } = useBusiness();
  const { showToast } = useToast();
  const [places, setPlaces] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPlaces(activeBusiness?.extraLocations || []);
  }, [activeBusiness?.id, (activeBusiness?.extraLocations || []).join("|")]);

  if (!activeBusiness?.id) return null;

  const save = async (next: string[]) => {
    setSaving(true);
    try {
      const res = await fetchApi<{ extraLocations: string[] }>(`/api/user/businesses/${activeBusiness.id}/locations`, {
        method: "POST",
        body: JSON.stringify({ locations: next }),
      });
      setPlaces(res.extraLocations);
      updateActiveBusiness({ extraLocations: res.extraLocations });
      showToast("Locations saved", "success");
    } catch (err) {
      showToast(parseApiError(err, "Couldn't save the locations. Please try again."), "error");
    } finally {
      setSaving(false);
    }
  };

  const add = () => {
    const name = draft.trim();
    if (!name || places.length >= MAX_EXTRA) return;
    setDraft("");
    save([...places, name]);
  };

  return (
    <div className="mt-5 rounded-[18px] border border-[#ece3d1] bg-white p-4 sm:p-6 shadow-[0_1px_2px_rgba(60,48,28,0.04)]">
      <h3 className="font-spectral text-[18px] font-semibold text-[#15463b]">Other locations</h3>
      <p className="mt-0.5 text-[12.5px] text-[#6f6757]">
        {activeBusiness.name} is based in {activeBusiness.location || "your main location"}. Add up to {MAX_EXTRA} more places and the
        Local SEO questions are split across all of them the next time your questions are written.
      </p>
      {places.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {places.map((p) => (
            <li key={p} className="inline-flex items-center gap-1.5 rounded-full border border-[#d0e4d6] bg-[#eef3f0] px-3 py-1 text-[12.5px] font-medium text-[#15463b]">
              <MapPin className="h-3 w-3" /> {p}
              <button type="button" aria-label={`Remove ${p}`} disabled={saving} onClick={() => save(places.filter((x) => x !== p))} className="cursor-pointer text-[#6f6757] hover:text-[#b1442a]">
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="e.g. Manchester, UK"
          disabled={places.length >= MAX_EXTRA}
          aria-label="Add a location"
          className="min-w-0 flex-1 rounded-lg border border-[#ece3d1] bg-[#fdfcf8] px-3 py-2 text-[13px] outline-none focus:border-[#15463b] disabled:opacity-50"
        />
        <button type="button" onClick={add} disabled={saving || !draft.trim() || places.length >= MAX_EXTRA} className="cursor-pointer rounded-lg bg-[#15463b] px-4 text-[13px] font-semibold text-white disabled:opacity-40">
          Add
        </button>
      </div>
    </div>
  );
}
