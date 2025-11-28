// FILE: src/pages/VetVisits.jsx
import { useEffect, useState } from "react";
import { listPets, VetVisit } from "@/api/entities";

const BRAND_MAGENTA = "#e906d3";

const btn = {
  borderRadius: 0,
  border: "1px solid #000",
  background: "#000",
  color: BRAND_MAGENTA,
  fontWeight: 700,
  padding: "8px 14px",
  cursor: "pointer",
  lineHeight: 1.1,
};

const CHEV_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4 8 L12 16 L20 8' stroke='black' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")";

/* ---------- helpers ---------- */

// Today in local YYYY-MM-DD
function todayLocalISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Build a timestamp string for Postgres WITHOUT toISOString()
// -> "YYYY-MM-DD HH:MM" (or "YYYY-MM-DD 00:00" if no time)
function buildTimestamp(dateStr, timeStr) {
  const d = (dateStr || "").trim();
  if (!d) return null;
  const t = (timeStr || "").trim() || "00:00";
  return `${d} ${t}`;
}

// Show "MM/DD/YYYY, h:mm AM/PM"
function fmtDisplay(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function VetVisits() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");

  const [visitDate, setVisitDate] = useState(todayLocalISO);
  const [visitTime, setVisitTime] = useState(""); // "HH:MM"
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);

  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------- load pets ---------- */
  useEffect(() => {
    (async () => {
      const p = await listPets();
      setPets(p || []);
      if (p && p.length) {
        setPetId(String(p[0].id));
      }
    })().catch(console.error);
  }, []);

  /* ---------- load visits for selected pet ---------- */
  useEffect(() => {
    if (!petId) return;
    setLoading(true);
    VetVisit.listForPet(petId)
      .then((data) => setRows(data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [petId]);

  /* ---------- form helpers ---------- */

  function resetForm() {
    setVisitDate(todayLocalISO());
    setVisitTime("");
    setReason("");
    setNotes("");
    setFile(null);
  }

  function openForm() {
    setShowForm(true);
    requestAnimationFrame(() => {
      document
        .querySelector("[data-vetvisit-form]")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function cancelForm() {
    resetForm();
    setShowForm(false);
  }

  async function handleAdd(e) {
    e?.preventDefault?.();
    if (!petId || !visitDate) {
      alert("Please choose a pet and a date.");
      return;
    }

    const visit_ts = buildTimestamp(visitDate, visitTime);
    if (!visit_ts) {
      alert("Invalid date.");
      return;
    }

    setSaving(true);
    try {
      await VetVisit.createWithFile({
        pet_id: petId,
        visit_date: visit_ts, // full date + time
        reason: reason || null,
        notes: notes || null,
        file,
      });

      resetForm();
      setShowForm(false);

      const data = await VetVisit.listForPet(petId);
      setRows(data || []);
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to add visit.");
    } finally {
      setSaving(false);
    }
  }

  async function handleView(row) {
    try {
      let url = row.doc_url;
      if (!url && row.file_path) {
        url = await VetVisit.signedUrl(row.file_path);
      }
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error(err);
      alert(err?.message || "Unable to open document.");
    }
  }

  async function handleDelete(row) {
    if (!window.confirm("Delete this visit record?")) return;
    try {
      await VetVisit.deleteWithFile(row.id, row.file_path);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to delete visit.");
    }
  }

  /* ---------- render ---------- */

  return (
    <div className="page" style={{ paddingTop: 8 }}>
      {/* Pet selector + Add Visit button */}
      <div
        className="card"
        style={{
          padding: 12,
          marginBottom: 12,
          maxWidth: 460,
          marginInline: "auto",
        }}
      >
        <label className="flex flex-col" style={{ marginBottom: 10 }}>
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
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <div style={{ textAlign: "center" }}>
          <button type="button" onClick={openForm} style={btn}>
            Add Visit
          </button>
        </div>
      </div>

      {/* Add Visit form (hidden until Add Visit) */}
      {showForm && (
        <div
          className="card"
          style={{
            padding: 16,
            marginBottom: 12,
            maxWidth: 460,
            marginInline: "auto",
          }}
          data-vetvisit-form
        >
          <form onSubmit={handleAdd}>
            <label className="flex flex-col" style={{ marginBottom: 10 }}>
              <span className="text-sm text-gray-600">Date</span>
              <input
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </label>

            <label className="flex flex-col" style={{ marginBottom: 10 }}>
              <span className="text-sm text-gray-600">Time (optional)</span>
              <input
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
              />
            </label>

            <label className="flex flex-col" style={{ marginBottom: 10 }}>
              <span className="text-sm text-gray-600">
                Appointment Reason (optional)
              </span>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Exam, shots, follow-up…"
              />
            </label>

            <label className="flex flex-col" style={{ marginBottom: 10 }}>
              <span className="text-sm text-gray-600">Notes (optional)</span>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything notable from this visit…"
              />
            </label>

            <label className="flex flex-col" style={{ marginBottom: 14 }}>
              <span className="text-sm text-gray-600">Upload (optional)</span>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                style={{ display: "block", width: "100%", maxWidth: "100%" }}
              />
            </label>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 10,
                marginTop: 4,
              }}
            >
              <button type="submit" style={btn} disabled={saving}>
                {saving ? "Saving…" : "Add"}
              </button>
              <button type="button" onClick={cancelForm} style={btn}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records list */}
      <div
        className="card"
        style={{
          padding: 12,
          maxWidth: 460,
          marginInline: "auto",
          marginBottom: 16,
        }}
      >
        <div className="text-sm text-gray-600" style={{ marginBottom: 8 }}>
          Records
        </div>

        {loading ? (
          <div>Loading…</div>
        ) : rows.length === 0 ? (
          <div>No vet visits</div>
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
                  padding: 10,
                  border: "1px solid #e6e6e6",
                  borderRadius: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  {/* Date + time together */}
                  <div style={{ fontWeight: 400 }}>
                    {fmtDisplay(r.visit_date)}
                  </div>

                  {/* Reason */}
                  {r.reason ? (
                    <div style={{ fontSize: 13 }}>{r.reason}</div>
                  ) : null}

                  {/* Notes */}
                  {r.notes ? (
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.85,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {r.notes}
                    </div>
                  ) : null}

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 10,
                      marginTop: 6,
                    }}
                  >
                    {(r.doc_url || r.file_path) && (
                      <button
                        type="button"
                        onClick={() => handleView(r)}
                        style={btn}
                      >
                        View
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(r)}
                      style={btn}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
