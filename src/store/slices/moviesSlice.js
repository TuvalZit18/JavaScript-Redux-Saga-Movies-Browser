import { createSlice } from "@reduxjs/toolkit";

// ─────────────────────────────────────────────
// Movies Slice — handles Popular, Airing Now,
// and Search results with pagination
// ─────────────────────────────────────────────

// TMDB API hard limit — requesting beyond page 500 returns HTTP 400
const TMDB_MAX_PAGES = 500;

const initialTabState = {
  movies: [],
  currentPage: 1,
  totalPages: 1,
  loading: false,
  error: null,
};

const initialState = {
  activeTab: "popular",
  searchQuery: "",
  favoritesSearchQuery: "",
  favoritesPage: 1,
  popular: { ...initialTabState },
  airing: { ...initialTabState },
  search: { ...initialTabState },
};

const moviesSlice = createSlice({
  name: "movies",
  initialState,
  reducers: {
    // ─── Tab ────────────────────────────────────────────────────────────────
    setActiveTab(state, action) {
      state.activeTab = action.payload;
      state.searchQuery = "";
      state.favoritesSearchQuery = "";
    },

    // ─── API Search ──────────────────────────────────────────────────────────
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
      state.search.currentPage = 1;
    },

    // ─── Favorites local search ───────────────────────────────────────────────
    setFavoritesSearchQuery(state, action) {
      state.favoritesSearchQuery = action.payload;
      state.favoritesPage = 1;
    },

    setFavoritesPage(state, action) {
      state.favoritesPage = action.payload;
    },

    // ─── Popular ─────────────────────────────────────────────────────────────
    fetchPopularRequest(state, action) {
      state.popular.loading = true;
      state.popular.error = null;
      if (action.payload?.page) state.popular.currentPage = action.payload.page;
    },
    fetchPopularSuccess(state, action) {
      state.popular.loading = false;
      state.popular.movies = action.payload.results ?? [];
      state.popular.totalPages = Math.min(
        action.payload.total_pages ?? 1,
        TMDB_MAX_PAGES,
      );
      state.popular.currentPage = action.payload.page ?? 1;
    },
    fetchPopularFailure(state, action) {
      state.popular.loading = false;
      state.popular.error = action.payload;
    },

    // ─── Airing Now ──────────────────────────────────────────────────────────
    fetchAiringRequest(state, action) {
      state.airing.loading = true;
      state.airing.error = null;
      if (action.payload?.page) state.airing.currentPage = action.payload.page;
    },
    fetchAiringSuccess(state, action) {
      state.airing.loading = false;
      state.airing.movies = action.payload.results ?? [];
      state.airing.totalPages = Math.min(
        action.payload.total_pages ?? 1,
        TMDB_MAX_PAGES,
      );
      state.airing.currentPage = action.payload.page ?? 1;
    },
    fetchAiringFailure(state, action) {
      state.airing.loading = false;
      state.airing.error = action.payload;
    },

    // ─── Search ──────────────────────────────────────────────────────────────
    fetchSearchRequest(state, action) {
      state.search.loading = true;
      state.search.error = null;
      if (action.payload?.page) state.search.currentPage = action.payload.page;
    },
    fetchSearchSuccess(state, action) {
      state.search.loading = false;
      state.search.movies = action.payload.results ?? [];
      state.search.totalPages = Math.min(
        action.payload.total_pages ?? 1,
        TMDB_MAX_PAGES,
      );
      state.search.currentPage = action.payload.page ?? 1;
    },
    fetchSearchFailure(state, action) {
      state.search.loading = false;
      state.search.error = action.payload;
    },
    clearSearch(state) {
      state.search = { ...initialTabState };
    },
  },
});

export const {
  setActiveTab,
  setSearchQuery,
  setFavoritesSearchQuery,
  setFavoritesPage,
  fetchPopularRequest,
  fetchPopularSuccess,
  fetchPopularFailure,
  fetchAiringRequest,
  fetchAiringSuccess,
  fetchAiringFailure,
  fetchSearchRequest,
  fetchSearchSuccess,
  fetchSearchFailure,
  clearSearch,
} = moviesSlice.actions;

export default moviesSlice.reducer;
