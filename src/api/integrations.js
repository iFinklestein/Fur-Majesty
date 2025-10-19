// FILE: src/api/integrations.js
// Single-source integrations. No extra Supabase clients here.

import { supabase } from "@/lib/supabaseClient";

/**
 * Subscribe to auth state changes via the one-and-only Supabase client.
 * Returns an unsubscribe fn.
 */
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    try { callback?.(session || null); } catch {}
  });
  return () => data?.subscription?.unsubscribe?.();
}

/* -------------------------------------------------------
   Storage helpers (bucket-agnostic)
   Usage example:
     await uploadFile({ bucket: 'pet-photos', path: `${uid}/${petId}/x.png`, file });
     const url = getPublicUrl('pet-photos', `${uid}/${petId}/x.png`);
-------------------------------------------------------- */

/**
 * Upload a file to Supabase Storage.
 * @param {Object} args
 * @param {string} args.bucket   - Storage bucket name
 * @param {string} args.path     - File path within the bucket
 * @param {File|Blob|Uint8Array} args.file
 * @param {boolean} [args.upsert=true]
 * @param {string}  [args.contentType] - e.g. 'image/png'
 * @returns {Promise<{path:string, fullPath:string}>}
 */
export async function uploadFile({ bucket, path, file, upsert = true, contentType } = {}) {
  if (!bucket || !path || !file) throw new Error('uploadFile: bucket, path, and file are required');
  const options = { upsert };
  if (contentType) options.contentType = contentType;

  const { data, error } = await supabase.storage.from(bucket).upload(path, file, options);
  if (error) throw new Error(`uploadFile failed: ${error.message}`);
  return { path: data?.path ?? path, fullPath: `${bucket}/${path}` };
}

/**
 * Get a public URL for a stored file (bucket must be public).
 * Synchronous (no await), returns a string.
 */
export function getPublicUrl(bucket, path) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data?.publicUrl ?? null;
}

/**
 * Remove a file from storage.
 */
export async function removeFile(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw new Error(`removeFile failed: ${error.message}`);
  return true;
}

/* ----------------------------------------------
   Backwards-compat aliases
----------------------------------------------- */
export const UploadFile = uploadFile;

export function initAnalytics() {}
export function initErrorReporting() {}
export function initPerf() {}
