// src/pages/Medications.jsx
import { useEffect, useMemo, useState } from "react";
import { listPets } from "@/api/entities";
import { Meds, FREQUENCIES, MedDoseLog as DoseLog } from "@/api/medications";
import PetCarousel from "@/components/PetCarousel";
import MedicationForm from "@/components/medications/MedicationForm";
import DoseLogForm from "@/components/medications/DoseLogForm";

/* ---------- helpers ---------- */
function freqLabel(v) {
  return FREQUENCIES.find((f) => f.value === v)?.label ?? (v || "—");
}
function to12h(time) {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const minute = parseInt(m || "0", 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hr12 = ((hour + 11) % 12) + 1;
  return `${hr12}:${String(minute).padStart(2, "0")} ${ampm}`;
}
/* inline chevron (matches Dose History) */
const CHEV_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4 8 L12 16 L20 8' stroke='black' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")";
const chevStyle = (rot180 = false) => ({
  width: 18, height: 18, backgroundImage: CHEV_BG, backgroundRepeat: "no-repeat",
  backgroundSize: "18px 18px", transform: rot180 ? "rotate(180deg)" : "none",
  transition: "transform 160ms ease", flex: "0 0 18px",
});
/* select style with large chevron */
const SELECT_STYLE = {
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  backgroundImage: CHEV_BG,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 10px center",
  backgroundSize: "18px 18px",
  paddingRight: 34,
};

export default function Medications() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");
  const [meds, setMeds] = useState([]);
  const [loading, setLoading] = useState(false);

  const [showMedForm, setShowMedForm] = useState(false);
  const [showDoseForm, setShowDoseForm] = useState(false);

  const [logsByMed, setLogsByMed] = useState({});
  const [expanded, setExpanded] = useState({});
  const [hasLogs, setHasLogs] = useState({});
  const [historyError, setHistoryError] = useState({});

  useEffect(() => {
    (async () => {
      const list = await listPets();
      setPets(list || []);
      if (list?.length) setPetId(list[0].id);
    })();
  }, []);

  async function reloadMeds(pid) {
    if (!pid) { setMeds([]); return; }
    setLoading(true);
    try {
      const rows = await Meds.listForPet(pid);
      setMeds(rows || []);
      setLogsByMed({});
      setHasLogs({});
      setExpanded({});
      setHistoryError({});
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { reloadMeds(petId); }, [petId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const m of meds) {
        try {
          const list = await DoseLog.list({ petId, medicationId: m.id });
          if (cancelled) return;
          const has = (list?.length ?? 0) > 0;
          setHasLogs(prev => ({ ...prev, [m.id]: has }));
          if (has) setLogsByMed(prev => ({ ...prev, [m.id]: list }));
        } catch {
          setHistoryError(prev => ({ ...prev, [m.id]: "History hidden by security policy. (Owner only)" }));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [meds, petId]);

  const petOptions = useMemo(() => pets.map(p => ({ value: p.id, label: p.name })), [pets]);

  function openAddMeds() {
    setShowMedForm(true);
    setShowDoseForm(false);
    requestAnimationFrame(() => {
      document.querySelector("[data-medication-form]")?.scrollIntoView({ behavior: "smooth" });
    });
  }
  function openEditMeds() { openAddMeds(); }

  function openLogDose(medId) {
    setShowDoseForm(true);
    setShowMedForm(false);
    requestAnimationFrame(() => {
      window.dispatchEvent(new CustomEvent("dose-intent", { detail: { petId, medicationId: medId } }));
      document.querySelector("[data-doselog-form]")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  async function refreshLogs(medicationId) {
    try {
      const list = await DoseLog.list({ petId, medicationId });
      setLogsByMed(prev => ({ ...prev, [medicationId]: list }));
      setHasLogs(prev => ({ ...prev, [medicationId]: (list?.length ?? 0) > 0 }));
      setHistoryError(prev => ({ ...prev, [medicationId]: null }));
    } catch {
      setHistoryError(prev => ({ ...prev, [medicationId]: "History hidden by security policy. (Owner only)" }));
    }
  }

  function toggleHistory(medId) {
    setExpanded(prev => ({ ...prev, [medId]: !prev[medId] }));
    if (!logsByMed[medId]) {
      (async () => {
        try {
          const list = await DoseLog.list({ petId, medicationId: medId });
          setLogsByMed(prev => ({ ...prev, [medId]: list }));
          setHasLogs(prev => ({ ...prev, [medId]: (list?.length ?? 0) > 0 }));
        } catch {
          setHistoryError(prev => ({ ...prev, [medId]: "History hidden by security policy. (Owner only)" }));
        }
      })();
    }
  }

  async function deleteLog(medicationId, logId) {
    const ok = window.confirm("Delete this dose log? This cannot be undone.");
    if (!ok) return;
    try {
      await DoseLog.remove(logId);
      await refreshLogs(medicationId);
    } catch (e) {
      console.error(e);
      alert("Failed to delete dose log.");
    }
  }

  return (
    <div className="page" style={{ paddingTop: 8 }}>
      {/* Pet selector (large chevron) */}
      <div className="card" style={{ padding: 10, marginBottom: 12 }}>
        <select
          value={petId}
          onChange={(e) => setPetId(e.target.value)}
          className="rounded border px-3 py-2 w-full"
          style={SELECT_STYLE}
        >
          {petOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="card" style={{ paddingTop: 8 }}>
        {loading ? (
          <div>Loading…</div>
        ) : meds.length === 0 ? (
          <div style={{ display: "grid", placeItems: "center", padding: 16 }}>
            <button
              type="button"
              onClick={openAddMeds}
              className="btn"
              style={{ minWidth: 120 }}
            >
              Add Meds
            </button>
          </div>
        ) : (
          <PetCarousel
            items={meds}
            renderItem={(m) => {
              const logs = logsByMed[m.id] || [];
              const isOpen = !!expanded[m.id];
              const histErr = historyError[m.id];

              return (
                <div className="card" style={{ border: "1px solid #e6e6e6", borderRadius: 14, padding: 12, background: "#fff" }}>
                  {/* Name (weight 500) */}
                  <div style={{ textAlign: "center", fontWeight: 500, marginBottom: 6 }}>
                    {m.name || ""}
                  </div>

                  {/* Dosage / Frequency */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div><div style={{ fontSize: 14 }}>{m.dosage || "—"}</div></div>
                    <div>
                      <div style={{ fontSize: 14 }}>
                        {freqLabel(m.frequency)}
                        {m.time_of_day ? ` @ ${to12h(m.time_of_day)}` : ""}
                      </div>
                    </div>
                  </div>

                  {/* Buttons (brand; same size) */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={() => openLogDose(m.id)}
                      className="btn"
                    >
                      Log Dose
                    </button>
                    <button
                      type="button"
                      onClick={openEditMeds}
                      className="btn"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Dose History header (right chevron) */}
                  <div
                    role="button"
                    onClick={() => toggleHistory(m.id)}
                    style={{
                      marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 8, cursor: "pointer", userSelect: "none", paddingRight: 2,
                    }}
                    aria-expanded={isOpen}
                  >
                    <span>Dose History</span>
                    <span style={chevStyle(isOpen)} />
                  </div>

                  {/* History list / inline hint */}
                  {isOpen && (
                    histErr ? (
                      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                        {histErr}
                      </div>
                    ) : logs.length > 0 ? (
                      <ul style={{ marginTop: 8, paddingLeft: 0, listStyle: "none" }}>
                        {logs.map((d) => (
                          <li key={d.id}
                            style={{ fontSize: 13, marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                            <span>
                              {new Date(d.given_at).toLocaleString()}
                              {d.amount ? ` • ${d.amount}` : ""} {d.notes ? `— ${d.notes}` : ""}
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteLog(m.id, d.id)}
                              title="Delete dose"
                              className="btn"
                              style={{ padding: "4px 8px" }}
                            >
                              Delete
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                        No doses logged yet.
                      </div>
                    )
                  )}
                </div>
              );
            }}
          />
        )}
      </div>

      {/* Hidden forms */}
      {showMedForm && (
        <div className="card" style={{ marginTop: 16 }} data-medication-form>
          <MedicationForm
            onSaved={async () => { await reloadMeds(petId); setShowMedForm(false); }}
            onCancel={() => setShowMedForm(false)}
          />
        </div>
      )}

      {showDoseForm && (
        <div className="card" style={{ marginTop: 16 }} data-doselog-form>
          <DoseLogForm
            onSaved={async (medicationId) => { setShowDoseForm(false); await refreshLogs(medicationId); }}
            onCancel={() => setShowDoseForm(false)}
          />
        </div>
      )}
    </div>
  );
}
