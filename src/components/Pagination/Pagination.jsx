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

const MAX_VISIBLE_PAGES = 7;
const COOLDOWN_MS = 300;

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

    const isReady = useCallback(() => {
      return Date.now() - (contextSwitchedAt?.current ?? 0) > COOLDOWN_MS;
    }, [contextSwitchedAt]);

    const handlePrev = useCallback(() => {
      if (!isFirst) {
        setFocusContext("pagination");
        onPageChange(currentPage - 1);
      }
    }, [isFirst, currentPage, onPageChange, setFocusContext]);

    const handleNext = useCallback(() => {
      if (!isLast) {
        setFocusContext("pagination");
        onPageChange(currentPage + 1);
      }
    }, [isLast, currentPage, onPageChange, setFocusContext]);

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
