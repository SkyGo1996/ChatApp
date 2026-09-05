import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Shimmer } from "@/components/Shimmer";

const ROW_COUNT = 5;

function ConversationShimmerRow() {
  return (
    <View style={styles.row}>
      <Shimmer
        width={48}
        height={48}
        borderRadius={styles.avatarRadius.borderRadius}
      />
      <View style={styles.bars}>
        <Shimmer width="55%" height={14} />
        <Shimmer width="80%" height={12} style={styles.secondBar} />
      </View>
    </View>
  );
}

/** Loading skeleton: 5 rows of avatar circle + 2 bars (pulsing). */
export function ConversationShimmer() {
  return (
    <View
      style={styles.container}
      accessibilityLabel="Loading conversations"
      accessibilityRole="progressbar">
      {Array.from({ length: ROW_COUNT }, (_, i) => (
        <ConversationShimmerRow key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.bg,
    flex: 1,
    paddingTop: theme.space(1),
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 68,
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(3),
  },
  avatarRadius: {
    borderRadius: theme.radius.full,
  },
  bars: {
    flex: 1,
    marginLeft: theme.space(3),
  },
  secondBar: {
    marginTop: theme.space(2),
  },
}));
