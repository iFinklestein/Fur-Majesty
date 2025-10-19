// FILE: src/components/vaccines/VaccineRecords.jsx
import { useEffect, useMemo, useState } from "react";
import {
  listVaccineRecords,
  addVaccineRecord,
  deleteVaccineRecord,
  getVaccineFileUrl,
  VACCINE_TYPES,
  monthsFor,
} from "../../api/vaccines.js";
import { listPets } from "../../api/entities.js";

function fmtDate(d) {
  if (!d) return "";
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toLocaleDateString();
}

function statusMeta(expires_on) {
  if (!expires_on) return { label: "No expiry", cls: "badge badge-due" };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const exp = new Date(expires_on); exp.setHours(0, 0, 0, 0);
  const days = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
  if (days < 0) return { label: `Expired ${Math.abs(days)}d`, cls: "badge badge-expired" };
  if (days <= 30) return { label: `Expires in ${days}d`, cls: "badge badge-due" };
  return { label: "Valid", cls: "badge badge-valid" };
}

export default function VaccineRecords() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");
  const [records, setRecords] = useState([]);

  const [givenOn, setGivenOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [title, setTitle] = useState(VACCINE_TYPES[0]?.value ?? "Rabies (1 yr)");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load pets
  useEffect(() => {
    (async () => {
      const list = await listPets();
      setPets(list);
      if (list?.length && !petId) setPetId(list[0].id);
    })().catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const petOptions = useMemo(() => pets.map((p) => ({ id: p.id, name: p.name })), [pets]);

  // Expiry preview
  const expiresPreview = useMemo(() => {
    try {
      const months = monthsFor(title);
      const dt = new Date(givenOn || new Date());
      dt.setMonth(dt.getMonth() + months);
      return dt.toISOString().slice(0, 10);
    } catch { return ""; }
  }, [title, givenOn]);

  // Load records for pet
  useEffect(() => {
    if (!petId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await listVaccineRecords(petId);
        if (!cancelled) setRecords(data || []);
      } catch (e) {
        if (!cancelled) alert("Failed to load vaccine records");
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [petId]);

  async function onAdd() {
    if (!petId || !title || !givenOn) {
      alert("Pet, vaccine, and date are required.");
      return;
    }
    setSaving(true);
    try {
      await addVaccineRecord({
        pet_id: petId,
        title,
        given_on: givenOn,
        notes: notes?.trim() || null,
        file,
      });
      const data = await listVaccineRecords(petId);
      setRecords(data || []);
      setNotes(""); setFile(null);
      alert("Vaccine record added.");
    } catch (e) {
      alert("Failed to add vaccine record");
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(record) {
    const id = typeof record === "string" ? record : record?.id;
    if (!id) { alert("Missing record id."); return; }
    if (!confirm("Delete this record?")) return;

    setLoading(true);
    try {
      const file_path = typeof record === "string" ? null : record?.file_path ?? null;
      await deleteVaccineRecord(id, file_path);
      const data = await listVaccineRecords(petId);
      setRecords(data || []);
    } catch (e) {
      alert("Failed to delete vaccine record");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function onView(filePath) {
    try {
      const url = await getVaccineFileUrl(filePath);
      if (url) window.open(url, "_blank", "noopener");
    } catch (e) {
      alert("Could not open the file");
      console.error(e);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 1040 }}>
      <h2>Vaccinations</h2>

      {/* Form */}
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
          <label className="flex flex-col">
            <span className="small muted">Pet</span>
            <select value={petId} onChange={(e) => setPetId(e.target.value)}>
              {petOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>

          <label className="flex flex-col">
            <span className="small muted">Vaccine</span>
            <select value={title} onChange={(e) => setTitle(e.target.value)}>
              {VACCINE_TYPES.map((v) => <option key={v.value} value={v.value}>{v.value}</option>)}
            </select>
          </label>

          <label className="flex flex-col">
            <span className="small muted">Date</span>
            <input type="date" value={givenOn} onChange={(e) => setGivenOn(e.target.value)} />
          </label>

          <label className="flex flex-col">
            <span className="small muted">Expires (auto)</span>
            <input type="date" value={expiresPreview} readOnly title="Calculated from vaccine type + date" />
          </label>
        </div>

        <div className="grid" style={{ marginTop: 12, gridTemplateColumns: "1fr 1fr" }}>
          <label className="flex flex-col">
            <span className="small muted">Notes (optional)</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes…" />
          </label>

          <label className="flex flex-col">
            <span className="small muted">Upload record (optional)</span>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>

        <div style={{ marginTop: 12 }}>
          <button onClick={onAdd} disabled={saving || !petId} className="btn">
            {saving ? "Saving…" : "Add"}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="panel">
        <h3 style={{ marginBottom: 8 }}>Records</h3>
        {loading && <div className="muted small">Loading…</div>}
        {!loading && records.length === 0 && <div className="muted small">No vaccine records yet.</div>}

        {!loading && records.length > 0 && (
          <ul className="clean">
            {records.map((rx, i) => {
              const st = statusMeta(rx.expires_on);
              return (
                <li key={rx.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i ? "1px solid var(--border)" : "0" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ fontWeight: 600 }} className="truncate">{rx.title ?? "Other"}</div>
                      <span className={st.cls}>{st.label}</span>
                    </div>
                    <div className="small muted">
                      Given: {fmtDate(rx.given_on)} • Expires: {fmtDate(rx.expires_on)}
                      {rx.notes ? ` — ${rx.notes}` : ""}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    {rx.file_path ? (
                      <button type="button" onClick={() => onView(rx.file_path)} className="btn btn-outline">View</button>
                    ) : null}
                    <button type="button" onClick={() => onDelete(rx)} className="btn btn-danger">Delete</button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
