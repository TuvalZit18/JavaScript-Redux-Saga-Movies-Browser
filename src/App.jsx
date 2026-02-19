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
// focusContext: 'search' | 'tabs' | 'grid' | 'pagination'
//
// contextSwitchedAt: timestamp of last context switch.
// Passed to all context-aware components so they can guard against
// queued keypresses bleeding in right after a context switch.
// The KEY that caused the switch fires normally — only the NEW context
// is locked for CONTEXT_SWITCH_COOLDOWN_MS after becoming active.
// ─────────────────────────────────────────────────────────────────────────────

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
  const [focusContext, setFocusContextRaw] = useState("tabs");
  const contextSwitchedAt = useRef(Date.now());

  // Wrap setFocusContext to always record the switch timestamp
  const setFocusContext = useCallback((newContext) => {
    contextSwitchedAt.current = Date.now();
    setFocusContextRaw(newContext);
  }, []);

  return (
    <>
      <Header />

      <Routes>
        <Route
          path="/"
          element={
            <>
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
              <Suspense fallback={<PageLoader />}>
                <HomePage
                  focusContext={focusContext}
                  setFocusContext={setFocusContext}
                  contextSwitchedAt={contextSwitchedAt}
                />
              </Suspense>
            </>
          }
        />

        <Route
          path="/movie/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <MovieDetailPage />
            </Suspense>
          }
        />
      </Routes>

      <Footer />
    </>
  );
};

export default App;
