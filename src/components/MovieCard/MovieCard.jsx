import React, { useCallback, memo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { addFavorite, removeFavorite } from "../../store/slices/favoritesSlice";
import { getPosterUrl } from "../../api/tmdb";
import styles from "./MovieCard.module.css";

const FALLBACK_POSTER = "/placeholder-poster.svg";

const MovieCard = memo(({ movie, isFocused, cardIndex }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const favorites = useSelector((state) => state.favorites.items);

  const favorited = favorites.some((fav) => fav.id === movie.id);
  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : "N/A";
  const rating =
    typeof movie.vote_average === "number"
      ? movie.vote_average.toFixed(1)
      : "N/A";
  const posterUrl = getPosterUrl(movie.poster_path) ?? FALLBACK_POSTER;

  const handleCardClick = useCallback(() => {
    navigate(`/movie/${movie.id}`);
  }, [navigate, movie.id]);

  const handleEyeClick = useCallback(
    (event) => {
      event.stopPropagation();
      navigate(`/movie/${movie.id}`);
    },
    [navigate, movie.id],
  );

  const handleFavoriteClick = useCallback(
    (event) => {
      event.stopPropagation();
      if (favorited) {
        dispatch(removeFavorite(movie.id));
      } else {
        dispatch(addFavorite(movie));
      }
    },
    [dispatch, favorited, movie],
  );

  return (
    <article
      className={`${styles.card} ${isFocused ? styles.focused : ""}`}
      onClick={handleCardClick}
      data-card
      data-index={cardIndex}
      aria-label={`${movie.title ?? "Unknown title"}, rated ${rating}`}
    >
      {/* ─── Poster — overflow hidden scoped here only ─── */}
      <div className={styles.posterWrapper}>
        <img
          src={posterUrl}
          alt={`${movie.title ?? "Movie"} poster`}
          className={styles.poster}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = FALLBACK_POSTER;
          }}
        />
      </div>

      {/* ─── Action buttons — outside posterWrapper so tooltip is never clipped ─── */}
      <div
        className={`${styles.actions} ${isFocused ? styles.actionsVisible : ""}`}
      >
        <button
          className={styles.actionBtn}
          onClick={handleEyeClick}
          aria-label={`View details for ${movie.title}`}
          data-tooltip="View Details"
          tabIndex={-1}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx="12"
              cy="12"
              r="3"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
        </button>

        <button
          className={`${styles.actionBtn} ${favorited ? styles.favorited : ""}`}
          onClick={handleFavoriteClick}
          aria-label={
            favorited
              ? `Remove ${movie.title} from favorites`
              : `Add ${movie.title} to favorites`
          }
          data-tooltip={
            favorited ? "Remove from Favorites" : "Add to Favorites"
          }
          tabIndex={-1}
        >
          {favorited ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* ─── Info ─── */}
      <div className={styles.info}>
        <h3 className={`${styles.title} truncate`} title={movie.title}>
          {movie.title ?? "Unknown Title"}
        </h3>
        <div className={styles.meta}>
          <span className={styles.rating}>
            <span className={styles.star} aria-hidden="true">
              ★
            </span>
            {rating}
          </span>
          <span className={styles.divider} aria-hidden="true">
            ·
          </span>
          <span className={styles.year}>{releaseYear}</span>
        </div>
      </div>
    </article>
  );
});

MovieCard.displayName = "MovieCard";

export default MovieCard;
