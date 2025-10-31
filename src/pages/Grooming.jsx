// FILE: src/pages/Grooming.jsx
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

// Big chevron (matching Dose History)
const CHEV_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4 8 L12 16 L20 8' stroke='black' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")";

function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function renderUS(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  const date = new Date(y, (m || 1) - 1, d || 1);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function Grooming() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");
  const [date, setDate] = useState(todayLocal());
  const [groomType, setGroomType] = useState(GROOMING_TYPES[0].value);

  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

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
    return () => { alive = false; };
  }, [petId]);

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
    return () => { alive = false; };
  }, [petId]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!petId) return;
    setSaving(true);
    try {
      await addGroomingLog({ pet_id: petId, date, type: groomType });
      const data = await listGroomsForPet(petId);
      setRows(data || []);
      setDate(todayLocal());
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
      <h2 style={{ display: "none" }}>Grooming</h2>

      {/* Form */}
      <form className="card" onSubmit={handleAdd}>
        <div className="grid-3">
          <label>
            <div>Pet</div>
            <select
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              className="select-chevron"
              style={{
                width: "100%",
                WebkitAppearance: "none",
                appearance: "none",
                backgroundImage: CHEV_BG,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                backgroundSize: "18px 18px",
              }}
            >
              {pets.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
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
              className="select-chevron"
              style={{
                width: "100%",
                WebkitAppearance: "none",
                appearance: "none",
                backgroundImage: CHEV_BG,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                backgroundSize: "18px 18px",
              }}
            >
              {GROOMING_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
      </form>

      {/* Appointments */}
      <div className="card" style={{ marginTop: 16 }}>
        {/* 🚫 remove bold */}
        <h3 style={{ marginBottom: 8, fontWeight: 400 }}>Appointments</h3>

        {loading && <div>Loading…</div>}
        {!loading && rows.length === 0 && <div>No Grooming appointments</div>}

        {!loading && rows.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8, fontWeight: 400 }}>Date</th>
                <th style={{ textAlign: "left", padding: 8, fontWeight: 400 }}>Type</th>
                <th style={{ textAlign: "right", padding: 8, fontWeight: 400 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                  <td style={{ padding: 8 }}>{renderUS(r.date)}</td>
                  <td style={{ padding: 8 }}>
                    {GROOMING_TYPES.find((t) => t.value === r.type)?.label ?? r.type}
                  </td>
                  <td style={{ padding: 8, textAlign: "right" }}>
                    <button onClick={() => handleDelete(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
