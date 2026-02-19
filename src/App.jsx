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
  const [focusContext, setFocusContextRaw] = useState("tabs");
  const contextSwitchedAt = useRef(Date.now());

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
        <Route
          path="/"
          element={
            <div style={pageStyle}>
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
            </div>
          }
        />

        <Route
          path="/movie/:id"
          element={
            <div style={pageStyle}>
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
