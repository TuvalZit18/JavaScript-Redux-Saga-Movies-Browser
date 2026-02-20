import React, { useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addFavorite, removeFavorite } from "../../store/slices/favoritesSlice";
import {
  fetchMovieDetails,
  getBackdropUrl,
  getPosterUrl,
} from "../../api/tmdb";
import styles from "./MovieDetailPage.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// MovieDetailPage
// ─────────────────────────────────────────────────────────────────────────────
// Fetches and displays full movie details.
// Escape key → navigate back.
// Add/Remove from favorites button.
// ─────────────────────────────────────────────────────────────────────────────

const FALLBACK_POSTER = "/placeholder-poster.svg";

/**
 * Custom hook — fetches full movie details from TMDB by ID.
 * Manages its own loading/error state locally (not in Redux)
 * since detail data is not shared across components.
 * @param {string|number} movieId - TMDB movie ID from URL params
 * @returns {{ movie: Object|null, loading: boolean, error: string|null }}
 */
const useMovieDetail = (movieId) => {
  // Local state only — movie details are fetched once per visit
  // and don't need to be shared globally via Redux
  const [state, setState] = React.useState({
    movie: null,
    loading: true,
    error: null,
  });

  /**
   * Fetches movie details when the component mounts or movieId changes.
   * Resets state to loading before each fetch to prevent stale data
   * from a previous movie flashing on screen.
   * Uses local state instead of Redux — detail data is not shared globally.
   */
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

const MovieDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const favorites = useSelector((state) => state.favorites.items);

  const { movie, loading, error } = useMovieDetail(id);

  const favorited = favorites.some((fav) => fav.id === movie?.id);

  /**
   * ─── Escape → go back ────────────────────────────────────────────────────
   * Registers a global keydown listener for this page only.
   * - Tab    → always blocked (consistent with global app behavior)
   * - Escape → navigates back to the home page
   *
   * Listener is cleaned up on unmount to prevent memory leaks
   * and avoid stale navigate references persisting after leaving the page.
   */
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Tab") {
        event.preventDefault();
        return;
      }
      if (event.key === "Escape") navigate("/");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  /**
   * Toggles the movie in/out of favorites.
   * Dispatches to favoritesSlice which persists to localStorage.
   */
  const handleFavoriteToggle = useCallback(() => {
    if (!movie) return;
    if (favorited) {
      dispatch(removeFavorite(movie.id));
    } else {
      dispatch(addFavorite(movie));
    }
  }, [dispatch, favorited, movie]);

  const handleBack = useCallback(() => navigate("/"), [navigate]);

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <div className={styles.spinner} aria-label="Loading movie details" />
        <p className={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────────────────────
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
  // ─── Derived display values — with fallbacks for missing API fields ───
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
  const genres = Array.isArray(movie.genres)
    ? movie.genres.map((g) => g.name).join(", ")
    : "";

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
      {/* tabIndex={-1} — Tab key is disabled globally, keyboard nav uses arrow keys*/}
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
          {genres && (
            <div className={styles.genres}>
              {movie.genres.map((genre) => (
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
          {/* tabIndex={-1} — Tab key is disabled globally, keyboard nav uses arrow keys*/}
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

          {/* Keyboard hint */}
          <p className={styles.hint}>
            Press <kbd>Esc</kbd> to go back
          </p>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailPage;
