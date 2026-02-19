import { useEffect, useCallback } from "react";

// ─────────────────────────────────────────────────────────────────────────────
// useKeyboardNavigation
//
// Handles arrow key navigation within the MOVIE GRID context only.
// Guard: ignores keypresses for COOLDOWN_MS after grid becomes active
// to prevent queued keypresses bleeding in from previous context.
//
// @param {object} options
//   gridRef           — ref to the grid container element
//   totalItems        — total number of cards currently rendered
//   columns           — cards per row (default: 4)
//   onEnter           — callback(index) when Enter pressed on focused card
//   onExitTop         — callback() when Up arrow on first row → go to tabs
//   onExitBottom      — callback() when Down arrow on last row → go to pagination
//   focusedIndex      — controlled focused card index
//   setFocusedIndex   — state setter
//   isActive          — whether grid context is currently active
//   contextSwitchedAt — ref with timestamp of last context switch (for guard)
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
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  const isReady = useCallback(() => {
    return Date.now() - (contextSwitchedAt?.current ?? 0) > COOLDOWN_MS;
  }, [contextSwitchedAt]);

  const scrollCardIntoView = useCallback(
    (index) => {
      if (gridRef?.current) {
        const cards = gridRef.current.querySelectorAll("[data-card]");
        cards[index]?.scrollIntoView({ block: "center", behavior: "smooth" });
      }
    },
    [gridRef],
  );

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
      if (event.key === "Tab") {
        event.preventDefault();
        return;
      }
      if (!isActive) return;

      // Guard: block queued keypresses right after context switch
      if (!isReady()) return;

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
          if (currentRow === lastRow) {
            onExitBottom?.();
          } else {
            moveFocus(focusedIndex + columns);
          }
          break;

        case "ArrowUp":
          event.preventDefault();
          if (currentRow === 0) {
            onExitTop?.();
          } else {
            moveFocus(focusedIndex - columns);
          }
          break;

        case "Enter":
          event.preventDefault();
          if (onEnter && focusedIndex >= 0 && focusedIndex < totalItems) {
            onEnter(focusedIndex);
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
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
