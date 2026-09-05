import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  conversationId: string;
};

export default function ChatDetailScreen({ conversationId }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat {conversationId}</Text>
      <Text style={styles.subtitle}>Chat detail placeholder</Text>
      <Link
        href={{ pathname: "/(tabs)/chats/[id]/profile", params: { id: conversationId || "1" } }}
        asChild
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View profile"
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>View Profile →</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 16,
  },
  linkButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  linkText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  subtitle: {
    color: "#6B7280",
    marginTop: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
  },
});
