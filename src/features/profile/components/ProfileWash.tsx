import { BlurView } from "expo-blur";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { type ReactNode } from "react";
import { Platform, View, type StyleProp, type ViewStyle } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { useReduceTransparency } from "@/hooks/useReduceTransparency";
import { chromeSheet, glassColorScheme } from "@/theme/recipes";

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Platform-adaptive wash for Profile cards / Block row.
 * Android tonal → Liquid Glass → BlurView → solid (Reduce Transparency).
 */
export function ProfileWash({ children, style }: Props) {
  const { theme } = useUnistyles();
  const reduceTransparency = useReduceTransparency();
  const chrome = chromeSheet(theme);

  if (Platform.OS === "android") {
    return <View style={[style, styles.chromeAndroid]}>{children}</View>;
  }

  const canGlass =
    !reduceTransparency &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable();

  // Host fill covers native empty-effect dark frame; never opaque-fill GlassView.
  if (canGlass) {
    return (
      <View style={[styles.glassHost, styles.hostFill]}>
        <GlassView
          style={[style, styles.iosBorder]}
          tintColor={theme.colors.glassTint}
          colorScheme={glassColorScheme(theme)}
          glassEffectStyle="regular">
          {children}
        </GlassView>
      </View>
    );
  }

  if (!reduceTransparency && chrome.useGlass) {
    return (
      <View style={[styles.glassHost, styles.hostFill]}>
        <BlurView
          intensity={chrome.blurRadius ?? theme.blur.full}
          tint="default"
          style={[style, styles.blurFill]}>
          {children}
        </BlurView>
      </View>
    );
  }

  return <View style={[style, styles.chromeSolid]}>{children}</View>;
}

const styles = StyleSheet.create((theme) => {
  const chrome = chromeSheet(theme);
  return {
    glassHost: {
      borderRadius: theme.radius.lg,
    },
    hostFill: {
      backgroundColor: chrome.backgroundColor,
    },
    iosBorder: {
      borderColor: chrome.borderColor,
      borderWidth: chrome.borderWidth,
    },
    blurFill: {
      backgroundColor: chrome.backgroundColor,
      borderColor: chrome.borderColor,
      borderWidth: chrome.borderWidth,
      overflow: "hidden" as const,
    },
    chromeAndroid: {
      backgroundColor: chrome.backgroundColor,
      borderColor: chrome.borderColor,
      borderWidth: chrome.borderWidth,
      elevation: chrome.elevation,
    },
    chromeSolid: {
      backgroundColor: chrome.backgroundColor,
      borderColor: theme.colors.border,
      borderWidth: 1,
    },
  };
});
