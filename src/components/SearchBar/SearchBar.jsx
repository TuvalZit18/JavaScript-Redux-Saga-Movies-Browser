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
/**
 * SearchBar
 *
 * Keyboard context (focusContext === 'search'):
 *   Escape    → clear search + go to tabs context
 *   ArrowDown → go to tabs context
 *   (all other keys type normally in the input)
 *
 * Guard: ignores keypresses for COOLDOWN_MS after becoming active context
 * to prevent queued keypresses bleeding in from previous context.
 * The key that triggered the context switch is NOT blocked — only keys
 * arriving after the switch are guarded.
 *
 * @param {string}          focusContext       - Current active keyboard context
 * @param {Function}        setFocusContext    - Switches the active keyboard context
 * @param {React.RefObject} contextSwitchedAt  - Timestamp of last context switch (for cooldown guard)
 */
// ─────────────────────────────────────────────────────────────────────────────

// Minimum query length before an API search request is dispatched.
// Matches the same constant in moviesSaga.js and HomePage.jsx — single source of truth per file.
const MIN_SEARCH_LENGTH = 2;

// Cooldown window after a context switch during which keypresses are ignored.
// Prevents queued keypresses from the previous context bleeding into this one.
// Must match COOLDOWN_MS across all context-aware components (FilterTabs, MovieGrid, Pagination).
const COOLDOWN_MS = 300;

const SearchBar = ({ focusContext, setFocusContext, contextSwitchedAt }) => {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.movies.activeTab);

  // On Favorites tab: read local filter query (no API)
  // On other tabs: read the API search query
  const searchQuery = useSelector((state) =>
    activeTab === "favorites"
      ? state.movies.favoritesSearchQuery
      : state.movies.searchQuery,
  );
  // useRef — holds the debounce timer ID without triggering re-renders on change
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const isFavoritesTab = activeTab === "favorites";
  const isActive = focusContext === "search";

  // Programmatically focus/blur the input when focusContext changes.
  // This syncs the visual focus state with the keyboard context system —
  // when another section becomes active, the input loses focus automatically.
  useEffect(() => {
    if (isActive) {
      inputRef.current?.focus();
    } else {
      inputRef.current?.blur();
    }
  }, [isActive]);

  /**
   * Returns true if enough time has passed since the last context switch.
   * Prevents queued keypresses from the previous context bleeding into the search input.
   * @returns {boolean}
   */
  const isReady = useCallback(() => {
    return Date.now() - contextSwitchedAt.current > COOLDOWN_MS;
  }, [contextSwitchedAt]);

  /**
   * Handles input value changes.
   * Favorites tab → dispatches local filter query only, no API call.
   * Other tabs    → dispatches API search with 500ms debounce.
   *                 Clears search results if query drops below MIN_SEARCH_LENGTH.
   */
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

  /**
   * Clears the search input and cancels any pending debounce timer.
   * Favorites tab → clears local filter query only.
   * Other tabs    → clears both the query and the search results in Redux.
   */
  const handleClear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (isFavoritesTab) {
      dispatch(setFavoritesSearchQuery(""));
    } else {
      dispatch(setSearchQuery(""));
      dispatch(clearSearch());
    }
  }, [dispatch, isFavoritesTab]);

  /**
   * Handles keyboard events on the search input.
   * Only processes navigation keys (Escape, ArrowDown) when context is active.
   * Typing keys are handled natively by the input element.
   */
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

  // Mouse click on the input activates the search context
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

        {/* tabIndex={-1} — Tab key is disabled globally, this prevents */}
        {/* the clear button from being reachable via Tab. */}
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
