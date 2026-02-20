import { createSlice } from "@reduxjs/toolkit";

// ─────────────────────────────────────────────
// Movies Slice — handles Popular, Airing Now,
// and Search results with pagination
// ─────────────────────────────────────────────

// TMDB API hard limit — requesting beyond page 500 returns HTTP 400
const TMDB_MAX_PAGES = 500;

/*Shared initial state shape for Popular, Airing Now, and Search tabs
  Spread into initialState so each tab has its own independent copy*/
/**
 * @typedef {Object} TabState
 * @property {Array}   movies      - List of movie objects returned from TMDB
 * @property {number}  currentPage - Current active page number (1-based)
 * @property {number}  totalPages  - Total pages available (capped at 500)
 * @property {boolean} loading     - True while API request is in flight
 * @property {string|null} error   - Error message if request failed, null otherwise
 */
const initialTabState = {
  movies: [],
  currentPage: 1,
  totalPages: 1,
  loading: false,
  error: null,
};

/**
 * @typedef {Object} MoviesState
 * @property {string}   activeTab            - Currently selected tab: 'popular' | 'airing' | 'favorites'
 * @property {string}   searchQuery          - API search query (Popular / Airing Now tabs only)
 * @property {string}   favoritesSearchQuery - Local filter query (Favorites tab — no API call)
 * @property {number}   favoritesPage        - Current page number for favorites pagination
 * @property {TabState} popular              - State for Popular movies tab
 * @property {TabState} airing               - State for Airing Now movies tab
 * @property {TabState} search               - State for Search results
 */
const initialState = {
  activeTab: "popular",
  searchQuery: "", // Used for API search (Popular / Airing Now)
  favoritesSearchQuery: "", // Used for local filtering only — no API call
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

    /**
     * Sets the active tab and clears both search queries.
     * Clearing ensures stale search results don't persist when switching tabs.
     * @param {string} action.payload - Tab id: 'popular' | 'airing' | 'favorites'
     */
    setActiveTab(state, action) {
      state.activeTab = action.payload;
      state.searchQuery = ""; // Clear API search on tab switch
      state.favoritesSearchQuery = ""; // Clear local favorites search on tab switch
    },

    // ─── API Search ──────────────────────────────────────────────────────────

    /**
     * Updates the API search query and resets search to page 1.
     * Triggers are handled in SearchBar (debounce) and moviesSaga (rate limit).
     * @param {string} action.payload - The search query string
     */
    setSearchQuery(state, action) {
      state.searchQuery = action.payload;
      state.search.currentPage = 1;
    },

    // ─── Favorites Local Search ───────────────────────────────────────────────

    /**
     * Updates the favorites filter query and resets to page 1.
     * Filtering is done locally — no API call is made.
     * @param {string} action.payload - The filter query string
     */
    setFavoritesSearchQuery(state, action) {
      state.favoritesSearchQuery = action.payload;
      state.favoritesPage = 1;
    },

    /**
     * Sets the current page for favorites pagination.
     * @param {number} action.payload - Page number (1-based)
     */
    setFavoritesPage(state, action) {
      state.favoritesPage = action.payload;
    },

    // ─── Popular ─────────────────────────────────────────────────────────────

    /**
     * Fired before the Popular API request is sent.
     * Sets loading state and optionally updates the current page.
     * @param {{ page?: number }} action.payload
     */
    fetchPopularRequest(state, action) {
      state.popular.loading = true;
      state.popular.error = null;
      if (action.payload?.page) state.popular.currentPage = action.payload.page;
    },

    /**
     * Fired when the Popular API request succeeds.
     * Caps totalPages at TMDB_MAX_PAGES to prevent HTTP 400 on high page numbers.
     * @param {{ results: Array, total_pages: number, page: number }} action.payload
     */
    fetchPopularSuccess(state, action) {
      state.popular.loading = false;
      state.popular.movies = action.payload.results ?? [];
      state.popular.totalPages = Math.min(
        action.payload.total_pages ?? 1,
        TMDB_MAX_PAGES,
      );
      state.popular.currentPage = action.payload.page ?? 1;
    },

    /**
     * Fired when the Popular API request fails.
     * @param {string} action.payload - Error message
     */
    fetchPopularFailure(state, action) {
      state.popular.loading = false;
      state.popular.error = action.payload;
    },

    // ─── Airing Now ──────────────────────────────────────────────────────────

    /**
     * Fired before the Airing Now API request is sent.
     * @param {{ page?: number }} action.payload
     */
    fetchAiringRequest(state, action) {
      state.airing.loading = true;
      state.airing.error = null;
      if (action.payload?.page) state.airing.currentPage = action.payload.page;
    },

    /**
     * Fired when the Airing Now API request succeeds.
     * @param {{ results: Array, total_pages: number, page: number }} action.payload
     */
    fetchAiringSuccess(state, action) {
      state.airing.loading = false;
      state.airing.movies = action.payload.results ?? [];
      state.airing.totalPages = Math.min(
        action.payload.total_pages ?? 1,
        TMDB_MAX_PAGES,
      );
      state.airing.currentPage = action.payload.page ?? 1;
    },

    /**
     * Fired when the Airing Now API request fails.
     * @param {string} action.payload - Error message
     */
    fetchAiringFailure(state, action) {
      state.airing.loading = false;
      state.airing.error = action.payload;
    },

    // ─── Search ──────────────────────────────────────────────────────────────

    /**
     * Fired before the Search API request is sent.
     * @param {{ page?: number }} action.payload
     */
    fetchSearchRequest(state, action) {
      state.search.loading = true;
      state.search.error = null;
      if (action.payload?.page) state.search.currentPage = action.payload.page;
    },

    /**
     * Fired when the Search API request succeeds.
     * @param {{ results: Array, total_pages: number, page: number }} action.payload
     */
    fetchSearchSuccess(state, action) {
      state.search.loading = false;
      state.search.movies = action.payload.results ?? [];
      state.search.totalPages = Math.min(
        action.payload.total_pages ?? 1,
        TMDB_MAX_PAGES,
      );
      state.search.currentPage = action.payload.page ?? 1;
    },

    /**
     * Fired when the Search API request fails.
     * @param {string} action.payload - Error message
     */
    fetchSearchFailure(state, action) {
      state.search.loading = false;
      state.search.error = action.payload;
    },

    /**
     * Resets search state entirely.
     * Called when the query drops below 2 characters or the user clears the input.
     */
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
