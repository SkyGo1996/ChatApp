import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";

import { blockedStorage, themeStorage } from "./persist";
import blockedReducer from "./slices/blockedSlice";
import themeReducer from "./slices/themeSlice";

const blockedPersistConfig = {
  key: "blocked",
  storage: blockedStorage,
  version: 1,
  migrate: (state: unknown): Promise<unknown> => Promise.resolve(state),
};

const themePersistConfig = {
  key: "theme",
  storage: themeStorage,
  version: 1,
  migrate: (state: unknown): Promise<unknown> => Promise.resolve(state),
};

const rootReducer = combineReducers({
  blocked: persistReducer(blockedPersistConfig, blockedReducer),
  theme: persistReducer(themePersistConfig, themeReducer),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

// Defer persistor creation until after initBlockedStorage() has swapped MMKV
// to the encrypted instance. Eager `persistStore(store)` would hydrate blocked
// from the plain fallback MMKV and never re-read the encrypted one.
export let persistor: ReturnType<typeof persistStore> | null = null;

export function ensurePersistor(): ReturnType<typeof persistStore> {
  if (!persistor) persistor = persistStore(store);
  return persistor;
}

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
