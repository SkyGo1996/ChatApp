import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import type { MMKV } from "react-native-mmkv";
import { createMMKV } from "react-native-mmkv";
import type { Storage } from "redux-persist";

import { parsePersistedThemeMode, type ThemeMode } from "./persist-recovery";

// Re-export ThemeMode for callers that imported from persist path historically
export type { ThemeMode };

export const MMKV_KEY_SECURE_STORE = "mmkv-key";
/** AES-256 requires exactly 32 bytes (UTF-8 / ASCII length). */
export const MMKV_AES256_KEY_BYTES = 32;

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

/** Printable ASCII alphabet (64 chars) — one byte → one char, key length === byte count. */
const ASCII_KEY_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/**
 * Map cryptographically random bytes to a fixed-length ASCII key.
 * MMKV AES-256 requires the encryptionKey string to be exactly 32 bytes UTF-8.
 */
export function bytesToAsciiKey(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => ASCII_KEY_ALPHABET[b % 64]!).join("");
}

/** Valid AES-256 MMKV key: exactly 32 ASCII (single-byte) characters. */
export function isValidAes256Key(key: string): boolean {
  if (key.length !== MMKV_AES256_KEY_BYTES) return false;
  for (let i = 0; i < key.length; i++) {
    const code = key.charCodeAt(i);
    if (code > 0x7f) return false;
  }
  return true;
}

function createPlainBlockedMMKV(): MMKV {
  return createMMKV({ id: "blocked-mmkv" });
}

function createEncryptedBlockedMMKV(encryptionKey: string): MMKV {
  return createMMKV({
    id: "blocked-mmkv-enc",
    encryptionKey,
    encryptionType: "AES-256",
  });
}

/**
 * Async initializer for encrypted blocked storage. Called during boot before
 * persist hydration. If SecureStore is available, re-creates MMKV with key.
 *
 * Key contract (react-native-mmkv v4):
 * - AES-256 → encryptionKey must be exactly 32 bytes
 * - Do not rotate a valid existing SecureStore key (would lock encrypted data)
 * - Legacy 64-char hex keys are invalid → regenerate (they never encrypted successfully)
 */
export async function initBlockedStorage(): Promise<void> {
  try {
    const available = await SecureStore.isAvailableAsync();
    if (!available) {
      if (__DEV__)
        console.warn(
          "[persist] SecureStore unavailable, blocked uses plain MMKV"
        );
      blockedMMKV = createPlainBlockedMMKV();
      return;
    }

    let key = await SecureStore.getItemAsync(MMKV_KEY_SECURE_STORE);
    if (!key || !isValidAes256Key(key)) {
      // Spec: techstack §7 — encryptionKey via Crypto.getRandomBytes.
      // Invalid/legacy keys (e.g. 64-char hex) never worked with MMKV AES — regenerate.
      const bytes = Crypto.getRandomBytes(MMKV_AES256_KEY_BYTES);
      key = bytesToAsciiKey(bytes);
      await SecureStore.setItemAsync(MMKV_KEY_SECURE_STORE, key);
    }

    try {
      blockedMMKV = createEncryptedBlockedMMKV(key);
    } catch {
      if (__DEV__)
        console.warn("[persist] MMKV encryption not supported, using plain");
      blockedMMKV = createPlainBlockedMMKV();
    }
  } catch {
    if (__DEV__)
      console.warn(
        "[persist] SecureStore unavailable, blocked uses plain MMKV"
      );
    blockedMMKV = createPlainBlockedMMKV();
  }
}

/** Test seam: reset module MMKV refs so initBlockedStorage can re-run cleanly. */
export function __resetBlockedMMKVForTests(): void {
  blockedMMKV = null;
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

// Expose direct instances for debugging / tests
export function getRawBlockedMMKV(): MMKV {
  return getBlockedMMKV();
}
export function getRawThemeMMKV(): MMKV {
  return getThemeMMKV();
}
