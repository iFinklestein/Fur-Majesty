// FILE: src/pages/Grooming.jsx
import { useEffect, useState } from "react";
import { listPets } from "@/api/entities.js";
import {
  listGroomsForPet,
  addGroomingLog,
  deleteGroomingLog,
} from "@/api/grooming.js";

/* -------------------------------------------
   Brand Styles
-------------------------------------------- */
const BRAND_MAGENTA = "#e906d3";

const btn = {
  borderRadius: 0,
  border: "1px solid #000",
  background: "#000",
  color: BRAND_MAGENTA,
  fontWeight: 700,
  padding: "10px 20px",
  minWidth: 70,
  cursor: "pointer",
};

const btnSecondary = {
  ...btn,
  background: "#000",
  color: BRAND_MAGENTA,
};

const CHEV_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4 8 L12 16 L20 8' stroke='black' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")";

const GROOMING_TYPES = [
  { value: "full_groom", label: "Full Groom" },
  { value: "bath_only", label: "Bath Only" },
  { value: "nail_trim", label: "Nail Trim" },
  { value: "teeth_cleaning", label: "Teeth Cleaning" },
];

// yyyy-mm-dd local
function todayLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Display mm/dd/yyyy
function renderUS(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function Grooming() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [date, setDate] = useState(todayLocal());
  const [groomType, setGroomType] = useState(GROOMING_TYPES[0].value);

  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  /* -----------------------------
     Load Pets
  ------------------------------ */
  useEffect(() => {
    (async () => {
      const list = await listPets();
      setPets(list || []);
      if (list?.length && !petId) setPetId(list[0].id);
    })();
  }, [petId]);

  /* -----------------------------
     Load Grooming Records
  ------------------------------ */
  useEffect(() => {
    if (!petId) return;
    setLoading(true);
    listGroomsForPet(petId)
      .then((d) => setRows(d || []))
      .finally(() => setLoading(false));
  }, [petId]);

  /* -----------------------------
     Add Groom Entry
  ------------------------------ */
  async function handleAdd(e) {
    e.preventDefault();
    if (!petId) return;

    setSaving(true);
    try {
      await addGroomingLog({
        pet_id: petId,
        date,
        type: groomType,
      });
      const data = await listGroomsForPet(petId);
      setRows(data || []);
      setDate(todayLocal());
      setGroomType(GROOMING_TYPES[0].value);
      setShowForm(false);
    } catch (e) {
      alert(e.message ?? "Failed to add grooming log");
    } finally {
      setSaving(false);
    }
  }

  /* -----------------------------
     Delete Groom Entry
  ------------------------------ */
  async function handleDelete(id) {
    if (!window.confirm("Delete this grooming entry?")) return;
    try {
      await deleteGroomingLog(id);
      const data = await listGroomsForPet(petId);
      setRows(data || []);
    } catch (e) {
      alert(e.message ?? "Failed to delete grooming log");
    }
  }

  /* -----------------------------
     UI
  ------------------------------ */
  return (
    <div className="page" style={{ paddingTop: 8 }}>
      {/* PET SELECT + ADD BUTTON */}
      <div className="card" style={{ padding: 12, maxWidth: 460, margin: "0 auto" }}>
        <label className="flex flex-col" style={{ marginBottom: 8 }}>
          <span className="text-sm text-gray-600">Pet</span>
          <select
            value={petId}
            onChange={(e) => setPetId(e.target.value)}
            className="rounded border px-3 py-2 w-full"
            style={{
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

        <div style={{ display: "grid", placeItems: "center" }}>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            style={btn}
          >
            Add Grooming
          </button>
        </div>
      </div>

      {/* ------------------- FORM ------------------- */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="card"
          style={{
            padding: 14,
            maxWidth: 460,
            margin: "16px auto",
          }}
        >
          {/* Date */}
          <label className="flex flex-col" style={{ marginBottom: 8 }}>
            <span className="text-sm text-gray-600">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded border px-3 py-2 w-full"
            />
          </label>

          {/* Type */}
          <label className="flex flex-col" style={{ marginBottom: 12 }}>
            <span className="text-sm text-gray-600">Type</span>
            <select
              value={groomType}
              onChange={(e) => setGroomType(e.target.value)}
              className="rounded border px-3 py-2 w-full"
              style={{
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

          {/* Action Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              marginTop: 10,
            }}
          >
            <button type="submit" disabled={saving} style={btn}>
              {saving ? "Saving…" : "Add"}
            </button>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={btnSecondary}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* ------------------- RECORDS ------------------- */}
      <div className="card" style={{ padding: 12, maxWidth: 460, margin: "16px auto" }}>
        <div style={{ fontWeight: 400, marginBottom: 6 }}>Records</div>

        {loading ? (
          <div>Loading…</div>
        ) : rows.length === 0 ? (
          <div>No grooming appointments</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
            {rows.map((r) => (
              <li key={r.id} className="card" style={{ padding: 12 }}>
                <div style={{ marginBottom: 6 }}>
                  <div>{renderUS(r.date)}</div>
                  <div>{GROOMING_TYPES.find((t) => t.value === r.type)?.label}</div>
                </div>

                <div style={{ display: "flex", justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    style={btn}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
