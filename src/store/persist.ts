import * as SecureStore from "expo-secure-store";
import { createMMKV } from "react-native-mmkv";
import type { MMKV } from "react-native-mmkv";
import type { Storage } from "redux-persist";

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
      const random = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
      key = random;
      await SecureStore.setItemAsync("mmkv-key", key);
    }
    try {
      blockedMMKV = createMMKV({ id: "blocked-mmkv-enc", encryptionKey: key });
    } catch {
      if (__DEV__) console.warn("[persist] MMKV encryption not supported, using plain");
      blockedMMKV = createMMKV({ id: "blocked-mmkv" });
    }
  } catch {
    if (__DEV__) console.warn("[persist] SecureStore unavailable, blocked uses plain MMKV");
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
            if (__DEV__) console.warn(`[persist:${label}] corrupt JSON for ${key}, clearing`);
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

export const blockedStorage: Storage = createMMKVStorage(getBlockedMMKV, "blocked");
export const themeStorage: Storage = createMMKVStorage(getThemeMMKV, "theme");

// Expose direct instances for debugging / future migrations
export function getRawBlockedMMKV(): MMKV {
  return getBlockedMMKV();
}
export function getRawThemeMMKV(): MMKV {
  return getThemeMMKV();
}
