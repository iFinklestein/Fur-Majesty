// FILE: src/api/grooming.js
import { supabase } from "../lib/supabaseClient";

// --- Date helpers (timezone safe) ---
// Accepts either a local "YYYY-MM-DD" string or a Date.
// Returns a local "YYYY-MM-DD" string without any UTC conversion.
function normalizeDate(v) {
  if (!v) return null;
  if (typeof v === "string") {
    // For <input type="date"> this is already local "YYYY-MM-DD"
    return v;
  }
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---- queries ----
export async function listGroomingLogs(petId) {
  if (!petId) return [];
  const { data, error } = await supabase
    .from("grooming_logs")
    .select("id, owner_id, pet_id, date, type, created_at")
    .eq("pet_id", petId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Back-compat alias if anything still imports this name.
export const listGroomsForPet = listGroomingLogs;

export async function addGroomingLog({ pet_id, date, type }) {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  const owner_id = authData?.user?.id ?? null;

  const row = {
    owner_id,
    pet_id,
    date: normalizeDate(date), // <- keep local date, no UTC conversion
    type: type ?? null,
  };

  const { data, error } = await supabase
    .from("grooming_logs")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteGroomingLog(idOrRow) {
  const id = typeof idOrRow === "string" ? idOrRow : idOrRow?.id;
  if (!id) return;
  const { error } = await supabase.from("grooming_logs").delete().eq("id", id);
  if (error) throw error;
}
