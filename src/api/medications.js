// src/api/medications.js
import { supabase } from "@/lib/supabaseClient";

/** Frequency options used across UI */
export const FREQUENCIES = [
  { value: "once",   label: "Once" },
  { value: "daily",  label: "Daily" },
  { value: "bid",    label: "Twice daily" },
  { value: "tid",    label: "Three times daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly",label: "Monthly" },
];

/* -----------------------------------------------------------
 * Medications CRUD
 * --------------------------------------------------------- */
export const Meds = {
  async listForPet(petId) {
    if (!petId) return [];
    const { data, error } = await supabase
      .from("medications")
      .select("*")
      .eq("pet_id", petId)
      .order("name", { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async add({ petId, name, dosage, timeOfDay, frequency, notes }) {
    const payload = {
      pet_id: petId,
      name,
      dosage,
      time_of_day: timeOfDay || null,
      frequency,
      notes: notes || null,
    };
    const { data, error } = await supabase
      .from("medications")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, patch) {
    const payload = {
      ...(patch.name       !== undefined && { name:        patch.name }),
      ...(patch.dosage     !== undefined && { dosage:      patch.dosage }),
      ...(patch.frequency  !== undefined && { frequency:   patch.frequency }),
      ...(patch.timeOfDay  !== undefined && { time_of_day: patch.timeOfDay }),
      ...(patch.notes      !== undefined && { notes:       patch.notes }),
    };
    const { data, error } = await supabase
      .from("medications")
      .update(payload)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

/* -----------------------------------------------------------
 * Dose Logs CRUD
 * --------------------------------------------------------- */
export const MedDoseLog = {
  async list({ petId, medicationId }) {
    const q = supabase
      .from("med_dose_logs")
      .select("*")
      .order("given_at", { ascending: false });

    if (petId)        q.eq("pet_id", petId);
    if (medicationId) q.eq("medication_id", medicationId);

    const { data, error } = await q;
    if (error) throw error;
    return data ?? [];
  },

  async add({ petId, medicationId, givenAt, amount, notes }) {
    const payload = {
      pet_id:        petId,
      medication_id: medicationId,
      given_at:      givenAt, // ISO string
      amount:        amount || null,
      notes:         notes  || null,
    };
    const { data, error } = await supabase
      .from("med_dose_logs")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabase
      .from("med_dose_logs")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  },
};

/* -----------------------------------------------------------
 * Back-compat aliases so existing imports keep working:
 *   import { Medication } from "@/api/medications"
 *   import { DoseLog }   from "@/api/medications"
 * --------------------------------------------------------- */
export const Medication = Meds;
export const DoseLog = MedDoseLog;
