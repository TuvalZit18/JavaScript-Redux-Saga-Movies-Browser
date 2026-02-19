import { call, put, takeLatest, delay } from "redux-saga/effects";
import {
  fetchPopularMovies,
  fetchAiringNowMovies,
  searchMovies,
} from "../../api/tmdb";
import {
  fetchPopularRequest,
  fetchPopularSuccess,
  fetchPopularFailure,
  fetchAiringRequest,
  fetchAiringSuccess,
  fetchAiringFailure,
  fetchSearchRequest,
  fetchSearchSuccess,
  fetchSearchFailure,
} from "../slices/moviesSlice";
import { tryRequest } from "../../utils/rateLimiter";

// ─────────────────────────────────────────────
// Movies Saga — all async API calls
// ─────────────────────────────────────────────

// TMDB hard limit — never request beyond page 500
const TMDB_MAX_PAGES = 500;

const safePage = (page) => Math.min(Math.max(1, page), TMDB_MAX_PAGES);

// ─── Popular ─────────────────────────────────────────────────────────────────
function* handleFetchPopular(action) {
  try {
    const page = safePage(action.payload?.page ?? 1);
    const data = yield call(fetchPopularMovies, page);
    yield put(fetchPopularSuccess(data));
  } catch (error) {
    yield put(
      fetchPopularFailure(error.message ?? "Failed to load popular movies."),
    );
  }
}

// ─── Airing Now ──────────────────────────────────────────────────────────────
function* handleFetchAiring(action) {
  try {
    const page = safePage(action.payload?.page ?? 1);
    const data = yield call(fetchAiringNowMovies, page);
    yield put(fetchAiringSuccess(data));
  } catch (error) {
    yield put(
      fetchAiringFailure(error.message ?? "Failed to load airing now movies."),
    );
  }
}

// ─── Search (debounce + rate limit) ──────────────────────────────────────────
function* handleFetchSearch(action) {
  try {
    const { query, page = 1 } = action.payload;
    const safePageNum = safePage(page);

    // Debounce — saga-level (component also debounces, double protection)
    yield delay(500);

    // Rate limit — max 5 requests per 10 seconds
    const allowed = tryRequest();
    if (!allowed) {
      yield put(fetchSearchFailure("Too many requests. Please wait a moment."));
      return;
    }

    const data = yield call(searchMovies, query, safePageNum);
    yield put(fetchSearchSuccess(data));
  } catch (error) {
    yield put(
      fetchSearchFailure(error.message ?? "Search failed. Please try again."),
    );
  }
}

// ─── Watchers ─────────────────────────────────────────────────────────────────
// takeLatest cancels any previous in-flight saga on new action
export function* moviesSaga() {
  yield takeLatest(fetchPopularRequest.type, handleFetchPopular);
  yield takeLatest(fetchAiringRequest.type, handleFetchAiring);
  yield takeLatest(fetchSearchRequest.type, handleFetchSearch);
}
