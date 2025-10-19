// src/components/medications/MedicationList.jsx
import { useEffect, useState } from "react";
import { listPets } from "@/api/entities";
import { Meds, FREQUENCIES } from "@/api/medications";
import PetCarousel from "@/components/PetCarousel";

function labelFor(value) {
  return FREQUENCIES.find((f) => f.value === value)?.label ?? (value || "—");
}

export default function MedicationList() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    (async () => {
      const list = await listPets();
      setPets(list || []);
      if (list?.length && !petId) setPetId(list[0].id);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!petId) return;
    (async () => {
      const data = await Meds.listForPet(petId);
      setRows(data || []);
    })();
  }, [petId]);

  return (
    <div className="rounded border p-4 mt-4">
      <div className="mb-3" style={{ position: "relative" }}>
        <select
          value={petId}
          onChange={(e) => setPetId(e.target.value)}
          className="rounded border px-3 py-2 w-full"
        >
          {pets.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <span aria-hidden style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)" }}>▾</span>
      </div>

      {rows.length === 0 ? (
        <div style={{ display: "grid", placeItems: "center", padding: 16 }}>
          <button
            type="button"
            onClick={() => document.querySelector("[data-medication-form]")?.scrollIntoView({ behavior: "smooth" })}
            style={{
              borderRadius: 0,
              border: "1px solid #000",
              background: "#000",
              color: "var(--accent)", /* #e906d3 */
              fontWeight: 700,
              padding: "8px 14px",
            }}
          >
            Add Meds
          </button>
        </div>
      ) : (
        <PetCarousel
          items={rows}
          renderItem={(m) => (
            <div className="card" style={{ border: "1px solid #e6e6e6", borderRadius: 14, padding: 12, background: "#fff" }}>
              <div style={{ textAlign: "center", fontWeight: 700, marginBottom: 6 }}>{m.name || ""}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>&lt;Dosage&gt; :</div>
                  <div style={{ fontSize: 14 }}>{m.dosage || "—"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 2 }}>&lt;Frequency&gt; :</div>
                  <div style={{ fontSize: 14 }}>
                    {labelFor(m.frequency)}
                    {m.time_of_day ? ` @ ${m.time_of_day}` : ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("dose-intent", { detail: { petId, medicationId: m.id } }));
                    document.querySelector("[data-doselog-form]")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  style={{
                    borderRadius: 0,
                    border: "1px solid #000",
                    background: "#000",
                    color: "var(--accent)", /* #e906d3 */
                    fontWeight: 700,
                    padding: "8px 10px",
                  }}
                >
                  + Log Dose
                </button>
                <button
                  type="button"
                  onClick={() => document.querySelector("[data-medication-form]")?.scrollIntoView({ behavior: "smooth" })}
                  style={{
                    borderRadius: 0,
                    border: "1px solid #000",
                    background: "#fff",
                    color: "#000",
                    fontWeight: 700,
                    padding: "8px 10px",
                  }}
                >
                  Edit Meds
                </button>
              </div>
              <details style={{ marginTop: 10 }} open={false}>
                <summary style={{ cursor: "default", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>▲</span>
                  <span>Dose History</span>
                </summary>
              </details>
            </div>
          )}
        />
      )}
    </div>
  );
}
