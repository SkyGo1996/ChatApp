import { ErrorBoundary } from "@/components/ErrorBoundary";
import ChatDetailScreen from "@/features/chat/screens/ChatDetailScreen";
import { useLocalSearchParams } from "expo-router";

export default function ChatDetailRoute() {
  const { id, name, avatar } = useLocalSearchParams<{
    id: string;
    name?: string;
    avatar?: string;
  }>();

  // Expo Router may deliver params as string | string[].
  const asString = (
    value: string | string[] | undefined
  ): string | undefined => (Array.isArray(value) ? value[0] : value);

  return (
    <ErrorBoundary retryAccessibilityLabel="Retry screen">
      <ChatDetailScreen
        conversationId={asString(id) ?? ""}
        contactName={asString(name)}
        contactAvatar={asString(avatar)}
      />
    </ErrorBoundary>
  );
}
