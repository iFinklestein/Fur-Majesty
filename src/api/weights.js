// src/api/weights.js
import { supabase } from "@/lib/supabaseClient";

/** Local YYYY-MM-DD (no timezone shift) */
function toLocalISODate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * List weight rows for a pet (newest first)
 */
export async function listWeightsForPet(petId) {
  const { data, error } = await supabase
    .from("weight_logs")
    .select("id, date, lbs, unit, notes")
    .eq("pet_id", petId)
    .order("date", { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Add a weight log
 * - lbs is required
 * - unit is optional (e.g., "lb" | "kg"); if the column doesn't exist, we retry without it
 */
export async function addWeight({ petId, date, lbs, unit, notes = "" }) {
  if (!petId) throw new Error("addWeight: petId required");
  if (lbs === undefined || lbs === null || isNaN(Number(lbs))) {
    throw new Error("addWeight: lbs is required (number)");
  }

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const owner_id = userData?.user?.id;

  const isoDate = toLocalISODate(date || new Date());

  // First try inserting with unit (if provided)
  let payload = {
    owner_id,
    pet_id: petId,
    date: isoDate,
    lbs: Number(lbs),
    notes: notes || "",
  };
  if (unit) payload.unit = unit;

  let { data, error } = await supabase
    .from("weight_logs")
    .insert([payload])
    .select("id")
    .single();

  // If the table doesn't have `unit`, retry without it
  if (error && String(error.code) === "42703") {
    const { unit: _unit, ...withoutUnit } = payload;
    ({ data, error } = await supabase
      .from("weight_logs")
      .insert([withoutUnit])
      .select("id")
      .single());
  }

  if (error) throw error;
  return data?.id;
}

/**
 * Delete a weight log by id
 */
export async function deleteWeight(id) {
  const { error } = await supabase.from("weight_logs").delete().eq("id", id);
  if (error) throw error;
}
