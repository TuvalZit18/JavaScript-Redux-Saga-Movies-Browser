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

const COLUMNS = 4;

const SkeletonCard = () => (
  <div className={styles.skeleton} aria-hidden="true">
    <div className={styles.skeletonPoster} />
    <div className={styles.skeletonInfo}>
      <div className={styles.skeletonLine} />
      <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
    </div>
  </div>
);

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

  // Reset focus to first card when movies change
  useEffect(() => {
    setFocusedIndex(0);
  }, [movies]);

  // Scroll first card into view when grid becomes active
  useEffect(() => {
    if (focusContext === "grid" && gridRef.current) {
      const cards = gridRef.current.querySelectorAll("[data-card]");
      cards[focusedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [focusContext]);

  const handleEnter = useCallback(
    (index) => {
      const movie = movies[index];
      if (movie?.id) navigate(`/movie/${movie.id}`);
    },
    [movies, navigate],
  );

  const handleExitTop = useCallback(() => {
    setFocusContext("tabs");
  }, [setFocusContext]);

  const handleExitBottom = useCallback(() => {
    setFocusContext("pagination");
  }, [setFocusContext]);

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

  if (loading) {
    return (
      <div className={styles.grid} ref={gridRef} aria-busy="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

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
