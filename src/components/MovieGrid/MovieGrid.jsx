import React, { useRef, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MovieCard from "../MovieCard/MovieCard";
import useKeyboardNavigation from "../../hooks/useKeyboardNavigation";
import styles from "./MovieGrid.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// MovieGrid
//
// Keyboard navigation active only when focusContext === 'grid'.
// Up on first row  → exits to tabs context.
// Down on last row → exits to pagination context.
// Guard handled inside useKeyboardNavigation hook.
// ─────────────────────────────────────────────────────────────────────────────

// Number of cards per row — must match the CSS grid-template-columns value
const COLUMNS = 4;

/**
 * Placeholder card shown during loading.
 * Matches the dimensions of a real MovieCard to prevent layout shift.
 * aria-hidden — decorative only, screen readers skip it.
 */
const SkeletonCard = () => (
  <div className={styles.skeleton} aria-hidden="true">
    <div className={styles.skeletonPoster} />
    <div className={styles.skeletonInfo}>
      <div className={styles.skeletonLine} />
      <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
    </div>
  </div>
);

/**
 * MovieGrid
 *
 * Renders a 4-column grid of MovieCard components.
 * Keyboard navigation is active only when focusContext === 'grid'.
 * Up on first row  → exits to tabs context.
 * Down on last row → exits to pagination context.
 * Guard against queued keypresses is handled inside useKeyboardNavigation.
 *
 * @param {Array}           movies            - List of movie objects to display
 * @param {boolean}         loading           - Shows skeleton cards when true
 * @param {string|null}     error             - Error message to display if fetch failed
 * @param {string}          emptyMessage      - Message shown when movies array is empty
 * @param {string}          focusContext      - Current active keyboard context
 * @param {Function}        setFocusContext   - Switches the active keyboard context
 * @param {React.RefObject} contextSwitchedAt - Timestamp of last context switch (for cooldown guard)
 */
const MovieGrid = ({
  movies = [],
  loading = false,
  error = null,
  emptyMessage,
  focusContext,
  setFocusContext,
  contextSwitchedAt,
}) => {
  const gridRef = useRef(null);
  const navigate = useNavigate();
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Reset focused card index to 0 whenever the movies list changes
  // (page change, tab switch, new search results) — prevents stale index
  // pointing to a card that no longer exists in the new list.
  useEffect(() => {
    setFocusedIndex(0);
  }, [movies]);

  // When grid context becomes active, scroll the currently focused card
  // into view immediately — ensures the user can see which card is highlighted
  // without having to press an arrow key first.
  useEffect(() => {
    if (focusContext === "grid" && gridRef.current) {
      const cards = gridRef.current.querySelectorAll("[data-card]");
      cards[focusedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [focusContext]);

  /**
   * Navigates to the movie detail page when Enter is pressed on a focused card.
   * Guards against missing movie ID from malformed API responses.
   * @param {number} index - Index of the focused card in the movies array
   */
  const handleEnter = useCallback(
    (index) => {
      const movie = movies[index];
      if (movie?.id) navigate(`/movie/${movie.id}`);
    },
    [movies, navigate],
  );

  /**
   * Exits grid context upward — switches focus to Filter Tabs.
   * Triggered by Up arrow on the first row.
   */
  const handleExitTop = useCallback(() => {
    setFocusContext("tabs");
  }, [setFocusContext]);

  /**
   * Exits grid context downward — switches focus to Pagination.
   * Triggered by Down arrow on the last row.
   */
  const handleExitBottom = useCallback(() => {
    setFocusContext("pagination");
  }, [setFocusContext]);

  // Delegate all grid keyboard handling to the hook.
  // isActive gates whether the hook responds to keypresses at all.
  useKeyboardNavigation({
    gridRef,
    totalItems: movies.length,
    columns: COLUMNS,
    onEnter: handleEnter,
    onExitTop: handleExitTop,
    onExitBottom: handleExitBottom,
    focusedIndex,
    setFocusedIndex,
    isActive: focusContext === "grid",
    contextSwitchedAt,
  });

  // ─── Loading state — 12 skeleton cards matching real grid layout ─────────
  if (loading) {
    return (
      <div className={styles.grid} ref={gridRef} aria-busy="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }
  // ─── Error state — shown when API request fails ───────────────────────────
  if (error) {
    return (
      <div className={styles.stateContainer}>
        <div className={styles.stateIcon}>⚠️</div>
        <p className={styles.stateText}>{error}</p>
        <p className={styles.stateSubtext}>
          Please check your connection and try again.
        </p>
      </div>
    );
  }
  // ─── Empty state — shown when API returns 0 results ──────────────────────
  if (!movies.length) {
    return (
      <div className={styles.stateContainer}>
        <div className={styles.stateIcon}>🎬</div>
        <p className={styles.stateText}>{emptyMessage ?? "No movies found."}</p>
      </div>
    );
  }

  return (
    <div
      ref={gridRef}
      className={styles.grid}
      role="list"
      aria-label="Movies grid"
    >
      {/* isFocused is false when grid context is inactive —*/}
      {/* this removes the highlight from all cards when navigating other sections —*/}
      {movies.map((movie, index) => (
        <div key={movie.id} role="listitem">
          <MovieCard
            movie={movie}
            isFocused={focusContext === "grid" && focusedIndex === index}
            cardIndex={index}
          />
        </div>
      ))}
    </div>
  );
};

export default MovieGrid;
