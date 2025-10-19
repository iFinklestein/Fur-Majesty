// src/api/entities.js
import { supabase } from "@/lib/supabaseClient";
import { getPublicUrl as _getPublicUrl } from "./integrations";

// ---------- helpers ----------
async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}
async function getUserId() {
  const user = await getUser();
  return user?.id ?? null;
}

// generic CRUD wrapper for a table
function table(name) {
  return {
    name,

    async list(where = {}, orderBy = "created_at", ascending = false) {
      let q = supabase.from(name).select("*");
      if (where && Object.keys(where).length) q = q.match(where);
      if (orderBy) q = q.order(orderBy, { ascending });
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },

    async filter(where = {}, orderBy = "created_at", ascending = false) {
      return this.list(where, orderBy, ascending);
    },

    async get(id) {
      const { data, error } = await supabase.from(name).select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },

    async create(payload) {
      // Normalize ownership: write BOTH user_id and owner_id if present in schema.
      const uid = payload?.user_id ?? (await getUserId());
      const owning = {
        ...payload,
        user_id: uid,
        owner_id: payload?.owner_id ?? uid,
      };

      const { data, error } = await supabase
        .from(name)
        .insert([owning])
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async update(id, patch) {
      const { data, error } = await supabase.from(name).update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },

    async delete(id) {
      const { error } = await supabase.from(name).delete().eq("id", id);
      if (error) throw error;
      return true;
    },
  };
}

// ---------- User ----------
export const User = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },
  async id() {
    return await getUserId();
  },
};

// ---------- Pets ----------
export const Pet = {
  ...table("pets"),

  async listForMe() {
    const owner_id = await getUserId();
    // Query by both columns to be future-proof
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .or(`user_id.eq.${owner_id},owner_id.eq.${owner_id}`)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  photoUrlFromPath(photo_path) {
    if (!photo_path) return "";
    return _getPublicUrl("pet-photos", photo_path) || "";
  },
};

export async function listPets() {
  return await Pet.listForMe();
}

// ---------- Vaccine Records ----------
export const VaccineRecord = table("vaccine_records");
export {
  listVaccinesForPet,
  addVaccineRecord,
  uploadVaxDoc,
  getVaxDocUrl,
  deleteVaccineRecord,
} from "./vaccines";

// ---------- Medications (moved out) ----------
export {
  Medication,
  MedDoseLog,
  DoseLog
} from "./medications";

// ---------- Pet Notes / Tasks / Grooming / Feeding ----------
export const PetNote         = table("pet_notes");
export const Task            = table("tasks");
export const Grooming        = table("grooming_sessions");
export const FeedingSchedule = table("feeding_schedules");

// ---------- Vet Visits ----------
const VET_BUCKET = "vet_docs";

export const VetVisit = {
  ...table("vet_visits"),

  async listForPet(pet_id) {
    const owner_id = await getUserId();
    return this.list({ owner_id, pet_id }, "visit_date", false);
  },

  async createWithFile(fields) {
    const { file, ...rest } = fields ?? {};
    const visit = await this.create({
      pet_id: rest.pet_id,
      visit_date: rest.visit_date,
      reason: rest.reason ?? null,
      notes: rest.notes ?? null,
    });

    if (file) {
      const owner_id = await getUserId();
      const safeName = file.name?.replace(/\s+/g, "_") ?? "document";
      const filePath = `${owner_id}/${visit.id}/${safeName}`;

      const { error: upErr } = await supabase.storage
        .from(VET_BUCKET)
        .upload(filePath, file, { upsert: true, cacheControl: "3600" });
      if (upErr) throw upErr;

      const { data: signed, error: signErr } = await supabase.storage
        .from(VET_BUCKET)
        .createSignedUrl(filePath, 60 * 60);
      if (signErr) throw signErr;

      await this.update(visit.id, { file_path: filePath, doc_url: signed.signedUrl });
      visit.file_path = filePath;
      visit.doc_url = signed.signedUrl;
    }

    return visit;
  },

  async signedUrl(file_path) {
    if (!file_path) return null;
    const { data, error } = await supabase.storage.from(VET_BUCKET).createSignedUrl(file_path, 60 * 60);
    if (error) throw error;
    return data?.signedUrl ?? null;
  },

  async deleteWithFile(id, file_path) {
    if (file_path) {
      await supabase.storage.from(VET_BUCKET).remove([file_path]).catch(() => {});
    }
    return await this.delete(id);
  },
};

export default {
  User,
  Pet,
  VaccineRecord,
  VetVisit,
  PetNote,
  Task,
  Grooming,
  FeedingSchedule,
  listPets,
  table,
};

export { table };
