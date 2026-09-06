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
  type PersistConfig,
  type PersistedState,
} from "redux-persist";

import { blockedStorage, themeStorage } from "./persist";
import { sanitizeBlockedState, sanitizeThemeState } from "./persist-recovery";
import blockedReducer, { type BlockedState } from "./slices/blockedSlice";
import themeReducer, { type ThemeState } from "./slices/themeSlice";

/** Shared redux-persist version for Blocked + Theme slices (bump on shape change). */
export const PERSIST_VERSION = 1;

function withPersistMeta<T extends object>(
  state: PersistedState,
  sanitized: T
): T & PersistedState {
  return {
    ...sanitized,
    _persist: state?._persist ?? { version: -1, rehydrated: false },
  };
}

const blockedPersistConfig: PersistConfig<BlockedState> = {
  key: "blocked",
  storage: blockedStorage,
  version: PERSIST_VERSION,
  migrate: (state) =>
    Promise.resolve(withPersistMeta(state, sanitizeBlockedState(state))),
};

const themePersistConfig: PersistConfig<ThemeState> = {
  key: "theme",
  storage: themeStorage,
  version: PERSIST_VERSION,
  migrate: (state) =>
    Promise.resolve(withPersistMeta(state, sanitizeThemeState(state))),
};

/** Test seam: blocked persist config with injectable storage (not the app singleton). */
export function createBlockedPersistConfig(
  storage: PersistConfig<BlockedState>["storage"]
): PersistConfig<BlockedState> {
  return {
    key: "blocked",
    storage,
    version: PERSIST_VERSION,
    // redux-persist's default 5s rehydrate watchdog is never cleared and
    // leaks a timer in Jest (`timeout && setTimeout(...)` in persistReducer).
    timeout: 0,
    migrate: (state) =>
      Promise.resolve(withPersistMeta(state, sanitizeBlockedState(state))),
  };
}

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
