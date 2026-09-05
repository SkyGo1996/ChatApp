import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import type { MMKV } from "react-native-mmkv";
import { createMMKV } from "react-native-mmkv";
import type { Storage } from "redux-persist";

import { parsePersistedThemeMode, type ThemeMode } from "./persist-recovery";

// Re-export ThemeMode for callers that imported from persist path historically
export type { ThemeMode };

// ---------------------------------------------------------------------------
// MMKV instances
// Blocked (encrypted) + Theme (plain) per techstack.md:51 / §7
// ---------------------------------------------------------------------------

let blockedMMKV: MMKV | null = null;
let themeMMKV: MMKV | null = null;

function getThemeMMKV(): MMKV {
  if (!themeMMKV) themeMMKV = createMMKV({ id: "theme-mmkv" });
  return themeMMKV;
}

function getBlockedMMKV(): MMKV {
  if (blockedMMKV) return blockedMMKV;
  // On web / where SecureStore unavailable, fallback to unencrypted
  // encryptionKey handling is async; for sync MMKV creation we defer key loading.
  blockedMMKV = createMMKV({ id: "blocked-mmkv" });
  return blockedMMKV;
}

// Async initializer for encrypted blocked storage. Called during boot before
// persist hydration. If SecureStore is available, re-creates MMKV with key.
export async function initBlockedStorage(): Promise<void> {
  try {
    let key = await SecureStore.getItemAsync("mmkv-key");
    if (!key) {
      // Spec: techstack §7 — encryptionKey via Crypto.getRandomBytes (hex for MMKV string key).
      // Do not rotate an existing SecureStore key — that would lock encrypted MMKV data.
      const bytes = Crypto.getRandomBytes(32);
      key = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
      await SecureStore.setItemAsync("mmkv-key", key);
    }
    try {
      blockedMMKV = createMMKV({ id: "blocked-mmkv-enc", encryptionKey: key });
    } catch {
      if (__DEV__)
        console.warn("[persist] MMKV encryption not supported, using plain");
      blockedMMKV = createMMKV({ id: "blocked-mmkv" });
    }
  } catch {
    if (__DEV__)
      console.warn(
        "[persist] SecureStore unavailable, blocked uses plain MMKV"
      );
    blockedMMKV = createMMKV({ id: "blocked-mmkv" });
  }
}

// ---------------------------------------------------------------------------
// redux-persist Storage adapter with corruption recovery
// ---------------------------------------------------------------------------

function createMMKVStorage(getMMKV: () => MMKV, label: string): Storage {
  return {
    getItem: (key: string): Promise<string | null> => {
      try {
        const raw = getMMKV().getString(key) ?? null;
        if (raw !== null) {
          try {
            JSON.parse(raw);
          } catch {
            if (__DEV__)
              console.warn(
                `[persist:${label}] corrupt JSON for ${key}, clearing`
              );
            getMMKV().remove(key);
            return Promise.resolve(null);
          }
        }
        return Promise.resolve(raw);
      } catch (e) {
        if (__DEV__) console.warn(`[persist:${label}] getItem error`, e);
        return Promise.resolve(null);
      }
    },
    setItem: (key: string, value: string): Promise<void> => {
      try {
        getMMKV().set(key, value);
      } catch (e) {
        if (__DEV__) console.warn(`[persist:${label}] setItem error`, e);
      }
      return Promise.resolve();
    },
    removeItem: (key: string): Promise<void> => {
      try {
        getMMKV().remove(key);
      } catch (e) {
        if (__DEV__) console.warn(`[persist:${label}] removeItem error`, e);
      }
      return Promise.resolve();
    },
  };
}

export const blockedStorage: Storage = createMMKVStorage(
  getBlockedMMKV,
  "blocked"
);
export const themeStorage: Storage = createMMKVStorage(getThemeMMKV, "theme");

/**
 * Sync read of persisted theme before redux-persist rehydration completes.
 * Parses nested persistoid (mode is JSON-stringified). Invalid → "system".
 */
export function getPersistedThemeModeSync(): ThemeMode {
  try {
    const raw = getThemeMMKV().getString("persist:theme");
    return parsePersistedThemeMode(raw ?? null);
  } catch {
    return "system";
  }
}

// Expose direct instances for debugging / future migrations
export function getRawBlockedMMKV(): MMKV {
  return getBlockedMMKV();
}
export function getRawThemeMMKV(): MMKV {
  return getThemeMMKV();
}
