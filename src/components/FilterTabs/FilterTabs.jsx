import React, { useRef, useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setActiveTab,
  fetchPopularRequest,
  fetchAiringRequest,
} from "../../store/slices/moviesSlice";
import styles from "./FilterTabs.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// FilterTabs
//
// Keyboard context (focusContext === 'tabs'):
//   Left/Right → move highlight between tabs (2s delay to fetch)
//   Enter      → confirm immediately
//   ArrowUp    → go to search context
//   ArrowDown  → go to grid context
//
// Guard: ignores keypresses for COOLDOWN_MS after becoming active
// to prevent queued keypresses bleeding in from previous context.
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "popular", label: "Popular", icon: "🔥" },
  { id: "airing", label: "Airing Now", icon: "📡" },
  { id: "favorites", label: "Favorites", icon: "💙" },
];
const COOLDOWN_MS = 300;

const FilterTabs = ({ focusContext, setFocusContext, contextSwitchedAt }) => {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.movies.activeTab);
  const focusTimers = useRef({});
  const tabRefs = useRef({});
  const containerRef = useRef(null);
  const isActive = focusContext === "tabs";

  const [highlightedIndex, setHighlightedIndex] = useState(
    TABS.findIndex((t) => t.id === activeTab),
  );

  useEffect(() => {
    setHighlightedIndex(TABS.findIndex((t) => t.id === activeTab));
  }, [activeTab]);

  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

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

  const isReady = useCallback(() => {
    return Date.now() - contextSwitchedAt.current > COOLDOWN_MS;
  }, [contextSwitchedAt]);

  const dispatchTabFetch = useCallback(
    (tabId) => {
      dispatch(setActiveTab(tabId));
      if (tabId === "popular") dispatch(fetchPopularRequest({ page: 1 }));
      if (tabId === "airing") dispatch(fetchAiringRequest({ page: 1 }));
    },
    [dispatch],
  );

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

  const handleBlur = useCallback((tabId) => {
    if (focusTimers.current[tabId]) {
      clearTimeout(focusTimers.current[tabId]);
      delete focusTimers.current[tabId];
    }
  }, []);

  // ─── Keyboard navigation ──────────────────────────────────────────────────
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
