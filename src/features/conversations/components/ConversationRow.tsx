import { Link } from "expo-router";
import {
  Pressable,
  StyleSheet as RNStyleSheet,
  Text,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";

import type { Conversation } from "@/features/conversations/types";

type Props = {
  conversation: Conversation;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];
  const second = parts[1];
  if (!first) return "?";
  if (!second) return first.slice(0, 2).toUpperCase();
  return `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase();
}

/**
 * Stub row for ticket 04. Ticket 05 replaces with Avatar, preview, timestamp,
 * press scale, and haptic.
 */
export function ConversationRow({ conversation }: Props) {
  const initials = initialsFromName(conversation.name);

  return (
    <Link
      href={{
        pathname: "/(tabs)/chats/[id]",
        params: { id: String(conversation.id) },
      }}
      asChild>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open chat with ${conversation.name}`}
        style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initials}</Text>
        </View>
        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {conversation.name}
          </Text>
          <Text style={styles.preview} numberOfLines={1}>
            No messages yet
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    alignItems: "center",
    backgroundColor: theme.colors.bg,
    borderBottomColor: theme.colors.border,
    borderBottomWidth: RNStyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 68,
    maxHeight: 72,
    paddingHorizontal: theme.space(4),
    paddingVertical: theme.space(3),
  },
  avatar: {
    alignItems: "center",
    backgroundColor: theme.colors.surface3,
    borderRadius: theme.radius.full,
    height: 48,
    justifyContent: "center",
    width: 48,
  },
  initials: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.subhead.size,
    fontWeight: "600",
  },
  body: {
    flex: 1,
    marginLeft: theme.space(3),
  },
  name: {
    color: theme.colors.text,
    fontSize: theme.type.headline.size,
    fontWeight: theme.type.headline.weight,
    letterSpacing: theme.type.headline.letterSpacing,
    lineHeight: theme.type.headline.lineHeight,
  },
  preview: {
    color: theme.colors.textSecondary,
    fontSize: theme.type.subhead.size,
    letterSpacing: theme.type.subhead.letterSpacing,
    lineHeight: theme.type.subhead.lineHeight,
    marginTop: theme.space(0.5),
  },
}));
