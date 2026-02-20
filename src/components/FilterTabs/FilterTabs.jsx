import React, { useRef, useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setActiveTab,
  fetchPopularRequest,
  fetchAiringRequest,
} from "../../store/slices/moviesSlice";
import styles from "./FilterTabs.module.css";

// Tab definitions — id must match Redux activeTab values in moviesSlice
const TABS = [
  { id: "popular", label: "Popular", icon: "🔥" },
  { id: "airing", label: "Airing Now", icon: "📡" },
  { id: "favorites", label: "Favorites", icon: "💙" },
];
const COOLDOWN_MS = 300;

// ─────────────────────────────────────────────────────────────────────────────
/**
 * FilterTabs
 *
 * Category tab bar with a sliding bubble indicator.
 * Keyboard context (focusContext === 'tabs'):
 *   Left/Right → move highlight between tabs (2s delay before fetch)
 *   Enter      → confirm highlighted tab and fetch immediately
 *   ArrowUp    → exit to search context
 *   ArrowDown  → exit to grid context
 *
 * Two fetch trigger modes (per task requirements):
 *   Mouse click  → immediate fetch
 *   Keyboard nav → 2 second delay, cancelled if user moves away before it fires
 *
 * Guard: ignores keypresses for COOLDOWN_MS after becoming active context
 * to prevent queued keypresses bleeding in from the previous context.
 *
 * @param {string}          focusContext      - Current active keyboard context
 * @param {Function}        setFocusContext   - Switches the active keyboard context
 * @param {React.RefObject} contextSwitchedAt - Timestamp of last context switch (for cooldown guard)
 */
// ─────────────────────────────────────────────────────────────────────────────
const FilterTabs = ({ focusContext, setFocusContext, contextSwitchedAt }) => {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.movies.activeTab);

  // Stores pending 2s fetch timers keyed by tab id.
  // useRef — timer IDs don't need to trigger re-renders.
  const focusTimers = useRef({});

  // DOM refs for each tab button — used to measure position for the slider animation
  const tabRefs = useRef({});
  const containerRef = useRef(null);
  const isActive = focusContext === "tabs";

  // Keyboard-highlighted tab index — may differ from activeTab during navigation.
  // Moves instantly on arrow keys; fetch fires after 2s or on Enter.
  const [highlightedIndex, setHighlightedIndex] = useState(
    TABS.findIndex((t) => t.id === activeTab),
  );

  // Sync highlighted index when activeTab changes externally
  // (e.g. tab switched programmatically from another component)
  useEffect(() => {
    setHighlightedIndex(TABS.findIndex((t) => t.id === activeTab));
  }, [activeTab]);

  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

  // Recalculate slider position whenever the active tab changes.
  // Measures the active tab's DOM position relative to the container
  // and animates the bubble indicator to slide underneath it.
  useEffect(() => {
    const activeEl = tabRefs.current[activeTab];
    const containerEl = containerRef.current;
    if (!activeEl || !containerEl) return;
    const containerRect = containerEl.getBoundingClientRect();
    const tabRect = activeEl.getBoundingClientRect();
    setSliderStyle({
      left: tabRect.left - containerRect.left,
      width: tabRect.width,
    });
  }, [activeTab]);
  /**
   * Returns true if enough time has passed since the last context switch.
   * Prevents queued keypresses from the previous context firing in this one.
   * @returns {boolean}
   */
  const isReady = useCallback(() => {
    return Date.now() - contextSwitchedAt.current > COOLDOWN_MS;
  }, [contextSwitchedAt]);

  /**
   * Sets the active tab in Redux and dispatches the appropriate fetch action.
   * Favorites tab has no fetch — it displays locally stored data only.
   * @param {string} tabId - Tab id: 'popular' | 'airing' | 'favorites'
   */
  const dispatchTabFetch = useCallback(
    (tabId) => {
      dispatch(setActiveTab(tabId));
      if (tabId === "popular") dispatch(fetchPopularRequest({ page: 1 }));
      if (tabId === "airing") dispatch(fetchAiringRequest({ page: 1 }));
    },
    [dispatch],
  );

  /**
   * Cancels all pending 2s fetch timers across all tabs.
   * Called before every navigation action to prevent stale fetches
   * from firing after the user has already moved to a different tab.
   */
  const clearAllFocusTimers = useCallback(() => {
    Object.values(focusTimers.current).forEach(clearTimeout);
    focusTimers.current = {};
  }, []);

  // ─── Click → immediate fetch ──────────────────────────────────────────────
  const handleClick = useCallback(
    (tabId) => {
      clearAllFocusTimers();
      setFocusContext("tabs");
      dispatchTabFetch(tabId);
    },
    [dispatchTabFetch, setFocusContext, clearAllFocusTimers],
  );

  // ─── Mouse focus → 2s delay fetch ────────────────────────────────────────
  const handleFocus = useCallback(
    (tabId) => {
      if (tabId === activeTab) return;
      focusTimers.current[tabId] = setTimeout(() => {
        dispatchTabFetch(tabId);
        delete focusTimers.current[tabId];
      }, 2000);
    },
    [activeTab, dispatchTabFetch],
  );

  // Mouse blur — cancel the 2s timer if the user moves away before it fires
  const handleBlur = useCallback((tabId) => {
    if (focusTimers.current[tabId]) {
      clearTimeout(focusTimers.current[tabId]);
      delete focusTimers.current[tabId];
    }
  }, []);

  // ─── Keyboard navigation ──────────────────────────────────────────────────
  // Global keydown listener — active only when focusContext === 'tabs'.
  // Arrow keys move highlight and start a 2s fetch timer.
  // Enter cancels the timer and fetches immediately.
  // Vertical arrows transfer focus context to adjacent sections.
  // Cleanup removes the listener when dependencies change or component unmounts.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Tab") {
        event.preventDefault();
        return;
      }
      if (!isActive) return;

      // Guard: block queued keypresses right after context switch
      if (!isReady()) return;

      const { key } = event;

      switch (key) {
        case "ArrowRight": {
          event.preventDefault();
          clearAllFocusTimers();
          const nextIndex = Math.min(highlightedIndex + 1, TABS.length - 1);
          setHighlightedIndex(nextIndex);
          // Start 2s delay for the newly highlighted tab
          const nextTabId = TABS[nextIndex].id;
          focusTimers.current[nextTabId] = setTimeout(() => {
            dispatchTabFetch(nextTabId);
            delete focusTimers.current[nextTabId];
          }, 2000);
          break;
        }

        case "ArrowLeft": {
          event.preventDefault();
          clearAllFocusTimers();
          const prevIndex = Math.max(highlightedIndex - 1, 0);
          setHighlightedIndex(prevIndex);
          const prevTabId = TABS[prevIndex].id;
          focusTimers.current[prevTabId] = setTimeout(() => {
            dispatchTabFetch(prevTabId);
            delete focusTimers.current[prevTabId];
          }, 2000);
          break;
        }

        case "Enter": {
          event.preventDefault();
          clearAllFocusTimers();
          dispatchTabFetch(TABS[highlightedIndex].id);
          break;
        }

        case "ArrowDown": {
          event.preventDefault();
          clearAllFocusTimers();
          setFocusContext("grid");
          break;
        }

        case "ArrowUp": {
          event.preventDefault();
          clearAllFocusTimers();
          setFocusContext("search");
          break;
        }

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isActive,
    isReady,
    highlightedIndex,
    dispatchTabFetch,
    setFocusContext,
    clearAllFocusTimers,
  ]);

  return (
    <nav className={styles.nav} aria-label="Movie categories">
      <div
        className={`${styles.tabsContainer} ${isActive ? styles.sectionActive : ""}`}
        ref={containerRef}
      >
        {/* Sliding bubble indicator — position and width driven by sliderStyle state.
    Animates smoothly between tabs via CSS transition on left and width. */}
        <div
          className={styles.slider}
          style={{ left: sliderStyle.left, width: sliderStyle.width }}
          aria-hidden="true"
        />

        {TABS.map((tab, index) => {
          const isTabActive = activeTab === tab.id;
          const isTabHighlighted = isActive && highlightedIndex === index;

          return (
            <button
              key={tab.id}
              ref={(el) => {
                tabRefs.current[tab.id] = el;
              }}
              className={`${styles.tab} ${isTabActive ? styles.active : ""} ${isTabHighlighted && !isTabActive ? styles.highlighted : ""}`}
              onClick={() => handleClick(tab.id)}
              onFocus={() => handleFocus(tab.id)}
              onBlur={() => handleBlur(tab.id)}
              aria-pressed={isTabActive}
              tabIndex={-1}
            >
              <span className={styles.tabIcon} aria-hidden="true">
                {tab.icon}
              </span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default FilterTabs;
