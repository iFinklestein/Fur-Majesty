// src/components/medications/MedicationForm.jsx
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { listPets } from "@/api/entities";
import { Meds, FREQUENCIES } from "@/api/medications";

/* Large chevron (matches Dose History) */
const CHEV_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4 8 L12 16 L20 8' stroke='black' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")";
const SELECT_STYLE = {
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  backgroundImage: CHEV_BG,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  backgroundSize: "18px 18px",
  paddingRight: 34,
};

export default function MedicationForm({ onSaved, onCancel }) {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");
  const [name, setName] = useState("");
  const [dosage, setDosage] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await listPets();
      setPets(list || []);
      if (list?.length) setPetId(list[0].id);
    })();
  }, []);

  const petOptions = useMemo(
    () => pets.map((p) => ({ id: p.id, name: p.name })),
    [pets]
  );

  async function submit(e) {
    e.preventDefault();
    if (!petId || !name.trim()) {
      alert("Pet and medication name are required.");
      return;
    }
    setSaving(true);
    try {
      await Meds.add({
        petId,
        name,
        dosage,
        frequency,
        timeOfDay, // NOTE: matches Meds.add: maps to time_of_day internally in API
        notes,
      });
      setName(""); setDosage(""); setTimeOfDay(""); setFrequency("daily"); setNotes("");
      onSaved && onSaved();
    } catch (err) {
      console.error(err);
      alert("Failed to add medication");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="grid gap-3">
        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Pet</span>
          <select
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
            className="rounded border px-2 py-1"
            style={SELECT_STYLE}
          >
            {petOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Medication name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded border px-2 py-1"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Dosage</span>
          <input
            value={dosage}
            onChange={(e) => setDosage(e.target.value)}
            className="rounded border px-2 py-1"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Time of day (optional)</span>
          <input
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value)}
            className="rounded border px-2 py-1"
            placeholder="06:00 PM"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Frequency</span>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="rounded border px-2 py-1"
            style={SELECT_STYLE}
          >
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px] rounded border px-2 py-1"
            placeholder="Anything notable…"
          />
        </label>

        <div className="flex" style={{ gap: 10 }}>
          <button
            type="submit"
            disabled={saving}
            className="btn"
            style={{ minWidth: 110 }}
          >
            {saving ? "Saving…" : "Add"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn"
              style={{ background: "#fff", color: "#000", border: "1px solid #000", minWidth: 110 }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

MedicationForm.propTypes = {
  onSaved: PropTypes.func,
  onCancel: PropTypes.func,
};
