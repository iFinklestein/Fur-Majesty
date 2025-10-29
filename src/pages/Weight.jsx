// src/pages/Weight.jsx
import { useEffect, useMemo, useState } from "react";
import { listPets } from "@/api/entities";
import { listWeightsForPet, addWeight, deleteWeight } from "@/api/weights";

/** Local YYYY-MM-DD (no timezone shift) */
function todayLocalISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function WeightPage() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");
  const [date, setDate] = useState(todayLocalISO());
  const [lbs, setLbs] = useState("");
  const [unit, setUnit] = useState("lb"); // optional; tolerant on backend
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const p = await listPets();
      setPets(p);
      if (p.length && !petId) setPetId(p[0].id);
    })().catch(console.error);
  }, []); // load once

  // Load history when pet changes
  useEffect(() => {
    if (!petId) return;
    setLoading(true);
    listWeightsForPet(petId)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [petId]);

  const selectedPetName = useMemo(
    () => pets.find((p) => p.id === petId)?.name ?? "",
    [pets, petId]
  );

  async function onAdd() {
    if (!petId) return alert("Select a pet first");
    if (!lbs || isNaN(Number(lbs))) return alert("Enter the weight in lbs");

    try {
      setSaving(true);
      // Pass the date string directly ("YYYY-MM-DD") — no Date() conversion
      await addWeight({ petId, date, lbs: Number(lbs), unit, notes });
      setLbs("");
      setNotes("");
      // refresh
      const fresh = await listWeightsForPet(petId);
      setRows(fresh);
    } catch (e) {
      console.error(e);
      alert("Failed to add weight");
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
      console.error(e);
      alert("Delete failed.");
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "0 auto" }}>
      {/* FORM CARD */}
      <div className="card" style={{ padding: 16, borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,.12)" }}>
        {/* Pet */}
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Pet</label>
        <select
          value={petId}
          onChange={(e) => setPetId(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", marginBottom: 12 }}
        >
          {pets.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Date */}
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)} // keep raw "YYYY-MM-DD"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", marginBottom: 12 }}
        />

        {/* Weight (lbs) */}
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Weight</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 8, marginBottom: 12 }}>
          <input
            type="number"
            inputMode="decimal"
            placeholder="e.g., 62.5"
            value={lbs}
            onChange={(e) => setLbs(e.target.value)}
            style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd" }}
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd" }}
          >
            <option value="lb">lb</option>
            <option value="kg">kg</option>
          </select>
        </div>

        {/* Notes */}
        <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>Notes (optional)</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={selectedPetName ? `Anything notable about ${selectedPetName}…` : "Anything notable…"}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", marginBottom: 16 }}
        />

        {/* Add (centered, on-brand) */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            onClick={onAdd}
            disabled={saving}
            style={{
              minWidth: 120,
              padding: "10px 18px",
              border: "1px solid #000",
              background: "#000",
              color: "#e906d3",
              fontWeight: 700,
              borderRadius: 0,
              cursor: "pointer",
            }}
          >
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
      </div>

      {/* HISTORY CARD */}
      <div className="card" style={{ marginTop: 18, padding: 16, borderRadius: 12, boxShadow: "0 2px 10px rgba(0,0,0,.08)" }}>
        <div style={{ fontWeight: 700, marginBottom: 10 }}>History</div>
        {loading ? (
          <div>Loading…</div>
        ) : rows.length === 0 ? (
          <div>No weight history</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
            {rows.map((r) => (
              <li key={r.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {new Date(r.date + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" })}
                  </div>
                  <div style={{ color: "#333" }}>
                    {typeof r.lbs === "number" ? `${r.lbs} lb` : r.lbs}
                    {r.unit && r.unit !== "lb" ? ` (${r.unit})` : ""}
                    {r.notes ? ` • ${r.notes}` : ""}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(r.id)}
                  style={{
                    padding: "8px 14px",
                    border: "1px solid #000",
                    background: "#000",
                    color: "#e906d3",
                    fontWeight: 700,
                    borderRadius: 0,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
