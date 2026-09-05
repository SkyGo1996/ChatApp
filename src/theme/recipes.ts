import { Platform } from "react-native";

import type { AppTheme } from "./themes";

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

function isIOS(): boolean {
  return Platform.OS === "ios";
}

/** Floating pill tab bar. */
export function chromeBar(theme: AppTheme): ChromeRecipe {
  if (isIOS()) {
    return {
      backgroundColor: theme.colors.glassBg,
      borderColor: theme.colors.glassBorder,
      borderWidth: 0.5,
      elevation: 0,
      useGlass: true,
      blurRadius: theme.blur.full,
    };
  }
  return {
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
    borderWidth: 1,
    elevation: 2,
    useGlass: false,
  };
}

/** Chat / screen header. */
export function chromeHeader(theme: AppTheme): ChromeRecipe {
  if (isIOS()) {
    return {
      backgroundColor: theme.colors.glassBg,
      borderColor: theme.colors.glassBorder,
      borderWidth: 0.5,
      elevation: 0,
      useGlass: true,
      blurRadius: theme.blur.full,
    };
  }
  return {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    elevation: theme.elevation.elevation,
    useGlass: false,
  };
}

/** Floating composer pill. */
export function chromeComposer(theme: AppTheme): ChromeRecipe {
  if (isIOS()) {
    return {
      backgroundColor: theme.colors.glassBg,
      borderColor: theme.colors.glassBorder,
      borderWidth: 0.5,
      elevation: 0,
      useGlass: true,
      blurRadius: theme.blur.full,
    };
  }
  return {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    elevation: 2,
    useGlass: false,
  };
}

/** Action / Block sheet. */
export function chromeSheet(theme: AppTheme): ChromeRecipe {
  if (isIOS()) {
    return {
      backgroundColor: theme.colors.glassBg,
      borderColor: theme.colors.glassBorder,
      borderWidth: 0.5,
      elevation: 0,
      useGlass: true,
      blurRadius: theme.blur.full,
    };
  }
  return {
    backgroundColor: theme.colors.surface3,
    borderColor: theme.colors.border,
    borderWidth: 1,
    elevation: 3,
    useGlass: false,
  };
}

/** Scroll-to-bottom FAB. */
export function chromeFab(theme: AppTheme): ChromeRecipe {
  if (isIOS()) {
    return {
      backgroundColor: theme.colors.glassBg,
      borderColor: theme.colors.glassBorder,
      borderWidth: 0.5,
      elevation: 0,
      useGlass: true,
      blurRadius: theme.blur.full,
    };
  }
  return {
    backgroundColor: theme.colors.surface3,
    borderColor: theme.colors.border,
    borderWidth: 1,
    elevation: 3,
    useGlass: false,
  };
}
