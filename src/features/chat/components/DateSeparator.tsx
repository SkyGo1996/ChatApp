import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

type Props = {
  label: string;
};

/** Centered date label with 1px hairlines on both sides. */
export function DateSeparator({ label }: Props) {
  return (
    <View
      style={styles.row}
      accessibilityRole="header"
      accessibilityLabel={label}>
      <View style={styles.line} />
      <Text style={styles.label} allowFontScaling>
        {label}
      </Text>
      <View style={styles.line} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    alignItems: "center",
    flexDirection: "row",
    marginTop: theme.space(3),
    paddingHorizontal: theme.space(4),
  },
  line: {
    backgroundColor: theme.colors.border,
    flex: 1,
    height: 1,
  },
  label: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.caption1.size,
    fontWeight: theme.type.caption1.weight,
    letterSpacing: theme.type.caption1.letterSpacing,
    lineHeight: theme.type.caption1.lineHeight,
    marginHorizontal: theme.space(2),
  },
}));
