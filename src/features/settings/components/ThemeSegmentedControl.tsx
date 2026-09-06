import { BlurView } from "expo-blur";
import {
  GlassView,
  isGlassEffectAPIAvailable,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import * as Haptics from "expo-haptics";
import { Platform, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { useReduceTransparency } from "@/hooks/useReduceTransparency";
import { glassColorScheme } from "@/theme/recipes";

import {
  THEME_MODE_TO_INDEX,
  THEME_VALUES,
  THEME_VALUE_TO_MODE,
} from "../constants";
import { useThemeMode } from "../hooks/useThemeMode";

// Native cross-platform segmented control (iOS: UISegmentedControl via SwiftUI Picker, Android: Material SingleChoiceRow)
import { SegmentedControl } from "@expo/ui/community/segmented-control";

export function ThemeSegmentedControl() {
  const { mode, setMode } = useThemeMode();
  const reduceTransparency = useReduceTransparency();
  const { theme } = useUnistyles();

  const selectedIndex = THEME_MODE_TO_INDEX[mode] ?? 0;

  const handleValueChange = (value: string) => {
    const next = THEME_VALUE_TO_MODE[value];
    if (!next || next === mode) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(next);
  };

  // Platform-adaptive pill track: iOS glass pill vs Android tonal surface-container pill
  // iOS respects Reduce Transparency; Android always solid tonal (no blur, no glassBorder)
  if (Platform.OS === "android") {
    return (
      <View
        style={[
          styles.pillAndroid,
          {
            backgroundColor: theme.colors.surface2,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.full,
          },
        ]}
        accessibilityLabel="Theme selector"
        testID="theme-segment-android-wrap">
        <SegmentedControl
          values={[...THEME_VALUES]}
          selectedIndex={selectedIndex}
          onValueChange={handleValueChange}
          tintColor={theme.colors.primary}
          testID="theme-segmented-control"
          style={styles.segment}
        />
      </View>
    );
  }

  // iOS
  const canGlass =
    !reduceTransparency &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable();

  // Host fill covers native empty-effect dark frame; never opaque-fill GlassView.
  const iosBorder = {
    borderColor: theme.colors.glassBorder,
    borderWidth: 0.5,
    borderRadius: theme.radius.full,
  };
  const hostFill = {
    backgroundColor: theme.colors.glassBg,
    borderRadius: theme.radius.full,
  };

  if (canGlass) {
    return (
      <View
        style={[styles.glassHost, theme.shadow, hostFill]}
        testID="theme-segment-ios-glass-host">
        <GlassView
          style={[styles.pillIOS, iosBorder]}
          tintColor={theme.colors.glassTint}
          colorScheme={glassColorScheme(theme)}
          glassEffectStyle="regular">
          <SegmentedControl
            values={[...THEME_VALUES]}
            selectedIndex={selectedIndex}
            onValueChange={handleValueChange}
            tintColor={theme.colors.primary}
            testID="theme-segmented-control"
            style={styles.segment}
          />
        </GlassView>
      </View>
    );
  }

  if (!reduceTransparency) {
    return (
      <View
        style={[styles.glassHost, theme.shadow, hostFill]}
        testID="theme-segment-ios-blur-host">
        <BlurView
          intensity={theme.blur.full}
          tint="default"
          style={[
            styles.pillIOS,
            iosBorder,
            hostFill,
            { overflow: "hidden" as const },
          ]}>
          <SegmentedControl
            values={[...THEME_VALUES]}
            selectedIndex={selectedIndex}
            onValueChange={handleValueChange}
            tintColor={theme.colors.primary}
            testID="theme-segmented-control"
            style={styles.segment}
          />
        </BlurView>
      </View>
    );
  }

  // Reduce Transparency fallback — solid tonal (no glass, no blur)
  return (
    <View
      style={[
        styles.pillIOS,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderWidth: 1,
          borderRadius: theme.radius.full,
        },
      ]}
      testID="theme-segment-ios-solid-wrap">
      <SegmentedControl
        values={[...THEME_VALUES]}
        selectedIndex={selectedIndex}
        onValueChange={handleValueChange}
        tintColor={theme.colors.primary}
        testID="theme-segmented-control"
        style={styles.segment}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  pillAndroid: {
    borderWidth: 1,
    elevation: 2,
    minHeight: 44,
    justifyContent: "center",
    padding: 2,
  },
  pillIOS: {
    minHeight: 44,
    justifyContent: "center",
    padding: 2,
  },
  glassHost: {
    borderRadius: theme.radius.full,
  },
  segment: {
    flex: 1,
  },
}));
