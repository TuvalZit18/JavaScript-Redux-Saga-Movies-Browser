import React, { useEffect, useCallback, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import MovieGrid from "../../components/MovieGrid/MovieGrid";
import Pagination from "../../components/Pagination/Pagination";
import {
  fetchPopularRequest,
  fetchAiringRequest,
  fetchSearchRequest,
  setFavoritesPage,
} from "../../store/slices/moviesSlice";
import styles from "./HomePage.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// HomePage
//
// The main page of the app. Responsible for:
//   - Displaying the movie grid based on the active tab and search query
//   - Deriving the correct dataset (Popular / Airing Now / Search / Favorites)
//   - Handling pagination for all tab types
//   - Passing focusContext down to MovieGrid and Pagination so keyboard
//     navigation knows which section currently owns arrow key input
//
// Data flow:
//   Active tab + search query → useMemo derives movies/loading/error/pages
//   → passed to MovieGrid and Pagination as props
//
// Note: This component does NOT own focusContext — it receives it from App.jsx
// which is the single source of truth for keyboard focus state.
// ─────────────────────────────────────────────────────────────────────────────

// Favorites are paginated locally — no API call involved
const FAVORITES_ITEMS_PER_PAGE = 20;

// Matches the minimum in SearchBar and moviesSaga — kept here as a single source of truth
const MIN_SEARCH_LENGTH = 2;

/**
 * HomePage
 *
 * @param {string}          focusContext      - Current active keyboard context
 * @param {Function}        setFocusContext   - Switches the active keyboard context
 * @param {React.RefObject} contextSwitchedAt - Timestamp of last context switch (for cooldown guard)
 */
const HomePage = ({ focusContext, setFocusContext, contextSwitchedAt }) => {
  const dispatch = useDispatch();

  // useLocation gives access to the current URL including query string.
  // Used on mount to restore the correct page when navigating back from MovieDetailPage.
  const location = useLocation();

  // ─── Redux State ───────────────────────────────────────────────────────────
  const activeTab = useSelector((state) => state.movies.activeTab);
  const searchQuery = useSelector((state) => state.movies.searchQuery);
  const favoritesSearchQuery = useSelector(
    (state) => state.movies.favoritesSearchQuery,
  );
  const popular = useSelector((state) => state.movies.popular);
  const airing = useSelector((state) => state.movies.airing);
  const search = useSelector((state) => state.movies.search);
  const favorites = useSelector((state) => state.favorites.items);
  const favoritesPage = useSelector((state) => state.movies.favoritesPage);

  // True when the search query meets the minimum length threshold.
  // Switches display priority from tab data to search results.
  const isApiSearching = searchQuery.length >= MIN_SEARCH_LENGTH;

  // ─── Initial Fetch ─────────────────────────────────────────────────────────
  // Reads ?page from the URL query string on mount.
  // When navigating back from MovieDetailPage, the URL is /?page=N — this
  // ensures the grid restores to the correct page rather than always page 1.
  // If no ?page param is present (normal app load), defaults to page 1.
  // deps array intentionally omits location — this should only run on mount.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pageFromUrl = parseInt(params.get("page"), 10);
    const page = pageFromUrl > 0 ? pageFromUrl : 1;
    dispatch(fetchPopularRequest({ page }));
  }, [dispatch]);

  // ─── Derive Display Data ───────────────────────────────────────────────────
  // useMemo prevents recalculation on every render.
  // Only reruns when the active tab, search query, or underlying data changes.
  //
  // Priority order (first match wins):
  //   1. Favorites tab     → local filter only, no API, paginated client-side
  //   2. Active API search → search results from TMDB (overrides active tab)
  //   3. Popular tab       → popular movies from TMDB
  //   4. Airing Now tab    → airing now movies from TMDB
  //   5. Fallback          → empty state (should never be reached)
  const { movies, loading, error, currentPage, totalPages, emptyMessage } =
    useMemo(() => {
      // ── 1. Favorites — local filter, no API ───────────────────────────────
      if (activeTab === "favorites") {
        const query = favoritesSearchQuery.trim().toLowerCase();
        const isFiltering = query.length >= MIN_SEARCH_LENGTH;

        // Filter favorites locally by title if search query is long enough
        const filteredFavs = isFiltering
          ? favorites.filter((movie) =>
              (movie.title ?? "").toLowerCase().includes(query),
            )
          : favorites;

        const totalFavPages = Math.max(
          1,
          Math.ceil(filteredFavs.length / FAVORITES_ITEMS_PER_PAGE),
        );

        // Clamp current page to valid range — filtered results may have
        // fewer pages than the currently stored favoritesPage
        const safePage = Math.min(favoritesPage, totalFavPages);
        const start = (safePage - 1) * FAVORITES_ITEMS_PER_PAGE;

        return {
          movies: filteredFavs.slice(start, start + FAVORITES_ITEMS_PER_PAGE),
          loading: false,
          error: null,
          currentPage: safePage,
          totalPages: totalFavPages,
          emptyMessage: isFiltering
            ? `No favorites match "${favoritesSearchQuery}"`
            : "You haven't added any favorites yet. Browse movies and press 💙 to save them!",
        };
      }

      // ── 2. API Search — overrides active tab when query is long enough ────
      if (isApiSearching) {
        return {
          movies: search.movies,
          loading: search.loading,
          error: search.error,
          currentPage: search.currentPage,
          totalPages: search.totalPages,
          emptyMessage: `No results found for "${searchQuery}"`,
        };
      }

      // ── 3. Popular tab ────────────────────────────────────────────────────
      if (activeTab === "popular") {
        return {
          movies: popular.movies,
          loading: popular.loading,
          error: popular.error,
          currentPage: popular.currentPage,
          totalPages: popular.totalPages,
          emptyMessage: "No popular movies available.",
        };
      }

      // ── 4. Airing Now tab ─────────────────────────────────────────────────
      if (activeTab === "airing") {
        return {
          movies: airing.movies,
          loading: airing.loading,
          error: airing.error,
          currentPage: airing.currentPage,
          totalPages: airing.totalPages,
          emptyMessage: "No airing now movies available.",
        };
      }

      // ── 5. Fallback — should never be reached ─────────────────────────────
      return {
        movies: [],
        loading: false,
        error: null,
        currentPage: 1,
        totalPages: 1,
        emptyMessage: "",
      };
    }, [
      activeTab,
      isApiSearching,
      searchQuery,
      favoritesSearchQuery,
      search,
      popular,
      airing,
      favorites,
      favoritesPage,
    ]);

  // ─── Pagination Handler ────────────────────────────────────────────────────
  /**
   * Handles page change for all tab types.
   * Favorites          → updates local page number only (no API call)
   * Search             → re-fetches with the same query on the new page
   * Popular / Airing   → dispatches the appropriate TMDB fetch action
   * @param {number} page - The requested page number (1-based)
   */
  const handlePageChange = useCallback(
    (page) => {
      if (activeTab === "favorites") {
        dispatch(setFavoritesPage(page));
        return;
      }
      if (isApiSearching) {
        dispatch(fetchSearchRequest({ query: searchQuery, page }));
        return;
      }
      if (activeTab === "popular") dispatch(fetchPopularRequest({ page }));
      if (activeTab === "airing") dispatch(fetchAiringRequest({ page }));
    },
    [dispatch, activeTab, isApiSearching, searchQuery],
  );

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* gridArea is the scrollable container — keyboard nav scrolls via scrollIntoView */}
      <div className={styles.gridArea}>
        <MovieGrid
          movies={movies}
          loading={loading}
          error={error}
          emptyMessage={emptyMessage}
          focusContext={focusContext}
          setFocusContext={setFocusContext}
          contextSwitchedAt={contextSwitchedAt}
        />
      </div>

      {/* Pagination sits outside gridArea so it's always visible below the grid */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        focusContext={focusContext}
        setFocusContext={setFocusContext}
        contextSwitchedAt={contextSwitchedAt}
      />
    </div>
  );
};

export default HomePage;
