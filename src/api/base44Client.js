// src/api/base44Client.js
// Do NOT create another Supabase client here.
// Re-export the singleton so legacy imports keep working.

export { supabase } from './entities.js';

// Tiny base64 helpers in case something still imports them from here.
// (Not the old "base44" thing — these are standard base64 helpers.)
export const encodeB64 = (s) =>
  typeof window !== 'undefined'
    ? btoa(unescape(encodeURIComponent(String(s))))
    : Buffer.from(String(s), 'utf8').toString('base64');

export const decodeB64 = (s) =>
  typeof window !== 'undefined'
    ? decodeURIComponent(escape(atob(String(s))))
    : Buffer.from(String(s), 'base64').toString('utf8');
