// src/components/medications/DoseLogForm.jsx
import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { listPets } from "@/api/entities";
import { Meds, DoseLog } from "@/api/medications";

/* ----------------------------- time helpers ----------------------------- */
// Format a Date -> "YYYY-MM-DDTHH:mm" in LOCAL time for <input type="datetime-local">
function toLocalInputValue(date) {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

// Parse "YYYY-MM-DDTHH:mm" (local) -> Date (local)
function fromLocalInputValue(v) {
  if (!v || typeof v !== "string") return new Date();
  const [datePart, timePart] = v.split("T");
  const [y, m, d] = datePart.split("-").map((n) => parseInt(n, 10));
  const [hh, mm] = (timePart || "00:00").split(":").map((n) => parseInt(n, 10));
  // Construct a LOCAL date (no implicit TZ conversion)
  return new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0, 0, 0);
}

export default function DoseLogForm({ onSaved, onCancel }) {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");
  const [meds, setMeds] = useState([]);
  const [medicationId, setMedicationId] = useState("");
  const [givenAt, setGivenAt] = useState(() => toLocalInputValue(new Date())); // ✅ local
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
      setGivenAt(toLocalInputValue(new Date())); // ✅ local reset
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
      // Convert LOCAL input to an ISO string (UTC) for storage in timestamptz
      const iso = fromLocalInputValue(givenAt).toISOString();

      await DoseLog.add({
        petId,
        medicationId,
        givenAt: iso,
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
            value={givenAt}                         // ✅ true local value
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
