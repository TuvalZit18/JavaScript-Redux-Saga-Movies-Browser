// ─────────────────────────────────────────────────────────────────────────────
// TMDB API Configuration
//
// To use this app, create a .env file in the project root and add:
//   VITE_TMDB_API_KEY=your_actual_api_key_here
//
// Get a free API key at: https://www.themoviedb.org/settings/api
// ─────────────────────────────────────────────────────────────────────────────

// Base URLs — not sensitive, no need to hide in .env
export const BASE_URL       = 'https://api.themoviedb.org/3'
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500'
export const IMAGE_ORIGINAL = 'https://image.tmdb.org/t/p/original'

// API key from environment variable
const API_KEY = import.meta.env.VITE_TMDB_API_KEY

// ─── Request timeout (ms) ───────────────────────────────────────────────────
const REQUEST_TIMEOUT_MS = 8000

// ─── Generic fetch with timeout & error handling ────────────────────────────
const fetchWithTimeout = async (url, timeoutMs = REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController()
  const timeoutId  = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)

    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }

    throw error
  }
}

// ─── Build URL helper ────────────────────────────────────────────────────────
const buildUrl = (endpoint, params = {}) => {
  const queryParams = new URLSearchParams({
    api_key: API_KEY,
    language: 'en-US',
    ...params,
  })
  return `${BASE_URL}${endpoint}?${queryParams.toString()}`
}

// ─── API Methods ─────────────────────────────────────────────────────────────

/**
 * Fetch popular movies
 * @param {number} page - Page number (default: 1)
 */
export const fetchPopularMovies = (page = 1) =>
  fetchWithTimeout(buildUrl('/movie/popular', { page }))

/**
 * Fetch now playing (airing now) movies
 * @param {number} page - Page number (default: 1)
 */
export const fetchAiringNowMovies = (page = 1) =>
  fetchWithTimeout(buildUrl('/movie/now_playing', { page }))

/**
 * Search movies by query
 * @param {string} query - Search term
 * @param {number} page  - Page number (default: 1)
 */
export const searchMovies = (query, page = 1) =>
  fetchWithTimeout(buildUrl('/search/movie', { query, page, include_adult: false }))

/**
 * Fetch full movie details by ID
 * @param {number} movieId - TMDB movie ID
 */
export const fetchMovieDetails = (movieId) =>
  fetchWithTimeout(buildUrl(`/movie/${movieId}`, { append_to_response: 'credits,videos' }))

// ─── Image URL helpers ───────────────────────────────────────────────────────

/**
 * Get full poster URL or null if path is missing
 * @param {string|null} posterPath - TMDB poster path
 */
export const getPosterUrl = (posterPath) =>
  posterPath ? `${IMAGE_BASE_URL}${posterPath}` : null

/**
 * Get full backdrop URL or null if path is missing
 * @param {string|null} backdropPath - TMDB backdrop path
 */
export const getBackdropUrl = (backdropPath) =>
  backdropPath ? `${IMAGE_ORIGINAL}${backdropPath}` : null
