import { useLocalSearchParams } from "expo-router";
import ChatDetailScreen from "@/features/chat/screens/ChatDetailScreen";

export default function ChatDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChatDetailScreen conversationId={id ?? ""} />;
}
