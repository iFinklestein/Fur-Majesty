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
  const [frequency, setFrequency] = useState("daily");

  // up to three times per day, depending on frequency
  const [time1, setTime1] = useState("");
  const [time2, setTime2] = useState("");
  const [time3, setTime3] = useState("");

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

  const isBid = frequency === "bid"; // Twice daily
  const isTid = frequency === "tid"; // Three times daily

  async function submit(e) {
    e.preventDefault();
    if (!petId || !name.trim()) {
      alert("Pet and medication name are required.");
      return;
    }

    // Build comma-separated string of times for time_of_day
    const times = [time1, time2, time3]
      .map((t) => t.trim())
      .filter(Boolean)
      .join(", ");

    setSaving(true);
    try {
      await Meds.add({
        petId,
        name,
        dosage,
        frequency,
        timeOfDay: times, // maps to time_of_day in API
        notes,
      });

      setName("");
      setDosage("");
      setFrequency("daily");
      setTime1("");
      setTime2("");
      setTime3("");
      setNotes("");
      onSaved && onSaved();
    } catch (err) {
      console.error(err);
      alert("Failed to add medication");
    } finally {
      setSaving(false);
    }
  }

  const primaryBtnStyle = {
    borderRadius: 0,
    border: "1px solid #000",
    background: "#000",
    color: "var(--accent, #e906d3)",
    fontWeight: 700,
    padding: "8px 12px",
    minWidth: 110,
  };

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
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
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

        {/* Time(s) of day */}
        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Time of day (optional)</span>
          <input
            type="time"
            value={time1}
            onChange={(e) => setTime1(e.target.value)}
            className="rounded border px-2 py-1"
          />
        </label>

        {(isBid || isTid) && (
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">
              Second time (optional)
            </span>
            <input
              type="time"
              value={time2}
              onChange={(e) => setTime2(e.target.value)}
              className="rounded border px-2 py-1"
            />
          </label>
        )}

        {isTid && (
          <label className="flex flex-col">
            <span className="text-sm text-gray-600">Third time (optional)</span>
            <input
              type="time"
              value={time3}
              onChange={(e) => setTime3(e.target.value)}
              className="rounded border px-2 py-1"
            />
          </label>
        )}

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Frequency</span>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="rounded border px-2 py-1"
            style={SELECT_STYLE}
          >
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
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
            style={primaryBtnStyle}
          >
            {saving ? "Saving…" : "Add"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn"
              style={primaryBtnStyle}
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
