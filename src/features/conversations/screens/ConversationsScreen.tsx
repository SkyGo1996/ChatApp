import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { ErrorBoundary } from "@/components/ErrorBoundary";

function ConversationsContent() {
  const [shouldCrashScreen, setShouldCrashScreen] = useState(false);
  if (shouldCrashScreen) {
    throw new Error("Dev screen crash — testing per-screen ErrorBoundary");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chats</Text>
      <Text style={styles.subtitle}>Conversations placeholder</Text>
      <Link
        href={{ pathname: "/(tabs)/chats/[id]", params: { id: "1" } }}
        asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open chat 1"
          style={styles.linkButton}>
          <Text style={styles.linkText}>Open Chat 1 →</Text>
        </Pressable>
      </Link>
      <Link
        href={{ pathname: "/(tabs)/chats/[id]", params: { id: "2" } }}
        asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open chat 2"
          style={styles.linkButton}>
          <Text style={styles.linkText}>Open Chat 2 →</Text>
        </Pressable>
      </Link>
      {__DEV__ ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Crash screen (dev)"
          onPress={() => setShouldCrashScreen(true)}
          style={styles.devCrashButton}>
          <Text style={styles.devCrashText}>Crash screen (dev)</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function ConversationsScreen() {
  const [shouldCrashRoot, setShouldCrashRoot] = useState(false);
  if (shouldCrashRoot) {
    throw new Error("Dev root crash — testing Root ErrorBoundary");
  }

  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <ErrorBoundary retryAccessibilityLabel="Retry screen">
          <ConversationsContent />
        </ErrorBoundary>
      </View>
      {__DEV__ ? (
        <View style={styles.rootCrashWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Crash app (dev)"
            onPress={() => setShouldCrashRoot(true)}
            style={styles.devCrashButton}>
            <Text style={styles.devCrashText}>Crash app (dev)</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  outer: {
    backgroundColor: theme.colors.bg,
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  rootCrashWrap: {
    alignItems: "center",
    paddingBottom: theme.spacing(8),
  },
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
