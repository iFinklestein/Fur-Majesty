import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import PetNotes from "../components/pets/PetNotes";

export default function Pets() {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPets = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        setPets([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("pets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching pets:", error.message);
      } else {
        setPets(data);
      }
      setLoading(false);
    };

    fetchPets();
  }, []);

  if (loading) return <p>Loading pets...</p>;
  if (!pets.length) return <p>No pets yet.</p>;

  return (
    <div>
      <h2>My Pets</h2>
      {pets.map((pet) => (
        <div
          key={pet.id}
          style={{
            border: "1px solid #ccc",
            padding: "1rem",
            marginBottom: "1rem",
            borderRadius: "6px",
          }}
        >
          <h3>{pet.name}</h3>
          <p>
            Species: {pet.species} | Breed: {pet.breed} | Sex: {pet.sex}
          </p>

          {/* Attach Pet Notes here */}
          <PetNotes petId={pet.id} />
        </div>
      ))}
    </div>
  );
}
