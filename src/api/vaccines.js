// src/api/vaccines.js
import { supabase } from "@/lib/supabaseClient";

/** Optional list for UI */
export const COMMON_VACCINES = [
  "Rabies (1yr)",
  "Rabies (3yr)",
  "DHPP",
  "DAPPv",
  "Bordetella",
  "Leptospirosis",
  "Lyme",
  "Canine Influenza (H3N2/H3N8)",
];

/** Default expiry rules (years) */
const EXPIRY_YEARS = {
  "Rabies (1yr)": 1,
  "Rabies (3yr)": 3,
  DHPP: 1,
  DAPPv: 1,
  Bordetella: 1,
  Leptospirosis: 1,
  Lyme: 1,
  "Canine Influenza (H3N2/H3N8)": 1,
};

export function calcExpiry(vaccineName, givenISOOrDate) {
  const base = new Date(givenISOOrDate);
  if (Number.isNaN(base.getTime())) return null;
  const years = EXPIRY_YEARS[vaccineName] ?? 1;
  const d = new Date(base);
  d.setFullYear(d.getFullYear() + years);
  return d.toISOString().slice(0, 10); // yyyy-mm-dd
}

/* ----------------- Functions entities.js expects ----------------- */

/** List records for a pet (newest first) */
export async function listVaccinesForPet(pet_id) {
  if (!pet_id) return [];
  const { data, error } = await supabase
    .from("vaccine_records")
    .select("*")
    .eq("pet_id", pet_id)
    .order("given_on", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Upload doc to storage (returns path) */
export async function uploadVaxDoc(file, { owner_id, pet_id }) {
  if (!file) return null;
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const key = `${owner_id}/${pet_id}/${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from("vaccine_docs")
    .upload(key, file, { upsert: false });
  if (error) throw error;
  return key;
}

/** Public URL for a stored doc */
export function getVaxDocUrl(file_path) {
  if (!file_path) return null;
  const { data } = supabase.storage.from("vaccine_docs").getPublicUrl(file_path);
  return data?.publicUrl || null;
}

/** Insert record — includes legacy 'title' to satisfy old NOT NULL constraint */
export async function addVaccineRecord({
  pet_id,
  vaccine,
  given_on,     // yyyy-mm-dd
  expires_on,   // yyyy-mm-dd
  file,         // optional File
  notes,        // optional
}) {
  if (!pet_id) throw new Error("pet_id required");

  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr) throw userErr;
  const owner_id = user?.id;
  if (!owner_id) throw new Error("Not signed in");

  let file_path = null;
  if (file) {
    file_path = await uploadVaxDoc(file, { owner_id, pet_id });
  }

  const payload = {
    pet_id,
    owner_id,
    vaccine,
    title: vaccine,            // <-- legacy support
    given_on,
    expires_on: expires_on || null,
    file_path,
    notes: notes || null,
  };

  const { data, error } = await supabase
    .from("vaccine_records")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Delete record (and its file if present) */
export async function deleteVaccineRecord(id) {
  const { data, error } = await supabase
    .from("vaccine_records")
    .select("file_path")
    .eq("id", id)
    .single();
  if (error) throw error;

  const file_path = data?.file_path;
  if (file_path) {
    await supabase.storage.from("vaccine_docs").remove([file_path]).catch(() => {});
  }

  const { error: delErr } = await supabase
    .from("vaccine_records")
    .delete()
    .eq("id", id);
  if (delErr) throw delErr;
  return true;
}

/* ----------------- Object wrapper your page imports ----------------- */
export const VaccineRecords = {
  listByPet: listVaccinesForPet,
  add: addVaccineRecord,
  remove: deleteVaccineRecord,
  getPublicUrl: getVaxDocUrl,
};
