// src/components/medications/DoseLogForm.jsx
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { listPets } from "@/api/entities";
import { Meds, DoseLog } from "@/api/medications";

/* large chevron for selects */
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

export default function DoseLogForm({ onSaved, onCancel }) {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");
  const [meds, setMeds] = useState([]);
  const [medicationId, setMedicationId] = useState("");
  const [givenAt, setGivenAt] = useState(
    () => new Date().toISOString().slice(0, 16)
  );
  const [amount, setAmount] = useState("1");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await listPets();
      setPets(list || []);
      if (list?.length) setPetId((p) => p || list[0].id);
    })();
  }, []);

  useEffect(() => {
    if (!petId) { setMeds([]); setMedicationId(""); return; }
    (async () => {
      const rows = await Meds.listForPet(petId);
      setMeds(rows || []);
      if (rows?.length) setMedicationId((m) => m || rows[0].id);
    })();
  }, [petId]);

  useEffect(() => {
    function handle(e) {
      const { petId: p, medicationId: m } = e.detail || {};
      if (p) setPetId(p);
      if (m) setMedicationId(m);
      setGivenAt(new Date().toISOString().slice(0, 16));
    }
    window.addEventListener("dose-intent", handle);
    return () => window.removeEventListener("dose-intent", handle);
  }, []);

  const petOptions = useMemo(
    () => pets.map((p) => ({ value: p.id, label: p.name })),
    [pets]
  );
  const medOptions = useMemo(
    () => meds.map((m) => ({ value: m.id, label: m.name })),
    [meds]
  );

  async function submit(e) {
    e.preventDefault();
    if (!petId || !medicationId) {
      alert("Pet and medication are required.");
      return;
    }
    setSaving(true);
    try {
      await DoseLog.add({
        petId,
        medicationId,
        givenAt: new Date(givenAt).toISOString(),
        amount: amount || null,
        notes,
      });
      setAmount("1");
      setNotes("");
      onSaved && onSaved(medicationId);
    } catch (err) {
      console.error("DoseLog.add failed:", err);
      alert("Failed to log dose");
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
            className="rounded border px-2 py-1 w-full"
            style={SELECT_STYLE}
          >
            {petOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Medication</span>
          <select
            value={medicationId}
            onChange={(e) => setMedicationId(e.target.value)}
            className="rounded border px-2 py-1 w-full"
            style={SELECT_STYLE}
          >
            {medOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Given at</span>
          <input
            type="datetime-local"
            value={givenAt}
            onChange={(e) => setGivenAt(e.target.value)}
            className="rounded border px-2 py-1"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Amount (optional)</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="rounded border px-2 py-1"
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px] rounded border px-2 py-1"
            placeholder="Anything notable..."
          />
        </label>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            type="submit"
            disabled={saving}
            className="btn"
            style={primaryBtnStyle}
          >
            {saving ? "Saving..." : "Add"}
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

DoseLogForm.propTypes = {
  onSaved: PropTypes.func,
  onCancel: PropTypes.func,
};
