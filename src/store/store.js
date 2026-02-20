import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware from "redux-saga";
import moviesReducer from "./slices/moviesSlice";
import favoritesReducer from "./slices/favoritesSlice";
import { rootSaga } from "./sagas/rootSaga";

// ─────────────────────────────────────────────
// Redux Store Configuration
// ─────────────────────────────────────────────

/*  Create saga middleware — must be created before configureStore
    and started after, so it can intercept dispatched actions*/
const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    movies: moviesReducer, // => Popular, Airing Now, Search state + pagination.
    favorites: favoritesReducer, // => Favorites list synced with localStorage.
  },
  middleware: (getDefaultMiddleware) =>
    // Disable thunk — Redux-Saga is the sole async middleware in this app.
    getDefaultMiddleware({ thunk: false }).concat(sagaMiddleware),
});

/*  Start the root saga. Must be called AFTER store is created.
    starts listening for actions.*/
sagaMiddleware.run(rootSaga);
