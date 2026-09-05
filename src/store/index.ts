import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { persistReducer, persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from "redux-persist";

import { blockedStorage, themeStorage } from "./persist";
import blockedReducer from "./slices/blockedSlice";
import themeReducer from "./slices/themeSlice";

const blockedPersistConfig = {
  key: "blocked",
  storage: blockedStorage,
  version: 1,
  migrate: (state: unknown) => Promise.resolve(state as never),
};

const themePersistConfig = {
  key: "theme",
  storage: themeStorage,
  version: 1,
  migrate: (state: unknown) => Promise.resolve(state as never),
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

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
