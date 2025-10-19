// src/pages/Grooming.jsx
import { useEffect, useState } from "react";
import { listPets } from "@/api/entities.js";
import {
  listGroomsForPet,
  addGroomingLog,
  deleteGroomingLog,
} from "@/api/grooming.js";

const GROOMING_TYPES = [
  { value: "full_groom", label: "Full Groom" },
  { value: "bath_only", label: "Bath Only" },
  { value: "nail_trim", label: "Nail Trim" },
  { value: "teeth_cleaning", label: "Teeth Cleaning" },
];

export default function Grooming() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [groomType, setGroomType] = useState(GROOMING_TYPES[0].value);
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  // load pets
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await listPets();
        if (!alive) return;
        setPets(list || []);
        if (list?.length && !petId) setPetId(list[0].id);
      } catch (e) {
        alert(e.message ?? "Failed to load pets");
      }
    })();
    return () => {
      alive = false;
    };
  }, [petId]);

  // load logs when pet changes
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!petId) {
        setRows([]);
        return;
      }
      setLoading(true);
      try {
        const data = await listGroomsForPet(petId);
        if (alive) setRows(data || []);
      } catch (e) {
        alert(e.message ?? "Failed to load grooming logs");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [petId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!petId) return;
    setSaving(true);
    try {
      await addGroomingLog({
        pet_id: petId,
        date,
        type: groomType,
        notes,
      });
      const data = await listGroomsForPet(petId);
      setRows(data || []);
      // reset a few bits
      setDate(new Date().toISOString().slice(0, 10));
      setNotes("");
    } catch (e) {
      alert(e.message ?? "Failed to add grooming log");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    try {
      await deleteGroomingLog(id);
      const data = await listGroomsForPet(petId);
      setRows(data || []);
    } catch (e) {
      alert(e.message ?? "Failed to delete grooming log");
    }
  }

  return (
    <div className="page">
      <h2>Grooming</h2>

      {/* Form */}
      <form className="card" onSubmit={handleAdd}>
        <div className="grid-3">
          <label>
            <div>Pet</div>
            <select
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              style={{ width: "100%" }}
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
              style={{ width: "100%" }}
            />
          </label>

          <label>
            <div>Type</div>
            <select
              value={groomType}
              onChange={(e) => setGroomType(e.target.value)}
              style={{ width: "100%" }}
            >
              {GROOMING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <label>
            <div>Notes (optional)</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ width: "100%" }}
              placeholder="Any notes…"
            />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
      </form>

      {/* Table */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 8 }}>Recent Sessions</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8, fontWeight: 400 }}>
                Date
              </th>
              <th style={{ textAlign: "left", padding: 8, fontWeight: 400 }}>
                Type
              </th>
              <th style={{ textAlign: "left", padding: 8, fontWeight: 400 }}>
                Notes
              </th>
              <th style={{ textAlign: "right", padding: 8, fontWeight: 400 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} style={{ padding: 10 }}>
                  Loading…
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 10 }}>
                  No grooming logs yet.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>{r.date}</td>
                  <td style={{ padding: 8 }}>
                    {GROOMING_TYPES.find((t) => t.value === r.type)?.label ??
                      r.type}
                  </td>
                  <td style={{ padding: 8 }}>{r.notes || "—"}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>
                    <button onClick={() => handleDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
