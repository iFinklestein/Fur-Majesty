// src/pages/Weight.jsx
import { useEffect, useState } from "react";
import { listPets } from "@/api/entities.js";
import { listWeightsForPet, addWeight, deleteWeight } from "@/api/weights.js";

export default function WeightPage() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [lbs, setLbs] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // load pets (pick first by default)
  useEffect(() => {
    (async () => {
      try {
        const p = await listPets();
        setPets(p || []);
        if ((p || []).length && !petId) setPetId(p[0].id);
      } catch (e) {
        alert(e.message || "Failed to load pets");
      }
    })();
  }, [petId]);

  // load weights for selected pet
  useEffect(() => {
    (async () => {
      if (!petId) return;
      setLoading(true);
      try {
        const data = await listWeightsForPet(petId);
        setRows(data || []);
      } catch (e) {
        alert(e.message || "Failed to load weights");
      } finally {
        setLoading(false);
      }
    })();
  }, [petId]);

  async function onAdd() {
    try {
      setSaving(true);
      await addWeight({ petId, date, lbs, notes });
      setNotes("");
      setLbs("");
      const data = await listWeightsForPet(petId);
      setRows(data || []);
    } catch (e) {
      alert(e.message || "Failed to add weight");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!confirm("Delete this weight entry?")) return;
    try {
      await deleteWeight(id);
      setRows((r) => r.filter((x) => x.id !== id));
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  }

  return (
    <div className="page">
      <h2>Weight Tracking</h2>

      {/* Form */}
      <div className="card">
        <div className="grid-3">
          <label>
            <div>Pet</div>
            <select
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            >
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div>Date</div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ width: "100%", padding: 8 }}
            />
          </label>

          <label>
            <div>Weight (lbs)</div>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              value={lbs}
              onChange={(e) => setLbs(e.target.value)}
              placeholder="e.g. 77"
              style={{ width: "100%", padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>
            <div>Notes (optional)</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ width: "100%", padding: 8 }}
              placeholder="Anything notable…"
            />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={onAdd} disabled={saving || !petId || !date || !lbs}>
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
      </div>

      {/* History */}
      <h3 style={{ margin: "12px 0" }}>History</h3>
      <div className="card">
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 10, fontWeight: 400 }}>
                Date
              </th>
              <th style={{ textAlign: "left", padding: 10, fontWeight: 400 }}>
                Notes
              </th>
              <th style={{ textAlign: "right", padding: 10, fontWeight: 400 }}>
                Weight (lbs)
              </th>
              <th style={{ textAlign: "right", padding: 10, fontWeight: 400 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} style={{ padding: 12 }}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 12 }}>
                  No entries yet.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  <td style={{ padding: 10 }}>{r.date}</td>
                  <td style={{ padding: 10 }}>{r.notes || "—"}</td>
                  <td style={{ padding: 10, textAlign: "right" }}>
                    {Number(r.lbs).toFixed(1)}
                  </td>
                  <td style={{ padding: 10, textAlign: "right" }}>
                    <button onClick={() => onDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
