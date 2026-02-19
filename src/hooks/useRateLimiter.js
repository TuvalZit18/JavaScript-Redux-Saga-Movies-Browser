import { useRef, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// useRateLimiter
//
// React hook wrapper around the rate limiter utility.
// Tracks request timestamps and exposes a `canRequest` check.
//
// Max: 5 requests per 10 seconds (matches saga-level rate limiting)
// ─────────────────────────────────────────────────────────────────────────────

const MAX_REQUESTS = 5
const WINDOW_MS    = 10_000

const useRateLimiter = () => {
  const timestamps = useRef([])

  const canRequest = useCallback(() => {
    const now = Date.now()

    // Purge expired timestamps
    timestamps.current = timestamps.current.filter(
      (ts) => ts > now - WINDOW_MS
    )

    return timestamps.current.length < MAX_REQUESTS
  }, [])

  const recordRequest = useCallback(() => {
    timestamps.current.push(Date.now())
  }, [])

  return { canRequest, recordRequest }
}

export default useRateLimiter
