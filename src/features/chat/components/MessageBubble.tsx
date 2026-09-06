import { RotateCw } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

import { formatMessageTimestamp } from "@/utils/datetime";

import type { Message } from "@/features/chat/types";

const MEMORY_ONLY_HINT = "Unsent if you leave the app";

type Props = {
  message: Message;
  marginTop: number;
  /** Re-issue failed send; only used when status is `failed`. */
  onRetrySend?: (localId: string) => void;
};

/**
 * Chat bubble: left for Contact (`them`), right for `me`.
 * Same-sender spacing is applied via marginTop from the list builder.
 * Outgoing statuses: dimmed while `sending`; red bubble + inline Retry when `failed`.
 */
export function MessageBubble({ message, marginTop, onRetrySend }: Props) {
  const { theme } = useUnistyles();
  const isMe = message.sender === "me";
  const timestamp = formatMessageTimestamp(message.createdAt);
  const sending = message.status === "sending";
  const failed = message.status === "failed";
  const senderLabel = isMe ? "You" : "Contact";
  const accessibilityLabel = timestamp
    ? `${senderLabel}: ${message.text}. ${timestamp}`
    : `${senderLabel}: ${message.text}`;

  return (
    <View
      style={[
        styles.row,
        isMe ? styles.rowMe : styles.rowThem,
        { marginTop },
        sending && styles.sending,
      ]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion={sending || failed ? "polite" : "none"}>
      <View style={styles.bubbleRow}>
        {failed && isMe ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retry send"
            accessibilityHint={MEMORY_ONLY_HINT}
            hitSlop={8}
            onPress={() => {
              onRetrySend?.(String(message.id));
            }}
            style={styles.retryButton}>
            <RotateCw
              color={theme.colors.destructive}
              size={20}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
          </Pressable>
        ) : null}
        <View
          testID={failed && isMe ? "message-bubble-failed" : undefined}
          style={[
            styles.bubble,
            isMe ? styles.bubbleMe : styles.bubbleThem,
            failed && isMe && styles.bubbleFailed,
          ]}>
          <Text
            style={[styles.body, isMe ? styles.bodyMe : styles.bodyThem]}
            allowFontScaling>
            {message.text}
          </Text>
        </View>
      </View>
      {timestamp ? (
        <Text
          style={[
            styles.timestamp,
            isMe ? styles.timestampMe : styles.timestampThem,
          ]}
          allowFontScaling>
          {timestamp}
        </Text>
      ) : null}
      {failed && isMe ? (
        <Text style={styles.memoryHint} allowFontScaling>
          {MEMORY_ONLY_HINT}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    maxWidth: "75%",
    paddingHorizontal: theme.space(4),
  },
  rowMe: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  rowThem: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  sending: {
    opacity: 0.7,
  },
  bubbleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.space(2),
    maxWidth: "100%",
  },
  bubble: {
    borderRadius: theme.radius.md,
    flexShrink: 1,
    maxWidth: "100%",
    paddingHorizontal: theme.space(3),
    paddingVertical: theme.space(2),
  },
  bubbleMe: {
    backgroundColor: theme.colors.bubbleMe,
  },
  bubbleThem: {
    backgroundColor: theme.colors.bubbleThem,
  },
  bubbleFailed: {
    backgroundColor: theme.colors.destructive,
  },
  body: {
    fontSize: theme.type.body.size,
    fontWeight: theme.type.body.weight,
    letterSpacing: theme.type.body.letterSpacing,
    lineHeight: theme.type.body.lineHeight,
  },
  bodyMe: {
    color: "#FFFFFF",
  },
  bodyThem: {
    color: theme.colors.text,
  },
  timestamp: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.caption1.size,
    fontWeight: theme.type.caption1.weight,
    letterSpacing: theme.type.caption1.letterSpacing,
    lineHeight: theme.type.caption1.lineHeight,
    marginTop: theme.space(0.5),
  },
  timestampMe: {
    textAlign: "right",
  },
  timestampThem: {
    textAlign: "left",
  },
  retryButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    minWidth: 44,
  },
  memoryHint: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.caption2.size,
    fontWeight: theme.type.caption2.weight,
    letterSpacing: theme.type.caption2.letterSpacing,
    lineHeight: theme.type.caption2.lineHeight,
    marginTop: theme.space(0.5),
    textAlign: "right",
  },
}));
