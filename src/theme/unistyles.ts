import { StyleSheet, UnistylesRuntime } from "react-native-unistyles";

import type { ThemeMode } from "@/store/slices/themeSlice";
import { darkTheme, lightTheme } from "./themes";

declare module "react-native-unistyles" {
  interface UnistylesThemes {
    light: typeof lightTheme;
    dark: typeof darkTheme;
  }
  interface UnistylesBreakpoints {
    xs: number;
    sm: number;
    md: number;
    lg: number;
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
    sm: 375,
    md: 768,
    lg: 1024,
  },
});

export function applyThemeMode(mode: ThemeMode): void {
  // Per unistyl.es/v3/guides/theming: Toggle adaptive themes via UnistylesRuntime.
  // Must disable adaptive before manual setTheme; re-enable for system.
  // Safe to call before React tree mounts.
  try {
    if (mode === "system") {
      UnistylesRuntime.setAdaptiveThemes(true);
    } else {
      UnistylesRuntime.setAdaptiveThemes(false);
      UnistylesRuntime.setTheme(mode);
    }
  } catch (e) {
    if (__DEV__) console.warn("[theme] applyThemeMode failed", e);
  }
}
