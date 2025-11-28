// src/components/vaccines/VaccineRecords.jsx
import { useEffect, useMemo, useState } from "react";
import { listPets } from "@/api/entities";
import {
  COMMON_VACCINES,
  VaccineRecords as API,
  calcExpiry,
} from "@/api/vaccines";

const CHEV_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4 8 L12 16 L20 8' stroke='black' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")";

const BRAND_MAGENTA = "#e906d3";
const BRAND_BTN = {
  borderRadius: 0,
  border: "1px solid #000",
  background: "#000",
  color: BRAND_MAGENTA,
  fontWeight: 700,
  padding: "6px 18px",
  minWidth: 100,
};

export default function VaccineRecords() {
  const [pets, setPets] = useState([]);
  const [petId, setPetId] = useState("");

  // Add Vaccine form state
  const [vaccine, setVaccine] = useState("");
  const [givenOn, setGivenOn] = useState("");     // yyyy-mm-dd
  const [expiresOn, setExpiresOn] = useState(""); // yyyy-mm-dd (auto)
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Records state
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load pets
  useEffect(() => {
    (async () => {
      const list = await listPets();
      setPets(list || []);
      const first = list?.[0];
      const idKey = first?.id ?? first?.pet_id ?? first?.petId ?? "";
      if (idKey) setPetId(String(idKey));
    })();
  }, []);

  // Auto-calc expiry as ISO
  useEffect(() => {
    if (vaccine && givenOn) setExpiresOn(calcExpiry(vaccine, givenOn));
    else setExpiresOn("");
  }, [vaccine, givenOn]);

  async function refresh(pid = petId) {
    if (!pid) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const data = await API.listByPet(pid);
      setRows(data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh(petId);
    // When switching pets, hide and reset form so you don't cross-contaminate inputs
    resetForm();
    setShowForm(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [petId]);

  const petOptions = useMemo(
    () =>
      (pets || [])
        .map((p) => {
          const idVal = p.id ?? p.pet_id ?? p.petId;
          return { value: String(idVal), label: p.name ?? p.pet_name ?? "Pet" };
        })
        .filter((o) => o.value && o.value !== "undefined"),
    [pets]
  );

  function resetForm() {
    setVaccine("");
    setGivenOn("");
    setExpiresOn("");
    setFile(null);
  }

  async function handleAdd() {
    const cleanPetId = (petId || "").trim();
    if (!cleanPetId) {
      alert("Select a pet first.");
      return;
    }
    if (!vaccine) {
      alert("Select a vaccine.");
      return;
    }
    if (!givenOn) {
      alert("Pick the shot date.");
      return;
    }

    setSaving(true);
    try {
      await API.add({
        pet_id: cleanPetId,
        vaccine,
        given_on: givenOn,             // yyyy-mm-dd
        expires_on: expiresOn || null, // yyyy-mm-dd
        file,
      });
      resetForm();
      setShowForm(false);
      await refresh(cleanPetId);
    } catch (e) {
      console.error(e);
      alert("Failed to add vaccine record.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this vaccine record?")) return;
    try {
      await API.remove(id);
      await refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to delete record.");
    }
  }

  function openForm() {
    setShowForm(true);
    requestAnimationFrame(() => {
      document
        .querySelector("[data-vaccine-form]")
        ?.scrollIntoView({ behavior: "smooth" });
    });
  }

  function cancelForm() {
    resetForm();
    setShowForm(false);
  }

  return (
    <div className="page" style={{ paddingTop: 8 }}>
      {/* Card 1: Pet selector (matches Medications header card) */}
      <div
        className="card"
        style={{
          padding: 10,
          marginBottom: 12,
          maxWidth: 460,
          marginInline: "auto",
        }}
      >
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
          {petOptions.length === 0 ? (
            <option value="">No pets found</option>
          ) : (
            petOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Card 2: Records + Add button (Medications-style) */}
      <div
        className="card"
        style={{ padding: 12, maxWidth: 460, marginInline: "auto" }}
      >
        <div
          style={{
            fontWeight: 400,
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span>Records</span>
          {rows.length > 0 && (
            <button
              type="button"
              onClick={openForm}
              className="btn"
              style={{ minWidth: 110 }}
            >
              Add Vaccine
            </button>
          )}
        </div>

        {loading ? (
          <div>Loading…</div>
        ) : rows.length === 0 ? (
          <div style={{ display: "grid", placeItems: "center", padding: 16 }}>
            <button
              type="button"
              onClick={openForm}
              className="btn"
              style={{ minWidth: 120 }}
            >
              Add Vaccine
            </button>
          </div>
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
            {rows.map((r) => {
              const url = API.getPublicUrl(r.file_path);
              return (
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
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 8,
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 400 }}>
                        {r.vaccine ?? r.title}
                      </div>
                      <div style={{ fontSize: 13, opacity: 0.9 }}>
                        {formatMDY(r.given_on)}{" "}
                        {r.expires_on
                          ? `• Expires ${formatMDY(r.expires_on)}`
                          : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        disabled={!url}
                        onClick={() =>
                          url && window.open(url, "_blank", "noopener")
                        }
                        style={{
                          ...BRAND_BTN,
                          minWidth: 70,
                          padding: "6px 10px",
                        }}
                        title={url ? "Open attachment" : "No file"}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        style={{
                          ...BRAND_BTN,
                          minWidth: 70,
                          padding: "6px 10px",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Card 3: Add Vaccine form (hidden until Add Vaccine pressed) */}
      {showForm && (
        <div
          className="card"
          style={{
            marginTop: 16,
            maxWidth: 460,
            marginInline: "auto",
            padding: 16,
          }}
          data-vaccine-form
        >
          <h2 style={{ marginTop: 0, marginBottom: 10, fontWeight: 400 }}>
            Add Vaccine
          </h2>

          {/* stacked fields, same pattern as other pages */}
          <label className="flex flex-col" style={{ marginBottom: 8 }}>
            <span className="text-sm text-gray-600">Vaccine</span>
            <select
              value={vaccine}
              onChange={(e) => setVaccine(e.target.value)}
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
              <option value="" disabled>
                Choose a vaccine…
              </option>
              {COMMON_VACCINES.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col" style={{ marginBottom: 8 }}>
            <span className="text-sm text-gray-600">Date given</span>
            <input
              type="date"
              value={givenOn}
              onChange={(e) => setGivenOn(e.target.value)}
              className="rounded border px-3 py-2 w-full"
            />
          </label>

          <label className="flex flex-col" style={{ marginBottom: 8 }}>
            <span className="text-sm text-gray-600">Expires (auto)</span>
            <input
              type="text"
              value={formatMDY(expiresOn)}
              readOnly
              className="rounded border px-3 py-2 w-full"
              style={{ background: "#f7f7f7", color: "#555" }}
              aria-label="Expires (auto-calculated)"
              title="Auto-calculated"
            />
          </label>

          <label className="flex flex-col" style={{ marginBottom: 8 }}>
            <span className="text-sm text-gray-600">
              Attachment (optional)
            </span>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </label>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving}
              className="btn"
              style={BRAND_BTN}
            >
              {saving ? "Saving…" : "Add"}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="btn"
              style={BRAND_BTN}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatMDY(ymd) {
  if (!ymd) return "";
  const d =
    typeof ymd === "string"
      ? new Date(ymd)
      : new Date(ymd?.toString?.() ?? ymd);
  if (Number.isNaN(d.getTime())) return "";
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const y = d.getFullYear();
  return `${m}/${day}/${y}`;
}
