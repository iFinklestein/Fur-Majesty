// src/pages/Dashboard.jsx
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AddPetForm from "../components/pets/AddPetForm";
import PetCarousel from "../components/PetCarousel";
import { getPublicUrl } from "@/api/integrations";

/* ---------- inline chevron (IDENTICAL to Medications) ---------- */
const CHEV_BG =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4 8 L12 16 L20 8' stroke='black' stroke-width='3' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>\")";
const chevStyle = (rot180 = false) => ({
  width: 18,
  height: 18,
  backgroundImage: CHEV_BG,
  backgroundRepeat: "no-repeat",
  backgroundSize: "18px 18px",
  transform: rot180 ? "rotate(180deg)" : "none",
  transition: "transform 160ms ease",
  flex: "0 0 18px",
});

export default function Dashboard() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Pet disclosure state (to match Meds header + chevron behavior)
  const [showAdd, setShowAdd] = useState(false);

  const loadPets = useCallback(async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) {
      setPets([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("pets")
      .select("id, name, species, breed, sex, dob, photo_path")
      .or(`user_id.eq.${user.id},owner_id.eq.${user.id}`)
      .order("name", { ascending: true });

    if (!error) {
      const withUrls = (data || []).map((p) => ({
        ...p,
        photo_url: p.photo_path ? getPublicUrl("pet-photos", p.photo_path) : "",
      }));
      setPets(withUrls);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  const handlePetCreated = () => loadPets();

  const deletePet = async (id) => {
    await supabase.from("pets").delete().eq("id", id);
    loadPets();
  };

  return (
    <div className="page">
      {/* Add Pet (header uses SAME chevron as Medications) */}
      <div className="card" style={{ padding: 12 }}>
        <div
          role="button"
          onClick={() => setShowAdd((v) => !v)}
          aria-expanded={showAdd}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            cursor: "pointer",
            userSelect: "none",
            paddingRight: 2,
          }}
        >
          {/* Match your header weight preference (500) */}
          <span style={{ fontWeight: 500 }}>Add Pet</span>
          <span style={chevStyle(showAdd)} />
        </div>

        {showAdd && (
          <div style={{ marginTop: 10 }}>
            <AddPetForm onCreated={handlePetCreated} />
          </div>
        )}
      </div>

      {/* My Pets */}
      <div className="card" style={{ paddingTop: 8 }}>
        <h2 style={{ marginBottom: 8, fontWeight: 500 }}>My Pets</h2>

        {loading && <p>Loading pets…</p>}
        {!loading && pets.length === 0 && <p>No pets yet.</p>}

        {!loading && pets.length > 0 && (
          <PetCarousel
            items={pets}
            renderItem={(pet) => (
              <div className="card">
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {/* Photo thumbnail */}
                  <div
                    style={{
                      height: 72,
                      width: 72,
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid #e5e5e5",
                      background: "#f6f6f6",
                      flexShrink: 0,
                    }}
                  >
                    {pet.photo_url ? (
                      <img
                        src={pet.photo_url}
                        alt={pet.name}
                        style={{ height: "100%", width: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div
                        style={{
                          height: "100%",
                          width: "100%",
                          display: "grid",
                          placeItems: "center",
                          fontSize: 12,
                          color: "#777",
                        }}
                      >
                        No photo
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      {/* Pet name weight 500 to match your non-bold directive */}
                      <div style={{ fontWeight: 500 }}>{pet.name}</div>
                      <button className="btn" onClick={() => deletePet(pet.id)}>
                        Delete
                      </button>
                    </div>

                    <div className="small" style={{ marginTop: 8 }}>
                      Species: {pet.species || "—"} &nbsp;|&nbsp; Breed: {pet.breed || "—"} &nbsp;|&nbsp; Sex: {pet.sex || "—"}
                    </div>

                    <div className="small" style={{ marginTop: 6 }}>
                      Birthdate: {pet.dob ? formatDateYmdToUs(pet.dob) : "—"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Format a YYYY-MM-DD string to MM/DD/YYYY without timezone conversion.
 * If the input isn't in that shape, we fall back to the raw value.
 */
function formatDateYmdToUs(ymd) {
  if (typeof ymd !== "string") return String(ymd ?? "");
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return ymd;
  const [, yyyy, mm, dd] = m;
  return `${mm}/${dd}/${yyyy}`;
}
