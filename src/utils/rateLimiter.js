// ─────────────────────────────────────────────────────────
// Rate Limiter — max 5 search requests per 10 seconds
// ─────────────────────────────────────────────────────────

const MAX_REQUESTS  = 5
const WINDOW_MS     = 10_000 // 10 seconds

// Timestamps of recent requests (module-level singleton)
const requestTimestamps = []

/**
 * Check whether a new request is allowed under the rate limit.
 * Purges timestamps older than the window before checking.
 * @returns {boolean} true if request is allowed
 */
export const isRequestAllowed = () => {
  const now = Date.now()

  // Remove timestamps outside the current window
  while (requestTimestamps.length && requestTimestamps[0] <= now - WINDOW_MS) {
    requestTimestamps.shift()
  }

  return requestTimestamps.length < MAX_REQUESTS
}

/**
 * Record that a request was made right now.
 * Should be called immediately before dispatching the request.
 */
export const recordRequest = () => {
  requestTimestamps.push(Date.now())
}

/**
 * Combined check-and-record: returns true and records if allowed,
 * returns false without recording if rate limit is reached.
 * @returns {boolean}
 */
export const tryRequest = () => {
  if (!isRequestAllowed()) return false
  recordRequest()
  return true
}
