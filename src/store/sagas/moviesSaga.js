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

/**
 * Clamps a page number between 1 and TMDB_MAX_PAGES.
 * Prevents HTTP 400 errors from TMDB when page exceeds their hard limit.
 * @param {number} page - Requested page number
 * @returns {number} - Safe page number within TMDB bounds
 */
const safePage = (page) => Math.min(Math.max(1, page), TMDB_MAX_PAGES);

// ─── Popular ─────────────────────────────────────────────────────────────────
function* handleFetchPopular(action) {
  try {
    const page = safePage(action.payload?.page ?? 1);
    // yield call() — invokes the API function through saga middleware
    // so it can be cancelled by takeLatest if a newer action arrives
    const data = yield call(fetchPopularMovies, page);
    // yield put() — dispatches an action back to the Redux store.
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

// ─── Watchers ─────────────────────────────────────────────────────────────
// takeLatest — listens for each action type and runs the handler.
// If the same action fires again before the previous handler finishes,
// the previous one is automatically cancelled — preventing race conditions
// and stale data from slow network responses.
export function* moviesSaga() {
  yield takeLatest(fetchPopularRequest.type, handleFetchPopular);
  yield takeLatest(fetchAiringRequest.type, handleFetchAiring);
  yield takeLatest(fetchSearchRequest.type, handleFetchSearch);
}
