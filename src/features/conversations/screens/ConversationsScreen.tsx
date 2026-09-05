import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function ConversationsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chats</Text>
      <Text style={styles.subtitle}>Conversations placeholder</Text>
      <Link href={{ pathname: "/(tabs)/chats/[id]", params: { id: "1" } }} asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open chat 1"
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>Open Chat 1 →</Text>
        </Pressable>
      </Link>
      <Link href={{ pathname: "/(tabs)/chats/[id]", params: { id: "2" } }} asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open chat 2"
          style={styles.linkButton}
        >
          <Text style={styles.linkText}>Open Chat 2 →</Text>
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
    marginTop: 12,
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
