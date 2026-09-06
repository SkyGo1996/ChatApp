import { Platform } from "react-native";

import { darkTheme, type AppTheme } from "./themes";

/**
 * Platform chrome surface recipe — identical layout keys for iOS Liquid Glass
 * vs Android M3 Expressive tonal surfaces. Ticket 13 GlassBar/GlassSheet consume these.
 *
 * Android never emits glassBorder / glassBg / blur.
 */

export type ChromeRecipe = {
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  /** Android elevation; 0 on iOS (use theme.shadow instead). */
  elevation: number;
  /** Whether iOS should apply blur / glass effect. Always false on Android. */
  useGlass: boolean;
  /** iOS blur radius hint; undefined on Android. */
  blurRadius?: number;
};

/**
 * Explicit GlassView colorScheme from Unistyles theme (not system `auto`).
 * Avoids dark→light flash when OS appearance ≠ in-app theme.
 */
export function glassColorScheme(theme: AppTheme): "light" | "dark" {
  return theme.colors.bg === darkTheme.colors.bg ? "dark" : "light";
}

function isIOS(): boolean {
  return Platform.OS === "ios";
}

/** Shared iOS Liquid Glass chrome shape (identical across bar/header/composer/sheet/fab). */
function iosGlassChrome(theme: AppTheme): ChromeRecipe {
  return {
    backgroundColor: theme.colors.glassBg,
    borderColor: theme.colors.glassBorder,
    borderWidth: 0.5,
    elevation: 0,
    useGlass: true,
    blurRadius: theme.blur.full,
  };
}

/** Shared Android tonal chrome — background + elevation vary per surface. */
function androidTonalChrome(
  backgroundColor: string,
  elevation: number,
  theme: AppTheme
): ChromeRecipe {
  return {
    backgroundColor,
    borderColor: theme.colors.border,
    borderWidth: 1,
    elevation,
    useGlass: false,
  };
}

/** Floating pill tab bar. */
export function chromeBar(theme: AppTheme): ChromeRecipe {
  if (isIOS()) return iosGlassChrome(theme);
  return androidTonalChrome(theme.colors.surface2, 2, theme);
}

/** Chat / screen header. */
export function chromeHeader(theme: AppTheme): ChromeRecipe {
  if (isIOS()) return iosGlassChrome(theme);
  return androidTonalChrome(
    theme.colors.surface,
    theme.elevation.elevation,
    theme
  );
}

/** Floating composer pill. */
export function chromeComposer(theme: AppTheme): ChromeRecipe {
  if (isIOS()) {
    return {
      ...iosGlassChrome(theme),
      // `inputBg` (not `glassBg`) so the overlay well stays distinct from chat `bg`.
      backgroundColor: theme.colors.inputBg,
    };
  }
  return androidTonalChrome(theme.colors.surface, 2, theme);
}

/** Action / Block sheet. */
export function chromeSheet(theme: AppTheme): ChromeRecipe {
  if (isIOS()) return iosGlassChrome(theme);
  return androidTonalChrome(theme.colors.surface3, 3, theme);
}

/** Scroll-to-bottom FAB. */
export function chromeFab(theme: AppTheme): ChromeRecipe {
  if (isIOS()) return iosGlassChrome(theme);
  return androidTonalChrome(theme.colors.surface3, 3, theme);
}
