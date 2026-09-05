import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function ConversationsScreen() {
  const [shouldCrash, setShouldCrash] = useState(false);
  if (shouldCrash) {
    throw new Error("Dev crash seam — testing ErrorBoundary");
  }

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
      {__DEV__ ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Crash app (dev)"
          onPress={() => setShouldCrash(true)}
          style={styles.devCrashButton}
        >
          <Text style={styles.devCrashText}>Crash app (dev)</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: "center",
    backgroundColor: theme.colors.bg,
    flex: 1,
    justifyContent: "center",
    padding: theme.spacing(4),
  },
  linkButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    marginTop: theme.spacing(3),
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(3),
  },
  linkText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing(1),
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
  devCrashButton: {
    borderColor: theme.colors.destructive,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    marginTop: theme.spacing(6),
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(2.5),
  },
  devCrashText: {
    color: theme.colors.destructive,
    fontWeight: "600",
  },
}));
