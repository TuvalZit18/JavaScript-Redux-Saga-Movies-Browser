import { createSlice } from "@reduxjs/toolkit";
import { loadFavorites, saveFavorites } from "../../utils/localStorage";

// ─────────────────────────────────────────────
// Favorites Slice — persisted via localStorage
// ─────────────────────────────────────────────

const initialState = {
  items: loadFavorites(), // Hydrate from localStorage on app start
};

const favoritesSlice = createSlice({
  name: "favorites",
  initialState,
  reducers: {
    /**
     * Add a movie to favorites.
     * Stores the full movie object so it can be displayed without an API call.
     * Silently ignores duplicates.
     * @param {Object} action.payload - Full movie object from TMDB
     */
    addFavorite(state, action) {
      const movie = action.payload;
      const alreadyExists = state.items.some((item) => item.id === movie.id);
      if (!alreadyExists) {
        state.items.push(movie);
        saveFavorites(state.items);
      }
    },

    /**
     * Remove a movie from favorites by ID.
     * @param {number} action.payload - TMDB movie ID
     */
    removeFavorite(state, action) {
      const movieId = action.payload;
      state.items = state.items.filter((item) => item.id !== movieId);
      // Persist to localStorage after every mutation
      saveFavorites(state.items);
    },
  },
});

export const { addFavorite, removeFavorite } = favoritesSlice.actions;

export default favoritesSlice.reducer;
