import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: "#2563EB",
        tabBarStyle: {
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          height: 64,
          borderRadius: 20,
          borderTopWidth: 0,
          backgroundColor: "#FFFFFF",
          // TODO(ticket-01-polish): replace with GlassBar (iOS glassBg+blur / Android surface2+border+elevation2)
        },
      }}
    >
      <Tabs.Screen name="chats" options={{ title: "Chats", headerShown: false }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
