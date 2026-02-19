// ─────────────────────────────────────────────
// localStorage Utility — Favorites Persistence
// ─────────────────────────────────────────────

const FAVORITES_KEY = 'cineverse_favorites'

/**
 * Load favorites array from localStorage.
 * Returns empty array if nothing stored or on parse error.
 * @returns {Array} Array of favorite movie objects
 */
export const loadFavorites = () => {
  try {
    const serialized = localStorage.getItem(FAVORITES_KEY)
    if (!serialized) return []
    return JSON.parse(serialized)
  } catch {
    // Corrupted data — return clean slate
    return []
  }
}

/**
 * Save favorites array to localStorage.
 * @param {Array} favorites - Array of movie objects to persist
 */
export const saveFavorites = (favorites) => {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
  } catch {
    // Storage might be full or unavailable — fail silently
    console.warn('Could not save favorites to localStorage.')
  }
}

/**
 * Check if a movie is in favorites by ID.
 * @param {Array}  favorites - Current favorites array
 * @param {number} movieId   - Movie ID to check
 * @returns {boolean}
 */
export const isFavorite = (favorites, movieId) =>
  favorites.some((movie) => movie.id === movieId)
