// src/api/weights.js
import { supabase } from "@/lib/supabaseClient";

/**
 * List weight rows for a pet (newest first)
 */
export async function listWeightsForPet(petId) {
  const { data, error } = await supabase
    .from("weight_logs")
    .select("id, date, lbs, notes")
    .eq("pet_id", petId)
    .order("date", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Add a weight log (lbs is required)
 */
export async function addWeight({ petId, date, lbs, notes = "" }) {
  // Normalise inputs
  const d = new Date(date);
  const isoDate = isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10);

  // Insert into the *lbs* column (not "value")
  const { data, error } = await supabase
    .from("weight_logs")
    .insert([
      {
        owner_id: (await supabase.auth.getUser()).data.user.id,
        pet_id: petId,
        date: isoDate,
        lbs: lbs,          // <-- IMPORTANT: write to lbs
        notes: notes || "",
      },
    ])
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Delete a weight log by id
 */
export async function deleteWeight(id) {
  const { error } = await supabase.from("weight_logs").delete().eq("id", id);
  if (error) throw error;
}
