import { all } from "redux-saga/effects";
import { moviesSaga } from "./moviesSaga";

// ─────────────────────────────────────────────
// Root Saga — single entry point that combines all feature sagas.
// store.js calls sagaMiddleware.run(rootSaga) once to start everything.
// Each feature (movies, etc.) has its own saga file for separation of concerns.
// ─────────────────────────────────────────────

/* Why yield and not await?
  Redux-Saga uses generator functions (function*) instead of async/await.
  yield pauses the generator and hands control back to the saga middleware,
  which can then cancel, restart, or race effects — something await cannot do.
  This is what enables powerful effects like takeLatest (auto-cancel previous
  in-flight requests) and race conditions, which are impossible with plain async/await.*/
export function* rootSaga() {
  /* yield all() starts all sagas concurrently — equivalent to Promise.all()
     but with saga middleware control over each one*/
  yield all([moviesSaga()]);
}
