import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Pressable, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

import { motion } from "@/theme/tokens";

type Props = {
  conversationId: string;
};

export default function ChatDetailScreen({ conversationId }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion
    );
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  const content = (
    <>
      <Text style={styles.title}>Chat {conversationId}</Text>
      <Text style={styles.subtitle}>Chat detail placeholder</Text>
      <Link
        href={{
          pathname: "/(tabs)/chats/[id]/profile",
          params: { id: conversationId || "1" },
        }}
        asChild>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View profile"
          style={styles.linkButton}>
          <Text style={styles.linkText}>View Profile →</Text>
        </Pressable>
      </Link>
    </>
  );

  if (reduceMotion) {
    return <View style={styles.container}>{content}</View>;
  }

  return (
    <Animated.View
      style={styles.container}
      entering={FadeInUp.duration(motion.fadeUp.duration).withInitialValues({
        opacity: motion.fadeUp.from.opacity,
        transform: [{ translateY: motion.fadeUp.from.translateY }],
      })}>
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: "center",
    backgroundColor: theme.colors.bg,
    flex: 1,
    justifyContent: "center",
    padding: theme.space(4),
  },
  linkButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    marginTop: theme.space(4),
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(3),
  },
  linkText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: theme.space(1),
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "700",
  },
}));
