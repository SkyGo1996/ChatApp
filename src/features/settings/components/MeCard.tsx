import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Avatar } from "@/components/Avatar";

import { ME } from "@/features/settings/constants";

export function MeCard() {
  return (
    <View
      style={styles.row}
      accessibilityRole="none"
      testID="me-card"
      accessibilityLabel={`Current user ${ME.name}`}>
      <Avatar name={ME.name} uri={ME.avatar} size={48} testID="me-avatar" />
      <View style={styles.texts} accessibilityLabel={`${ME.name} ${ME.phone}`}>
        <Text
          style={styles.name}
          allowFontScaling
          numberOfLines={1}
          accessibilityRole="header">
          {ME.name}
        </Text>
        <Text
          style={styles.phone}
          allowFontScaling
          numberOfLines={1}
          testID="me-phone">
          {ME.phone}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.space(3),
    minHeight: 44,
  },
  texts: {
    flex: 1,
    gap: 2,
    justifyContent: "center",
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.type.headline.size,
    fontWeight: theme.type.headline.weight,
    letterSpacing: theme.type.headline.letterSpacing,
    lineHeight: theme.type.headline.lineHeight,
  },
  phone: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.subhead.size,
    fontWeight: theme.type.subhead.weight,
    letterSpacing: theme.type.subhead.letterSpacing,
    lineHeight: theme.type.subhead.lineHeight,
  },
}));
