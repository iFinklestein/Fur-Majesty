// src/components/utils/taskPurge.jsx
// Utility helpers for purging completed tasks on demand or on a schedule.

import { purgeCompletedTasks } from '/src/api/entities.js';
import { useEffect, useRef } from 'react';

/**
 * Run the purge once (convenience wrapper).
 * @param {{olderThanDays?: number}} opts
 * @returns {Promise<{purged:number, mode:string}>}
 */
export async function runPurge(opts = {}) {
  const olderThanDays = Number(opts.olderThanDays ?? 30);
  return await purgeCompletedTasks({ olderThanDays });
}

/**
 * Start a repeating purge. Returns a handle with stop().
 *
 * @param {{
 *   enabled?: boolean,
 *   intervalMinutes?: number,
 *   olderThanDays?: number,
 *   onResult?: (res:{purged:number,mode:string}) => void,
 *   onError?: (err:Error) => void
 * }} opts
 */
export function scheduleAutoPurge(opts = {}) {
  const enabled = opts.enabled !== false;
  const intervalMinutes = Math.max(1, Number(opts.intervalMinutes ?? 60));
  const olderThanDays = Number(opts.olderThanDays ?? 30);
  const onResult = typeof opts.onResult === 'function' ? opts.onResult : () => {};
  const onError = typeof opts.onError === 'function' ? opts.onError : console.error;

  if (!enabled) return { stop() {}, isRunning: false };

  let stopped = false;

  async function tick() {
    try {
      const res = await purgeCompletedTasks({ olderThanDays });
      onResult(res);
    } catch (err) {
      onError(err);
    }
  }

  // run immediately once, then on interval
  tick();
  const id = setInterval(tick, intervalMinutes * 60 * 1000);

  return {
    stop() {
      if (!stopped) {
        clearInterval(id);
        stopped = true;
      }
    },
    isRunning: true,
    intervalMinutes,
    olderThanDays
  };
}

/**
 * React hook version. Starts the schedule on mount and stops on unmount.
 * Re-starts if key options change.
 */
export function useAutoPurge(opts = {}) {
  const handleRef = useRef(null);

  useEffect(() => {
    if (handleRef.current) handleRef.current.stop();
    handleRef.current = scheduleAutoPurge(opts);
    return () => {
      if (handleRef.current) handleRef.current.stop();
    };
    // re-run only when these core options change
  }, [opts.enabled, opts.intervalMinutes, opts.olderThanDays]);
}

export default { runPurge, scheduleAutoPurge, useAutoPurge };
