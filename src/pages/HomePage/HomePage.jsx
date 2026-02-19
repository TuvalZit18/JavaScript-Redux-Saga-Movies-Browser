import React, { useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import MovieGrid from "../../components/MovieGrid/MovieGrid";
import Pagination from "../../components/Pagination/Pagination";
import {
  fetchPopularRequest,
  fetchAiringRequest,
  fetchSearchRequest,
  setFavoritesPage,
} from "../../store/slices/moviesSlice";
import styles from "./HomePage.module.css";

const FAVORITES_ITEMS_PER_PAGE = 20;
const MIN_SEARCH_LENGTH = 2;

const HomePage = ({ focusContext, setFocusContext, contextSwitchedAt }) => {
  const dispatch = useDispatch();
  const activeTab = useSelector((state) => state.movies.activeTab);
  const searchQuery = useSelector((state) => state.movies.searchQuery);
  const favoritesSearchQuery = useSelector(
    (state) => state.movies.favoritesSearchQuery,
  );
  const popular = useSelector((state) => state.movies.popular);
  const airing = useSelector((state) => state.movies.airing);
  const search = useSelector((state) => state.movies.search);
  const favorites = useSelector((state) => state.favorites.items);
  const favoritesPage = useSelector((state) => state.movies.favoritesPage);

  const isApiSearching = searchQuery.length >= MIN_SEARCH_LENGTH;

  useEffect(() => {
    dispatch(fetchPopularRequest({ page: 1 }));
  }, [dispatch]);

  const { movies, loading, error, currentPage, totalPages, emptyMessage } =
    useMemo(() => {
      if (activeTab === "favorites") {
        const query = favoritesSearchQuery.trim().toLowerCase();
        const isFiltering = query.length >= MIN_SEARCH_LENGTH;
        const filteredFavs = isFiltering
          ? favorites.filter((movie) =>
              (movie.title ?? "").toLowerCase().includes(query),
            )
          : favorites;
        const totalFavPages = Math.max(
          1,
          Math.ceil(filteredFavs.length / FAVORITES_ITEMS_PER_PAGE),
        );
        const safePage = Math.min(favoritesPage, totalFavPages);
        const start = (safePage - 1) * FAVORITES_ITEMS_PER_PAGE;
        return {
          movies: filteredFavs.slice(start, start + FAVORITES_ITEMS_PER_PAGE),
          loading: false,
          error: null,
          currentPage: safePage,
          totalPages: totalFavPages,
          emptyMessage: isFiltering
            ? `No favorites match "${favoritesSearchQuery}"`
            : "You haven't added any favorites yet. Browse movies and press 💙 to save them!",
        };
      }

      if (isApiSearching) {
        return {
          movies: search.movies,
          loading: search.loading,
          error: search.error,
          currentPage: search.currentPage,
          totalPages: search.totalPages,
          emptyMessage: `No results found for "${searchQuery}"`,
        };
      }

      if (activeTab === "popular") {
        return {
          movies: popular.movies,
          loading: popular.loading,
          error: popular.error,
          currentPage: popular.currentPage,
          totalPages: popular.totalPages,
          emptyMessage: "No popular movies available.",
        };
      }

      if (activeTab === "airing") {
        return {
          movies: airing.movies,
          loading: airing.loading,
          error: airing.error,
          currentPage: airing.currentPage,
          totalPages: airing.totalPages,
          emptyMessage: "No airing now movies available.",
        };
      }

      return {
        movies: [],
        loading: false,
        error: null,
        currentPage: 1,
        totalPages: 1,
        emptyMessage: "",
      };
    }, [
      activeTab,
      isApiSearching,
      searchQuery,
      favoritesSearchQuery,
      search,
      popular,
      airing,
      favorites,
      favoritesPage,
    ]);

  const handlePageChange = useCallback(
    (page) => {
      if (activeTab === "favorites") {
        dispatch(setFavoritesPage(page));
        return;
      }
      if (isApiSearching) {
        dispatch(fetchSearchRequest({ query: searchQuery, page }));
        return;
      }
      if (activeTab === "popular") dispatch(fetchPopularRequest({ page }));
      if (activeTab === "airing") dispatch(fetchAiringRequest({ page }));
    },
    [dispatch, activeTab, isApiSearching, searchQuery],
  );

  return (
    <div className={styles.page}>
      <div className={styles.gridArea}>
        <MovieGrid
          movies={movies}
          loading={loading}
          error={error}
          emptyMessage={emptyMessage}
          focusContext={focusContext}
          setFocusContext={setFocusContext}
          contextSwitchedAt={contextSwitchedAt}
        />
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        focusContext={focusContext}
        setFocusContext={setFocusContext}
        contextSwitchedAt={contextSwitchedAt}
      />
    </div>
  );
};

export default HomePage;
