import * as Haptics from "expo-haptics";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

import { Avatar } from "@/components/Avatar";
import { pressInScale, pressOutScale } from "@/components/pressScale";
import { useReduceMotion } from "@/hooks/useReduceMotion";
import { formatConversationTimestamp } from "@/utils/datetime";

import { useConversationPreview } from "@/features/conversations/hooks/useConversationPreview";
import type { Conversation } from "@/features/conversations/types";

const PREVIEW_PLACEHOLDER = "No messages yet";

type Props = {
  conversation: Conversation;
};

/**
 * Conversation row: Avatar, Name, last-Message preview, timestamp.
 * Preview enrichment fails soft to placeholder; press scale + light haptic
 * respect Reduce Motion.
 */
export function ConversationRow({ conversation }: Props) {
  const { preview } = useConversationPreview(conversation.id);
  const reduceMotion = useReduceMotion();
  const scale = useSharedValue(1);

  // Prefer locally patched fields (ticket 08) over enrichment.
  const previewText =
    conversation.lastMessage ?? preview?.text ?? PREVIEW_PLACEHOLDER;
  const timestampSource =
    conversation.lastMessageAt ?? preview?.createdAt ?? null;
  const timestamp = timestampSource
    ? formatConversationTimestamp(timestampSource)
    : null;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    if (reduceMotion) return;
    pressInScale(scale);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const onPressOut = () => {
    if (reduceMotion) return;
    pressOutScale(scale);
  };

  return (
    <Link
      href={{
        pathname: "/(tabs)/chats/[id]",
        params: {
          id: String(conversation.id),
          name: conversation.name,
          avatar: conversation.avatar,
        },
      }}
      asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open chat with ${conversation.name}`}
        onPressIn={onPressIn}
        onPressOut={onPressOut}>
        <Animated.View style={[styles.row, animatedStyle]}>
          <Avatar
            name={conversation.name}
            uri={conversation.avatar}
            size={48}
            recyclingKey={String(conversation.id)}
          />
          <View style={styles.body}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {conversation.name}
              </Text>
              {timestamp ? (
                <Text style={styles.timestamp} numberOfLines={1}>
                  {timestamp}
                </Text>
              ) : null}
            </View>
            <Text style={styles.preview} numberOfLines={1}>
              {previewText}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    alignItems: "center",
    backgroundColor: theme.colors.bg,
    flexDirection: "row",
    maxHeight: 72,
    minHeight: 64,
    paddingHorizontal: theme.space(4),
  },
  body: {
    // 1px inset border leading from avatar edge (design over requirements)
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
    flex: 1,
    justifyContent: "center",
    marginLeft: theme.space(3),
    minHeight: 64,
    paddingVertical: theme.space(3),
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: theme.space(2),
  },
  name: {
    color: theme.colors.text,
    flex: 1,
    fontSize: theme.type.headline.size,
    fontWeight: theme.type.headline.weight,
    letterSpacing: theme.type.headline.letterSpacing,
    lineHeight: theme.type.headline.lineHeight,
  },
  timestamp: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.caption1.size,
    fontWeight: theme.type.caption1.weight,
    letterSpacing: theme.type.caption1.letterSpacing,
    lineHeight: theme.type.caption1.lineHeight,
  },
  preview: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.subhead.size,
    letterSpacing: theme.type.subhead.letterSpacing,
    lineHeight: theme.type.subhead.lineHeight,
    marginTop: theme.space(0.5),
  },
}));
