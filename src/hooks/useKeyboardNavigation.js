import { useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
/**
 * useKeyboardNavigation
 *
 * Handles arrow key navigation within the MOVIE GRID context only.
 * Guard: ignores keypresses for COOLDOWN_MS after grid becomes active
 * to prevent queued keypresses bleeding in from previous context.
 *
 * @param {object}   options
 * @param {React.RefObject} options.gridRef           - Ref to the grid container element
 * @param {number}   options.totalItems               - Total number of cards currently rendered
 * @param {number}   [options.columns=4]              - Cards per row (default: 4)
 * @param {Function} options.onEnter                  - Callback(index) when Enter pressed on focused card
 * @param {Function} options.onExitTop                - Callback when Up arrow pressed on first row → go to tabs
 * @param {Function} options.onExitBottom             - Callback when Down arrow pressed on last row → go to pagination
 * @param {number}   options.focusedIndex             - Controlled focused card index
 * @param {Function} options.setFocusedIndex          - State setter for focusedIndex
 * @param {boolean}  options.isActive                 - Whether grid context is currently active
 * @param {React.RefObject} options.contextSwitchedAt - Ref with timestamp of last context switch (for guard)
 */
// ─────────────────────────────────────────────────────────────────────────────

const COOLDOWN_MS = 300;

const useKeyboardNavigation = ({
  gridRef,
  totalItems,
  columns = 4,
  onEnter,
  onExitTop,
  onExitBottom,
  focusedIndex,
  setFocusedIndex,
  isActive,
  contextSwitchedAt,
}) => {
  // Clamps a value between min and max — prevents focus from going out of grid bounds
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  /**
   * Returns true if enough time has passed since the last context switch.
   * Prevents queued keypresses from the previous context bleeding into this one.
   * Example: pressing Down 3 times in FilterTabs — only the first triggers the
   * context switch, the other 2 are blocked here for COOLDOWN_MS.
   */
  const isReady = useCallback(() => {
    return Date.now() - (contextSwitchedAt?.current ?? 0) > COOLDOWN_MS;
  }, [contextSwitchedAt]);

  /**
   * Scrolls the focused card into the center of the visible grid area.
   * Uses [data-card] attribute selector to find cards — avoids coupling
   * to CSS class names which may change.
   */
  const scrollCardIntoView = useCallback(
    (index) => {
      if (gridRef?.current) {
        const cards = gridRef.current.querySelectorAll("[data-card]");
        cards[index]?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    },
    [gridRef],
  );

  /**
   * Moves focus to a new card index, clamped to valid grid bounds.
   * Updates the focused index in state and scrolls the card into view.
   * @param {number} newIndex - Target card index (will be clamped)
   */
  const moveFocus = useCallback(
    (newIndex) => {
      const clamped = clamp(newIndex, 0, totalItems - 1);
      setFocusedIndex(clamped);
      scrollCardIntoView(clamped);
    },
    [totalItems, setFocusedIndex, scrollCardIntoView],
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Tab is disabled globally — prevent default behavior across the whole app
      if (event.key === "Tab") {
        event.preventDefault();
        return;
      }
      // Only handle keys when the grid context is active
      if (!isActive) return;

      // Guard: block queued keypresses that arrived right after a context switch.
      // Example: pressing Down 3x in FilterTabs — first key triggers the switch,
      // the next 2 are blocked here for COOLDOWN_MS to prevent them firing in the grid
      if (!isReady()) return;

      // Derive row positions to detect first/last row boundary exits
      const { key } = event;
      const currentRow = Math.floor(focusedIndex / columns);
      const lastRow = Math.floor((totalItems - 1) / columns);

      switch (key) {
        case "ArrowRight":
          event.preventDefault();
          moveFocus(focusedIndex + 1);
          break;

        case "ArrowLeft":
          event.preventDefault();
          moveFocus(focusedIndex - 1);
          break;

        case "ArrowDown":
          event.preventDefault();
          // Last row → exit grid context downward to Pagination
          if (currentRow === lastRow) {
            onExitBottom?.();
          } else {
            moveFocus(focusedIndex + columns);
          }
          break;

        case "ArrowUp":
          event.preventDefault();
          // First row → exit grid context upward to Filter Tabs
          if (currentRow === 0) {
            onExitTop?.();
          } else {
            moveFocus(focusedIndex - columns);
          }
          break;

        case "Enter":
          event.preventDefault();
          // Validate index before firing to guard against stale state
          if (onEnter && focusedIndex >= 0 && focusedIndex < totalItems) {
            onEnter(focusedIndex);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Cleanup — remove listener on unmount or when dependencies change
    // to prevent stale closures from handling events after re-render
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isActive,
    isReady,
    focusedIndex,
    columns,
    totalItems,
    moveFocus,
    onEnter,
    onExitTop,
    onExitBottom,
  ]);
};

export default useKeyboardNavigation;
