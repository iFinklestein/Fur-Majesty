// src/pages/VetVisits.jsx

import { useEffect, useMemo, useState } from "react";
import { listPets, VetVisit } from "@/api/entities";

/* ================================
   Brand styles (single source)
   ================================ */
const BRAND_MAGENTA = "#e906d3";
const btnBase = {
  background: "#000",
  color: BRAND_MAGENTA,
  border: "1px solid #000",
  padding: "10px 18px",
  fontWeight: 700,
  cursor: "pointer",
  display: "inline-block",
  lineHeight: 1.1,
};
const btn = { ...btnBase, textAlign: "center" };

/* Same chevron as Dose History, at 18px */
const CHEV_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4 8 L12 16 L20 8' stroke='black' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")";

/* ================================
   Date helpers
   ================================ */
function fmtInputDate(d) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}
function fmtDisplay(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  if (String(dt).length === 10) {
    return new Date(`${dt}T00:00:00`).toLocaleDateString(undefined, {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  }
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/* ================================
   Component
   ================================ */
export default function VetVisits() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");
  const [visitDate, setVisitDate] = useState(fmtInputDate(new Date()));
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load pets once
  useEffect(() => {
    (async () => {
      const p = await listPets();
      setPets(p);
      if (p?.length && !petId) setPetId(p[0].id);
    })().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load visits for selected pet
  useEffect(() => {
    if (!petId) return;
    setLoading(true);
    VetVisit.listForPet(petId)
      .then(setRows)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [petId]);

  const selectedPetName = useMemo(
    () => pets.find((p) => p.id === petId)?.name ?? "",
    [pets, petId]
  );

  async function handleAdd(e) {
    e?.preventDefault?.();
    if (!petId || !visitDate) return;
    setSaving(true);
    try {
      await VetVisit.createWithFile({
        pet_id: petId,
        visit_date: visitDate,
        reason: reason || null,
        notes: notes || null,
        file,
      });
      setReason("");
      setNotes("");
      setFile(null);
      const r = await VetVisit.listForPet(petId);
      setRows(r);
      alert("Visit added.");
    } catch (err) {
      alert(err?.message || String(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleView(row) {
    try {
      let url = row.doc_url;
      if (!url && row.file_path) url = await VetVisit.signedUrl(row.file_path);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      alert(err?.message || String(err));
    }
  }

  async function handleDelete(row) {
    if (!window.confirm("Delete this visit record?")) return;
    try {
      await VetVisit.deleteWithFile(row.id, row.file_path);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      alert(err?.message || String(err));
    }
  }

  return (
    <div className="page" style={{ maxWidth: 400, margin: "0 auto" }}>
      {/* Intentionally no page title here to match the rest of the app */}

      <form onSubmit={handleAdd} aria-label="Add vet visit" className="panel" style={{ padding: 16 }}>
        <label className="flex flex-col" style={{ marginBottom: 10 }}>
          <span className="small muted">Pet</span>
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

        <label className="flex flex-col" style={{ marginBottom: 10 }}>
          <span className="small muted">Date</span>
          <input
            type="date"
            value={visitDate}
            onChange={(e) => setVisitDate(e.target.value)}
          />
        </label>

        <label className="flex flex-col" style={{ marginBottom: 10 }}>
          <span className="small muted">Appointment Reason (Optional)</span>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Exam, shots, follow-up…"
          />
        </label>

        <label className="flex flex-col" style={{ marginBottom: 10 }}>
          <span className="small muted">Notes</span>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={`Anything notable from ${selectedPetName || "this"} visit…`}
          />
        </label>

        <label className="flex flex-col" style={{ marginBottom: 14 }}>
          <span className="small muted">Upload (optional)</span>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        <div style={{ textAlign: "center" }}>
          <button type="submit" style={btn} disabled={saving}>
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
      </form>

      <div className="panel" style={{ marginTop: 16, padding: 12 }}>
        <div className="small muted" style={{ marginBottom: 8 }}>
          Records
        </div>
        {loading ? (
          <div>Loading…</div>
        ) : rows.length === 0 ? (
          <div>No vet visits</div>
        ) : (
          <ul className="clean" style={{ display: "grid", gap: 8 }}>
            {rows.map((r) => (
              <li key={r.id} className="card" style={{ padding: 12 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div>
                    {/* Date no longer bold */}
                    <div style={{ fontWeight: 400 }}>{fmtDisplay(r.visit_date)}</div>
                    {r.reason ? <div>{r.reason}</div> : null}
                    {r.notes ? (
                      <div className="small muted">{r.notes}</div>
                    ) : null}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
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
