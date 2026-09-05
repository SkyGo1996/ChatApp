import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { formatMessageTimestamp } from "@/utils/datetime";

import type { MessageGroupPosition } from "@/features/chat/lib/buildChatListItems";
import type { Message } from "@/features/chat/types";

type Props = {
  message: Message;
  group: MessageGroupPosition;
  marginTop: number;
};

/**
 * Chat bubble: left for Contact (`them`), right for `me`.
 * Group position is reserved for spacing (applied via marginTop from builder).
 */
export function MessageBubble({ message, group: _group, marginTop }: Props) {
  const isMe = message.sender === "me";
  const timestamp = formatMessageTimestamp(message.createdAt);
  const sending = message.status === "sending";
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
      accessibilityLabel={accessibilityLabel}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
        <Text
          style={[styles.body, isMe ? styles.bodyMe : styles.bodyThem]}
          allowFontScaling>
          {message.text}
        </Text>
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
  bubble: {
    borderRadius: theme.radius.md,
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
}));
