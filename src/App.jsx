import React, { Suspense, lazy, useState, useCallback, useRef } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
import SearchBar from "./components/SearchBar/SearchBar";
import FilterTabs from "./components/FilterTabs/FilterTabs";
import Footer from "./components/Footer/Footer";

const HomePage = lazy(() => import("./pages/HomePage/HomePage"));
const MovieDetailPage = lazy(
  () => import("./pages/MovieDetailPage/MovieDetailPage"),
);

// ─────────────────────────────────────────────────────────────────────────────
// App — root layout, routing, focus context owner
//
// Layout: flex column, full height
//   Header (fixed height)
//   Main area (flex: 1, scrollable inside)
//     SearchBar + FilterTabs + HomePage (on /)
//     MovieDetailPage (on /movie/:id)
//   Footer (fixed height)
// ─────────────────────────────────────────────────────────────────────────────

const pageStyle = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  minHeight: 0,
  overflow: "hidden",
};

const PageLoader = () => (
  <div
    style={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        border: "3px solid var(--color-border-subtle)",
        borderTopColor: "var(--color-accent)",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
  </div>
);

const App = () => {
  // App starts with focus on Filter Tabs — user can navigate immediately on load
  const [focusContext, setFocusContextRaw] = useState("tabs");
  // useRef — not useState — so updating the timestamp never triggers a re-render.
  const contextSwitchedAt = useRef(Date.now());

  /* Wraps the raw setter to always record the switch timestamp
  Used by all context-aware components to guard against queued keypresses*/
  const setFocusContext = useCallback((newContext) => {
    contextSwitchedAt.current = Date.now();
    setFocusContextRaw(newContext);
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Header />

      <Routes>
        {/* ── Home — Search + Tabs + Grid wrapped in a flex column page container ── */}
        <Route
          path="/"
          element={
            <div style={pageStyle}>
              {/* SearchBar, FilterTabs share focusContext with HomePage
                  so all three know which section owns keyboard input */}
              <SearchBar
                focusContext={focusContext}
                setFocusContext={setFocusContext}
                contextSwitchedAt={contextSwitchedAt}
              />
              <FilterTabs
                focusContext={focusContext}
                setFocusContext={setFocusContext}
                contextSwitchedAt={contextSwitchedAt}
              />
              {/* Suspense — shows PageLoader spinner while the lazy-loaded chunk downloads.
                  HomePage and MovieDetailPage are loaded on-demand (lazy) to reduce
                  the initial bundle size and speed up first paint. */}
              <Suspense fallback={<PageLoader />}>
                <HomePage
                  focusContext={focusContext}
                  setFocusContext={setFocusContext}
                  contextSwitchedAt={contextSwitchedAt}
                />
              </Suspense>
            </div>
          }
        />
        {/* ── Movie Detail — full page, no search/tabs, Escape key navigates back ── */}
        <Route
          path="/movie/:id"
          element={
            <div style={pageStyle}>
              {/* Suspense — same pattern. MovieDetailPage is only downloaded when
                  the user navigates to /movie/:id for the first time. */}
              <Suspense fallback={<PageLoader />}>
                <MovieDetailPage />
              </Suspense>
            </div>
          }
        />
      </Routes>

      <Footer />
    </div>
  );
};

export default App;
