import { Tabs } from "expo-router";
import { StyleSheet } from "react-native-unistyles";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: styles.tint.color,
        tabBarInactiveTintColor: styles.inactiveTint.color,
        tabBarStyle: styles.tabBar,
      }}>
      <Tabs.Screen
        name="chats"
        options={{ title: "Chats", headerShown: false }}
      />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}

const styles = StyleSheet.create((theme) => ({
  tint: {
    color: theme.colors.primary,
  },
  inactiveTint: {
    color: theme.colors.textSecondary,
  },
  tabBar: {
    position: "absolute",
    bottom: theme.space(4),
    left: theme.space(4),
    right: theme.space(4),
    height: 64,
    borderRadius: theme.radius.sheet,
    borderTopWidth: 0,
    // Placeholder pill — GlassBar (ticket 13) replaces with chromeBar recipe
    backgroundColor: theme.colors.surface2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
}));
