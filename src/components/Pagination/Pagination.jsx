import React, { useCallback, memo, useState, useEffect } from "react";
import styles from "./Pagination.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// Pagination
//
// Keyboard context (focusContext === 'pagination'):
//   Left/Right → move highlight between page numbers (no fetch yet)
//   Enter      → confirm highlighted page → fetch
//   ArrowUp    → exit to grid context
//
// Tracks highlighted PAGE NUMBER (not array index) to stay stable
// when the pages array rebuilds after navigation.
//
// Guard: ignores keypresses for COOLDOWN_MS after becoming active.
// ─────────────────────────────────────────────────────────────────────────────

// Maximum number of page buttons shown at once — ellipsis used beyond this
const MAX_VISIBLE_PAGES = 7;

// Cooldown window after context switch — must match all other context-aware components
const COOLDOWN_MS = 300;

/**
 * Builds the visible page range array with ellipsis placeholders.
 * Always includes first and last page, with up to MAX_VISIBLE_PAGES shown.
 * Ellipsis ('...') is inserted where pages are skipped.
 * Example: [1, '...', 6, 7, 8, '...', 500]
 * @param {number} currentPage  - Currently active page
 * @param {number} totalPages   - Total number of pages available
 * @returns {Array<number|string>} - Array of page numbers and '...' placeholders
 */
const buildPageRange = (currentPage, totalPages) => {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [1];

  const leftBound = currentPage - 1;
  const rightBound = currentPage + 1;

  if (leftBound > 2) pages.push("...");

  for (
    let p = Math.max(2, leftBound);
    p <= Math.min(totalPages - 1, rightBound);
    p++
  ) {
    pages.push(p);
  }

  if (rightBound < totalPages - 1) pages.push("...");

  pages.push(totalPages);

  return pages;
};

// memo() — prevents re-render when parent updates focusContext for other sections.
// Pagination only needs to re-render when its own props change.
const Pagination = memo(
  ({
    currentPage,
    totalPages,
    onPageChange,
    focusContext,
    setFocusContext,
    contextSwitchedAt,
  }) => {
    const isActive = focusContext === "pagination";
    const pages = buildPageRange(currentPage, totalPages);

    // Track highlighted PAGE NUMBER — stable across pages array rebuilds
    const [highlightedPage, setHighlightedPage] = useState(currentPage);

    // Sync highlighted page when currentPage changes (e.g. after fetch)
    useEffect(() => {
      setHighlightedPage(currentPage);
    }, [currentPage]);

    const isFirst = currentPage === 1;
    const isLast = currentPage === totalPages;

    /**
     * Returns true if enough time has passed since the last context switch.
     * Prevents queued keypresses from the previous context bleeding into pagination.
     * @returns {boolean}
     */
    const isReady = useCallback(() => {
      return Date.now() - (contextSwitchedAt?.current ?? 0) > COOLDOWN_MS;
    }, [contextSwitchedAt]);

    /**
     * Navigates to the previous page and activates pagination context.
     * No-op if already on the first page.
     */
    const handlePrev = useCallback(() => {
      if (!isFirst) {
        setFocusContext("pagination");
        onPageChange(currentPage - 1);
      }
    }, [isFirst, currentPage, onPageChange, setFocusContext]);

    /**
     * Navigates to the next page and activates pagination context.
     * No-op if already on the last page.
     */
    const handleNext = useCallback(() => {
      if (!isLast) {
        setFocusContext("pagination");
        onPageChange(currentPage + 1);
      }
    }, [isLast, currentPage, onPageChange, setFocusContext]);

    /**
     * Handles clicking a specific page number.
     * Activates pagination context and triggers page fetch.
     * Ignores ellipsis clicks (typeof check) and clicks on current page.
     * @param {number|string} page - Page number or '...' ellipsis placeholder
     */
    const handlePageClick = useCallback(
      (page) => {
        if (typeof page === "number" && page !== currentPage) {
          setFocusContext("pagination");
          onPageChange(page);
        }
      },
      [currentPage, onPageChange, setFocusContext],
    );

    // ─── Keyboard navigation ────────────────────────────────────────────────
    // Registers a global keydown listener active only when focusContext === 'pagination'.
    // Left/Right moves the highlight without fetching — Enter confirms and fetches.
    // This prevents accidental page loads when browsing through page numbers.
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

        // Get only the actual page numbers from current pages array (skip ellipsis)
        const pageNumbers = pages.filter((p) => typeof p === "number");

        if (key === "ArrowRight") {
          event.preventDefault();
          const currentIdx = pageNumbers.indexOf(highlightedPage);
          const nextPage =
            pageNumbers[Math.min(currentIdx + 1, pageNumbers.length - 1)];
          if (nextPage !== undefined) setHighlightedPage(nextPage);
        }

        if (key === "ArrowLeft") {
          event.preventDefault();
          const currentIdx = pageNumbers.indexOf(highlightedPage);
          const prevPage = pageNumbers[Math.max(currentIdx - 1, 0)];
          if (prevPage !== undefined) setHighlightedPage(prevPage);
        }

        if (key === "Enter") {
          event.preventDefault();
          if (typeof highlightedPage === "number") {
            onPageChange(highlightedPage);
          }
        }

        if (key === "ArrowUp") {
          event.preventDefault();
          setFocusContext("grid");
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
      isActive,
      isReady,
      highlightedPage,
      pages,
      onPageChange,
      setFocusContext,
    ]);

    // No pagination needed for single-page results — render nothing
    if (totalPages <= 1) return null;

    return (
      <nav
        className={`${styles.pagination} ${isActive ? styles.sectionActive : ""}`}
        aria-label="Pagination"
      >
        {/* Previous arrow */}
        <button
          className={`${styles.arrow} ${isFirst ? styles.disabled : ""}`}
          onClick={handlePrev}
          disabled={isFirst}
          aria-label="Previous page"
          tabIndex={-1}
        >
          ‹
        </button>

        {/* Page numbers */}
        {pages.map((page, index) =>
          page === "..." ? (
            <span key={`ellipsis-${index}`} className={styles.ellipsis}>
              …
            </span>
          ) : (
            <button
              key={page}
              className={`${styles.pageBtn}
              ${page === currentPage ? styles.active : ""}
              ${isActive && page === highlightedPage && page !== currentPage ? styles.highlighted : ""}
            `}
              onClick={() => handlePageClick(page)}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? "page" : undefined}
              tabIndex={-1}
            >
              {page}
            </button>
          ),
        )}

        {/* Next arrow */}
        <button
          className={`${styles.arrow} ${isLast ? styles.disabled : ""}`}
          onClick={handleNext}
          disabled={isLast}
          aria-label="Next page"
          tabIndex={-1}
        >
          ›
        </button>
      </nav>
    );
  },
);

Pagination.displayName = "Pagination";

export default Pagination;
