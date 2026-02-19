import { createSlice } from '@reduxjs/toolkit'
import { loadFavorites, saveFavorites } from '../../utils/localStorage'

// ─────────────────────────────────────────────
// Favorites Slice — persisted via localStorage
// ─────────────────────────────────────────────

const initialState = {
  items: loadFavorites(), // Hydrate from localStorage on app start
}

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    /**
     * Add a movie to favorites.
     * Stores the full movie object for offline display.
     */
    addFavorite(state, action) {
      const movie = action.payload
      const alreadyExists = state.items.some((item) => item.id === movie.id)
      if (!alreadyExists) {
        state.items.push(movie)
        saveFavorites(state.items)
      }
    },

    /**
     * Remove a movie from favorites by ID.
     */
    removeFavorite(state, action) {
      const movieId = action.payload
      state.items   = state.items.filter((item) => item.id !== movieId)
      saveFavorites(state.items)
    },
  },
})

export const { addFavorite, removeFavorite } = favoritesSlice.actions

export default favoritesSlice.reducer
