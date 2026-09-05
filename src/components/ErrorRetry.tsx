import { Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Props = {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  retryAccessibilityLabel?: string;
};

export function ErrorRetry({
  message = "Something went wrong.",
  onRetry,
  retryLabel = "Retry",
  retryAccessibilityLabel,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityLabel={retryAccessibilityLabel ?? retryLabel}
          accessibilityRole="button"
          style={styles.button}>
          <Text style={styles.buttonText}>{retryLabel}</Text>
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
    padding: theme.space(6),
  },
  message: {
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: theme.space(4),
    textAlign: "center",
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.space(6),
    paddingVertical: theme.space(3),
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
}));
