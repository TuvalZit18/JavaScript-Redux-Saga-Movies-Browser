import { all } from 'redux-saga/effects'
import { moviesSaga } from './moviesSaga'

// ─────────────────────────────────────────────
// Root Saga — combines all feature sagas
// ─────────────────────────────────────────────
export function* rootSaga() {
  yield all([
    moviesSaga(),
  ])
}
