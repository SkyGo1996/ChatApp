import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Shimmer } from "@/components/Shimmer";
import { space, type as typeTokens } from "@/theme/tokens";

type Props = {
  /** `page` fills the screen; `header` is a compact older-page placeholder. */
  variant?: "page" | "header";
};

type RowSpec = {
  isMe: boolean;
  lines: 1 | 2 | 3;
  widthPct: `${number}%`;
};

// MessageBubble: paddingVertical 2*space(2) + N * type.body.lineHeight
const BUBBLE_PAD_Y = space(2) * 2;
const LINE_HEIGHT = typeTokens.body.lineHeight;

function bubbleHeight(lines: 1 | 2 | 3): number {
  return BUBBLE_PAD_Y + lines * LINE_HEIGHT;
}

const WITHIN_GROUP = space(1);
const BETWEEN_GROUP = space(3);

const PAGE_ROWS: readonly RowSpec[] = [
  { isMe: false, lines: 3, widthPct: "100%" },
  { isMe: false, lines: 1, widthPct: "48%" },
  { isMe: true, lines: 2, widthPct: "92%" },
  { isMe: false, lines: 2, widthPct: "78%" },
  { isMe: true, lines: 1, widthPct: "42%" },
  { isMe: true, lines: 3, widthPct: "100%" },
] as const;

const HEADER_ROWS: readonly RowSpec[] = [
  { isMe: false, lines: 3, widthPct: "100%" },
  { isMe: true, lines: 1, widthPct: "48%" },
] as const;

function BubbleShimmerRow({
  widthPct,
  height,
  marginTop,
  isMe,
}: {
  widthPct: `${number}%`;
  height: number;
  marginTop: number;
  isMe: boolean;
}) {
  return (
    <View
      testID="message-shimmer-row"
      style={[styles.row, isMe ? styles.rowMe : styles.rowThem, { marginTop }]}>
      <Shimmer
        width={widthPct}
        height={height}
        borderRadius={styles.bubbleRadius.borderRadius}
      />
      <Shimmer width={48} height={12} style={styles.timestamp} />
    </View>
  );
}

function rowMarginTop(index: number, rows: readonly RowSpec[]): number {
  if (index === 0) return BETWEEN_GROUP;
  const prev = rows[index - 1];
  const curr = rows[index];
  if (!prev || !curr) return BETWEEN_GROUP;
  return prev.isMe === curr.isMe ? WITHIN_GROUP : BETWEEN_GROUP;
}

function ShimmerRows({ rows }: { rows: readonly RowSpec[] }) {
  return (
    <>
      {rows.map((spec, i) => (
        <BubbleShimmerRow
          key={i}
          widthPct={spec.widthPct}
          height={bubbleHeight(spec.lines)}
          marginTop={rowMarginTop(i, rows)}
          isMe={spec.isMe}
        />
      ))}
    </>
  );
}

/** Bubble skeleton for chat loading / older pagination. Page variant is bottom-anchored. */
export function MessageShimmer({ variant = "page" }: Props) {
  if (variant === "header") {
    return (
      <View
        style={styles.header}
        accessibilityLabel="Loading messages"
        accessibilityRole="progressbar">
        <ShimmerRows rows={HEADER_ROWS} />
      </View>
    );
  }

  return (
    <View
      style={styles.page}
      accessibilityLabel="Loading messages"
      accessibilityRole="progressbar">
      <ShimmerRows rows={PAGE_ROWS} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  page: {
    backgroundColor: theme.colors.bg,
    flex: 1,
    justifyContent: "flex-end",
    paddingTop: theme.space(2),
  },
  header: {
    paddingVertical: theme.space(1),
  },
  row: {
    // Explicit width so child % widths resolve (maxWidth alone shrink-wraps).
    maxWidth: "75%",
    paddingHorizontal: theme.space(4),
    width: "75%",
  },
  rowMe: {
    alignItems: "flex-end",
    alignSelf: "flex-end",
  },
  rowThem: {
    alignItems: "flex-start",
    alignSelf: "flex-start",
  },
  bubbleRadius: {
    borderRadius: theme.radius.md,
  },
  timestamp: {
    marginTop: theme.space(0.5),
  },
}));
