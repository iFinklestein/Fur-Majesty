// FILE: src/pages/VetVisits.jsx
import { useEffect, useMemo, useState } from "react";
import { listPets, VetVisit } from "@/api/entities";

function fmtDate(d) {
  if (!d) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export default function VetVisits() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");
  const [visitDate, setVisitDate] = useState(fmtDate(new Date()));
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await listPets();
      setPets(p);
      if (p?.length && !petId) setPetId(p[0].id);
    })().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!petId) return;
    setLoading(true);
    VetVisit.listForPet(petId)
      .then((r) => setRows(r))
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
      setReason(""); setNotes(""); setFile(null);
      const r = await VetVisit.listForPet(petId);
      setRows(r);
      alert("Visit added.");
    } catch (err) {
      alert(err.message || String(err));
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
      alert(err.message || String(err));
    }
  }

  async function handleDelete(row) {
    if (!window.confirm("Delete this visit record?")) return;
    try {
      await VetVisit.deleteWithFile(row.id, row.file_path);
      setRows((prev) => prev.filter((r) => r.id !== row.id));
    } catch (err) {
      alert(err.message || String(err));
    }
  }

  return (
    <div className="page" style={{ maxWidth: 840, margin: "0 auto" }}>
      <h2>Vet Visits</h2>

      <form onSubmit={handleAdd} aria-label="Add vet visit" className="panel">
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <label className="flex flex-col">
            <span className="small muted">Pet</span>
            <select id="pet" name="pet" value={petId} onChange={(e) => setPetId(e.target.value)}>
              {pets.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>

          <label className="flex flex-col">
            <span className="small muted">Visit date</span>
            <input id="visit-date" type="date" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
          </label>

          <label className="flex flex-col">
            <span className="small muted">Reason (optional)</span>
            <input id="reason" type="text" value={reason} placeholder="Exam, shots, follow-up…" onChange={(e) => setReason(e.target.value)} />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <label className="flex flex-col">
            <span className="small muted">Notes (optional)</span>
            <textarea id="notes" value={notes} placeholder={`Anything notable from ${selectedPetName}'s visit…`} onChange={(e) => setNotes(e.target.value)} rows={4} style={{ width: "100%" }} />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <label className="flex flex-col">
            <span className="small muted">Upload document (optional)</span>
            <input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
      </form>

      <h3 style={{ marginTop: 24 }}>Records for {selectedPetName || "selected pet"}</h3>

      {loading ? (
        <p>Loading…</p>
      ) : rows.length === 0 ? (
        <p>No visits yet.</p>
      ) : (
        <ul className="clean" style={{ display: "grid", gap: 8 }}>
          {rows.map((r) => (
            <li key={r.id} className="card" style={{ padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <strong style={{ fontWeight: 600 }}>{r.visit_date}</strong>
                  {r.reason ? <> — {r.reason}</> : null}
                  {r.notes ? <div className="small muted">{r.notes}</div> : null}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {(r.doc_url || r.file_path) && (
                    <button className="btn btn-outline" onClick={() => handleView(r)} type="button" aria-label="View document">
                      View
                    </button>
                  )}
                  <button className="btn btn-danger" onClick={() => handleDelete(r)} type="button" aria-label="Delete record">
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
