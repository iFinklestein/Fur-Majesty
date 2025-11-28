// FILE: src/pages/Weight.jsx
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

// Display MM/DD/YYYY from yyyy-mm-dd
function formatDisplayDate(ymd) {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-").map((n) => parseInt(n, 10));
  const dt = new Date(y, (m || 1) - 1, d || 1);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// Large chevron (same vector used elsewhere)
const CHEV_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4 8 L12 16 L20 8' stroke='black' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")";

const BRAND_MAGENTA = "#e906d3";

const btn = {
  borderRadius: 0,
  border: "1px solid #000",
  background: "#000",
  color: BRAND_MAGENTA,
  fontWeight: 700,
  padding: "8px 14px",
  minWidth: 70,
  cursor: "pointer",
};

export default function WeightPage() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [date, setDate] = useState(todayLocalISO());
  const [lbs, setLbs] = useState("");
  const [unit, setUnit] = useState("lb"); // optional; tolerant on backend
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  // Load pets (deps include petId because we branch on it inside)
  useEffect(() => {
    (async () => {
      const p = await listPets();
      setPets(p || []);
      if (p?.length && !petId) setPetId(p[0].id);
    })().catch(console.error);
  }, [petId]);

  // Load history when pet changes
  useEffect(() => {
    if (!petId) return;
    setLoading(true);
    listWeightsForPet(petId)
      .then((data) => setRows(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [petId]);

  const selectedPetName = useMemo(
    () => pets.find((p) => p.id === petId)?.name ?? "",
    [pets, petId]
  );

  async function handleAdd(e) {
    e?.preventDefault?.();
    if (!petId) return alert("Select a pet first");
    if (!lbs || isNaN(Number(lbs))) return alert("Enter the weight in lbs");

    try {
      setSaving(true);
      await addWeight({ petId, date, lbs: Number(lbs), unit, notes });

      setLbs("");
      setNotes("");
      setDate(todayLocalISO());
      setUnit("lb");
      setShowForm(false);

      const fresh = await listWeightsForPet(petId);
      setRows(fresh || []);
    } catch (e) {
      console.error(e);
      alert("Failed to add weight");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this weight entry?")) return;
    try {
      await deleteWeight(id);
      setRows((r) => r.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
      alert("Delete failed.");
    }
  }

  function handleCancel() {
    // Just hide the form; leave fields as-is or reset if you prefer
    setShowForm(false);
  }

  return (
    <div className="page" style={{ paddingTop: 8 }}>
      {/* PET SELECT + ADD BUTTON */}
      <div className="card" style={{ padding: 12, maxWidth: 460, margin: "0 auto" }}>
        <label style={{ display: "block", marginBottom: 6 }}>
          <span className="small muted">Pet</span>
        </label>
        <select
          value={petId}
          onChange={(e) => setPetId(e.target.value)}
          className="select-chevron"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #ddd",
            marginBottom: 12,
            WebkitAppearance: "none",
            appearance: "none",
            backgroundImage: CHEV_BG,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
            backgroundSize: "18px 18px",
          }}
        >
          {pets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div style={{ display: "grid", placeItems: "center" }}>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            style={btn}
          >
            Add Weight
          </button>
        </div>
      </div>

      {/* ADD FORM (hidden until Add Weight tapped) */}
      {showForm && (
        <form
          onSubmit={handleAdd}
          className="card"
          style={{
            padding: 16,
            borderRadius: 12,
            maxWidth: 460,
            margin: "16px auto",
          }}
        >
          {/* Date */}
          <label style={{ display: "block", marginBottom: 6 }}>
            <span className="small muted">Date</span>
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              marginBottom: 12,
            }}
          />

          {/* Weight (lbs) + Unit */}
          <label style={{ display: "block", marginBottom: 6 }}>
            <span className="small muted">Weight</span>
          </label>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 110px",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <input
              type="number"
              inputMode="decimal"
              placeholder="e.g., 62.5"
              value={lbs}
              onChange={(e) => setLbs(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="select-chevron"
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #ddd",
                WebkitAppearance: "none",
                appearance: "none",
                backgroundImage: CHEV_BG,
                backgroundRepeat: "no-repeat",
                backgroundPosition: "right 10px center",
                backgroundSize: "18px 18px",
              }}
            >
              <option value="lb">lb</option>
              <option value="kg">kg</option>
            </select>
          </div>

          {/* Notes */}
          <label style={{ display: "block", marginBottom: 6 }}>
            <span className="small muted">Notes (optional)</span>
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={
              selectedPetName
                ? `Anything notable about ${selectedPetName}…`
                : "Anything notable…"
            }
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid #ddd",
              marginBottom: 16,
            }}
          />

          {/* Add / Cancel buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <button
              type="submit"
              disabled={saving}
              style={btn}
            >
              {saving ? "Saving…" : "Add"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              style={btn}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* HISTORY CARD */}
      <div
        className="card"
        style={{
          marginTop: 18,
          padding: 16,
          borderRadius: 12,
          maxWidth: 460,
          marginInline: "auto",
        }}
      >
        <div style={{ fontWeight: 400, marginBottom: 10 }}>Records</div>
        {loading ? (
          <div>Loading…</div>
        ) : rows.length === 0 ? (
          <div>No weight records</div>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: 8,
            }}
          >
            {rows.map((r) => (
              <li
                key={r.id}
                className="card"
                style={{
                  padding: 12,
                  borderRadius: 10,
                }}
              >
                <div style={{ marginBottom: 6 }}>
                  <div style={{ fontWeight: 400 }}>
                    {formatDisplayDate(r.date)}
                  </div>
                  <div style={{ color: "#333" }}>
                    {typeof r.lbs === "number"
                      ? `${r.lbs} ${r.unit || "lb"}`
                      : r.lbs}
                    {r.notes ? ` • ${r.notes}` : ""}
                  </div>
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
