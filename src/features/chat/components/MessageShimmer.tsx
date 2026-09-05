import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Shimmer } from "@/components/Shimmer";

type Props = {
  /** `page` fills the screen; `header` is a compact older-page placeholder. */
  variant?: "page" | "header";
};

const PAGE_ROWS = 6;
const HEADER_ROWS = 2;

function BubbleShimmerRow({ wide }: { wide: boolean }) {
  return (
    <View style={styles.row}>
      <Shimmer
        width={wide ? "70%" : "55%"}
        height={40}
        borderRadius={styles.bubbleRadius.borderRadius}
      />
      <Shimmer width={48} height={10} style={styles.timestamp} />
    </View>
  );
}

/** Left-aligned bubble skeleton for chat loading / older pagination. */
export function MessageShimmer({ variant = "page" }: Props) {
  const rows = variant === "header" ? HEADER_ROWS : PAGE_ROWS;
  return (
    <View
      style={variant === "header" ? styles.header : styles.page}
      accessibilityLabel="Loading messages"
      accessibilityRole="progressbar">
      {Array.from({ length: rows }, (_, i) => (
        <BubbleShimmerRow key={i} wide={i % 2 === 0} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  page: {
    backgroundColor: theme.colors.bg,
    flex: 1,
    paddingTop: theme.space(3),
  },
  header: {
    paddingVertical: theme.space(2),
  },
  row: {
    alignItems: "flex-start",
    marginBottom: theme.space(3),
    paddingHorizontal: theme.space(4),
  },
  bubbleRadius: {
    borderRadius: theme.radius.md,
  },
  timestamp: {
    marginTop: theme.space(1),
  },
}));
