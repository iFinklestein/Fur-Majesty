// src/pages/Dashboard.jsx
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import AddPetForm from "../components/pets/AddPetForm";
import PetCarousel from "../components/PetCarousel";
import { getPublicUrl } from "@/api/integrations";

export default function Dashboard() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

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
      {/* Add Pet */}
      <div className="card">
        <details>
          <summary className="summary-clean">Add Pet</summary>
          <div style={{ marginTop: 8 }}>
            <AddPetForm onCreated={handlePetCreated} />
          </div>
        </details>
      </div>

      {/* My Pets */}
      <div className="card" style={{ paddingTop: 8 }}>
        <h2 style={{ marginBottom: 8 }}>My Pets</h2>

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
                      <div style={{ fontWeight: 700 }}>{pet.name}</div>
                      <button onClick={() => deletePet(pet.id)}>Delete</button>
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
  if (!m) return ymd; // unexpected shape; show as-is
  const [, yyyy, mm, dd] = m;
  return `${mm}/${dd}/${yyyy}`;
}
