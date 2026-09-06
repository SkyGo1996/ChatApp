import { DarkTheme, DefaultTheme, type Theme } from "expo-router";
import type { NativeStackNavigationOptions } from "expo-router/build/react-navigation/native-stack/types";
import { useMemo } from "react";
import { Platform } from "react-native";
import { useUnistyles } from "react-native-unistyles";

import { chromeHeader, glassColorScheme } from "./recipes";
import { darkTheme, type AppTheme } from "./themes";

/**
 * Native Stack header options that follow Unistyles theme.
 * Central seam for Option A — all native headers must derive from this.
 *
 * headerStyle only accepts backgroundColor on native stack (expo-router docs).
 *
 * Transparent chat headers:
 * - iOS 26+: omit headerBlurEffect — scrollEdgeEffects (automatic) supplies
 *   Liquid Glass. Setting blurEffect alongside scrollEdgeEffects causes
 *   "[RNScreens] Using both `blurEffect` and `scrollEdgeEffects` simultaneously
 *   may cause overlapping effects" and double-blur.
 * - iOS 18 and earlier: set headerBlurEffect to systemChromeMaterial — without
 *   it, headerTransparent is a clear overlay (messages show through).
 */

/** Liquid Glass / scrollEdgeEffects exist only on iOS 26+. */
export function isIOS26OrLater(): boolean {
  return Platform.OS === "ios" && Number(Platform.Version) >= 26;
}
export type ThemedStackOptions = Pick<
  NativeStackNavigationOptions,
  | "headerStyle"
  | "headerTintColor"
  | "headerTitleStyle"
  | "headerShadowVisible"
  | "headerTransparent"
  | "headerBlurEffect"
  | "headerBackButtonDisplayMode"
  | "contentStyle"
  | "unstable_nativeProps"
>;

/**
 * React Navigation theme mapped from Unistyles tokens.
 * Required so NativeTabs / Liquid Glass scene backgrounds follow app SOT
 * (`theme.colors.bg`) instead of DefaultTheme white (`rgb(242,242,247)`),
 * which flashes on iOS 26 tab switches.
 */
export function navigationTheme(theme: AppTheme, isDark: boolean): Theme {
  const base = isDark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: isDark,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.bg,
      card: theme.colors.surface,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.destructive,
    },
  };
}

export function useNavigationTheme(): Theme {
  const { theme, rt } = useUnistyles();
  const themeName = (rt as { themeName?: string }).themeName;
  const isDark =
    themeName === "dark" || theme.colors.bg === darkTheme.colors.bg;
  return useMemo(() => navigationTheme(theme, isDark), [theme, isDark]);
}

function headerNativeProps(
  theme: AppTheme
): ThemedStackOptions["unstable_nativeProps"] {
  // Pin iOS 26 Liquid Glass back-button / header chrome to Unistyles, not OS
  // inherit — avoids dark→light flash when app theme ≠ system appearance.
  return {
    headerConfig: {
      experimental_userInterfaceStyle: glassColorScheme(theme),
    },
  };
}

export function themedStackOptions(
  theme: AppTheme,
  opts?: { transparent?: boolean }
): ThemedStackOptions {
  const transparent = opts?.transparent ?? false;
  const isIOS = Platform.OS === "ios";
  const chrome = chromeHeader(theme);
  const nativeProps = isIOS ? headerNativeProps(theme) : undefined;

  // Opaque headers: solid surface (chromeHeader => surface on Android, glassBg on iOS).
  // For iOS opaque we prefer surface (solid) so dark/light is crisp; chromeHeader
  // on iOS would be semi-transparent glassBg which is indistinct as native header bg.
  // Keep chrome's elevation for shadow visibility.
  if (transparent && isIOS) {
    // Pre-26: frosted material. iOS 26+: leave undefined for scrollEdgeEffects.
    const headerBlurEffect = isIOS26OrLater()
      ? undefined
      : ("systemChromeMaterial" as const);
    return {
      headerTransparent: true,
      headerStyle: { backgroundColor: "transparent" },
      headerTintColor: theme.colors.text,
      headerTitleStyle: { color: theme.colors.text },
      headerShadowVisible: false,
      headerBlurEffect,
      // Global default: chevron only, no back-title label (iOS; Android
      // back arrow shows no label regardless).
      headerBackButtonDisplayMode: "minimal",
      contentStyle: { backgroundColor: theme.colors.bg },
      ...(nativeProps ? { unstable_nativeProps: nativeProps } : {}),
    };
  }

  return {
    headerTransparent: false,
    // Prefer theme.colors.surface for opaque headers; fall back to chrome colour
    headerStyle: {
      backgroundColor: theme.colors.surface ?? chrome.backgroundColor,
    },
    headerTintColor: theme.colors.text,
    headerTitleStyle: { color: theme.colors.text },
    headerShadowVisible: chrome.elevation > 0,
    headerBlurEffect: undefined,
    // Global default: chevron only, no back-title label (iOS; Android
    // back arrow shows no label regardless).
    headerBackButtonDisplayMode: "minimal",
    contentStyle: { backgroundColor: theme.colors.bg },
    ...(nativeProps ? { unstable_nativeProps: nativeProps } : {}),
  };
}

export function useThemedStackOptions(opts?: {
  transparent?: boolean;
}): ThemedStackOptions {
  const { theme } = useUnistyles();
  const transparent = opts?.transparent;
  return useMemo(
    () =>
      themedStackOptions(
        theme,
        transparent === undefined ? undefined : { transparent }
      ),
    [theme, transparent]
  );
}
