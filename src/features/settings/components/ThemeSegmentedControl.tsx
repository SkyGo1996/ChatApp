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
} from "@/features/settings/constants";
import { useThemeMode } from "@/features/settings/hooks/useThemeMode";

// iOS: community drop-in (SwiftUI segmented Picker). Android: Compose SegmentedButton
// so we can set activeContentColor — community only maps tintColor → activeContainerColor.
import { SegmentedControl } from "@expo/ui/community/segmented-control";
import {
  Text as ComposeText,
  Host,
  SegmentedButton,
  SingleChoiceSegmentedButtonRow,
} from "@expo/ui/jetpack-compose";

/** Selected segment label on primary — matches me-bubble / Retry contrast. */
const SELECTED_SEGMENT_TEXT = "#FFFFFF";

export function ThemeSegmentedControl() {
  const { mode, setMode } = useThemeMode();
  const reduceTransparency = useReduceTransparency();
  const { theme } = useUnistyles();
  // Follow in-app theme (not OS) so Compose/SwiftUI Host text colors stay readable.
  const appearance = glassColorScheme(theme);

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
        style={styles.pillAndroid}
        accessibilityLabel="Theme selector"
        testID="theme-segment-android-wrap">
        <View style={styles.segment} testID="theme-segmented-control">
          <Host
            matchContents={{ vertical: true }}
            colorScheme={appearance}
            style={styles.segment}>
            <SingleChoiceSegmentedButtonRow>
              {THEME_VALUES.map((label, index) => (
                <SegmentedButton
                  key={label}
                  selected={index === selectedIndex}
                  onClick={() => handleValueChange(label)}
                  colors={{
                    activeContainerColor: theme.colors.primary,
                    activeContentColor: SELECTED_SEGMENT_TEXT,
                    inactiveContentColor: theme.colors.text,
                  }}>
                  <SegmentedButton.Label>
                    <ComposeText>{label}</ComposeText>
                  </SegmentedButton.Label>
                </SegmentedButton>
              ))}
            </SingleChoiceSegmentedButtonRow>
          </Host>
        </View>
      </View>
    );
  }

  // iOS
  const canGlass =
    !reduceTransparency &&
    isLiquidGlassAvailable() &&
    isGlassEffectAPIAvailable();

  if (canGlass) {
    return (
      <View
        style={[styles.glassHost, theme.shadow]}
        testID="theme-segment-ios-glass-host">
        <GlassView
          style={[styles.pillIOS, styles.iosBorder]}
          tintColor={theme.colors.glassTint}
          colorScheme={appearance}
          glassEffectStyle="regular">
          <SegmentedControl
            values={[...THEME_VALUES]}
            selectedIndex={selectedIndex}
            onValueChange={handleValueChange}
            tintColor={theme.colors.primary}
            appearance={appearance}
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
        style={[styles.glassHost, theme.shadow]}
        testID="theme-segment-ios-blur-host">
        <BlurView
          intensity={theme.blur.full}
          tint="default"
          style={[styles.pillIOS, styles.blurFill]}>
          <SegmentedControl
            values={[...THEME_VALUES]}
            selectedIndex={selectedIndex}
            onValueChange={handleValueChange}
            tintColor={theme.colors.primary}
            appearance={appearance}
            testID="theme-segmented-control"
            style={styles.segment}
          />
        </BlurView>
      </View>
    );
  }

  // Reduce Transparency fallback — solid tonal (no glass, no blur)
  return (
    <View style={styles.pillIOSSolid} testID="theme-segment-ios-solid-wrap">
      <SegmentedControl
        values={[...THEME_VALUES]}
        selectedIndex={selectedIndex}
        onValueChange={handleValueChange}
        tintColor={theme.colors.primary}
        appearance={appearance}
        testID="theme-segmented-control"
        style={styles.segment}
      />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  pillAndroid: {
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    elevation: 2,
    justifyContent: "center",
    minHeight: 44,
    padding: 2,
  },
  pillIOS: {
    justifyContent: "center",
    minHeight: 44,
    padding: 2,
  },
  pillIOSSolid: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: 44,
    padding: 2,
  },
  glassHost: {
    backgroundColor: theme.colors.glassBg,
    borderRadius: theme.radius.full,
  },
  iosBorder: {
    borderColor: theme.colors.glassBorder,
    borderRadius: theme.radius.full,
    borderWidth: 0.5,
  },
  blurFill: {
    backgroundColor: theme.colors.glassBg,
    borderColor: theme.colors.glassBorder,
    borderRadius: theme.radius.full,
    borderWidth: 0.5,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
  },
}));
