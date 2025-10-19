import { supabase } from "../lib/supabaseClient";

// ---- utils ----
function toISODate(v) {
  if (!v) return null;
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

// ---- queries ----
export async function listGroomingLogs(petId) {
  if (!petId) return [];
  const { data, error } = await supabase
    .from("grooming_logs")
    .select("id, owner_id, pet_id, date, type, notes, created_at")
    .eq("pet_id", petId)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

// Back-compat alias (if old callers use this name)
export const listGroomsForPet = listGroomingLogs;

export async function addGroomingLog({ pet_id, date, type, notes }) {
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;
  const owner_id = authData?.user?.id ?? null;

  const row = {
    owner_id,
    pet_id,
    date: toISODate(date),
    type: type ?? null,   // your schema requires NOT NULL; UI supplies a value
    notes: notes ?? null,
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
