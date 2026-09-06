import { NativeTabs } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform } from "react-native";
import { useUnistyles } from "react-native-unistyles";

import { glassColorScheme } from "@/theme/recipes";

export default function TabsLayout() {
  const { theme } = useUnistyles();

  // Liquid Glass tints with the content behind the bar; DynamicColorIOS
  // keeps icon/label contrast correct across light/dark (Expo Native Tabs docs).
  const tintColor =
    Platform.OS === "ios"
      ? DynamicColorIOS({
          light: theme.colors.primary,
          dark: theme.colors.primary,
        })
      : theme.colors.primary;

  const inactiveColor =
    Platform.OS === "ios"
      ? DynamicColorIOS({
          light: theme.colors.textSecondary,
          dark: theme.colors.textSecondary,
        })
      : theme.colors.textSecondary;

  // Paint the native tab scene with Unistyles bg — iOS 26 Liquid Glass samples
  // content behind the bar; without this, DefaultTheme white flashes on switch.
  const tabContentStyle = { backgroundColor: theme.colors.bg };

  return (
    <NativeTabs
      tintColor={tintColor}
      iconColor={{ default: inactiveColor, selected: tintColor }}
      labelStyle={{
        default: { color: inactiveColor },
        selected: { color: tintColor },
      }}
      // iOS 18 and earlier: keep tab bar opaque at scroll edge (no-op on iOS 26+)
      disableTransparentOnScrollEdge
      // iOS 26+: minimize when scrolling (no-op on older iOS / Android)
      minimizeBehavior="onScrollDown"
      // Pin TabsHost colorScheme to Unistyles (not OS inherit) so Liquid Glass
      // does not flash dark→light when app theme ≠ system appearance.
      unstable_nativeProps={{
        colorScheme: glassColorScheme(theme),
      }}>
      <NativeTabs.Trigger name="chats" contentStyle={tabContentStyle}>
        <NativeTabs.Trigger.Label>Chats</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "message", selected: "message.fill" }}
          md="chat"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings" contentStyle={tabContentStyle}>
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md="settings"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
