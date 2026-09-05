import * as Haptics from "expo-haptics";
import { Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Props = {
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  retryAccessibilityLabel?: string;
  /** When true, Retry is visible but non-interactive (e.g. 429 window). */
  retryDisabled?: boolean;
  /** Light haptic on Retry tap. Default true; ErrorBoundary sets false. */
  hapticOnRetry?: boolean;
};

export function ErrorRetry({
  message = "Something went wrong.",
  onRetry,
  retryLabel = "Retry",
  retryAccessibilityLabel,
  retryDisabled = false,
  hapticOnRetry = true,
}: Props) {
  const handleRetry = () => {
    if (retryDisabled || !onRetry) return;
    if (hapticOnRetry) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onRetry();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable
          onPress={handleRetry}
          disabled={retryDisabled}
          accessibilityLabel={retryAccessibilityLabel ?? retryLabel}
          accessibilityRole="button"
          accessibilityState={{ disabled: retryDisabled }}
          style={[styles.button, retryDisabled && styles.buttonDisabled]}>
          <Text
            style={[
              styles.buttonText,
              retryDisabled && styles.buttonTextDisabled,
            ]}>
            {retryLabel}
          </Text>
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
    color: theme.colors.destructive,
    fontSize: 16,
    marginBottom: theme.space(4),
    textAlign: "center",
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: theme.space(6),
    paddingVertical: theme.space(3),
  },
  buttonDisabled: {
    backgroundColor: theme.colors.disabled,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "center",
  },
  buttonTextDisabled: {
    color: theme.colors.textSecondary,
  },
}));
