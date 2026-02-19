import React, { useCallback, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setSearchQuery,
  setFavoritesSearchQuery,
  fetchSearchRequest,
  clearSearch,
} from "../../store/slices/moviesSlice";
import styles from "./SearchBar.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// SearchBar
//
// Keyboard context (focusContext === 'search'):
//   Escape    → clear + go to tabs context
//   ArrowDown → go to tabs context
//   (all other keys type normally)
//
// Guard: ignores keypresses for COOLDOWN_MS after becoming active context
// to prevent queued keypresses bleeding in from previous context.
// The key that triggered the context switch is NOT blocked — only keys
// arriving after the switch are guarded.
// ─────────────────────────────────────────────────────────────────────────────

const MIN_SEARCH_LENGTH = 2;
const COOLDOWN_MS = 300;

const SearchBar = ({ focusContext, setFocusContext, contextSwitchedAt }) => {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.movies.activeTab);
  const searchQuery = useSelector((state) =>
    activeTab === "favorites"
      ? state.movies.favoritesSearchQuery
      : state.movies.searchQuery,
  );

  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const isFavoritesTab = activeTab === "favorites";
  const isActive = focusContext === "search";

  // Focus/blur the input when context changes
  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus();
    } else {
      inputRef.current?.blur();
    }
  }, [isActive]);

  const isReady = useCallback(() => {
    return Date.now() - contextSwitchedAt.current > COOLDOWN_MS;
  }, [contextSwitchedAt]);

  const handleChange = useCallback(
    (event) => {
      const value = event.target.value;

      if (isFavoritesTab) {
        dispatch(setFavoritesSearchQuery(value));
        return;
      }

      dispatch(setSearchQuery(value));
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (value.length >= MIN_SEARCH_LENGTH) {
        debounceRef.current = setTimeout(() => {
          dispatch(fetchSearchRequest({ query: value, page: 1 }));
        }, 500);
      } else {
        dispatch(clearSearch());
      }
    },
    [dispatch, isFavoritesTab],
  );

  const handleClear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (isFavoritesTab) {
      dispatch(setFavoritesSearchQuery(""));
    } else {
      dispatch(setSearchQuery(""));
      dispatch(clearSearch());
    }
  }, [dispatch, isFavoritesTab]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Tab") {
        event.preventDefault();
        return;
      }
      if (!isActive) return;

      // Guard: block queued keypresses right after context switch
      if (!isReady()) return;

      if (event.key === "Escape") {
        event.preventDefault();
        handleClear();
        setFocusContext("tabs");
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setFocusContext("tabs");
        return;
      }
    },
    [isActive, isReady, handleClear, setFocusContext],
  );

  const handleClick = useCallback(() => {
    setFocusContext("search");
  }, [setFocusContext]);

  return (
    <div className={styles.wrapper}>
      <div className={`${styles.container} ${isActive ? styles.focused : ""}`}>
        <span className={styles.icon} aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle
              cx="11"
              cy="11"
              r="7"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M20 20l-3-3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>

        <input
          ref={inputRef}
          type="text"
          className={styles.input}
          placeholder={
            isFavoritesTab ? "Search your favorites..." : "Search movies..."
          }
          value={searchQuery}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          aria-label={isFavoritesTab ? "Search favorites" : "Search movies"}
          autoComplete="off"
          spellCheck={false}
        />

        {searchQuery && (
          <button
            className={styles.clearButton}
            onClick={handleClear}
            aria-label="Clear search"
            tabIndex={-1}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
