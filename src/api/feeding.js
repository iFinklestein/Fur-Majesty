// FILE: src/api/feeding.js
import { supabase } from "../lib/supabaseClient.js";

/** Convert "09:00 AM" / "6:00 PM" -> "HH:MM" (24h) for a Postgres TIME column */
function toDbTime(hhmm12) {
  if (!hhmm12) return null;
  const [time, apRaw] = String(hhmm12).trim().split(/\s+/); // "09:00", "AM"
  const [hh, mm] = time.split(":").map((v) => parseInt(v, 10));
  const ap = (apRaw || "").toUpperCase();
  let H = hh % 12;
  if (ap === "PM") H += 12;
  if (ap === "AM" && hh === 12) H = 0;
  return `${String(H).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** List schedules for a pet (ascending by time) */
export async function listFeedingSchedules(petId) {
  const { data, error } = await supabase
    .from("feeding_schedules")
    .select(
      "id, pet_id, time_of_day, amount, unit, days, food, notes, is_active"
    )
    .eq("pet_id", petId)
    .order("time_of_day", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Add one or more schedule rows.
 * payload = { pet_id, times: ["09:00 AM","06:00 PM"], amount, unit, days, food, notes, is_active }
 */
export async function addSchedule(payload) {
  const {
    pet_id,
    times = [],
    amount = null,
    unit = null,
    days = [],
    food = null,
    notes = null,
    is_active = true,
  } = payload;

  const rows = (times || [])
    .map(toDbTime)
    .filter(Boolean)
    .map((t) => ({
      pet_id,
      time_of_day: t, // Postgres TIME accepts "HH:MM"
      amount,
      unit,
      days,
      food,
      notes,
      is_active,
    }));

  if (!rows.length) return [];

  const { data, error } = await supabase
    .from("feeding_schedules")
    .insert(rows)
    .select();

  if (error) throw error;
  return data || [];
}

/** Delete a single schedule row by id */
export async function deleteSchedule(id) {
  const { data, error } = await supabase
    .from("feeding_schedules")
    .delete()
    .eq("id", id)
    .select();

  if (error) throw error;
  return data?.[0] ?? null;
}

/** Update is_active explicitly */
export async function setScheduleActive(id, is_active) {
  const { data, error } = await supabase
    .from("feeding_schedules")
    .update({ is_active })
    .eq("id", id)
    .select();

  if (error) throw error;
  return data?.[0] ?? null;
}

/** Back-compat (some earlier code used toggleScheduleActive) */
export async function toggleScheduleActive(id) {
  // Read current
  const { data: row, error: readErr } = await supabase
    .from("feeding_schedules")
    .select("is_active")
    .eq("id", id)
    .single();

  if (readErr) throw readErr;

  return setScheduleActive(id, !row?.is_active);
}

/** Optional: update other fields (amount/unit/days/food/notes/time_of_day) */
export async function updateSchedule(id, fields) {
  const patch = { ...fields };
  if (patch.time) patch.time_of_day = toDbTime(patch.time);
  delete patch.time;

  const { data, error } = await supabase
    .from("feeding_schedules")
    .update(patch)
    .eq("id", id)
    .select();

  if (error) throw error;
  return data?.[0] ?? null;
}
