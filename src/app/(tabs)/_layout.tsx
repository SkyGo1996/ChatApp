import { NativeTabs } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform } from "react-native";
import { useUnistyles } from "react-native-unistyles";

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

  return (
    <NativeTabs
      tintColor={tintColor}
      iconColor={{ default: inactiveColor, selected: tintColor }}
      labelStyle={{
        default: { color: inactiveColor },
        selected: { color: tintColor },
      }}
      // iOS 26+: minimize when scrolling (no-op on older iOS / Android)
      minimizeBehavior="onScrollDown">
      <NativeTabs.Trigger name="chats">
        <NativeTabs.Trigger.Label>Chats</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "message", selected: "message.fill" }}
          md="chat"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: "gearshape", selected: "gearshape.fill" }}
          md="settings"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
