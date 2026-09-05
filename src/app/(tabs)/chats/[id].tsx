import { ErrorBoundary } from "@/components/ErrorBoundary";
import ChatDetailScreen from "@/features/chat/screens/ChatDetailScreen";
import { useLocalSearchParams } from "expo-router";

export default function ChatDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ErrorBoundary retryAccessibilityLabel="Retry screen">
      <ChatDetailScreen conversationId={id ?? ""} />
    </ErrorBoundary>
  );
}
