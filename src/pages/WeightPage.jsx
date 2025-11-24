// FILE: src/pages/WeightPage.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  listWeightsForPet,
  addWeightLog,
  deleteWeightLog,
} from "@/api/weights";

function asISODate(d = new Date()) {
  // yyyy-mm-dd for <input type="date">
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${yr}-${mo}-${da}`;
}

export default function WeightPage() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");
  const [weight, setWeight] = useState("");
  const [loggedAt, setLoggedAt] = useState(asISODate());
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, setError] = useState(""); // we only need the setter for alerts

  const selectedPet = useMemo(
    () => pets.find((p) => p.id === petId) || null,
    [pets, petId]
  );

  // Load pets (include petId in deps because we check it inside)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("pets")
          .select("id,name")
          .order("name", { ascending: true });

        if (error) throw error;
        if (!active) return;

        setPets(data || []);
        if (data && data.length && !petId) {
          setPetId(data[0].id);
        }
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to load pets.");
        alert(e.message || "Failed to load pets.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [petId]); // ✅ satisfies eslint-react-hooks

  // Load weights when pet changes
  useEffect(() => {
    let active = true;
    if (!petId) {
      setRows([]);
      return;
    }
    (async () => {
      setError("");
      setLoading(true);
      try {
        const data = await listWeightsForPet(petId);
        if (active) setRows(data || []);
      } catch (e) {
        console.error(e);
        setError(e.message || "Failed to load weight logs.");
        alert(e.message || "Failed to load weight logs.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [petId]);

  async function onAdd(e) {
    e.preventDefault();
    if (!petId) {
      alert("Please select a pet.");
      return;
    }
    const n = Number(weight);
    if (!Number.isFinite(n) || n <= 0) {
      alert("Please enter a valid weight.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await addWeightLog({
        petId,
        weight: n,
        loggedAt,
        notes: notes?.trim() || null,
      });
      // refresh list
      const data = await listWeightsForPet(petId);
      setRows(data || []);
      // clear entry fields (keep date)
      setWeight("");
      setNotes("");
    } catch (e) {
      console.error(e);
      setError(e.message || "Failed to add weight log.");
      alert(e.message || "Failed to add weight log.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    if (!id) return;
    if (!confirm("Delete this weight entry?")) return;
    try {
      await deleteWeightLog(id);
      setRows((r) => r.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
      alert(e.message || "Failed to delete entry.");
    }
  }

  return (
    <div style={{ padding: 16, maxWidth: 860 }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
        Weight Tracking
      </h2>

      {/* Entry form */}
      <form
        onSubmit={onAdd}
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          padding: 16,
          marginBottom: 24,
          background: "#fff",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginBottom: 12,
          }}
        >
          {/* Pet */}
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Pet</span>
            <select
              value={petId}
              onChange={(e) => setPetId(e.target.value)}
              disabled={loading}
              style={{
                height: 36,
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "0 10px",
              }}
            >
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          {/* Weight */}
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              Weight (e.g., 22.4)
            </span>
            <input
              type="number"
              step="0.01"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0.00"
              style={{
                height: 36,
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "0 10px",
              }}
            />
          </label>

          {/* Date */}
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 12, color: "#6b7280" }}>Date</span>
            <input
              type="date"
              value={loggedAt}
              onChange={(e) => setLoggedAt(e.target.value)}
              style={{
                height: 36,
                border: "1px solid #d1d5db",
                borderRadius: 8,
                padding: "0 10px",
              }}
            />
          </label>
        </div>

        {/* Notes */}
        <label style={{ display: "grid", gap: 6, marginBottom: 12 }}>
          <span style={{ fontSize: 12, color: "#6b7280" }}>Notes (optional)</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any context to remember (diet change, exercise, etc.)"
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 8,
              padding: 10,
              resize: "vertical",
            }}
          />
        </label>

        <button
          type="submit"
          disabled={saving || !petId}
          style={{
            height: 38,
            padding: "0 16px",
            borderRadius: 8,
            border: "none",
            background: saving ? "#9ca3af" : "#2563eb",
            color: "white",
            fontWeight: 600,
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving..." : "Add"}
        </button>
      </form>

      {/* List */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 10,
          background: "#fff",
        }}
      >
        <div
          style={{
            padding: 12,
            borderBottom: "1px solid #e5e7eb",
            fontWeight: 600,
          }}
        >
          {selectedPet ? `Records for ${selectedPet.name}` : "Records"}
        </div>

        {loading ? (
          <div style={{ padding: 16 }}>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 16, color: "#6b7280" }}>
            No weight logs yet.
          </div>
        ) : (
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {rows.map((r) => (
              <li
                key={r.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 12,
                  borderTop: "1px solid #f3f4f6",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {Number(r.weight).toFixed(2)}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                    {r.logged_at} {r.notes ? "— " + r.notes : ""}
                  </div>
                </div>
                <button
                  onClick={() => onDelete(r.id)}
                  style={{
                    height: 32,
                    padding: "0 12px",
                    borderRadius: 8,
                    border: "1px solid #ef4444",
                    color: "#ef4444",
                    background: "transparent",
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
