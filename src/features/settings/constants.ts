import type { ThemeMode } from "./types";

/**
 * Hard-coded Current User `me` — no API call, no fetch.
 * id 999 is outside mock 1–60 range per spec.
 */
export const ME = {
  id: "999",
  name: "You",
  phone: "+1-202-555-0199",
  avatar: null as string | null,
} as const;

export const APP_VERSION_FALLBACK = "1.0.0" as const;

export const THEME_VALUES = ["System", "Light", "Dark"] as const;

export const THEME_VALUE_TO_MODE: Record<string, ThemeMode> = {
  System: "system",
  Light: "light",
  Dark: "dark",
};

export const THEME_MODE_TO_INDEX: Record<ThemeMode, number> = {
  system: 0,
  light: 1,
  dark: 2,
};
