import ChatDetailScreen from "@/features/chat/screens/ChatDetailScreen";
import { useLocalSearchParams } from "expo-router";

export default function ChatDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ChatDetailScreen conversationId={id ?? ""} />;
}
