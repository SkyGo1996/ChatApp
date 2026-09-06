import { configureStore } from "@reduxjs/toolkit";
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

import { createMemoryStorage } from "@/test-utils";

import { createBlockedPersistConfig, PERSIST_VERSION } from "./index";
import blockedReducer, {
  blockContact,
  isContactBlocked,
} from "./slices/blockedSlice";

function waitForRehydrate(
  persistor: ReturnType<typeof persistStore>
): Promise<void> {
  return new Promise((resolve) => {
    if (persistor.getState().bootstrapped) {
      resolve();
      return;
    }
    const unsub = persistor.subscribe(() => {
      if (persistor.getState().bootstrapped) {
        unsub();
        resolve();
      }
    });
  });
}

function createPersistedBlockedStore(
  storage: ReturnType<typeof createMemoryStorage>
) {
  const reducer = persistReducer(
    createBlockedPersistConfig(storage),
    blockedReducer
  );
  const store = configureStore({
    reducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }),
  });
  const persistor = persistStore(store);
  return { store, persistor, storage };
}

function parsePersistoid(raw: string): {
  blockedIds: Record<string, unknown>;
  version: number;
} {
  const outer: unknown = JSON.parse(raw);
  if (outer === null || typeof outer !== "object") {
    throw new Error("persistoid must be an object");
  }
  const record = outer as Record<string, unknown>;
  const blockedIdsField = record.blockedIds;
  const persistField = record._persist;
  if (typeof blockedIdsField !== "string" || typeof persistField !== "string") {
    throw new Error("persistoid fields must be JSON strings");
  }
  const blockedIds: unknown = JSON.parse(blockedIdsField);
  const meta: unknown = JSON.parse(persistField);
  if (
    blockedIds === null ||
    typeof blockedIds !== "object" ||
    meta === null ||
    typeof meta !== "object"
  ) {
    throw new Error("persistoid nested parse failed");
  }
  const version = (meta as { version?: unknown }).version;
  if (typeof version !== "number") {
    throw new Error("persistoid missing version");
  }
  return {
    blockedIds: blockedIds as Record<string, unknown>,
    version,
  };
}

describe("blocked versioned persist", () => {
  const persistors: ReturnType<typeof persistStore>[] = [];

  afterEach(() => {
    for (const p of persistors) {
      p.pause();
    }
    persistors.length = 0;
  });

  test("PERSIST_VERSION is 1", () => {
    expect(PERSIST_VERSION).toBe(1);
  });

  test("test persist config disables redux-persist rehydrate watchdog", () => {
    const config = createBlockedPersistConfig(createMemoryStorage());
    expect(config.timeout).toBe(0);
  });

  test("blockContact persists with version 1 and rehydrates", async () => {
    const storage = createMemoryStorage();
    const first = createPersistedBlockedStore(storage);
    persistors.push(first.persistor);
    await waitForRehydrate(first.persistor);

    first.store.dispatch(blockContact(42));
    await first.persistor.flush();

    const rawUnknown: unknown = await storage.getItem("persist:blocked");
    expect(typeof rawUnknown).toBe("string");
    if (typeof rawUnknown !== "string") return;

    const { blockedIds, version } = parsePersistoid(rawUnknown);
    expect(version).toBe(PERSIST_VERSION);
    expect(blockedIds["42"]).toBe(true);

    // Second store rehydrates Blocked Contact
    const second = createPersistedBlockedStore(storage);
    persistors.push(second.persistor);
    await waitForRehydrate(second.persistor);

    expect(isContactBlocked(second.store.getState(), 42)).toBe(true);
    expect(isContactBlocked(second.store.getState(), "42")).toBe(true);
  });

  test("migrate strips unknown keys and invalid entries → Contact unblocked", async () => {
    // Persistoid shape: each field is JSON-stringified
    const dirty = JSON.stringify({
      blockedIds: JSON.stringify({
        "1": true,
        "2": false,
        "3": "yes",
      }),
      extraField: JSON.stringify({ leak: true }),
      _persist: JSON.stringify({ version: PERSIST_VERSION, rehydrated: true }),
    });
    const storage = createMemoryStorage({ "persist:blocked": dirty });
    const { store, persistor } = createPersistedBlockedStore(storage);
    persistors.push(persistor);
    await waitForRehydrate(persistor);

    const state = store.getState();
    expect(isContactBlocked(state, "1")).toBe(true);
    expect(isContactBlocked(state, "2")).toBe(false);
    expect(isContactBlocked(state, "3")).toBe(false);
    expect("extraField" in state).toBe(false);
  });

  test("corrupt persistoid shape hydrates to empty (all Contacts unblocked)", async () => {
    const dirty = JSON.stringify({
      blockedIds: JSON.stringify(["not", "a", "map"]),
      _persist: JSON.stringify({ version: PERSIST_VERSION, rehydrated: true }),
    });
    const storage = createMemoryStorage({ "persist:blocked": dirty });
    const { store, persistor } = createPersistedBlockedStore(storage);
    persistors.push(persistor);
    await waitForRehydrate(persistor);

    expect(store.getState().blockedIds).toEqual({});
    expect(isContactBlocked(store.getState(), "1")).toBe(false);
  });
});
