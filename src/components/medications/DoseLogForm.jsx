// src/components/medications/DoseLogForm.jsx
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { listPets } from "@/api/entities";
import { Meds, DoseLog } from "@/api/medications";

export default function DoseLogForm({ onSaved, onCancel }) {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");
  const [meds, setMeds] = useState([]);
  const [medicationId, setMedicationId] = useState("");
  const [givenAt, setGivenAt] = useState(() => new Date().toISOString().slice(0, 16));
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

  const petOptions = useMemo(() => pets.map((p) => ({ value: p.id, label: p.name })), [pets]);
  const medOptions = useMemo(() => meds.map((m) => ({ value: m.id, label: m.name })), [meds]);

  async function submit(e) {
    e.preventDefault();
    if (!petId || !medicationId) { alert("Pet and medication are required."); return; }
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

  return (
    <form onSubmit={submit}>
      <div className="grid gap-3">
        <label className="flex flex-col">
          <span className="text-sm text-gray-600">Pet</span>
          <select
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
            className="rounded border px-2 py-1 w-full select-chevron"
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
            className="rounded border px-2 py-1 w-full select-chevron"
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

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            style={{
              borderRadius: 0,
              border: "1px solid #000",
              background: "#000",
              color: "var(--accent)",
              fontWeight: 700,
              padding: "8px 12px",
            }}
          >
            {saving ? "Saving..." : "Log Dose"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                borderRadius: 0,
                border: "1px solid #000",
                background: "#fff",
                color: "#000",
                fontWeight: 700,
                padding: "8px 12px",
              }}
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
