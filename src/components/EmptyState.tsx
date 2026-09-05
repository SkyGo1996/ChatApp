import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Props = {
  title: string;
  secondary?: string;
  illustration?: ReactNode;
};

export function EmptyState({ title, secondary, illustration }: Props) {
  return (
    <View style={styles.container} accessibilityRole="text">
      {illustration ? (
        <View style={styles.illustration}>{illustration}</View>
      ) : null}
      <Text style={styles.title}>{title}</Text>
      {secondary ? <Text style={styles.secondary}>{secondary}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: theme.space(6),
    paddingVertical: theme.space(8),
  },
  illustration: {
    marginBottom: theme.space(4),
    opacity: 0.7,
  },
  title: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.headline.size,
    fontWeight: theme.type.headline.weight,
    textAlign: "center",
  },
  secondary: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.subhead.size,
    marginTop: theme.space(2),
    textAlign: "center",
  },
}));
