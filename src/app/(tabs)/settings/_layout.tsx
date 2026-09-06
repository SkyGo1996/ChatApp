import { Stack } from "expo-router";

import { useThemedStackOptions } from "@/theme/navigation";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function SettingsTabLayout() {
  const themed = useThemedStackOptions();
  return (
    <Stack screenOptions={themed}>
      <Stack.Screen name="index" options={{ title: "Settings" }} />
    </Stack>
  );
}
