// ─────────────────────────────────────────────────────────────────────────────
/**
 * TMDB API Configuration
 *
 * To use this app, create a .env file in the project root and add:
 *   VITE_TMDB_API_KEY=your_actual_api_key_here
 *
 * Get a free API key at: https://www.themoviedb.org/settings/api
 */
// ─────────────────────────────────────────────────────────────────────────────

// Base URLs — not sensitive, no need to hide in .env
export const BASE_URL = "https://api.themoviedb.org/3";
export const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/h632";
export const IMAGE_ORIGINAL = "https://image.tmdb.org/t/p/original";

// API key from environment variable
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// ─── Request timeout (ms) ───────────────────────────────────────────────────
const REQUEST_TIMEOUT_MS = 8000;

/**
 * Generic fetch wrapper with timeout and error handling.
 * ───────────────────────────────────────────────────
 * Aborts the request if it exceeds timeoutMs via AbortController.
 * @param {string} url           - Full request URL
 * @param {number} [timeoutMs]   - Timeout in milliseconds (default: REQUEST_TIMEOUT_MS)
 * @returns {Promise<Object>}    - Parsed JSON response
 * @throws {Error}               - On timeout, non-OK HTTP status, or network failure
 */
const fetchWithTimeout = async (url, timeoutMs = REQUEST_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }

    throw error;
  }
};

// ─── Build URL helper ────────────────────────────────────────────────────────
/**
 * Builds a full TMDB API URL with query parameters.
 * Automatically appends the API key and language to every request.
 * @param {string} endpoint      - TMDB API endpoint (e.g. '/movie/popular')
 * @param {Object} [params={}]   - Additional query parameters to merge in
 * @returns {string}             - Complete URL ready for fetch
 */
const buildUrl = (endpoint, params = {}) => {
  const queryParams = new URLSearchParams({
    api_key: API_KEY,
    language: "en-US",
    ...params,
  });
  return `${BASE_URL}${endpoint}?${queryParams.toString()}`;
};

// ─── API Methods ─────────────────────────────────────────────────────────────

/**
 * Fetches the list of popular movies from TMDB.
 * @param {number} [page=1]      - Page number (1-based, max 500)
 * @returns {Promise<Object>}    - TMDB paginated response with results array
 */
export const fetchPopularMovies = (page = 1) =>
  fetchWithTimeout(buildUrl("/movie/popular", { page }));

/**
 * Fetches movies currently playing in theaters (Airing Now).
 * @param {number} [page=1]      - Page number (1-based, max 500)
 * @returns {Promise<Object>}    - TMDB paginated response with results array
 */
export const fetchAiringNowMovies = (page = 1) =>
  fetchWithTimeout(buildUrl("/movie/now_playing", { page }));

/**
 * Searches movies by title query string.
 * Adult content is excluded via include_adult: false.
 * @param {string} query         - Search term (minimum 2 characters enforced upstream)
 * @param {number} [page=1]      - Page number (1-based, max 500)
 * @returns {Promise<Object>}    - TMDB paginated response with results array
 */
export const searchMovies = (query, page = 1) =>
  fetchWithTimeout(
    buildUrl("/search/movie", { query, page, include_adult: false }),
  );

/**
 * Fetches full movie details including credits and videos.
 * append_to_response joins multiple endpoints in a single API call.
 * @param {number} movieId       - TMDB movie ID
 * @returns {Promise<Object>}    - Full movie object with genres, runtime, credits, videos
 */
export const fetchMovieDetails = (movieId) =>
  fetchWithTimeout(
    buildUrl(`/movie/${movieId}`, { append_to_response: "credits,videos" }),
  );

// ─── Image URL helpers ───────────────────────────────────────────────────────

/**
 * Builds the full poster image URL from a TMDB poster path.
 * Uses IMAGE_BASE_URL (w500) for consistent card sizing.
 * @param {string|null} posterPath   - TMDB relative poster path (e.g. '/abc123.jpg')
 * @returns {string|null}            - Full image URL or null if path is missing
 */
export const getPosterUrl = (posterPath) =>
  posterPath ? `${IMAGE_BASE_URL}${posterPath}` : null;

/**
 * Builds the full backdrop image URL from a TMDB backdrop path.
 * Uses IMAGE_ORIGINAL for maximum quality on the detail page.
 * @param {string|null} backdropPath - TMDB relative backdrop path
 * @returns {string|null}            - Full image URL or null if path is missing
 */
export const getBackdropUrl = (backdropPath) =>
  backdropPath ? `${IMAGE_ORIGINAL}${backdropPath}` : null;
