import type { NativeStackNavigationOptions } from "expo-router/build/react-navigation/native-stack/types";
import { useMemo } from "react";
import { Platform } from "react-native";
import { useUnistyles } from "react-native-unistyles";

import { chromeHeader } from "./recipes";
import type { AppTheme } from "./themes";

/**
 * Native Stack header options that follow Unistyles theme.
 * Central seam for Option A — all native headers must derive from this.
 *
 * headerStyle only accepts backgroundColor on native stack (expo-router docs).
 * Do NOT set headerBlurEffect — iOS 26+ scrollEdgeEffects (automatic) handles
 * blur reveal on scroll. Setting blurEffect alongside scrollEdgeEffects causes
 * "[RNScreens] Using both `blurEffect` and `scrollEdgeEffects` simultaneously
 * may cause overlapping effects" and double-blur.
 */
export type ThemedStackOptions = Pick<
  NativeStackNavigationOptions,
  | "headerStyle"
  | "headerTintColor"
  | "headerTitleStyle"
  | "headerShadowVisible"
  | "headerTransparent"
  | "headerBlurEffect"
  | "contentStyle"
>;

export function themedStackOptions(
  theme: AppTheme,
  opts?: { transparent?: boolean }
): ThemedStackOptions {
  const transparent = opts?.transparent ?? false;
  const isIOS = Platform.OS === "ios";
  const chrome = chromeHeader(theme);

  // Opaque headers: solid surface (chromeHeader => surface on Android, glassBg on iOS).
  // For iOS opaque we prefer surface (solid) so dark/light is crisp; chromeHeader
  // on iOS would be semi-transparent glassBg which is indistinct as native header bg.
  // Keep chrome's elevation for shadow visibility.
  // headerBlurEffect intentionally omitted (undefined) — iOS 26+ scrollEdgeEffects
  // is automatic; setting blurEffect triggers RNScreens double-blur warning.
  if (transparent && isIOS) {
    return {
      headerTransparent: true,
      headerStyle: { backgroundColor: "transparent" },
      headerTintColor: theme.colors.text,
      headerTitleStyle: { color: theme.colors.text },
      headerShadowVisible: false,
      headerBlurEffect: undefined,
      contentStyle: { backgroundColor: theme.colors.bg },
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
    contentStyle: { backgroundColor: theme.colors.bg },
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
