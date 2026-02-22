import React, { useEffect, useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addFavorite, removeFavorite } from "../../store/slices/favoritesSlice";
import {
  fetchPopularRequest,
  fetchAiringRequest,
  fetchSearchRequest,
} from "../../store/slices/moviesSlice";
import {
  fetchMovieDetails,
  getBackdropUrl,
  getPosterUrl,
} from "../../api/tmdb";
import Toast from "../../components/Toast/Toast";
import styles from "./MovieDetailPage.module.css";

/**
 * MovieDetailPage
 *
 * Fetches and displays full details for a single movie.
 * Supports keyboard navigation between movies using Left/Right arrow keys,
 * using the currently loaded movie list in Redux (no extra fetches for mid-page nav).
 *
 * Keyboard behaviour:
 *   Escape     → back to home grid
 *   ArrowRight → next movie in list / first movie of next page
 *   ArrowLeft  → previous movie in list / last movie of previous page
 *
 * Boundary behaviour:
 *   First movie on page 1     → toast warning, cannot go further left
 *   Last movie on last page   → toast warning, cannot go further right
 *   Page boundary (mid-list)  → dispatch fetch for adjacent page,
 *                               navigate after movies update in Redux
 */

const FALLBACK_POSTER = "/placeholder-poster.svg";

// ─── useMovieDetail ───────────────────────────────────────────────────────────
/**
 * Custom hook that fetches full movie details for a given movieId.
 * Uses local state — detail data is not shared globally via Redux.
 * Resets to loading state before each fetch to prevent stale data flash.
 *
 * @param {string} movieId - TMDB movie ID from URL params
 * @returns {{ movie: Object|null, loading: boolean, error: string|null }}
 */
const useMovieDetail = (movieId) => {
  const [state, setState] = React.useState({
    movie: null,
    loading: true,
    error: null,
  });

  // Fetches movie details when the component mounts or movieId changes.
  // Resets state to loading before each fetch to prevent stale data
  // from a previous movie flashing on screen.
  useEffect(() => {
    if (!movieId) return;
    setState({ movie: null, loading: true, error: null });

    fetchMovieDetails(movieId)
      .then((data) => setState({ movie: data, loading: false, error: null }))
      .catch((err) =>
        setState({
          movie: null,
          loading: false,
          error: err.message ?? "Failed to load movie.",
        }),
      );
  }, [movieId]);

  return state;
};

// ─── MovieDetailPage ──────────────────────────────────────────────────────────
const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const favorites = useSelector((state) => state.favorites.items);

  // ─── Toast state ───────────────────────────────────────────────────────────
  // toast = { message, type } | null — null means no toast is shown
  const [toast, setToast] = useState(null);

  // toastRef mirrors toast state but persists across re-renders and stale closures.
  // useCallback deps change whenever state changes, causing closures to capture
  // stale values. The ref always holds the true current value regardless of
  // how many times the component re-renders between keypresses.
  const toastRef = React.useRef(null);

  /**
   * Shows a toast notification.
   * Guard: uses toastRef (not state) to check if a toast is already visible.
   * This prevents stale closures from seeing toast=null on repeated keypresses.
   * @param {string} message - Text to display
   * @param {string} type    - 'info' | 'warning'
   */
  const showToast = useCallback((message, type = "info") => {
    // Check the ref — not state — because state may be stale inside closures
    if (toastRef.current) return;
    const value = { message, type };
    toastRef.current = value;
    setToast(value);
  }, []); // no deps — toastRef.current is always fresh

  const dismissToast = useCallback(() => {
    toastRef.current = null; // clear ref first so next keypress can show a new toast
    setToast(null);
  }, []);

  // ─── Current movies list from Redux ────────────────────────────────────────
  // Read the active tab and its movie list so we know where the current movie
  // sits in the list and can navigate to adjacent movies
  const activeTab = useSelector((state) => state.movies.activeTab);
  const searchQuery = useSelector((state) => state.movies.searchQuery);
  const popular = useSelector((state) => state.movies.popular);
  const airing = useSelector((state) => state.movies.airing);
  const search = useSelector((state) => state.movies.search);

  // Priority matches HomePage: search overrides tab when query is active
  const isSearching = searchQuery.length >= 2;
  const activeList = isSearching
    ? search
    : activeTab === "airing"
      ? airing
      : popular;

  const movies = activeList.movies;
  const currentPage = activeList.currentPage;
  const totalPages = activeList.totalPages;

  // Index of the currently viewed movie within the loaded page
  const currentIndex = movies.findIndex((m) => String(m.id) === String(id));

  const { movie, loading, error } = useMovieDetail(id);
  const favorited = favorites.some((fav) => fav.id === movie?.id);

  // ─── Page boundary navigation ──────────────────────────────────────────────
  // When the user hits a page boundary, we dispatch the page change action.
  // The saga fetches the new page and updates movies[] in Redux.
  // pendingNav ref tracks which end of the new page to navigate to:
  //   'next' → first movie of the new page (movies[0])
  //   'prev' → last movie of the new page (movies[movies.length - 1])
  // We use a ref (not state) so the watching useEffect always sees the latest value
  // without creating stale closure issues.
  const pendingNav = React.useRef(null);

  /**
   * Dispatches the correct page fetch action based on the active tab.
   * Mirrors the same logic as handlePageChange in HomePage.
   * @param {number} page - The page number to fetch
   */
  const goToPage = useCallback(
    (page) => {
      if (isSearching) {
        dispatch(fetchSearchRequest({ query: searchQuery, page }));
      } else if (activeTab === "airing") {
        dispatch(fetchAiringRequest({ page }));
      } else {
        dispatch(fetchPopularRequest({ page }));
      }
    },
    [dispatch, isSearching, searchQuery, activeTab],
  );

  // Watches movies[] — when Redux updates with the new page after goToPage(),
  // navigate to the correct boundary movie based on pendingNav direction.
  useEffect(() => {
    if (!pendingNav.current || movies.length === 0) return;
    const direction = pendingNav.current;
    pendingNav.current = null; // clear before navigating to prevent double-fire

    if (direction === "next") navigate(`/movie/${movies[0].id}`);
    if (direction === "prev")
      navigate(`/movie/${movies[movies.length - 1].id}`);
  }, [movies, navigate]);

  // ─── Arrow key navigation ──────────────────────────────────────────────────
  /**
   * Handles Left/Right arrow key navigation between movies.
   * Right → next movie or first movie of next page
   * Left  → previous movie or last movie of previous page
   * Toasts at hard boundaries (first movie page 1, last movie last page).
   * @param {'left'|'right'} direction
   */
  const handleArrowNavigation = useCallback(
    (direction) => {
      // Cannot navigate if current movie isn't found in the loaded list.
      // This happens when entering the detail page directly via URL
      // or when browsing from the Favorites tab.
      if (currentIndex === -1) {
        showToast(
          "Navigation is only available when browsing from the grid",
          "info",
        );
        return;
      }

      if (direction === "right") {
        if (currentIndex < movies.length - 1) {
          // Mid-page: go to next movie in current list — instant, no fetch
          navigate(`/movie/${movies[currentIndex + 1].id}`);
        } else if (currentPage < totalPages) {
          // Last movie on page: change page → saga fetches → useEffect navigates to movies[0]
          pendingNav.current = "next";
          goToPage(currentPage + 1);
        } else {
          // Last movie on last page — hard boundary, nothing more to show
          showToast(
            "You've reached the last movie — press ← to go back",
            "warning",
          );
        }
      }

      if (direction === "left") {
        if (currentIndex > 0) {
          // Mid-page: go to previous movie in current list — instant, no fetch
          navigate(`/movie/${movies[currentIndex - 1].id}`);
        } else if (currentPage > 1) {
          // First movie on page: change page → saga fetches → useEffect navigates to movies[last]
          pendingNav.current = "prev";
          goToPage(currentPage - 1);
        } else {
          // First movie on page 1 — hard boundary, nothing before this
          showToast(
            "You're on the first movie — press → to continue browsing",
            "warning",
          );
        }
      }
    },
    [
      currentIndex,
      movies,
      currentPage,
      totalPages,
      navigate,
      goToPage,
      showToast,
    ],
  );

  /**
   * Navigates back to the home grid and restores the correct page.
   * Passes the current page as a URL query param (?page=N) so HomePage
   * can read it on mount and fetch the correct page instead of always
   * defaulting to page 1.
   */
  const handleBack = useCallback(() => {
    navigate(`/?page=${currentPage}`);
  }, [navigate, currentPage]);

  // ─── Global keyboard handler ───────────────────────────────────────────────
  // Registers a global keydown listener for this page only.
  // - Tab        → always blocked (consistent with global app behavior)
  // - Escape     → navigates back to the home page
  // - ArrowRight → next movie navigation
  // - ArrowLeft  → previous movie navigation
  // Cleanup removes the listener on unmount to prevent stale closures.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Tab") {
        event.preventDefault();
        return;
      }
      if (event.key === "Escape") {
        handleBack();
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        handleArrowNavigation("right");
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleArrowNavigation("left");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown); // cleanup
  }, [navigate, handleBack, handleArrowNavigation]);

  const handleFavoriteToggle = useCallback(() => {
    if (!movie) return;
    if (favorited) {
      dispatch(removeFavorite(movie.id));
    } else {
      dispatch(addFavorite(movie));
    }
  }, [dispatch, favorited, movie]);

  // ─── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner} aria-label="Loading movie details" />
        <p className={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  // ─── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className={styles.errorWrapper}>
        <span className={styles.errorIcon}>⚠️</span>
        <p className={styles.errorText}>{error}</p>
        <button className={styles.backBtn} onClick={handleBack}>
          ← Back to movies
        </button>
      </div>
    );
  }

  if (!movie) return null;

  // ─── Derived display values — with fallbacks for missing API fields ─────────
  const posterUrl = getPosterUrl(movie.poster_path) ?? FALLBACK_POSTER;
  const backdropUrl = getBackdropUrl(movie.backdrop_path);
  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "N/A";
  const rating =
    typeof movie.vote_average === "number"
      ? movie.vote_average.toFixed(1)
      : "N/A";
  const runtime = movie.runtime
    ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
    : null;
  const genres = Array.isArray(movie.genres) ? movie.genres : [];

  return (
    <div className={styles.page}>
      {/* ─── Backdrop ─── */}
      {backdropUrl && (
        <div
          className={styles.backdrop}
          style={{ backgroundImage: `url(${backdropUrl})` }}
          aria-hidden="true"
        />
      )}
      <div className={styles.backdropOverlay} aria-hidden="true" />

      {/* ─── Back button ─── */}
      <button className={styles.backBtn} onClick={handleBack} tabIndex={-1}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 12H5M12 19l-7-7 7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Back
      </button>

      {/* ─── Content ─── */}
      <div className={styles.content}>
        {/* Poster */}
        <div className={styles.posterWrapper}>
          <img
            src={posterUrl}
            alt={`${movie.title ?? "Movie"} poster`}
            className={styles.poster}
            onError={(e) => {
              e.currentTarget.src = FALLBACK_POSTER;
            }}
          />
        </div>

        {/* Details */}
        <div className={styles.details}>
          <h1 className={styles.title}>{movie.title ?? "Unknown Title"}</h1>

          {movie.tagline && <p className={styles.tagline}>"{movie.tagline}"</p>}

          {/* Meta row */}
          <div className={styles.meta}>
            <span className={styles.rating}>
              <span className={styles.star}>★</span>
              {rating}
              <span className={styles.ratingCount}>/ 10</span>
            </span>
            {releaseYear !== "N/A" && (
              <span className={styles.metaItem}>{releaseYear}</span>
            )}
            {runtime && <span className={styles.metaItem}>{runtime}</span>}
          </div>

          {/* Genres */}
          {genres.length > 0 && (
            <div className={styles.genres}>
              {genres.map((genre) => (
                <span key={genre.id} className={styles.genreTag}>
                  {genre.name}
                </span>
              ))}
            </div>
          )}

          {/* Overview */}
          {movie.overview && (
            <div className={styles.overviewSection}>
              <h2 className={styles.sectionTitle}>Overview</h2>
              <p className={styles.overview}>{movie.overview}</p>
            </div>
          )}

          {/* Favorite button */}
          <button
            className={`${styles.favoriteBtn} ${favorited ? styles.favoriteBtnActive : ""}`}
            onClick={handleFavoriteToggle}
            tabIndex={-1}
            aria-label={
              favorited ? "Remove from favorites" : "Add to favorites"
            }
          >
            {favorited ? (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                Remove from Favorites
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Add to Favorites
              </>
            )}
          </button>

          {/* Keyboard hint — updated to include Left/Right navigation */}
          <p className={styles.hint}>
            <kbd>Esc</kbd> back &nbsp;·&nbsp;
            <kbd>←</kbd> <kbd>→</kbd> browse movies
          </p>
        </div>
      </div>

      {/* ─── Toast — rendered outside content so it floats above everything ─── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={dismissToast}
        />
      )}
    </div>
  );
};

export default MovieDetailPage;
