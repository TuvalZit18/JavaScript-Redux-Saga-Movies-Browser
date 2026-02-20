import { useRef, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// useRateLimiter
//
// React hook wrapper around the rate limiter utility.
// Tracks request timestamps and exposes a `canRequest` check.
//
// Max: 5 requests per 10 seconds (matches saga-level rate limiting)
// ─────────────────────────────────────────────────────────────────────────────

const MAX_REQUESTS = 5;
const WINDOW_MS = 10_000;

const useRateLimiter = () => {
  // useRef — persists across renders without triggering re-renders.
  // A plain variable would reset on every render, state would cause unnecessary re-renders.
  const timestamps = useRef([]);

  /**
   * Checks if a new request is allowed under the current rate limit window.
   * Purges expired timestamps before checking — sliding window approach.
   * Does NOT record the request — call recordRequest() separately if allowed.
   * @returns {boolean} true if request is within the allowed limit
   */
  const canRequest = useCallback(() => {
    const now = Date.now();

    // Purge expired timestamps
    timestamps.current = timestamps.current.filter(
      (ts) => ts > now - WINDOW_MS,
    );

    return timestamps.current.length < MAX_REQUESTS;
  }, []);

  /**
   * Records the current timestamp as a new request.
   * Should only be called immediately AFTER canRequest() returns true.
   */
  const recordRequest = useCallback(() => {
    // Sliding window — only timestamps within the last WINDOW_MS are counted.
    // This means the limit resets gradually rather than all at once.
    timestamps.current.push(Date.now());
  }, []);

  return { canRequest, recordRequest };
};

export default useRateLimiter;
