import { configureStore } from '@reduxjs/toolkit'
import createSagaMiddleware from 'redux-saga'
import moviesReducer from './slices/moviesSlice'
import favoritesReducer from './slices/favoritesSlice'
import { rootSaga } from './sagas/rootSaga'

// ─────────────────────────────────────────────
// Redux Store Configuration
// ─────────────────────────────────────────────

const sagaMiddleware = createSagaMiddleware()

export const store = configureStore({
  reducer: {
    movies:    moviesReducer,
    favorites: favoritesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
})

// Start the root saga
sagaMiddleware.run(rootSaga)
