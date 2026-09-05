import type { ThemeMode } from "@/features/settings/types";

import type { BlockedState } from "./slices/blockedSlice";
import type { ThemeState } from "./slices/themeSlice";

export type { ThemeMode };

/**
 * Pure sanitizers for versioned persist migrate + corruption recovery.
 * Never throw — invalid input resets to initial state shape.
 */

const VALID_THEME_MODES = new Set<ThemeMode>(["system", "light", "dark"]);

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === "string" && VALID_THEME_MODES.has(value as ThemeMode);
}

/**
 * Strip unknown keys; invalid mode → system.
 */
export function sanitizeThemeState(raw: unknown): ThemeState {
  if (raw === null || typeof raw !== "object") {
    return { mode: "system" };
  }
  const mode = (raw as { mode?: unknown }).mode;
  return { mode: isThemeMode(mode) ? mode : "system" };
}

/**
 * Strip unknown keys; non-object / invalid map → {}.
 * Only keep entries whose value is exactly `true`.
 */
export function sanitizeBlockedState(raw: unknown): BlockedState {
  if (raw === null || typeof raw !== "object") {
    return { blockedIds: {} };
  }
  const blockedIdsRaw = (raw as { blockedIds?: unknown }).blockedIds;
  if (
    blockedIdsRaw === null ||
    typeof blockedIdsRaw !== "object" ||
    Array.isArray(blockedIdsRaw)
  ) {
    return { blockedIds: {} };
  }
  const blockedIds: Record<string, true> = {};
  for (const [key, value] of Object.entries(
    blockedIdsRaw as Record<string, unknown>
  )) {
    if (value === true) {
      blockedIds[key] = true;
    }
  }
  return { blockedIds };
}

/**
 * Parse redux-persist persistoid for theme.
 * Persist stores: `{ mode: "\"light\"", _persist: "..." }` — mode is JSON-stringified.
 */
export function parsePersistedThemeMode(raw: string | null): ThemeMode {
  if (!raw) return "system";
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed === null || typeof parsed !== "object") return "system";
    const modeField = (parsed as { mode?: unknown }).mode;
    // Persistoid: mode is a JSON-encoded string, e.g. "\"dark\""
    if (typeof modeField === "string") {
      try {
        const inner = JSON.parse(modeField) as unknown;
        if (isThemeMode(inner)) return inner;
      } catch {
        // Maybe stored bare (non-persistoid) — accept if already a ThemeMode
        if (isThemeMode(modeField)) return modeField;
      }
    }
    if (isThemeMode(modeField)) return modeField;
    return "system";
  } catch {
    return "system";
  }
}
