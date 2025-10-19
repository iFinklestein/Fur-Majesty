// FILE: src/pages/Feeding.jsx
import { useEffect, useMemo, useState } from "react";
import { listPets } from "@/api/entities.js";
import {
  listFeedingSchedules,
  addSchedule,
  deleteSchedule,
  setScheduleActive,
} from "@/api/feeding.js";

/* --------- time helpers (string-only; no TZ drift) --------- */
function to24(hhmm12) {
  if (!hhmm12) return "";
  const parts = hhmm12.trim().split(/\s+/);
  const [h, m] = parts[0].split(":").map(Number);
  const ap = (parts[1] || "").toUpperCase();
  let hh = h % 12;
  if (ap === "PM") hh += 12;
  return `${String(hh).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function from24(hhmm) {
  if (!hhmm) return "";
  const [hStr, mStr] = String(hhmm).split(":");
  const h = parseInt(hStr || "0", 10);
  const m = parseInt(mStr || "0", 10);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = ((h + 11) % 12) + 1;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ap}`;
}
/* ----------------------------------------------------------- */

const DEFAULT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function FeedingPage() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState(null);

  // form state
  const [times, setTimes] = useState(["09:00 AM", "06:00 PM"]);
  const [amount, setAmount] = useState("1.0");
  const [unit, setUnit] = useState("cups");
  const [food, setFood] = useState("");
  const [notes, setNotes] = useState("");
  const [days, setDays] = useState(DEFAULT_DAYS);

  // table
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);

  const selectedPet = useMemo(
    () => pets.find((p) => p.id === petId) || null,
    [pets, petId]
  );

  // load pets once
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // load schedules when pet changes
  useEffect(() => {
    if (!petId) return;
    (async () => {
      try {
        const data = await listFeedingSchedules(petId);
        setRows(data || []);

        if ((data || []).length) {
          setTimes(data.map((r) => from24(r.time_of_day)));
          setAmount(String(data[0].amount ?? "1.0"));
          setUnit(data[0].unit || "cups");
          setFood(data[0].food || "");
          setNotes(data[0].notes || "");
          setDays(Array.isArray(data[0].days) ? data[0].days : DEFAULT_DAYS);
        } else {
          setTimes(["09:00 AM", "06:00 PM"]);
          setAmount("1.0");
          setUnit("cups");
          setFood("");
          setNotes("");
          setDays(DEFAULT_DAYS);
        }
      } catch (e) {
        alert(e.message || "Failed to load schedules");
      }
    })();
  }, [petId]);

  async function refresh() {
    if (!petId) return;
    const data = await listFeedingSchedules(petId);
    setRows(data || []);
  }

  async function onAdd() {
    if (!petId) return;
    setSaving(true);
    try {
      const payload = {
        pet_id: petId,
        times,
        amount: parseFloat(amount || "0") || 0,
        unit,
        food: food || null,
        days,
        notes: notes || null,
      };
      await addSchedule(payload);
      await refresh();
    } catch (e) {
      alert(e.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!id) return;
    if (!confirm("Delete this schedule?")) return;
    try {
      await deleteSchedule(id);
      await refresh();
    } catch (e) {
      alert(e.message || "Delete failed");
    }
  }

  async function onToggleActive(id, next) {
    try {
      await setScheduleActive(id, !!next);
      await refresh();
    } catch (e) {
      alert(e.message || "Update failed");
    }
  }

  const toggleDay = (d) =>
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );

  return (
    <div className="page">
      <h2>Feeding Schedule</h2>

      {/* Form */}
      <div className="card">
        {/* Pet */}
        <div style={{ marginBottom: 12 }}>
          <label>
            <div>Pet</div>
            <select
              value={petId || ""}
              onChange={(e) => setPetId(e.target.value)}
              style={{ padding: 8, minWidth: 240 }}
            >
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Times */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div>Times</div>
            <button
              type="button"
              onClick={() => setTimes((t) => [...t, "06:00 PM"])}
              style={{ marginLeft: 8 }}
            >
              + Add time
            </button>
          </div>

          <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
            {times.map((t, idx) => (
              <div
                key={`${idx}-${t}`}
                style={{ display: "flex", alignItems: "center", gap: 8 }}
              >
                <input
                  type="time"
                  value={to24(t)}
                  onChange={(e) => {
                    const next = [...times];
                    next[idx] = from24(e.target.value);
                    setTimes(next);
                  }}
                />
                <button
                  type="button"
                  onClick={() =>
                    setTimes((arr) => arr.filter((_, i) => i !== idx))
                  }
                >
                  Remove
                </button>
                <span style={{ opacity: 0.6 }}>{t}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Amount / Unit */}
        <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
          <label>
            <div>Amount</div>
            <input
              type="number"
              step="0.25"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <label>
            <div>Unit</div>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="cups">cups</option>
              <option value="oz">oz</option>
              <option value="g">g</option>
            </select>
          </label>
        </div>

        {/* Food */}
        <div style={{ marginBottom: 12 }}>
          <label>
            <div>Food (optional)</div>
            <input
              type="text"
              value={food}
              onChange={(e) => setFood(e.target.value)}
              placeholder="Brand / flavor"
              style={{ width: 320 }}
            />
          </label>
        </div>

        {/* Days */}
        <div style={{ marginBottom: 12 }}>
          <div>Days</div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {DEFAULT_DAYS.map((d) => (
              <label key={d} style={{ display: "inline-flex", gap: 6 }}>
                <input
                  type="checkbox"
                  checked={days.includes(d)}
                  onChange={() => toggleDay(d)}
                />
                <span>{d}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label>
            <div>Notes (optional)</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              style={{ width: "100%", maxWidth: 640 }}
            />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={onAdd} disabled={saving || !petId}>
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginBottom: 8 }}>
          {selectedPet ? `Schedules for ${selectedPet.name}` : "Schedules"}
        </h3>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8, fontWeight: 400 }}>
                Time
              </th>
              <th style={{ textAlign: "left", padding: 8, fontWeight: 400 }}>
                Days
              </th>
              <th style={{ textAlign: "left", padding: 8, fontWeight: 400 }}>
                Amount
              </th>
              <th style={{ textAlign: "left", padding: 8, fontWeight: 400 }}>
                Food
              </th>
              <th style={{ textAlign: "center", padding: 8, fontWeight: 400 }}>
                Active
              </th>
              <th style={{ textAlign: "right", padding: 8, fontWeight: 400 }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: 10 }}>
                  No schedules yet.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #eee" }}>
                <td style={{ padding: 8 }}>{from24(r.time_of_day)}</td>
                <td style={{ padding: 8 }}>
                  {(r.days || []).join(", ") || "—"}
                </td>
                <td style={{ padding: 8 }}>
                  {r.amount} {r.unit}
                </td>
                <td style={{ padding: 8 }}>{r.food || "—"}</td>
                <td style={{ padding: 8, textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={!!r.active}
                    onChange={(e) => onToggleActive(r.id, e.target.checked)}
                  />
                </td>
                <td style={{ padding: 8, textAlign: "right" }}>
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
