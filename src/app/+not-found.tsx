import { Link } from "expo-router";
import { MessageCircleOff } from "lucide-react-native";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

export default function NotFound() {
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      <View style={styles.icon} accessibilityRole="image">
        <MessageCircleOff
          size={48}
          color={theme.colors.textSecondary}
          strokeWidth={1.5}
        />
      </View>
      <Text style={styles.title}>Page not found</Text>
      <Text style={styles.message}>
        The page you&apos;re looking for doesn&apos;t exist or was moved.
      </Text>
      <Link href="/(tabs)/chats" style={styles.link}>
        Go to Chats
      </Link>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: "center",
    backgroundColor: theme.colors.bg,
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.space(6),
  },
  icon: {
    marginBottom: theme.space(4),
    opacity: 0.7,
  },
  title: {
    color: theme.colors.text,
    fontSize: theme.type.title2.size,
    fontWeight: theme.type.title2.weight,
    textAlign: "center",
  },
  message: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.body.size,
    marginTop: theme.space(2),
    textAlign: "center",
  },
  link: {
    color: theme.colors.primary,
    fontWeight: "600",
    marginTop: theme.space(4),
  },
}));
