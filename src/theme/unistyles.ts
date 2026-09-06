import { Appearance } from "react-native";
import { StyleSheet, UnistylesRuntime } from "react-native-unistyles";

import type { ThemeMode } from "@/features/settings/types";

import { darkTheme, lightTheme, type AppTheme } from "./themes";

declare module "react-native-unistyles" {
  interface UnistylesThemes {
    light: AppTheme;
    dark: AppTheme;
  }
  interface UnistylesBreakpoints {
    xs: number;
  }
}

StyleSheet.configure({
  settings: {
    adaptiveThemes: true,
  },
  themes: {
    light: lightTheme,
    dark: darkTheme,
  },
  breakpoints: {
    xs: 0,
  },
});

function rootBgForMode(mode: ThemeMode): string {
  if (mode === "light") return lightTheme.colors.bg;
  if (mode === "dark") return darkTheme.colors.bg;
  // colorScheme is a Unistyles enum-like; compare as string
  const scheme = String(UnistylesRuntime.colorScheme);
  if (scheme === "dark") return darkTheme.colors.bg;
  return lightTheme.colors.bg;
}

/**
 * Apply Theme Mode to Unistyles runtime.
 * system → adaptive OS following; light/dark → disable adaptive then setTheme.
 * Also sets root view background to avoid first-frame flash.
 * Syncs RN Appearance so iOS 26 Liquid Glass (tabs / back button) matches
 * forced Light/Dark instead of OS inherit; system uses 'unspecified'.
 * Safe to call before React tree mounts. Callers should not touch UnistylesRuntime.
 */
export function applyThemeMode(mode: ThemeMode): void {
  try {
    if (mode === "system") {
      UnistylesRuntime.setAdaptiveThemes(true);
      // 'unspecified' clears the RN override so OS appearance is followed again.
      Appearance.setColorScheme("unspecified");
    } else {
      UnistylesRuntime.setAdaptiveThemes(false);
      UnistylesRuntime.setTheme(mode);
      Appearance.setColorScheme(mode);
    }
    UnistylesRuntime.setRootViewBackgroundColor(rootBgForMode(mode));
  } catch (e) {
    if (__DEV__) console.warn("[theme] applyThemeMode failed", e);
  }
}
