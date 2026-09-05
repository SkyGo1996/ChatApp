import { Stack } from "expo-router";

export const unstable_settings = {
  initialRouteName: "index",
};

export default function ChatsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Chats" }} />
      <Stack.Screen name="[id]" options={{ title: "Chat" }} />
      <Stack.Screen name="[id]/profile" options={{ title: "Profile" }} />
    </Stack>
  );
}
