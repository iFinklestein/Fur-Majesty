// FILE: src/api/vaccines.js
import { supabase } from "../lib/supabaseClient";

/* -------------------------- helpers -------------------------- */
async function getOwnerId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user?.id ?? null;
}
function assertOk({ error }) {
  if (error) throw error;
}
function toISODate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toISOString().slice(0, 10);
}

/* -------------------- vaccine type registry ------------------ */
/** Edit this list to control default expiry length by vaccine. */
export const VACCINE_TYPES = [
  { value: "Rabies (1 yr)", months: 12 },
  { value: "Rabies (3 yr)", months: 36 },
  { value: "DAPP (Distemper/Parvo)", months: 12 },
  { value: "Bordetella", months: 12 },
  { value: "Leptospirosis", months: 12 },
  { value: "Lyme", months: 12 },
];

export function monthsFor(vaccineName) {
  return VACCINE_TYPES.find((v) => v.value === vaccineName)?.months ?? 12;
}

/* --------------------------- queries ------------------------- */

/** List vaccine records for a pet (soonest expiry first). */
export async function listVaccinesForPet(petId) {
  if (!petId) return [];
  const { data, error } = await supabase
    .from("vaccine_records")
    .select(
      "id, owner_id, pet_id, title, given_on, expires_on, file_path, notes, created_at"
    )
    .eq("pet_id", petId)
    .order("expires_on", { ascending: true })
    .order("created_at", { ascending: false });

  assertOk({ error });
  return data ?? [];
}

/** Back-compat alias some components may import. */
export const listVaccineRecords = listVaccinesForPet;

/**
 * Insert a vaccine row.
 * Payload: { pet_id, title, given_on (YYYY-MM-DD), expires_on?, notes?, file? (File) }
 * Uploads file (optional) to `vaccine_docs` and stores `file_path`.
 * If expires_on is not supplied, it's auto-calculated from vaccine title.
 */
export async function addVaccineRecord(payload) {
  const owner_id = await getOwnerId();
  if (!payload?.pet_id || !payload?.title || !payload?.given_on) {
    throw new Error("Missing required fields: pet_id, title, given_on");
  }

  // Optional file upload
  let file_path = null;
  if (payload.file) {
    file_path = await uploadVaxDoc(payload.file, payload.pet_id);
  }

  // Auto-calc expiry if not provided
  let expires_on = payload.expires_on ?? null;
  try {
    if (!expires_on) {
      const months = monthsFor(payload.title);
      const given = new Date(payload.given_on);
      given.setMonth(given.getMonth() + months);
      expires_on = toISODate(given);
    }
  } catch {
    // leave null if anything goes wrong
  }

  const row = {
    owner_id,
    pet_id: payload.pet_id,
    title: payload.title,
    given_on: payload.given_on,
    expires_on,
    notes: payload.notes ?? null,
    file_path,
  };

  const { data, error } = await supabase
    .from("vaccine_records")
    .insert(row)
    .select()
    .single();

  assertOk({ error });
  return data;
}

/** Delete a vaccine record and best-effort remove its storage object. */
export async function deleteVaccineRecord(idOrRecord, maybeFilePath) {
  const id = typeof idOrRecord === "string" ? idOrRecord : idOrRecord?.id;
  const file_path =
    typeof idOrRecord === "string" ? maybeFilePath ?? null : idOrRecord?.file_path ?? null;

  if (!id) return;

  if (file_path) {
    try {
      await supabase.storage.from("vaccine_docs").remove([file_path]);
    } catch {
      /* ignore storage cleanup failures */
    }
  }

  const { error } = await supabase.from("vaccine_records").delete().eq("id", id);
  assertOk({ error });
}

/** Upload vaccine document to `vaccine_docs` bucket; return storage key */
export async function uploadVaxDoc(file, petId) {
  if (!file || !petId) return null;

  const owner_id = await getOwnerId();
  const cleanName = String(file.name || "doc").replace(/\s+/g, "_");
  const path = `${owner_id}/${petId}/${Date.now()}_${cleanName}`;

  const { error } = await supabase
    .storage
    .from("vaccine_docs")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  assertOk({ error });
  return path;
}

/** Create a signed URL for a stored vaccine document. */
export async function getVaxDocUrl(filePath, expiresInSeconds = 300) {
  if (!filePath) return null;

  const { data, error } = await supabase
    .storage
    .from("vaccine_docs")
    .createSignedUrl(filePath, expiresInSeconds);

  assertOk({ error });
  return data?.signedUrl ?? null;
}

/** Alias kept for call-sites */
export const getVaccineFileUrl = getVaxDocUrl;
